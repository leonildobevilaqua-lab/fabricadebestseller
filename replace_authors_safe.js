const fs = require('fs');
const file = 'frontend/components/WebinarLaunch.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `                [
                  { img: "autor_comum_1_1785522805078.png", title: "LIVRO BEM SUCEDIDO", desc: "AUTORA INDEPENDENTE" },
                  { img: "autor_comum_2_1785522816216.png", title: "REFERÊNCIA EM NEGÓCIOS", desc: "LIVRO DE EMPREENDEDORISMO" },
                  { img: "autor_comum_3_1785522826073.png", title: "SUCESSO DE VENDAS", desc: "AUTORA BEST-SELLER" },
                  { img: "autor_comum_4_1785522836947.png", title: "MUITO ACIMA DA MÉDIA", desc: "ESCRITOR DE NÃO FICÇÃO" },
                  { img: "autor_comum_5_1785522848208.png", title: "APOSTA JOVEM", desc: "DESTAQUE NACIONAL" },
                  { img: "autor_comum_6_1785522858746.png", title: "FINANÇAS DESCOMPLICADAS", desc: "SUCESSO DE PÚBLICO" },
                  { img: "autor_comum_7_1785522868640.png", title: "NOVA VOZ NA LITERATURA", desc: "TOP 1 NA AMAZON" },
                  { img: "autor_comum_8_1785522879511.png", title: "SUPERAÇÃO E SUCESSO", desc: "AUTOR REVELAÇÃO" }
                ].map((author, index) => (
                  <div key={index} className="w-64 sm:w-72 bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative group-hover/card flex-shrink-0">
                    <div className="aspect-[3/4] relative flex items-center justify-center bg-slate-900">
                      <img 
                        src={\`/assets/landing/\${author.img}\`}`;

const newStr = `                [
                  { img: "1 – A Chama Inextinguível - Ap. Custodio Ignacio.jpg", title: "A Chama Inextinguível", desc: "Ap. Custodio Ignacio" },
                  { img: "2 – O Campo Magnético das Vendas - Leonildo Bevilaqua.png", title: "O Campo Magnético das Vendas", desc: "Leonildo Bevilaqua" },
                  { img: "3 – A Ilusão da Cor - Edinaldo Pereira da Silva.png", title: "A Ilusão da Cor", desc: "Edinaldo Pereira da Silva" },
                  { img: "4 – A Nova Educação – Moisés Allaion Ferreira.jpg", title: "A Nova Educação", desc: "Moisés Allaion Ferreira" },
                  { img: "5 – O Mapa Secreto da Puberdade – Tânia Garcia.jpg", title: "O Mapa Secreto da Puberdade", desc: "Tânia Garcia" },
                  { img: "6 – Memorize de Forma Inteligente, Não Árdua! – Prof. Carlos André.png", title: "Memorize de Forma Inteligente, Não Árdua!", desc: "Prof. Carlos André" },
                  { img: "7 – 3 Minutos de Silêncio – Aline Tanaka.png", title: "3 Minutos de Silêncio", desc: "Aline Tanaka" },
                  { img: "8 – Autodefesa é para Todos – Flávio Almeida.png", title: "Autodefesa é para Todos", desc: "Flávio Almeida" },
                  { img: "9 – A Rosa e o Cravo – Solange Cristina Leandrin Betiate.png", title: "A Rosa e o Cravo", desc: "Solange Cristina Leandrin Betiate" },
                  { img: "10 – Crianças do Amanhã – Carlos Bueno.png", title: "Crianças do Amanhã", desc: "Carlos Bueno" }
                ].map((author, index) => (
                  <div key={index} className="w-64 sm:w-72 bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative group-hover/card flex-shrink-0">
                    <div className="aspect-[3/4] relative flex items-center justify-center bg-slate-900">
                      <img 
                        src={\`/assets/\${author.img}\`}`;

if (content.includes(oldStr)) {
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(file, content);
  console.log('Successfully replaced authors.');
} else {
  console.log('String not found');
}
