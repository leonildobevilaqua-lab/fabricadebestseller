import React from 'react';

const Disclaimer: React.FC = () => {
    return (
        <div className="max-w-6xl mx-auto px-6 py-8 mt-12 border-t border-slate-800/50">
            <p className="text-[10px] text-slate-500 leading-relaxed text-center uppercase tracking-tight opacity-60">
                Este site não faz parte do site do Facebook ou Facebook Inc. Além disso, este site NÃO é endossado pelo Facebook de forma alguma. 
                FACEBOOK é uma marca comercial da FACEBOOK, Inc. 
                <br /><br />
                <strong>AVISO LEGAL:</strong> Os números de vendas indicados acima são meus números de vendas pessoais. Por favor, entenda que meus resultados não são típicos, não estou sugerindo que você os duplicará (ou fará qualquer coisa nesse sentido). Tenho a vantagem de praticar marketing e propaganda de resposta direta desde 2018 e, como resultado, tenho um grupo de seguidores estabelecido. Estou usando essas referências apenas para fins de exemplo. Seus resultados variarão e dependerão de muitos fatores ... incluindo, mas não se limitando a, seu histórico, experiência e ética de trabalho. Todos os negócios envolvem riscos, bem como esforços e ações massivas e consistentes.
            </p>
        </div>
    );
};

export default Disclaimer;
