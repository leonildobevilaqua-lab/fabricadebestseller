
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://aulcxbqbiqlagocpjfvx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bGN4YnFiaXFsYWdvY3BqZnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDE4ODAsImV4cCI6MjA4MzMxNzg4MH0.ooJbWU70OZBMkatrvx-XkkNq9JPZ878UCow7cXeJzAs'
);

const PROJECT_ID = 'c6fed274-61ea-4e46-a2e6-fe6411b12e00';

async function recover() {
  console.log("Starting recovery for project:", PROJECT_ID);
  
  const { data: record, error: getError } = await supabase
    .from('kv_store')
    .select('*')
    .eq('key', `/projects/${PROJECT_ID}`)
    .single();
    
  if (getError || !record) {
    console.error("Project not found in Supabase:", getError);
    return;
  }
  
  const project = record.value;
  console.log("Current status:", project.metadata.status);
  
  // Define the structure based on the topic field
  const titles = [
    "A Força Silenciosa - Por que sua quietude te promove e seu barulho te anula. Base: 1 Pe 3:4",
    "Ela Se Veste de Força e Dignidade - Postura, comunicação e presença que comandam respeito. Base: Pv 31:25",
    "A Boca Que Abre Com Sabedoria - Como liderar e negociar sem ser chamada de \"mandona\". Base: Pv 31:26",
    "Ela Examina e Compra Campos - Mentalidade de investidora com seu salário. Base: Pv 31:16",
    "Do Seu Lucro Ela Planta Vinha - Como multiplicar e não só gastar. Base: Pv 31:16",
    "Não Teme a Neve Pela Sua Casa - Como blindar sua vida de qualquer crise. Base: Pv 31:21",
    "Princesa na Rua, Rainha no Lar - A sabedoria de entender o tempo e o lugar de tudo... Base: Ec 3:1, Pv 14:1",
    "O Coração do Homem Confia Nela - Como se tornar o porto seguro que um homem de valor procura. Base: Pv 31:11",
    "Seu Homem é Estimado Nas Portas - Como sua conduta promove o homem que está com você e ele te louva por isso. Base: Pv 31:23,28",
    "A Alegria da Mulher Virtuosa - O princípio bíblico de honra, serviço e entrega mútua na aliança... Base: Pv 5:18, 1 Co 7:3-5"
  ];
  
  const structure = titles.map((t, idx) => ({
    id: idx + 1,
    title: t.split(' - ')[0],
    intro: t,
    content: "",
    isGenerated: false,
    summary: "",
    isCompleted: false
  }));
  
  // Add Intro (id 0)
  structure.unshift({
    id: 0,
    title: "Introdução",
    intro: "Introdução ao Segredo do Selo",
    content: "",
    isGenerated: false,
    summary: "",
    isCompleted: false
  });
  
  // Add Conclusion (id 11)
  structure.push({
    id: 11,
    title: "Conclusão",
    intro: "Conclusão e Chamado à Ação",
    content: "",
    isGenerated: false,
    summary: "",
    isCompleted: false
  });
  
  project.structure = structure.map(ch => ({ ...ch, isGenerated: true, content: ch.content || "Conteúdo recuperado pelo sistema." }));
  
  // Ensure critical fields are inside metadata for Admin Panel visibility
  project.metadata = {
    ...project.metadata,
    id: project.id || PROJECT_ID,
    bookTitle: project.bookTitle || project.metadata.bookTitle || "Geração Recuperada",
    authorName: project.authorName || project.metadata.authorName || "Autor",
    topic: project.topic || project.metadata.topic || "",
    contact: project.contact || project.metadata.contact || { name: project.authorName, email: "n/a" },
    status: 'COMPLETED',
    progress: 100,
    statusMessage: "Finalizado manualmente para recuperação.",
    currentWorkerId: "" // Unlock
  };
  
  // Also update root status for consistency
  project.status = 'COMPLETED';
  project.progress = 100;
  
  const { error: updateError } = await supabase
    .from('kv_store')
    .upsert({
      key: `/projects/${PROJECT_ID}`,
      value: project,
      updated_at: new Date().toISOString()
    });
    
  if (updateError) {
    console.error("Failed to update project:", updateError);
  } else {
    console.log("Project recovered successfully!");
  }
}

recover();
