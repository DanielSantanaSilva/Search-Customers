# Search Customers

Plugin profissional de prospecção e CRM local para o **Google Antigravity**, implementado em TypeScript com foco em segurança, organização e facilidade de evolução.

> **Customer** é o termo correto em inglês para “cliente”; **customers** é sua forma plural.

## O que o projeto oferece

- Plugin Antigravity com sete skills acionadas por linguagem natural.
- Servidor MCP em TypeScript para o agente consultar e atualizar o CRM.
- API REST local construída com Fastify e validação Zod.
- Banco SQLite local com histórico básico do pipeline e exclusão lógica.
- Dashboard responsivo em React, TypeScript, Vite e Tailwind CSS.
- Pipeline de prospecção com etapas de novo lead até fechamento.
- Resumo financeiro com valores fechados, recebidos, pendentes e MRR.
- Controle de follow-ups, contratos e dados de contato.
- Integração opcional com Playwright e Google Maps Platform.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Interface | React 19, TypeScript, Tailwind CSS 4, Lucide Icons |
| Build | Vite 8 |
| API | Fastify 5 |
| Validação | Zod 4 |
| Banco | SQLite com `better-sqlite3` |
| Integração com agente | Model Context Protocol SDK |
| Testes | Vitest |
| Qualidade | TypeScript strict e Oxlint |

## Arquitetura

```text
Search-Customers/
├── plugin.json                 # Manifesto do plugin Antigravity
├── mcp_config.json             # Servidores MCP usados pelo plugin
├── skills/                     # Instruções especializadas do agente
│   ├── prospector-setup/
│   ├── prospeccao-maps/
│   ├── dashboard-leads/
│   ├── redesign-premium/
│   ├── proposta-gmail/
│   ├── deploy-hostinger/
│   └── contrato-servico/
├── server/
│   ├── db/database.ts          # Inicialização e schema SQLite
│   ├── mcp/index.ts            # Servidor MCP stdio
│   ├── services/               # Regras de negócio reutilizadas
│   ├── app.ts                  # Rotas e segurança da API
│   ├── domain.ts               # Schemas, tipos e domínios
│   └── index.ts                # Entrada do servidor HTTP
├── src/
│   ├── components/             # Componentes do dashboard
│   ├── lib/                    # Cliente HTTP e formatadores
│   ├── types/                  # Tipos da interface
│   ├── App.tsx                 # Dashboard principal
│   └── index.css               # Tailwind e estilos globais
├── data/                       # Banco local, ignorado pelo Git
└── dist/                       # Build de produção
```

A API e o MCP usam o mesmo `LeadService`. Isso impede que as regras do dashboard e as regras do agente evoluam de forma diferente.

## Requisitos

- Node.js 22 ou superior.
- npm 10 ou superior.
- Google Antigravity, para utilizar o projeto como plugin.
- Opcional: plugin Google Maps Platform para pesquisa oficial de locais.

Verifique o ambiente:

```bash
node --version
npm --version
```

## Instalação para desenvolvimento

Clone ou copie o projeto e abra um terminal em sua raiz:

```bash
npm install
cp .env.example .env
npm run dev
```

No Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
npm run dev
```

O comando inicia dois processos:

- Dashboard Vite: `http://localhost:5173`
- API Fastify: `http://127.0.0.1:8765`

A rota `http://127.0.0.1:8765/api/health` deve responder:

```json
{ "status": "ok" }
```

O banco é criado automaticamente em `data/search-customers.db` na primeira inicialização.

## Instalação como plugin do Antigravity

O Antigravity procura plugins em uma pasta global ou dentro do workspace.

### Opção 1: instalação no projeto

Copie esta pasta para:

```text
SEU_WORKSPACE/.agents/plugins/search-customers/
```

### Opção 2: instalação global

Windows:

```text
C:\Users\SEU_USUARIO\.gemini\config\plugins\search-customers\
```

macOS e Linux:

```text
~/.gemini/config/plugins/search-customers/
```

Depois:

1. Entre na pasta instalada.
2. Execute `npm install`.
3. Confira o `mcp_config.json`.
4. Reinicie o Antigravity para recarregar plugins e MCPs.
5. Diga no chat: **“configurar o Search Customers”**.

O `mcp_config.json` usa `${pluginDir}` como diretório do servidor. Caso sua versão do Antigravity não resolva essa variável, substitua o valor de `cwd` pelo caminho absoluto da pasta do plugin.

Exemplo no Windows:

