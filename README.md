# Bestseller Factory AI

Plataforma completa de geração de livros com IA, suporte multi-idiomas, pagamentos e entrega automática.

## Funcionalidades
- **Landing Page de Alta Conversão**: Design moderno, simulação de pagamento.
- **Multi-Idioma**: Suporte completo (Frontend + Livro Gerado) para PT, EN, ES.
- **Protocolo Viral 12-Passos**: Geração estruturada de livros de não-ficção.
- **Admin Panel**: Configuração de chaves de API (Gemini, GPT, Claude, Llama, DeepSeek), Integração de Email (SMTP) e Webhook Kiwify.
- **Entrega Automática**: Envio do DOCX final por e-mail e download direto.

## Configuração

### 1. Backend
```bash
cd backend
npm install
npm start
```
O servidor rodará na porta 3001.

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Acesse em `http://localhost:5173`.

### 3. Configuração Admin
Acesse `/admin` no Frontend (ou clique no link no header).
Credenciais padrão:
- User: `contato@leonildobevilaqua.com.br`
- Senha: `Leo129520-*-`

No painel, configure:
- **API Keys**: Insira suas chaves de IA.
- **SMTP**: Configure seu servidor de e-mail para envio dos livros.
- **Kiwify**: Copie a URL do Webhook e configure no produto na Kiwify.

## Estrutura do Projeto
- `frontend/`: React + Vite + Tailwind.
  - `components/Generator.tsx`: Núcleo da IA.
  - `components/LandingPage.tsx`: Entrada do funil.
  - `services/api.ts`: Comunicação com Backend.
- `backend/`: Express + Node.
  - `services/ai.service.ts`: Lógica de Prompts e IAs.
  - `services/email.service.ts`: Envio de e-mails.
  - `controllers/payment.controller.ts`: Webhooks.

## Notas de Desenvolvimento
- O sistema de pagamento está em modo "Simulação/Polling". Para produção, integre o Webhook real da Kiwify.
- A persistência dos projetos usa Supabase (configuração necessária em `.env` se for usar persistência real além da memória/sessão).

Developed by Agentic AI.
