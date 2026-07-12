import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before importing services
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { handleTictoWebhook } from '../src/controllers/payment.controller';
import { getVal, setVal } from '../src/services/db.service';
import { Request, Response } from 'express';

const TEST_EMAIL = 'test_webhook@fabricadebestseller.com.br';
const SAFE_EMAIL = TEST_EMAIL.replace(/[^a-zA-Z0-9]/g, '_');

// Helper to create mocked Express Request and Response
function createMockExpress(payload: any) {
    const req = {
        body: payload,
        headers: {},
        query: {}
    } as any;

    const res = {
        headersSent: false,
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        json(data: any) {
            this.responseData = data;
            this.headersSent = true;
            return this;
        },
        statusCode: 200,
        responseData: null
    } as any;

    return { req, res };
}

async function runTest() {
    console.log("=========================================");
    console.log("STARTING TICTO WEBHOOK INTEGRATION TEST");
    console.log("=========================================");

    // 1. Reset user credits and redeemed payments
    console.log(`Cleaning up old data for ${TEST_EMAIL}...`);
    await setVal(`/credits/${SAFE_EMAIL}`, 0);
    await setVal(`/users/${SAFE_EMAIL}/bookCredits`, 0);
    await setVal(`/cipCredits/${SAFE_EMAIL}`, 0);
    await setVal(`/users/${SAFE_EMAIL}/cipCredits`, 0);
    await setVal(`/barcodeCredits/${SAFE_EMAIL}`, 0);
    await setVal(`/users/${SAFE_EMAIL}/barcodeCredits`, 0);
    await setVal(`/qrCredits/${SAFE_EMAIL}`, 0);
    await setVal(`/users/${SAFE_EMAIL}/qrCredits`, 0);
    await setVal(`/users/${SAFE_EMAIL}/redeemed_payments`, []);
    await setVal(`/users/${SAFE_EMAIL}/promo_599_used`, false);
    console.log("Cleanup done.");

    const TICTO_TOKEN = 'amedGWJ2idnDxqiP8KMS65f7ZpGFepUerSvXk5WsOsGoAasl4ZSlDOaCcu8x5mw40PY2Q6kSjdTCoAhWWIpr31ReZuMH77DNb4en';

    // Test cases definition
    const testCases = [
        {
            name: "PRC - Pacote de Registro Completo (ID 111114)",
            payload: {
                token: TICTO_TOKEN,
                event: "sale_approved",
                status: "approved",
                customer: { email: TEST_EMAIL, name: "Test PRC User" },
                item: { product_id: "111114", product_name: "PRC - Pacote de Registro Completo" },
                transaction: { id: "tx_prc_123" }
            },
            expected: { book: 0, cip: 1, barcode: 1, qr: 1 }
        },
        {
            name: "Gerador Automático de QR Codes (ID 111112)",
            payload: {
                token: TICTO_TOKEN,
                event: "sale_approved",
                status: "approved",
                customer: { email: TEST_EMAIL, name: "Test QR User" },
                item: { product_id: "111112", product_name: "Gerador Automático de QR Codes" },
                transaction: { id: "tx_qr_123" }
            },
            expected: { book: 0, cip: 1, barcode: 1, qr: 2 } // qr increases by 1 (total 2)
        },
        {
            name: "Crédito para Geração de Código de Barras (ID 110881 - Hash O9012A440)",
            payload: {
                token: TICTO_TOKEN,
                event: "sale_approved",
                status: "approved",
                customer: { email: TEST_EMAIL, name: "Test Barcode User" },
                item: { product_name: "Código de Barras" },
                order: { checkout_code: "O9012A440" },
                transaction: { id: "tx_barcode_123" }
            },
            expected: { book: 0, cip: 1, barcode: 2, qr: 2 } // barcode increases by 1 (total 2)
        },
        {
            name: "Crédito para Geração de Código de Barras (O77037442 hash found in Frontend)",
            payload: {
                token: TICTO_TOKEN,
                event: "sale_approved",
                status: "approved",
                customer: { email: TEST_EMAIL, name: "Test Barcode 2 User" },
                item: { product_name: "Código de Barras" },
                order: { checkout_code: "O77037442" },
                transaction: { id: "tx_barcode_456" }
            },
            expected: { book: 0, cip: 1, barcode: 3, qr: 2 } // barcode increases by 1 (total 3)
        },
        {
            name: "Crédito para Ficha Catalográfica (ID 110774)",
            payload: {
                token: TICTO_TOKEN,
                event: "sale_approved",
                status: "approved",
                customer: { email: TEST_EMAIL, name: "Test Ficha User" },
                item: { product_id: "110774", product_name: "Crédito Ficha Catalográfica" },
                transaction: { id: "tx_ficha_123" }
            },
            expected: { book: 0, cip: 2, barcode: 3, qr: 2 } // cip increases by 1 (total 2)
        },
        {
            name: "Pacote com 6 Créditos para Gerar 6 Livros (ID 110634 / O276DFB4A)",
            payload: {
                token: TICTO_TOKEN,
                event: "sale_approved",
                status: "approved",
                customer: { email: TEST_EMAIL, name: "Test 6 Books User" },
                item: { product_id: "110634", product_name: "Pacote com 6 Créditos" },
                order: { checkout_code: "O276DFB4A" },
                transaction: { id: "tx_books6_123" }
            },
            expected: { book: 6, cip: 2, barcode: 3, qr: 2 } // book increases by 6 (total 6)
        },
        {
            name: "Pacote com 12 Créditos (ID 110633)",
            payload: {
                token: TICTO_TOKEN,
                event: "sale_approved",
                status: "approved",
                customer: { email: TEST_EMAIL, name: "Test 12 Books User" },
                item: { product_id: "110633", product_name: "Pacote 12 Livros" },
                transaction: { id: "tx_books12_123" }
            },
            expected: { book: 18, cip: 2, barcode: 3, qr: 2 } // book increases by 12 (total 18)
        },
        {
            name: "Pacote com 9 Créditos (ID 110631)",
            payload: {
                token: TICTO_TOKEN,
                event: "sale_approved",
                status: "approved",
                customer: { email: TEST_EMAIL, name: "Test 9 Books User" },
                item: { product_id: "110631", product_name: "Pacote 9 Livros" },
                transaction: { id: "tx_books9_123" }
            },
            expected: { book: 27, cip: 2, barcode: 3, qr: 2 } // book increases by 9 (total 27)
        },
        {
            name: "Pacote com 3 Créditos (ID 110628)",
            payload: {
                token: TICTO_TOKEN,
                event: "sale_approved",
                status: "approved",
                customer: { email: TEST_EMAIL, name: "Test 3 Books User" },
                item: { product_id: "110628", product_name: "Pacote 3 Livros" },
                transaction: { id: "tx_books3_123" }
            },
            expected: { book: 30, cip: 2, barcode: 3, qr: 2 } // book increases by 3 (total 30)
        },
        {
            name: "Fábrica de Best Seller - Gerador de Livros Profissionais (ID 108488)",
            payload: {
                token: TICTO_TOKEN,
                event: "sale_approved",
                status: "approved",
                customer: { email: TEST_EMAIL, name: "Test 1 Book User" },
                item: { product_id: "108488", product_name: "Gerador de Livros Profissionais" },
                transaction: { id: "tx_book1_123" }
            },
            expected: { book: 31, cip: 2, barcode: 3, qr: 2 } // book increases by 1 (total 31)
        },
        {
            name: "Oferta Especial de 1ª Compra de Créditos (ID 111296)",
            payload: {
                token: TICTO_TOKEN,
                event: "sale_approved",
                status: "approved",
                customer: { email: TEST_EMAIL, name: "Test Promo User" },
                item: { product_id: "111296", product_name: "Oferta Especial 1ª Compra" },
                transaction: { id: "tx_promo_123" }
            },
            expected: { book: 32, cip: 2, barcode: 3, qr: 2 } // book increases by 1 (total 32)
        },
        {
            name: "Fallback Test: Unmapped ID but name contains 'REGISTRO COMPLETO'",
            payload: {
                token: TICTO_TOKEN,
                event: "sale_approved",
                status: "approved",
                customer: { email: TEST_EMAIL, name: "Test Fallback User" },
                item: { product_id: "999999", product_name: "SUPER PACOTE DE REGISTRO COMPLETO FBS" },
                transaction: { id: "tx_fallback_123" }
            },
            expected: { book: 32, cip: 3, barcode: 4, qr: 3 } // cip, barcode, qr increase by 1
        }
    ];

    let allPassed = true;

    for (const tc of testCases) {
        console.log(`\nRunning test case: ${tc.name}`);
        const { req, res } = createMockExpress(tc.payload);

        // Call the webhook controller
        await handleTictoWebhook(req, res);

        // Fetch values from DB to verify
        const book = Number(await getVal(`/credits/${SAFE_EMAIL}`) || 0);
        const cip = Number(await getVal(`/cipCredits/${SAFE_EMAIL}`) || 0);
        const barcode = Number(await getVal(`/barcodeCredits/${SAFE_EMAIL}`) || 0);
        const qr = Number(await getVal(`/qrCredits/${SAFE_EMAIL}`) || 0);

        const success = book === tc.expected.book &&
                        cip === tc.expected.cip &&
                        barcode === tc.expected.barcode &&
                        qr === tc.expected.qr;

        if (success) {
            console.log(`✅ PASSED: ${tc.name}`);
        } else {
            console.error(`❌ FAILED: ${tc.name}`);
            console.error(`   Expected: Book=${tc.expected.book}, CIP=${tc.expected.cip}, Barcode=${tc.expected.barcode}, QR=${tc.expected.qr}`);
            console.error(`   Got:      Book=${book}, CIP=${cip}, Barcode=${barcode}, QR=${qr}`);
            allPassed = false;
        }
    }

    // 5. Clean up test email data from DB
    console.log(`\nCleaning up test data for ${TEST_EMAIL}...`);
    await setVal(`/credits/${SAFE_EMAIL}`, null);
    await setVal(`/users/${SAFE_EMAIL}`, null);
    await setVal(`/cipCredits/${SAFE_EMAIL}`, null);
    await setVal(`/barcodeCredits/${SAFE_EMAIL}`, null);
    await setVal(`/qrCredits/${SAFE_EMAIL}`, null);
    console.log("Cleanup finished.");

    console.log("=========================================");
    if (allPassed) {
        console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉");
    } else {
        console.error("⚠️ SOME TESTS FAILED! PLEASE REVIEW LOGS. ⚠️");
        process.exit(1);
    }
    console.log("=========================================");
}

runTest().catch(err => {
    console.error("Fatal error running tests:", err);
    process.exit(1);
});
