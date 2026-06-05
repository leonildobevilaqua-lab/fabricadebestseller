# Fábrica de Best Seller - Guia para o Claude Code

Este arquivo serve como uma documentação de inicialização rápida para o **Claude Code** (ou outros agentes de IA) entenderem a estrutura, comandos e arquitetura do projeto **Fábrica de Best Seller**.

---

## 🚀 Visão Geral do Projeto

A **Fábrica de Best Seller** é uma plataforma SaaS full-stack que automatiza a criação, edição e diagramação de livros de alto impacto (best-sellers comerciais). A esteira de produção vai desde a análise de mercado e geração de capítulos baseados em IA até a compilação de arquivos `.docx` prontos para impressão (formato 6"x9") e geração de capas completas com orelhas (PDF/PNG).

### Principais Funcionalidades
1. **Esteira de Pesquisa Ativa**: Coleta e analisa dados do YouTube, Google Search e Best-Sellers da Amazon para mapear as dores, medos e lacunas de conteúdo no nicho escolhido.
2. **Escrita Humanizada Iterativa**: Escreve o livro capítulo por capítulo, dividindo cada um em 4 subtópicos. Os prompts aplicam ativamente regras de *Burstiness* (variabilidade de frases), *Perplexidade* (vocabulário rico) e *Anti-AI* (banimento de transições robóticas).
3. **Compilador Editorial (`doc.service.ts`)**: Gera arquivos Microsoft Word (.docx) formatados de acordo com padrões editoriais rígidos:
   - Tamanho físico: 6" x 9" (15,24 cm x 22,86 cm).
   - Margens espelhadas com medianiz (gutter) para encadernação.
   - Sumário (TOC) dinâmico, página de dedicatória, agradecimentos e "Sobre o Autor".
   - Numeração de páginas iniciando estritamente na página 11 (Introdução).
4. **Gerador de Capas Profissionais (`CoverGenerator.tsx`)**: Canvas interativo no frontend que renderiza a capa completa (Frente, Lombada, Verso e Orelhas) com base no estilo visual selecionado e gera PDF de 300 DPI pronto para impressão ou publicação na UICLAP/KDP.
5. **Painel Admin & Cobrança**: Integração com webhooks da Kiwify e Asaas para controle de créditos, faturamento e ativação automática de pedidos.

---

## 📂 Arquitetura do Repositório

O projeto está dividido em duas partes principais no mesmo repositório:

