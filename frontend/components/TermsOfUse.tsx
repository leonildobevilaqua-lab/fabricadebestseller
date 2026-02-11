import React from 'react';

export const TermsOfUse: React.FC = () => {
    return (
        <div className="min-h-screen bg-white text-slate-800 font-sans p-8 md:p-16 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Termos de Uso</h1>
            <p className="mb-4 text-sm text-slate-500">Última atualização: {new Date().toLocaleDateString()}</p>

            <div className="space-y-6 leading-relaxed">
                <section>
                    <h2 className="text-xl font-bold mb-2">1. Aceitação dos Termos</h2>
                    <p>Ao acessar e utilizar o site e os serviços da Fábrica de Best Sellers (operado por E Mais Business Soluções em Marketing Ltda, CNPJ 37.453.924/0001-53), você concorda com estes Termos de Uso e com nossa Política de Privacidade. Se não concordar, não utilize nossos serviços.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">2. Descrição do Serviço</h2>
                    <p>Oferecemos uma plataforma baseada em Inteligência Artificial para auxiliar na criação, estruturação e desenvolvimento de livros digitais e impressos. O usuário fornece o tema e dados iniciais, e nossa tecnologia gera o conteúdo sugerido.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">3. Responsabilidade pelo Conteúdo</h2>
                    <p>O conteúdo gerado pela IA é uma sugestão baseada em padrões. <strong>O usuário (autor) é o único responsável pela revisão, edição, veracidade e publicação final da obra.</strong> A E Mais Business não detém direitos autorais sobre a obra criada pelo usuário, mas também não se responsabiliza por plágios acidentais, informações incorretas ou uso indevido do conteúdo gerado.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">4. Planos e Pagamentos</h2>
                    <ul className="list-disc ml-6 mt-2">
                        <li>Os serviços podem ser adquiridos via compra avulsa ou assinatura (Planos Starter, PRO, Black).</li>
                        <li>Os pagamentos são processados via Kiwify.</li>
                        <li>Assinaturas possuem renovação automática conforme o ciclo contratado (mensal ou anual).</li>
                        <li>O cancelamento pode ser solicitado a qualquer momento, interrompendo a renovação futura, mas não reembolsando períodos já utilizados, salvo garantia legal de 7 dias.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">5. Uso Aceitável</h2>
                    <p>É proibido utilizar nossa plataforma para gerar conteúdo ilegal, odioso, discriminatório, difamatório ou que viole direitos de terceiros. Reservamo-nos o direito de suspender contas que violem esta regra.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">6. Propriedade Intelectual</h2>
                    <p>A tecnologia, código-fonte, design e marca "Fábrica de Best Sellers" são propriedade exclusiva da E Mais Business. Você recebe uma licença de uso da plataforma, não a propriedade do software.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">7. Limitação de Responsabilidade</h2>
                    <p>Nossos serviços são fornecidos "como estão". Não garantimos que a plataforma estará livre de erros ou interrupções. Em nenhuma circunstância a E Mais Business será responsável por danos indiretos, lucros cessantes ou perda de dados decorrentes do uso do serviço.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">8. Alterações nos Termos</h2>
                    <p>Podemos atualizar estes Termos a qualquer momento. O uso contínuo do serviço após as alterações constitui aceitação dos novos termos.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">9. Contato e Foro</h2>
                    <p>Para suporte: <strong>suporte@fabricadebestseller.com.br</strong></p>
                    <p>Fica eleito o foro da comarca da sede da empresa para dirimir quaisquer dúvidas oriundas destes Termos.</p>
                </section>
            </div>

            <div className="mt-12 border-t pt-8 text-center">
                <a href="/" className="text-blue-600 hover:underline">Voltar para a Página Inicial</a>
            </div>
        </div>
    );
};
