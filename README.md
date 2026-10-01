# Sistema de Controle de Vagas em Acolhimentos Municipais

Sistema web para gestão de vagas e acolhidos na rede socioassistencial do município de Guarujá. Desenvolvido para a **Secretaria de Desenvolvimento e Assistência Social (SEDEAS)**.

## 📋 Visão Geral

O sistema centraliza o controle de vagas e o acompanhamento das pessoas acolhidas nas unidades municipais:

- **ILPI** — Instituição de Longa Permanência para Idosos
- **SAICA** — Serviço de Acolhimento Institucional para Crianças e Adolescentes
- **Centro Dia Idoso**
- **José Calherani**
- **Residência Inclusiva (R.I.)**

### Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **Dashboard** | Indicadores consolidados com filtros por tipo e unidade |
| **Unidades** | CRUD completo com mapa visual de vagas |
| **Vagas** | Bloqueio/desbloqueio com motivo e prazo (RN-08) |
| **Acolhidos** | Cadastro com criptografia de campos sensíveis |
| **Acolhimentos** | Admissão com protocolo único e desacolhimento |
| **Consulta Judiciária** | Acesso supervisionado para Judiciário/MP |
| **Auditoria** | Trilha imutável com exportação em PDF (LGPD Art. 37) |
| **Usuários** | Administração com RBAC e auditoria |
| **DPO** | Encarregado pelo Tratamento de Dados (LGPD Art. 41) |
| **Perfil** | Troca de senha com auditoria |

## 🏗️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Front-end | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Back-end | Next.js Server Actions + Route Handlers |
| Banco de dados | PostgreSQL 17 (Supabase) |
| ORM | Drizzle ORM |
| Autenticação | Supabase Auth |
| Criptografia | pgcrypto (AES-256) + HMAC |
| Deploy | Vercel |

## 🔐 Segurança e LGPD

O sistema foi projetado com **security-first** e **LGPD by design**:

- **RLS (Row-Level Security)** em todas as tabelas — isolamento entre unidades no nível do banco
- **Criptografia em repouso** de campos sensíveis (CPF, RG, alergias, comorbidades)
- **Trilha de auditoria imutável** — trigger bloqueia UPDATE/DELETE
- **RBAC** com 6 perfis de acesso
- **Mascaramento de dados sensíveis** em módulos específicos
- **Justificativa obrigatória** para exportação de auditoria e consulta judicial

## 🚀 Começando

### Pré-requisitos

- Node.js 20+
- pnpm ou npm
- Supabase CLI
- Git

### Instalação

```bash
# Clone o repositório
git clone https://github.com/Npc-player/Sistema_Vagas_Sedeas.git
cd Sistema_Vagas_Sedeas

# Instale as dependências
npm install

# Configure as variáveis de ambiente (ver .env.example)
cp .env.example .env.local
# Edite .env.local com suas credenciais