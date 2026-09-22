const fs = require('fs');
const file = 'frontend/components/WebinarLaunch.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\[[\s\S]*?autor_comum_8_1785522879511\.png[\s\S]*?\]/;

const newArray = `[
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
                ]`;

content = content.replace(regex, newArray);
content = content.replace('src={`/assets/landing/${author.img}`}', 'src={`/assets/${author.img}`}');
fs.writeFileSync(file, content);
console.log('Successfully replaced authors and image path.');