```json
{
  "command": "npm",
  "args": ["run", "mcp"],
  "cwd": "C:/Users/SEU_USUARIO/.gemini/config/plugins/search-customers"
}
```

## Configuração do ambiente

Copie `.env.example` para `.env` e ajuste quando necessário:

```dotenv
PORT=8765
HOST=127.0.0.1
SEARCH_CUSTOMERS_DB=./data/search-customers.db
```

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `8765` | Porta da API local |
| `HOST` | `127.0.0.1` | Interface de rede; mantenha local por segurança |
| `SEARCH_CUSTOMERS_DB` | `./data/search-customers.db` | Caminho do banco SQLite |

Não coloque credenciais de hospedagem, Google ou Gmail no `.env` versionado. Use o cofre de segredos do sistema ou variáveis locais fora do Git.

## Como usar no Antigravity

As skills são ativadas por linguagem natural.

### Configuração inicial

```text
Configurar o Search Customers para prospectar clínicas em Curitiba.
```

### Buscar e qualificar leads

```text
Prospere 10 clínicas odontológicas em Curitiba com boa avaliação e site ruim.
```

O agente deve consultar fontes permitidas, avaliar os sites e salvar somente informações verificáveis com a ferramenta `lead_upsert`.

### Consultar o pipeline

```text
Mostre meus leads em proposta e os follow-ups pendentes.
```

### Redesenhar um site

```text
Crie um redesign premium para o lead clinica-vida.
```

### Preparar uma proposta

```text
Crie um rascunho de proposta para clinica-vida, sem enviar automaticamente.
```

### Publicar

```text
Publique o site aprovado da clinica-vida na Hostinger por SFTP e verifique o HTTPS.
```

### Formalizar

```text
Prepare o contrato do cliente clinica-vida e indique os dados que ainda faltam.
```

## Ferramentas MCP disponíveis

| Ferramenta | Finalidade |
| --- | --- |
| `lead_list` | Lista todos os leads ou filtra por status |
| `lead_get` | Consulta um lead pelo slug |
| `lead_upsert` | Cria ou atualiza dados básicos sem apagar o pipeline |
| `lead_patch` | Atualiza parcialmente qualquer campo permitido |
| `lead_transition_status` | Move o lead entre etapas |
| `followup_list_due` | Lista propostas aguardando follow-up |
| `followup_record` | Registra um follow-up realizado |
| `finance_summary` | Retorna métricas financeiras e do funil |

### Status aceitos

```text
novo → redesenhado → publicado → proposta → respondeu → fechado
                                                       ↘ descartado
```

O status `descartado` também pode ser usado a partir de qualquer etapa quando houver confirmação do usuário.

## API REST

A API fica disponível apenas em `127.0.0.1` por padrão.

| Método | Rota | Uso |
| --- | --- | --- |
| `GET` | `/api/health` | Verifica a saúde da API |
| `GET` | `/api/leads` | Lista leads |
| `GET` | `/api/leads?status=proposta` | Filtra por status |
| `GET` | `/api/leads/:slug` | Busca um lead |
| `POST` | `/api/leads` | Cria ou atualiza dados básicos |
| `PATCH` | `/api/leads/:slug` | Atualiza parcialmente um lead |
| `DELETE` | `/api/leads/:slug` | Faz exclusão lógica |
| `GET` | `/api/dashboard/summary` | Retorna métricas do dashboard |
| `GET` | `/api/followups?days=3` | Lista follow-ups pendentes |
| `POST` | `/api/leads/:slug/followups` | Registra follow-up |

Exemplo de criação:

```bash
curl -X POST http://127.0.0.1:8765/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "clinica-vida",
    "nome": "Clínica Vida",
    "nicho": "Clínica médica",
    "cidade": "Curitiba",
    "nota": 4.9,
    "avaliacoes": 120,
    "email": "contato@exemplo.com",
    "telefone": "",
    "whatsapp": "",
    "siteAntigo": "https://example.com",
    "motivo": "Site pouco responsivo e sem CTA claro.",
    "urlNova": "",
    "observacoes": ""
  }'
```

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia API e frontend com recarregamento automático |
| `npm run dev:web` | Inicia somente o dashboard |
| `npm run dev:api` | Inicia somente a API |
| `npm run mcp` | Inicia o servidor MCP stdio |
| `npm run build` | Executa TypeScript e gera o frontend em `dist/` |
| `npm start` | Serve API e o build de produção |
| `npm run test` | Executa testes automatizados |
| `npm run lint` | Verifica padrões e possíveis erros |
| `npm run typecheck` | Valida todos os tipos sem gerar arquivos |

