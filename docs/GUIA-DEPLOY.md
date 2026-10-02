# Guia de Deploy

**Sistema de Controle de Vagas em Acolhimentos Municipais**

Documento técnico destinado à equipe de TI responsável pela implantação, replicação e manutenção do sistema.

Versão 1.0 — outubro/2026

---

## Sumário

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Pré-requisitos](#2-pré-requisitos)
3. [Configuração do Supabase](#3-configuração-do-supabase)
4. [Configuração do Vercel](#4-configuração-do-vercel)
5. [Variáveis de Ambiente](#5-variáveis-de-ambiente)
6. [Migrations do Banco de Dados](#6-migrations-do-banco-de-dados)
7. [Criação do Primeiro Administrador](#7-criação-do-primeiro-administrador)
8. [Deploy de Produção](#8-deploy-de-produção)
9. [Domínio Personalizado](#9-domínio-personalizado)
10. [Backup e Recuperação](#10-backup-e-recuperação)
11. [Monitoramento e Logs](#11-monitoramento-e-logs)
12. [Atualização do Sistema](#12-atualização-do-sistema)
13. [Replicação em Outro Município](#13-replicação-em-outro-município)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Visão Geral da Arquitetura

### Componentes de segurança

- **RLS** — isolamento por unidade no nível do banco
- **Criptografia em repouso** — CPF, RG, dados de saúde
- **Trilha de auditoria imutável** — trigger bloqueia UPDATE/DELETE
- **RBAC** — 6 perfis de acesso
- **JWT** — sessões assinadas pelo Supabase Auth

---

## 2. Pré-requisitos

### Ferramentas de desenvolvimento

| Ferramenta | Versão mínima | Instalação |
|------------|---------------|-----------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| Git | 2.30+ | [git-scm.com](https://git-scm.com) |
| Supabase CLI | 2.100+ | `scoop install supabase` (Windows) ou `brew install supabase/tap/supabase` (macOS/Linux) |
| Vercel CLI (opcional) | 39+ | `npm install -g vercel` |
| VS Code (recomendado) | Última | [code.visualstudio.com](https://code.visualstudio.com) |

### Contas necessárias

- **GitHub** — com acesso ao repositório do projeto
- **Supabase** — plano gratuito ou pago
- **Vercel** — plano gratuito ou pago

### Conhecimentos recomendados

- Git básico (clone, commit, push, branches)
- Terminal/PowerShell
- Conceitos de banco de dados relacionais
- Conceitos de RLS (Row Level Security)

---

## 3. Configuração do Supabase

### 3.1 Criar projeto

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Clique em **New Project**
3. Preencha:
   - **Organization:** escolha ou crie
   - **Name:** `Sistema_Vagas_Sedeas` (ou o nome do município)
   - **Database Password:** ⚠️ gere uma senha **forte** e **guarde**
   - **Region:** **South America (São Paulo)** para melhor latência
   - **Pricing Plan:** Free ou Pro
4. Aguarde o provisionamento (~2 min)

### 3.2 Anotar as credenciais

Em **Project Settings → API**, copie e guarde:

- **Project URL** — `https://xxxx.supabase.co`
- **Project API keys:**
  - `anon` `public` — chave pública (para o front-end)
  - `service_role` `secret` — chave secreta (**NUNCA** expor ao cliente)

Em **Project Settings → Database**, copie:

- **Connection string → Transaction pooler** (porta **6543**) — para o runtime
- **Connection string → Session/Direct pooler** (porta **5432**) — para migrations

### 3.3 Configurar autenticação

1. **Authentication → Providers** — confirme que **Email** está habilitado
2. **Authentication → URL Configuration:**
   - **Site URL:** `https://SEU-DOMINIO.vercel.app` (ou domínio próprio)
   - **Redirect URLs:** adicione `https://SEU-DOMINIO.vercel.app/**` e `http://localhost:3000/**`

### 3.4 Gerar chave de criptografia

A chave de criptografia AES-256 é usada para proteger CPF, RG e dados de saúde.

**Gere uma chave forte de 64 caracteres hexadecimais:**

```powershell
# Windows PowerShell
-join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })

# Linux/macOS
openssl rand -hex 32

⚠️ CRÍTICO:

Guarde a chave em gerenciador de senhas ou cofre institucional

Perder a chave = perder acesso a todos os dados criptografados

Nunca commite a chave no Git

Em caso de rotação, planeje uma migração de recriptografia

4. Configuração do Vercel
4.1 Criar projeto
Acesse vercel.com/dashboard

Clique em Add New → Project

Selecione o repositório GitHub do sistema

Configure:

Application Preset: Next.js (detectado automaticamente)

Root Directory: ./ (padrão)

Build Command: npm run build (padrão)

Não faça o deploy ainda — primeiro configure as variáveis

4.2 Integração com Supabase (recomendado)
A integração oficial sincroniza automaticamente as variáveis:

Vercel → Integrations → Supabase

Add Integration

Escolha a organização/projeto Supabase

Selecione o projeto Vercel

Autorize

As variáveis POSTGRES_URL, SUPABASE_URL, etc. serão populadas automaticamente.

⚠️ Atenção: variáveis marcadas como Sensitive no Vercel não são baixadas pelo CLI (vercel env pull). Nesse caso, copie manualmente do Supabase.

4.3 Adicionar variáveis manuais
Em Vercel → Settings → Environment Variables, adicione as variáveis que a integração não cobriu:

FIELD_ENCRYPTION_KEY — chave gerada no Passo 3.4

SUPABASE_SECRET_KEY — se a integração não populou

Marque Production, Preview e Development para cada uma.

5. Variáveis de Ambiente
Tabela completa
Variável	Origem	Obrigatória	Descrição
POSTGRES_URL	Supabase → Connection string (pooler)	✅	Conexão pooled (porta 6543) — usada pelo runtime
POSTGRES_URL_NON_POOLING	Supabase → Connection string (direct)	✅	Conexão direta (porta 5432) — usada por migrations
NEXT_PUBLIC_SUPABASE_URL	Supabase → API → Project URL	✅	URL do projeto Supabase
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY	Supabase → API → anon key	✅	Chave pública (client-side)
SUPABASE_SECRET_KEY	Supabase → API → service_role key	✅	Chave secreta (server-side, para Admin API)
FIELD_ENCRYPTION_KEY	Gerada (Passo 3.4)	✅	Chave AES-256 (64 chars hex)
Sobre a codificação da senha na URL
Se a senha do banco tiver caracteres especiais (@, #, :, /, ?, &, %), ela precisa ser URL-encoded na connection string:

Caractere	Codificação
@	%40
#	%23
:	%3A
/	%2F
?	%3F
&	%26
%	%25
Exemplo: senha G@ruja vira G%40ruja na URL.

Arquivo .env.local (desenvolvimento)
Para rodar localmente, crie .env.local na raiz do projeto:

POSTGRES_URL="postgresql://postgres.xxx:SENHA@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgresql://postgres.xxx:SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="eyJ..."
SUPABASE_SECRET_KEY="eyJ..."
FIELD_ENCRYPTION_KEY="sua-chave-hex-64-chars"

⚠️ NUNCA commite .env.local — ele já está no .gitignore.


Migrations, primeiro admin, deploy, backup e troubleshooting

---

## 6. Migrations do Banco de Dados

### 6.1 Clonar o repositório

```bash
git clone https://github.com/Npc-player/Sistema_Vagas_Sedeas.git
cd Sistema_Vagas_Sedeas
npm install

6.2 Linkar o projeto Supabase
bash
supabase login
supabase link --project-ref <SEU_PROJECT_REF>
O project-ref está em Supabase Dashboard → Project Settings → General → Reference ID.

6.3 Aplicar as migrations
bash
supabase db push
O que isso faz:

Compara as migrations locais (supabase/migrations/) com o banco remoto

Aplica apenas as pendentes

Mostra cada migration aplicada

Migrations esperadas (na ordem cronológica):

init_schema — enums e tabelas base

rls_policies — policies de RLS

rls_acolhidos — policies específicas

grants_authenticated — GRANTs

grant_helper_functions — permissões das funções helper

trigger_create_profile — trigger auth.users → profiles

crypto_functions — funções pgcrypto

unique_cpf_hash — unicidade de CPF

protocolo_sequence — sequence de protocolos

dpo_module — tabelas do módulo DPO

6.4 Validar
No Supabase → SQL Editor, rode:

sql
-- Verifica tabelas criadas
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Verifica RLS habilitado
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;

-- Verifica policies
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
Esperado:

Tabelas: acolhidos, acolhimentos, audit_log, dpo_configuracao, lgpd_requisicoes, profiles, unidades, vagas

rowsecurity = false não deve retornar nada em tabelas públicas (todas com RLS ativo)

15+ policies

7. Criação do Primeiro Administrador
⚠️ Isso só precisa ser feito uma vez. O primeiro usuário deve ser criado manualmente.

7.1 Criar usuário no Supabase Auth
Supabase → Authentication → Users

Clique em Add user → Create new user

Preencha:

Email: e-mail institucional do administrador

Password: senha forte (mínimo 12 caracteres)

Auto Confirm User: ✅ marque esta opção (senão o usuário fica pendente de confirmação)

Clique em Create user

7.2 Promover para ADMIN_MUNICIPAL
O trigger on_auth_user_created criou automaticamente um profile com role OPERADOR. Promova para Admin:

Supabase → SQL Editor

Execute:

sql
UPDATE profiles
SET role = 'ADMIN_MUNICIPAL'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'email-do-admin@dominio.gov.br'
);

-- Confirmar
SELECT p.id, p.nome_completo, p.role, u.email
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'email-do-admin@dominio.gov.br';
7.3 Fazer login
Acesse o sistema no Vercel (ou local) com as credenciais criadas.

⚠️ Recomendação: no primeiro acesso, altere a senha via Meu perfil e configure o DPO via Módulo DPO.

8. Deploy de Produção
8.1 Configurar variáveis no Vercel
Antes do primeiro deploy, garanta que todas as variáveis do item 5 estão configuradas em Production.

8.2 Fazer o deploy
Opção A — Automático via GitHub (recomendado):

Todo git push para main dispara deploy automático

Pull requests geram preview deploys

Opção B — Manual via CLI:

bash
vercel login
vercel link
vercel --prod
8.3 Validar o deploy
Acesse a URL de produção e teste:

Health check: https://SEU-DOMINIO/api/health deve retornar {"status":"ok"}

Login com o admin criado

Navegação pelos módulos

Criação de uma unidade de teste

Verificação de auditoria — o log deve registrar o CREATE

8.4 Ajustar Site URL no Supabase
Após o deploy, atualize em Supabase → Authentication → URL Configuration:

Site URL: URL de produção do Vercel

Redirect URLs: adicione https://SEU-DOMINIO/**

9. Domínio Personalizado
Se o município tiver domínio próprio (ex.: sedecas.gov.br), configure um subdomínio:

Vercel → Settings → Domains

Adicione vagas.sedecas.gov.br

Configure o DNS conforme instruído (registro CNAME ou A)

Aguarde a propagação (até 48h)

Supabase → Authentication → URL Configuration:

Atualize Site URL para o novo domínio

Adicione Redirect URLs

10. Backup e Recuperação
10.1 Backups automáticos (Supabase)
Plano Free: backup diário com retenção de 7 dias

Plano Pro: backups automáticos com PITR (Point-in-Time Recovery)

Configure em Supabase → Database → Backups.

10.2 Backup manual
Via CLI:

bash
supabase db dump -f backup.sql
Via Supabase Dashboard:

Database → Backups → Download

10.3 Teste de recuperação
Recomenda-se trimestralmente:

Restaure o backup em um projeto Supabase de homologação

Valide que os dados estão íntegros

Documente o teste

10.4 Recuperação em desastre
Em caso de perda do banco:

Crie novo projeto Supabase

Restaure o backup mais recente

Reaplique as migrations (se necessário)

Atualize as credenciais no Vercel

Faça novo deploy

⚠️ Sem a FIELD_ENCRYPTION_KEY, os campos sensíveis permanecem inacessíveis mesmo com backup. Guarde-a com segurança.

11. Monitoramento e Logs
11.1 Logs do Vercel
Vercel → Deployments → [deploy] → Functions — logs de execução

Vercel → Logs — logs em tempo real (plano Pro)

11.2 Logs do Supabase
Supabase → Logs → Postgres Logs — queries e erros de banco

Supabase → Logs → Auth Logs — tentativas de login

11.3 Trilha de auditoria (dentro do sistema)
O sistema registra internamente todas as operações sensíveis:

Módulo Auditoria (admin) — filtros avançados + exportação PDF

Alertas automáticos: unidades com ocupação ≥ 95%, adolescentes próximos da maioridade

11.4 Monitoramento de falhas
⚠️ Falhas de auditoria não derrubam a operação, mas são registradas em console.error e capturadas pelos logs do Vercel. Recomenda-se:

Curto prazo: revisar logs do Vercel semanalmente

Médio prazo: integrar Sentry ou Datadog para alertas automáticos

12. Atualização do Sistema
12.1 Fluxo padrão
Desenvolvedor: cria branch, implementa, testa localmente

Pull Request: Vercel gera preview deploy automaticamente

Validação: aprovação na preview URL

Merge para main: deploy automático em produção

Monitoramento: verificar logs por 24h

12.2 Aplicação de migrations
Migrations são aplicadas separadamente:

bash
git pull origin main
supabase db push
⚠️ Ordem recomendada:

Backup do banco

Aplicar migrations

Fazer deploy do código

Validar

12.3 Reversão (rollback)
Deploy: Vercel → Deployments → ⋯ → Promote to Production (em deploy anterior)

Migrations: ⚠️ Não há rollback automático. Crie uma nova migration que reverta as alterações.

13. Replicação em Outro Município
Para replicar o sistema em outro município:

Fork do repositório no GitHub

Criar novo projeto Supabase (Passos 3)

Gerar nova FIELD_ENCRYPTION_KEY (⚠️ NÃO reutilizar a do município anterior)

Criar novo projeto Vercel vinculado ao fork

Ajustar textos institucionais:

src/app/layout.tsx — título e metadados

src/app/login/page.tsx — nome da secretaria

src/app/(app)/sobre/page.tsx — órgão, secretário, desenvolvedores

src/app/(app)/dpo/page.tsx — dados do DPO

src/lib/audit/pdf.ts — cabeçalho dos PDFs

Aplicar migrations e criar o primeiro admin

Deploy

Dica: crie um script de fork ou template para reduzir o trabalho manual.

14. Troubleshooting
Erro: "permission denied for schema auth"
Causa: tentativa de criar objetos no schema auth (reservado ao Supabase).

Solução: use o schema private para funções helper. Já resolvido nas migrations atuais.

Erro: "Invalid API key"
Causa: SUPABASE_SECRET_KEY ou FIELD_ENCRYPTION_KEY com valor mascarado ([SENSITIVE]).

Solução: copie o valor real do Supabase e substitua no .env.local / Vercel.

Erro: "Cannot read properties of undefined (reading 'total')"
Causa: resultado do db.execute() em formato inesperado.

Solução: usar o helper firstRow/allRows (já aplicado no código).

Build falha com "Failed to type check"
Causa: cache do .next corrompido.

Solução:

bash
rm -rf .next    # Linux/macOS
Remove-Item -Recurse -Force .next   # Windows PowerShell
npm run build
Dashboard muito lento (103s)
Causa: pool de conexões mal configurado (Supavisor Transaction mode).

Solução: max: 1 no src/db/client.ts e queries sequenciais no dashboard. Já aplicado.

Login não funciona em produção
Causas possíveis:

Site URL no Supabase desatualizado — ajuste em Authentication → URL Configuration

Sessão expirada — TTL padrão é 1h; considere aumentar

Conta bloqueada após 5 tentativas — reative via Admin

Erro: "stream closed early" / "destination stream closed"
Causa: conexão com Supabase fechando prematuramente.

Solução: verificar idle_timeout e max_lifetime no client.ts; verificar se o Supabase está pausado (plano Free pausa após 7 dias sem uso).

Projeto Supabase pausado
Sintoma: site retorna erro 500 em todas as operações.

Solução: acessar supabase.com/dashboard, selecionar o projeto e clicar em Resume project. Considere plano pago para evitar pausas automáticas.

Erro 42501 — permission denied for table
Causa: GRANTs ausentes.

Solução:

sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.NOME_DA_TABELA TO authenticated;
Anexos
A. Checklist de implantação
□ Projeto Supabase criado (região São Paulo)
□ Connection strings anotadas (pooler + direct)
□ Chave FIELD_ENCRYPTION_KEY gerada e guardada
□ Autenticação configurada (Site URL + Redirect URLs)
□ Projeto Vercel vinculado ao GitHub
□ Variáveis de ambiente configuradas em Production
□ Migrations aplicadas (supabase db push)
□ Primeiro admin criado e promovido
□ Deploy validado (health check + login)
□ Domínio personalizado configurado (se aplicável)
□ Backups configurados
□ Manual de operação entregue aos usuários
□ Equipe treinada
B. Contatos úteis
Serviço	URL
Supabase Dashboard	supabase.com/dashboard
Vercel Dashboard	vercel.com/dashboard
GitHub Repo	github.com/Npc-player/Sistema_Vagas_Sedeas
Documentação Next.js	nextjs.org/docs
Documentação Supabase	supabase.com/docs
Documentação Drizzle	orm.drizzle.team
C. Comandos úteis
bash
# Desenvolvimento
npm run dev              # Sobe servidor local

# Build
npm run build            # Build de produção
npm run start            # Roda build local

# Supabase
supabase login           # Autenticar
supabase link            # Linkar ao projeto
supabase db push         # Aplicar migrations
supabase migration list  # Ver migrations
supabase db dump         # Backup

# Git
git status               # Ver alterações
git add .                # Adicionar tudo
git commit -m "msg"      # Comitar
git push origin main     # Enviar
Secretaria de Desenvolvimento e Assistência Social (SEDEAS)
Prefeitura Municipal de Guarujá
© 2026 — Uso interno