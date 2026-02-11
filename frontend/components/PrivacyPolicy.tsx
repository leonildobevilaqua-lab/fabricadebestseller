import React from 'react';

export const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-white text-slate-800 font-sans p-8 md:p-16 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Política de Privacidade</h1>
            <p className="mb-4 text-sm text-slate-500">Última atualização: {new Date().toLocaleDateString()}</p>

            <div className="space-y-6 leading-relaxed">
                <section>
                    <h2 className="text-xl font-bold mb-2">1. Informações Gerais</h2>
                    <p>A E Mais Business Soluções em Marketing Ltda ("nós", "nosso"), pessoa jurídica de direito privado inscrita no CNPJ sob o nº 37.453.924/0001-53, entende a importância de proteger suas informações pessoais. Esta Política de Privacidade descreve como coletamos, usamos e compartilhamos seus dados ao utilizar nossos serviços e website (fabricadebestseller.com.br).</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">2. Coleta de Dados</h2>
                    <p>Coletamos informações que você nos fornece diretamente, como:</p>
                    <ul className="list-disc ml-6 mt-2">
                        <li>Dados de cadastro: Nome, e-mail, telefone/WhatsApp.</li>
                        <li>Dados de pagamento: Processados de forma segura por gateways parceiros (ex: Kiwify). Nós não armazenamos dados completos de cartão de crédito.</li>
                        <li>Conteúdo gerado: Informações inseridas para a criação de livros e materiais via nossa Inteligência Artificial.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">3. Uso dos Dados</h2>
                    <p>Utilizamos seus dados para:</p>
                    <ul className="list-disc ml-6 mt-2">
                        <li>Fornecer e manter nossos serviços de geração de conteúdo.</li>
                        <li>Processar pagamentos e assinaturas.</li>
                        <li>Enviar comunicações importantes, atualizações e ofertas (com seu consentimento).</li>
                        <li>Melhorar e personalizar sua experiência na plataforma.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">4. Compartilhamento de Dados</h2>
                    <p>Não vendemos suas informações pessoais. Podemos compartilhar dados com:</p>
                    <ul className="list-disc ml-6 mt-2">
                        <li>Fornecedores de serviços essenciais (hospedagem, processamento de pagamento, envio de e-mail).</li>
                        <li>Autoridades legais, se necessário para cumprir a lei ou proteger nossos direitos.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">5. Segurança</h2>
                    <p>Adotamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">6. Seus Direitos (LGPD)</h2>
                    <p>Você tem direito a acessar, corrigir, excluir ou limitar o uso de seus dados pessoais. Para exercer esses direitos, entre em contato conosco através do e-mail: <strong>suporte@fabricadebestseller.com.br</strong>.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">7. Cookies e Rastreamento</h2>
                    <p>Utilizamos cookies e tecnologias semelhantes (como o Pixel do Facebook) para analisar o tráfego e melhorar nossos esforços de marketing. Você pode gerenciar suas preferências de cookies nas configurações do seu navegador.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">8. Contato</h2>
                    <p>Se tiver dúvidas sobre esta Política, entre em contato:</p>
                    <p className="mt-2">
                        <strong>E Mais Business Soluções em Marketing Ltda</strong><br />
                        CNPJ: 37.453.924/0001-53<br />
                        E-mail: suporte@fabricadebestseller.com.br
                    </p>
                </section>
            </div>

            <div className="mt-12 border-t pt-8 text-center">
                <a href="/" className="text-blue-600 hover:underline">Voltar para a Página Inicial</a>
            </div>
        </div>
    );
};