## Produção local

Gere o dashboard e inicie o servidor:

```bash
npm run build
npm start
```

A aplicação completa ficará em `http://127.0.0.1:8765`. Somente a pasta `dist` é servida estaticamente; o banco, as configurações e os arquivos internos não ficam expostos por HTTP.

## Publicação de sites na Hostinger

A Hostinger é usada somente para hospedar os sites criados para os clientes. O CRM permanece local e não deve ser enviado para a hospedagem.

Para publicar uma página ou site aprovado:

1. Gere e valide os arquivos finais do site do cliente.
2. Confirme no hPanel o domínio e o diretório raiz correspondente.
3. Faça backup caso existam arquivos anteriores no destino.
4. Publique somente os arquivos finais do site, preferencialmente por SFTP, SSH ou pelo gerenciador de arquivos do hPanel.
5. Não envie o CRM, `.env`, bancos SQLite, `node_modules`, skills ou arquivos internos deste plugin.
6. Verifique DNS, HTTPS, assets, rotas, responsividade, formulários e links.
7. Atualize a URL no CRM local e marque o lead como `publicado` somente após a validação.

Não presuma que o diretório seja sempre `public_html`; use o caminho informado pelo hPanel para o domínio selecionado.

## Uso local do CRM

O dashboard, a API Fastify e o banco SQLite são ferramentas locais para gerenciar leads e clientes. Inicie-os apenas no computador de trabalho:

```bash
npm run dev
```

Para usar o build local de produção:

```bash
npm run build
npm start
```

Mantenha `HOST=127.0.0.1`, não copie o banco para a pasta pública da Hostinger e faça backups periódicos de `data/search-customers.db` em um local privado e seguro.

## Segurança e privacidade

- A aplicação escuta somente em localhost por padrão.
- O banco e arquivos `.env` não devem ser versionados.
- A API valida payloads e limita requisições a 1 MB.
- O frontend não injeta HTML vindo de leads.
- Exclusões são lógicas para reduzir perdas acidentais.
- Na Hostinger, prefira SFTP, SSH ou o gerenciador de arquivos do hPanel; não use FTP simples.
- Não salve senhas no banco, nas observações ou nos arquivos das skills.
- Revise os termos do Google Maps antes de armazenar dados obtidos pela plataforma.
- Trate dados pessoais conforme a LGPD e mantenha apenas os dados necessários.
- Solicite revisão jurídica antes de usar contratos gerados.

## Qualidade antes de enviar mudanças

Execute sempre:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Solução de problemas

### O dashboard abre, mas não carrega dados

Confirme se a API está em execução:

```bash
npm run dev:api
```

Depois acesse `http://127.0.0.1:8765/api/health`.

### O MCP não aparece no Antigravity

1. Confirme que `npm install` foi executado na pasta instalada.
2. Troque `${pluginDir}` por um caminho absoluto em `mcp_config.json`.
3. Teste manualmente com `npm run mcp`.
4. Reinicie o Antigravity.

### O SQLite não abre

Confirme que o usuário possui permissão de escrita na pasta `data`. Se usar um caminho personalizado, defina `SEARCH_CUSTOMERS_DB` com um caminho absoluto.

### A porta 8765 já está em uso

Altere `PORT` no `.env` e atualize o proxy de desenvolvimento em `vite.config.ts` se também estiver usando o Vite.

## Diretrizes para contribuição

- Mantenha regras de negócio em `server/services`, não nas rotas.
- Valide toda entrada externa com Zod.
- Evite duplicar tipos entre camadas; quando o projeto crescer, extraia um pacote compartilhado.
- Não adicione segredos, bancos locais ou builds ao Git.
- Inclua testes para correções e novas regras.
- Preserve acessibilidade, responsividade e mensagens em português.
- Use comentários somente quando explicarem uma decisão não óbvia; prefira nomes claros e funções pequenas.

## Créditos

O fluxo funcional foi inspirado no projeto público `ArrecheNeto/gemini-prospector`. Esta implementação utiliza arquitetura e código próprios em TypeScript, corrige riscos do protótipo original e mantém a separação entre setup, prospecção, redesign, proposta, deploy, dashboard e contrato.

## Licença

Distribuído sob a licença MIT. Adicione seus dados de autoria ao publicar o repositório.