### 1. Backend (`/backend`)
Construído em Node.js com Express e TypeScript.
- [backend/src/index.ts](file:///c:/Users/Pichau/OneDrive/FERRAMENTAS%20-%20PROFISSIONAIS/bestseller-factory-ai/backend/src/index.ts): Inicialização do servidor Express.
- [backend/src/routes/](file:///c:/Users/Pichau/OneDrive/FERRAMENTAS%20-%20PROFISSIONAIS/bestseller-factory-ai/backend/src/routes): Definição de rotas para projetos, admin, usuários e pagamentos.
- [backend/src/controllers/project.controller.ts](file:///c:/Users/Pichau/OneDrive/FERRAMENTAS%20-%20PROFISSIONAIS/bestseller-factory-ai/backend/src/controllers/project.controller.ts): Gerencia o estado de criação do livro, bloqueio de workers concorrentes e esteiras assíncronas.
- [backend/src/services/ai.service.ts](file:///c:/Users/Pichau/OneDrive/FERRAMENTAS%20-%20PROFISSIONAIS/bestseller-factory-ai/backend/src/services/ai.service.ts): Core da IA. Contém os prompts de humanização, estruturação do livro, títulos e redação iterativa.
- [backend/src/services/doc.service.ts](file:///c:/Users/Pichau/OneDrive/FERRAMENTAS%20-%20PROFISSIONAIS/bestseller-factory-ai/backend/src/services/doc.service.ts): Geração física do arquivo .docx usando a biblioteca `docx`.
- [backend/src/services/db.service.ts](file:///c:/Users/Pichau/OneDrive/FERRAMENTAS%20-%20PROFISSIONAIS/bestseller-factory-ai/backend/src/services/db.service.ts): Banco de dados rápido baseado em arquivos JSON (`database.json`) integrado com sincronização do Supabase para escalabilidade e backup.
- [backend/src/services/llm.factory.ts](file:///c:/Users/Pichau/OneDrive/FERRAMENTAS%20-%20PROFISSIONAIS/bestseller-factory-ai/backend/src/services/llm.factory.ts): Factory que instancia o provedor de IA ativo (Gemini, OpenAI, Anthropic) com failover automático.

### 2. Frontend (`/frontend`)
Single Page Application desenvolvida em React, Vite e TypeScript.
- [frontend/App.tsx](file:///c:/Users/Pichau/OneDrive/FERRAMENTAS%20-%20PROFISSIONAIS/bestseller-factory-ai/frontend/App.tsx): Gerenciador de rotas e fluxo geral de telas (Dashboard, Editor, Landing).
- [frontend/components/CoverGenerator/CoverGenerator.tsx](file:///c:/Users/Pichau/OneDrive/FERRAMENTAS%20-%20PROFISSIONAIS/bestseller-factory-ai/frontend/components/CoverGenerator/CoverGenerator.tsx): Módulo interativo para criação de capas físicas/digitais.
- [frontend/components/CoverGenerator/CoverRender.tsx](file:///c:/Users/Pichau/OneDrive/FERRAMENTAS%20-%20PROFISSIONAIS/bestseller-factory-ai/frontend/components/CoverGenerator/CoverRender.tsx): Renderiza no Canvas o layout exato da capa com base nas dimensões calculadas (orelhas, sangria, lombada em mm).
- [frontend/components/Dashboard.tsx](file:///c:/Users/Pichau/OneDrive/FERRAMENTAS%20-%20PROFISSIONAIS/bestseller-factory-ai/frontend/components/Dashboard.tsx): Painel do cliente onde ele visualiza seus livros, créditos e downloads.
- [frontend/components/Admin.tsx](file:///c:/Users/Pichau/OneDrive/FERRAMENTAS%20-%20PROFISSIONAIS/bestseller-factory-ai/frontend/components/Admin.tsx): Controle financeiro, logs, controle de chaves e visualização de pedidos.

---

## 🛠️ Comandos de Desenvolvimento

### Backend (`/backend`)
- **Instalar Dependências**: `npm install`
- **Iniciar em Desenvolvimento**: `npm run dev`
- **Compilar**: `npm run build` (roda `tsc`)
- **Checar Tipos sem Compilar**: `npx tsc --noEmit`

### Frontend (`/frontend`)
- **Instalar Dependências**: `npm install`
- **Iniciar Servidor Local**: `npm run dev`
- **Compilar para Produção**: `npm run build`

---

## 🧠 Fluxo de Produção do Livro

```
[Entrada de Tema/Nicho]
          ↓
[Esteira de Pesquisa] -> Youtube API + Google-SR + Amazon Scraper
          ↓
[Contexto de Pesquisa] -> Mapeado em dores e mitos do nicho
          ↓
[Geração de Títulos] -> 9 Opções cinematográficas (Sem colons/dashes)
          ↓
[Estruturação] -> Criação de 12 Capítulos (Padrão: Fundamentos -> Métodos -> Prática)
          ↓
[Aprovação do Usuário] -> O cliente valida a estrutura de capítulos
          ↓
[Escrita Iterativa] -> Introdução + 12 Capítulos (cada capítulo tem 4 seções com Previous Context)
          ↓
[Diagramação automática] -> Compilação .docx (6x9 margins, numeração a partir da pág. 11)
          ↓
[Entrega do Livro] -> Geração de ZIP com Docx + Imagens + Textos de Copy de Vendas
```

---

## 🔐 Configuração de Variáveis de Ambiente

As credenciais sensíveis nunca devem ser hardcodadas. Elas são gerenciadas de forma independente para evitar bloqueios de push.

- **Backend**: Configurado no arquivo local `/backend/.env` (não versionado).
- **Frontend**: Configurado no arquivo local `/frontend/.env.local` (não versionado) sob o prefixo `VITE_`.
- **Chaves de API prioritárias**: `GEMINI_API_KEY`, `OPENAI_API_KEY` e `VITE_OPENAI_API_KEY`.
