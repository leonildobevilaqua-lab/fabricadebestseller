const path = require('path');
const backendDir = 'c:/Users/Pichau/OneDrive/FERRAMENTAS - PROFISSIONAIS/bestseller-factory-ai/backend';
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });

const { getVal } = require(path.join(backendDir, 'dist/src/services/db.service'));
const { getProjectByEmail } = require(path.join(backendDir, 'dist/src/services/queue.service'));

async function verifyAll() {
    console.log('=== VERIFYING DATABASE FETCH FOR ADMIN & VIP AREA ===');
    
    // 1. Fetch leads for Admin Dashboard
    const leads = await getVal('/leads', { forceSync: true });
    console.log(`\n1. Admin Leads Count: ${Array.isArray(leads) ? leads.length : 0}`);
    if (Array.isArray(leads) && leads.length > 0) {
        console.log('   Latest Lead:', leads[0].name, '| Email:', leads[0].email, '| Status:', leads[0].status);
    }

    // 2. Fetch projects for Admin Dashboard History
    const projects = await getVal('/projects', { forceSync: true });
    console.log(`\n2. Admin Projects History Count: ${Array.isArray(projects) ? projects.length : 0}`);
    if (Array.isArray(projects) && projects.length > 0) {
        console.log('   Sample Project:', projects[0].id, '| Title:', projects[0].metadata?.bookTitle || projects[0].metadata?.title, '| Email:', projects[0].metadata?.contact?.email);
    }

    // 3. Test getProjectByEmail for VIP area member (Helton Pimentel)
    const heltonProj = await getProjectByEmail('helton90pbs@gmail.com');
    console.log('\n3. VIP Area Member Project Check (helton90pbs@gmail.com):');
    if (heltonProj) {
        console.log('   SUCCESS! Found Project ID:', heltonProj.id);
        console.log('   Title:', heltonProj.metadata?.bookTitle);
        console.log('   Author:', heltonProj.metadata?.authorName);
        console.log('   Status:', heltonProj.metadata?.status);
    } else {
        console.error('   FAILED: Could not find project for helton90pbs@gmail.com');
    }

    // 4. Test getProjectByEmail for VIP area member (Leonildo Bevilaqua)
    const leoProj = await getProjectByEmail('contato@leonildobevilaqua.com.br');
    console.log('\n4. VIP Area Member Project Check (contato@leonildobevilaqua.com.br):');
    if (leoProj) {
        console.log('   SUCCESS! Found Project ID:', leoProj.id);
        console.log('   Title:', leoProj.metadata?.bookTitle);
    }
}

verifyAll().catch(console.error);
