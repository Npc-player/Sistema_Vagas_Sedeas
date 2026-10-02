# Manual de Operação

**Sistema de Controle de Vagas em Acolhimentos Municipais**

Secretaria de Desenvolvimento e Assistência Social (SEDEAS)
Prefeitura Municipal de Guarujá

Versão 1.0 — outubro/2026

---

## Sumário

1. [Apresentação](#1-apresentação)
2. [Primeiro acesso](#2-primeiro-acesso)
3. [Perfis de usuário](#3-perfis-de-usuário)
4. [Navegação básica](#4-navegação-básica)
5. [Módulo Dashboard](#5-módulo-dashboard)
6. [Módulo Unidades](#6-módulo-unidades)
7. [Módulo Controle de Vagas](#7-módulo-controle-de-vagas)
8. [Módulo Pessoas Acolhidas](#8-módulo-pessoas-acolhidas)
9. [Módulo Acolhimentos](#9-módulo-acolhimentos)
10. [Módulo Consulta Judiciária](#10-módulo-consulta-judiciária)
11. [Módulo Auditoria](#11-módulo-auditoria)
12. [Módulo Usuários](#12-módulo-usuários)
13. [Módulo DPO — LGPD](#13-módulo-dpo--lgpd)
14. [Meu Perfil](#14-meu-perfil)
15. [Perguntas Frequentes](#15-perguntas-frequentes)
16. [Suporte](#16-suporte)

---

## 1. Apresentação

O **Sistema de Controle de Vagas em Acolhimentos Municipais** centraliza a gestão das unidades socioassistenciais, das pessoas acolhidas e das vagas disponíveis no município.

### O que o sistema faz

- **Controla vagas** em tempo real (disponíveis, ocupadas, bloqueadas, reservadas)
- **Cadastra pessoas acolhidas** com proteção de dados sensíveis (LGPD)
- **Registra admissões e desacolhimentos** com histórico completo
- **Audita** todas as operações em trilha imutável
- **Oferece consulta supervisionada** ao Poder Judiciário e Ministério Público
- **Gerencia usuários e permissões** com segurança

### O que o sistema NÃO faz

- Não substitui o prontuário técnico da unidade
- Não emite documentos oficiais (ofícios, relatórios institucionais)
- Não se integra automaticamente com sistemas do Judiciário ou da Saúde

---

## 2. Primeiro acesso

### Como recebo minhas credenciais?

O acesso é criado pelo **Administrador Municipal**. Você receberá:

- **E-mail institucional** (login)
- **Senha temporária** (entregue por canal seguro pelo administrador)

### Primeiro login

1. Acesse o endereço do sistema fornecido pelo administrador
2. Digite seu **e-mail** e a **senha temporária**
3. Clique em **Entrar**

### Trocar a senha no primeiro acesso

⚠️ **Importante:** a senha temporária deve ser alterada no primeiro acesso.

1. Clique no **avatar** (canto superior direito)
2. Selecione **Meu perfil**
3. Preencha:
   - **Senha atual:** a senha temporária recebida
   - **Nova senha:** deve atender aos 5 requisitos:
     - Mínimo 12 caracteres
     - Letra maiúscula
     - Letra minúscula
     - Número
     - Caractere especial (`!@#$%...`)
   - **Confirmar nova senha**
4. Clique em **Alterar senha**

### Requisitos de senha

Ao digitar a nova senha, os 5 requisitos ficam **verdes** conforme forem atendidos. O botão **"Alterar senha"** só habilita quando todos estiverem OK.

### Esqueci minha senha

Entre em contato com o **Administrador Municipal** para que ele gere uma nova senha temporária.

---

## 3. Perfis de usuário

Cada usuário tem um **perfil de acesso** com permissões específicas:

| Perfil | O que pode fazer |
|--------|------------------|
| **Administrador Municipal** | Acesso total: gerencia unidades, vagas, acolhidos, usuários, auditoria, DPO e configurações |
| **Gestor de Acolhimento** | Gerencia vagas e cadastros **apenas da sua unidade** |
| **Operador / Recepção** | Registra entradas, saídas e movimentações **da sua unidade** |
| **Conselho Municipal** | Consulta **somente leitura** de indicadores agregados (sem dados individualizados) |
| **Judiciário / MP** | Consulta supervisionada de registros individuais vinculados a processos, com justificativa obrigatória |
| **TI / Suporte** | Manutenção técnica; acesso a logs sem visualização de dados nominais |

### Como saber meu perfil?

Clique no **avatar** (canto superior direito). O menu mostra seu perfil abaixo do e-mail.

---

## 4. Navegação básica

### Cabeçalho (topo da página)

| Elemento | Função |
|----------|--------|
| **Logo** | Volta para o Dashboard |
| **Dashboard** | Indicadores consolidados |
| **Módulos do Sistema** | Hub de acesso a todos os módulos |
| **Avatar** | Menu do usuário (perfil, sobre, sair) |

### Menu do usuário (avatar)

- **Meu perfil** — Dados da conta e troca de senha
- **Sobre o sistema** — Versão e créditos
- **Sair do sistema** — Encerra a sessão

### Botões e ícones

- **Botão primário (teal)** — Ação principal da tela (Salvar, Cadastrar, Aplicar)
- **Botão outline** — Ação secundária (Cancelar, Voltar, Detalhes)
- **Botão vermelho** — Ação destrutiva (Desativar, Desacolher)
- **Ícone ⇾** — Indica que o card é clicável

---

## 5. Módulo Dashboard

O **Dashboard** apresenta os indicadores consolidados da rede socioassistencial.

### Filtros (topo)

- **Tipo de acolhimento** — ILPI, SAICA, Centro Dia, José Calherani, R.I. ou Todos
- **Unidade** — unidade específica ou Todas
- Clique em **Aplicar** para filtrar os indicadores

### Indicadores

| Indicador | O que mostra |
|-----------|--------------|
| **Capacidade instalada** | Total de vagas na rede (ou subset filtrado) |
| **Vacância operacional** | Vagas disponíveis para atendimento imediato |
| **Ocupação atual** | Vagas ocupadas + bloqueadas + reservadas |
| **Acolhimentos ativos** | Total de pessoas em acolhimento no momento |
| **Taxa de ocupação** | Percentual de ocupação (com barra colorida por zona de alerta) |
| **Tempo médio de permanência** | Duração média dos acolhimentos já encerrados |
| **Distribuição por tipo** | Comparativo entre ILPI, SAICA, etc. |
| **Fluxo de movimentação** | Entradas e saídas dos últimos 12 meses |

### Alertas automáticos

- 🟥 **Unidades com ocupação ≥ 95%** — requer atenção imediata
- 🟨 **Adolescentes em SAICA com 17 anos e 6 meses** — planejar desacolhimento ou encaminhamento (RN-07)

### Zonas de alerta da taxa de ocupação

| Faixa | Cor | Significado |
|-------|-----|-------------|
| 0–74% | Teal (verde-petróleo) | Operação normal |
| 75–94% | Âmbar | Atenção — capacidade se aproximando do limite |
| 95–100% | Vermelho | Crítico — praticamente sem vagas |

---

## 6. Módulo Unidades

O módulo **Unidades de Acolhimento** permite cadastrar e gerenciar as instalações físicas da rede socioassistencial.

### Acessar

- Menu **Módulos do Sistema** → **Unidades de Acolhimento**

### Lista de unidades

A tela mostra todas as unidades cadastradas com:

- **Nome**, **Tipo** e **Localização**
- **Capacidade** (número de vagas)
- **Responsável técnico**
- **Status**: badge verde (Ativa) ou cinza (Inativa)
- Botão **Detalhes** em cada linha

### Cadastrar nova unidade

1. Clique em **Nova unidade**
2. Preencha os 4 blocos de dados:

| Bloco | Campos obrigatórios |
|-------|---------------------|
| **Identificação** | Nome, Tipo, Capacidade total |
| **Endereço** | Logradouro, Número, Bairro, Cidade, UF, CEP |
| **Contato institucional** | Telefone, E-mail |
| **Responsável técnico** | Nome, Telefone, E-mail |

3. Clique em **Cadastrar unidade**

⚠️ **Atenção:** ao criar a unidade com capacidade N, o sistema **cria automaticamente N vagas numeradas** de 1 a N. Não é possível criar vagas manualmente — sempre decorrem da capacidade.

### Detalhes da unidade

Ao clicar em **Detalhes**, você acessa:

- **Cards de resumo**: Capacidade, Vagas disponíveis, Taxa de ocupação
- **Localização**, **Contato**, **Responsável técnico**
- **Mapa de vagas** — visualização colorida de cada vaga:
  - 🟢 Verde — Disponível
  - 🔴 Vermelho — Ocupada
  - 🟡 Amarelo — Bloqueada
  - 🔵 Azul — Reservada
- Botões **Desativar** (ou Reativar) e **Editar**

### Editar unidade

1. Nos detalhes, clique em **Editar**
2. Altere os campos desejados
3. **Ao mudar a capacidade:**
   - Aumento → novas vagas são criadas automaticamente
   - Redução → vagas excedentes são removidas, **mas somente se estiverem disponíveis**
   - Se houver vagas ocupadas/bloqueadas acima do novo limite → o sistema bloqueia a alteração

### Desativar / Reativar unidade

- **Desativar:** a unidade deixa de receber novos acolhimentos, mas o histórico é preservado
- **Reativar:** a unidade volta a ficar disponível

⚠️ **Regra RN-09:** não é possível desativar uma unidade que tenha acolhidos ativos.

---

## 7. Módulo Controle de Vagas

O módulo **Controle de Vagas** oferece visão operacional em tempo real.

### Painel consolidado (`/vagas`)

- **Cards de resumo geral**: Capacidade, Disponíveis, Ocupadas, Taxa de ocupação
- **Distribuição por tipo** — ILPI, SAICA, etc.
- **Tabela por unidade** com barra de ocupação colorida
- Botão **Ver vagas** em cada linha

### Detalhes de uma unidade

Ao clicar em **Ver vagas**:

- **Cards**: Total, Disponíveis, Ocupadas, Bloqueadas, Taxa
- **Mapa interativo** — cada vaga pode ser clicada
- **Legenda** com contadores por status

### Bloquear uma vaga (RN-08)

Bloqueios são usados em situações temporárias (manutenção, reforma, interdição sanitária).

1. No mapa, clique em uma **vaga verde (disponível)**
2. Preencha:
   - **Motivo** — Manutenção, Reforma, Interdição Sanitária, Desinfecção/Isolamento, Obra Estrutural, Outro
   - **Detalhes** — informações complementares (obrigatório se "Outro")
   - **Prazo estimado** — data prevista para liberação
3. Clique em **Confirmar bloqueio**

**Resultado:** a vaga fica **amarela** no mapa e não pode receber acolhimentos.

### Desbloquear uma vaga

1. Clique em uma **vaga amarela (bloqueada)**
2. Confira o motivo e prazo
3. Clique em **Confirmar desbloqueio**

**Resultado:** a vaga volta a **verde** (disponível).

### Estados das vagas

| Cor | Status | Significado |
|-----|--------|-------------|
| 🟢 | Disponível | Vaga livre, higienizada e apta |
| 🔴 | Ocupada | Pessoa em acolhimento formalmente ativo |
| 🟡 | Bloqueada | Indisponível temporariamente |
| 🔵 | Reservada | Destinada a acolhimento iminente deferido |

---

## 8. Módulo Pessoas Acolhidas

O módulo **Pessoas Acolhidas** centraliza o cadastro dos indivíduos em atendimento.

### Lista de pessoas

Mostra todas as pessoas cadastradas com:

- **Nome completo** (e nome social, se houver)
- **Data de nascimento** e **Idade calculada**
- **Nome da mãe**
- Botão **Detalhes**

### Cadastrar nova pessoa

1. Clique em **Cadastrar pessoa**
2. Preencha:

| Bloco | Campos |
|-------|--------|
| **Identificação** | Nome completo*, Nome social, Data de nascimento*, Nome da mãe, Nome do pai |
| **Documentos** | CPF, RG (opcionais) |
| **Saúde** | Alergias, Comorbidades |
| **Histórico familiar** | Rede de apoio, referências comunitárias |

3. Clique em **Cadastrar pessoa**

### 🔒 Proteção de dados (LGPD)

⚠️ **Importante:**

- **CPF, RG, alergias e comorbidades** são **criptografados em repouso** (AES-256)
- Esses dados **nunca aparecem em logs de auditoria**
- Acesso aos dados sensíveis é **registrado em trilha** (LGPD Art. 37)
- **Toda leitura** de CPF, RG ou dados de saúde é auditada

### Unicidade de CPF (RN-03)

Se você tentar cadastrar uma pessoa com **CPF já existente**, o sistema bloqueia com a mensagem:

> "Já existe um acolhido cadastrado com este CPF."

### Editar cadastro

- Nos detalhes, clique em **Editar**
- Os campos sensíveis aparecem **descriptografados** para edição
- Alterações em campos sensíveis são registradas em auditoria

### Ver detalhes

A página de detalhes mostra:

- **Dados pessoais** — nome, data de nascimento, filiação
- **Documentos** — CPF, RG (visíveis apenas para perfis autorizados)
- **Saúde** — alergias, comorbidades
- **Histórico familiar**
- **Aviso LGPD** em destaque

---

## 9. Módulo Acolhimentos

O módulo **Acolhimentos** registra as admissões e os desacolhimentos.

### Lista

- **Acolhimentos ativos** — quem está atualmente em acolhimento
- **Histórico** — acolhimentos encerrados

Cada linha mostra: Protocolo, Pessoa, Unidade, Data, Regime e Status.

### Registrar admissão (entrada)

1. Clique em **Registrar admissão**
2. Preencha as 3 etapas:

**Etapa 1 — Pessoa acolhida**
- Selecione a pessoa (apenas quem não tem acolhimento ativo aparece)

**Etapa 2 — Unidade e vaga**
- Selecione a unidade (apenas as compatíveis com o perfil etário aparecem)
- Selecione a vaga (número)
- O sistema confirma: *"Perfil compatível: X anos em [Tipo]"*

**Etapa 3 — Dados da admissão**
- **Data do acolhimento** (não pode ser futura)
- **Regime** — Provisório ou Definitivo
- **Motivo** — Vulnerabilidade social, Negligência familiar, Violência doméstica, Abandono, Dependência química, Saúde mental, Situação de rua, Determinação judicial, Outro
- **Detalhamento** — contexto (opcional)

3. Clique em **Registrar admissão**

**Resultado:**
- A vaga fica **ocupada** (vermelha)
- A pessoa passa a ter **acolhimento ativo**
- É gerado um **protocolo único** (formato `ACO-AAAA-NNNNNN`)
- Tudo é registrado em auditoria

### Compatibilidade etária (RN-01)

| Tipo de unidade | Idade compatível |
|-----------------|------------------|
| ILPI, Centro Dia, José Calherani | 60+ anos |
| SAICA | 0 a 17 anos |
| Residência Inclusiva (R.I.) | 18+ anos |

### Registrar desacolhimento (saída)

1. Abra os detalhes do acolhimento ativo
2. Clique em **Registrar desacolhimento**
3. Preencha:
   - **Data do desacolhimento** (não pode ser antes da entrada — RN-05)
   - **Motivo** — Reintegração familiar, Transferência, Maioridade, Óbito, Decisão judicial
   - **Detalhamento** (opcional)
4. Clique em **Confirmar desacolhimento**

**Resultado:**
- O acolhimento fica **encerrado**
- A vaga volta a ficar **disponível**
- A pessoa pode ser readmitida posteriormente
- Tudo é registrado em auditoria

### Acompanhar via protocolo

Cada acolhimento tem um **protocolo único** (`ACO-AAAA-NNNNNN`) que serve para:

- Rastreabilidade entre sistemas
- Consulta no módulo Judiciário
- Referência em relatórios

---

## 10. Módulo Consulta Judiciária

⚠️ **Acesso restrito** ao Poder Judiciário, Ministério Público e Administração Municipal.

### Finalidade

Permite consultar registros individuais vinculados a **procedimentos legais em curso**, sempre com **justificativa obrigatória** e **registro imutável em auditoria**.

### Como consultar

1. Menu **Módulos do Sistema** → **Consulta Judiciária**
2. Preencha:
   - **Tipo de busca** — CPF, Nome completo ou Protocolo de acolhimento
   - **Termo de busca** — o valor correspondente
   - **Processo/Ofício** (opcional) — número do processo judicial
   - **Justificativa legal** — obrigatória, mínimo 50 caracteres
3. Clique em **Executar consulta**

### Resultado

Para cada registro encontrado, o sistema exibe:

- **Nome, idade, filiação**
- **CPF e RG** (visíveis para este perfil)
- **Histórico de acolhimentos** — todos os acolhimentos da pessoa
- **Aviso de dados de saúde** — se houver, mas **NÃO exibe o conteúdo** (LGPD Art. 11)

### 🔒 Importante sobre dados de saúde

Os dados de saúde (alergias, comorbidades) **NÃO são exibidos** neste módulo, mesmo para o Judiciário. O sistema indica apenas *"Possui dados de saúde registrados"*. Requisição específica deve ser encaminhada à SEDEAS.

### Registro em auditoria

Toda consulta gera registro com:

- **Protocolo único** no formato `CJU-AAAA-NNNNNNNN`
- **Tipo de busca** e **termo consultado**
- **Justificativa completa** informada
- **Identificação do solicitante** (usuário, IP, data/hora)
- **Resultado** (com ou sem dados)

⚠️ O registro ocorre **antes** da busca — mesmo consultas sem resultado são registradas.

---

## 11. Módulo Auditoria

⚠️ **Acesso restrito** ao Administrador Municipal.

### Finalidade

Consulta à **trilha imutável** de todas as operações do sistema (LGPD Art. 37).

### O que é registrado

- **CREATE** — criação de registros
- **READ** — leitura de dados sensíveis
- **UPDATE** — alteração de registros
- **DELETE** — exclusão (raramente usado)
- **LOGIN** / **LOGIN_FAILED** / **LOGOUT** — autenticação
- **EXPORT** — exportação de relatórios

### Como consultar

1. Menu **Módulos do Sistema** → **Auditoria**
2. Use os filtros:
   - **Ação** — tipo de operação
   - **Entidade** — a qual tabela se refere
   - **Usuário** — quem executou
   - **Data início / Data fim**
3. Clique em **Aplicar filtros**

### Ver detalhes

Cada linha tem botão **Detalhes** que abre um modal com:

- **Data/hora exata** (UTC-3)
- **Ação**, **Entidade**, **ID do registro**
- **Usuário** (e-mail + perfil)
- **IP de origem** e **User-Agent**
- **Estado anterior** (JSON)
- **Estado posterior** (JSON)
- **Metadados**

### Exportar em PDF

⚠️ **Justificativa legal obrigatória** (mínimo 30 caracteres).

1. Clique em **Exportar PDF**
2. Informe a justificativa
3. Clique em **Confirmar exportação**

**Resultado:**
- PDF é baixado com nome `EXP-AAAA-NNNNNNNN-trilha-auditoria.pdf`
- Contém cabeçalho institucional, protocolo, justificativa e a tabela completa
- A exportação **é registrada em auditoria** com a justificativa

### 🔒 Imutabilidade

A trilha de auditoria **não pode ser editada ou excluída** — nem mesmo pelo Administrador. A proteção é feita por **trigger no banco de dados** com registro em conformidade com a LGPD.

---

## 12. Módulo Usuários

⚠️ **Acesso restrito** ao Administrador Municipal.

### Lista de usuários

Mostra todos os usuários do sistema com: Nome, E-mail, Perfil, Unidade e Status.

### Criar novo usuário

1. Clique em **Novo usuário**
2. Preencha:
   - **Nome completo**
   - **E-mail institucional**
   - **Perfil de acesso** (ver tabela de perfis)
   - **Unidade vinculada** — obrigatória para Gestor e Operador
3. Clique em **Criar usuário**

**Resultado:**
- O sistema gera uma **senha temporária** automaticamente
- A senha é exibida **apenas uma vez** — copie e entregue ao usuário por canal seguro
- O usuário deverá **alterar a senha no primeiro acesso**

### Gerenciar usuário

Clique em **Gerenciar** em qualquer usuário para acessar:

- **Dados** — editar nome, perfil e unidade
- **Resetar senha** — gera nova senha temporária
- **Desativar / Reativar** — bloqueia ou libera o acesso

⚠️ **Auto-proteção:** você não pode desativar a própria conta nem alterar seu próprio perfil de acesso.

### Sobre a desativação

- Usuário desativado **não consegue fazer login** (bloqueio no provedor de auth)
- O histórico de operações **é preservado**
- A reativação restaura o acesso com a senha anterior

---

## 13. Módulo DPO — LGPD

⚠️ **Acesso restrito** ao Administrador Municipal.

### Finalidade

Canal de comunicação entre **titulares de dados** e o **Encarregado pelo Tratamento de Dados Pessoais** (LGPD Art. 41).

### Configuração do DPO

Card **"Encarregado pelo Tratamento de Dados"** com os dados do responsável nomeado:

- Nome completo
- E-mail de contato
- Telefone
- Cargo
- Endereço
- Horário de atendimento
- Observações

**Quando o responsável muda**, o Administrador edita os dados nesta tela — sem necessidade de alteração no sistema.

### Requisições LGPD

O sistema registra as solicitações dos titulares:

| Tipo | Descrição |
|------|-----------|
| **ACESSO** | Acesso aos dados pessoais (Art. 18, II) |
| **CORRECAO** | Correção de dados incompletos ou desatualizados |
| **EXCLUSAO** | Exclusão de dados desnecessários ou excessivos |
| **PORTABILIDADE** | Portabilidade a outro fornecedor |
| **INFORMACAO_COMPARTILHAMENTO** | Informação sobre compartilhamento |
| **REVOGACAO_CONSENTIMENTO** | Revogação de consentimento |
| **OUTRO** | Outros direitos |

### Acompanhar requisições

Cada requisição tem:

- **Protocolo único** (`LGPD-AAAA-NNNNNN`)
- **Status**:
  - **Recebida** (azul) — aguardando análise
  - **Em análise** (âmbar) — em tratamento
  - **Respondida** (verde) — resposta enviada
  - **Arquivada** (cinza) — encerrada
- **Prazo de resposta** — 15 dias corridos (destaque vermelho se próximo do vencimento)

### Responder uma requisição

1. Clique em **Responder** na linha desejada
2. Selecione o **novo status**
3. Escreva a **resposta oficial** ao requerente
4. Clique em **Salvar resposta**

**Resultado:**
- A resposta fica registrada
- Se status = **Respondida**, o sistema marca a data/hora da resposta
- Tudo é registrado em auditoria

---

## 14. Meu Perfil

Acessível a **todos os usuários** pelo avatar → **Meu perfil**.

### Dados da conta

- Nome, e-mail, perfil de acesso, unidade vinculada
- Data de criação e último acesso

⚠️ **Alteração de nome, e-mail ou perfil:** entre em contato com o Administrador Municipal.

### Trocar senha

1. Preencha **Senha atual**
2. Digite a **Nova senha** (ver requisitos)
3. **Confirme** a nova senha
4. Clique em **Alterar senha**

**Requisitos da senha:**

- Mínimo 12 caracteres
- Letra maiúscula
- Letra minúscula
- Número
- Caractere especial

O contador e os indicadores mostram em tempo real se a senha atende aos requisitos.

**Auditoria:** toda tentativa (sucesso ou falha) é registrada — **sem gravar a senha**.

---

## 15. Perguntas Frequentes

### Não consigo fazer login. O que fazer?

1. Verifique se digitou o e-mail correto (sem espaços)
2. Confirme a senha (o campo diferencia maiúsculas de minúsculas)
3. Se a conta foi desativada, contate o Administrador
4. Após 5 tentativas inválidas, a conta é **bloqueada** — peça ao Administrador para desbloquear

### A sessão expira rápido. O que fazer?

A sessão expira após **15 minutos de inatividade**. Salve seu trabalho com frequência. Se estiver digitando uma anotação longa, mova o mouse periodicamente.

### Perdi a senha temporária recebida. O que fazer?

Contate o Administrador Municipal para **resetar a senha**. Uma nova senha temporária será gerada.

### Cadastrei a pessoa errada. Como corrigir?

1. Abra o cadastro da pessoa
2. Clique em **Editar**
3. Corrija os campos
4. Salve

⚠️ O sistema mantém **histórico completo** — a correção também é auditada.

### Como cadastrar um adolescente em SAICA?

1. Cadastre a pessoa normalmente em **Pessoas Acolhidas** com a data de nascimento real
2. Em **Acolhimentos** → **Registrar admissão**
3. O sistema valida automaticamente a compatibilidade etária (RN-01)

### Por que não consigo reduzir a capacidade de uma unidade?

Provavelmente há **vagas ocupadas ou bloqueadas** acima do novo limite. Você precisa primeiro:

1. Desacolher (transferir) quem está nas vagas excedentes, OU
2. Desbloquear as vagas bloqueadas

### Como funciona o alerta de maioridade em SAICA?

O sistema identifica automaticamente adolescentes em SAICA que completaram **17 anos e 6 meses** (RN-07) e exibe um card âmbar no Dashboard. A partir daí, o Gestor deve planejar:

- Desacolhimento por maioridade (aos 18)
- Encaminhamento para Residência Inclusiva (se aplicável)

### Por que alguns dados aparecem como "—"?

Dados **não informados** aparecem como "—". Não são erros. Podem ser complementados depois via edição.

### Exportei o PDF da auditoria. Onde encontro?

O PDF é baixado diretamente pelo navegador, com nome `EXP-AAAA-NNNNNNNN-trilha-auditoria.pdf`. Verifique a pasta de **Downloads**.

### Como solicitar acesso ao sistema?

Entre em contato com o **Administrador Municipal** da SEDEAS, informando:

- Nome completo
- E-mail institucional
- Perfil desejado
- Unidade de lotação (se aplicável)

---

## 16. Suporte

| Assunto | Contato |
|---------|---------|
| **Acesso e senhas** | Administrador Municipal da SEDEAS |
| **Problemas técnicos** | Equipe de TI |
| **LGPD e privacidade** | Encarregado (DPO) — canal dentro do sistema |
| **Dúvidas de uso** | Gestor de Acolhimento da unidade |

### Canais

- **TI:** ti@sedecas.gov.br
- **DPO:** dpo@sedecas.gov.br

---

## Histórico de Versões

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0 | outubro/2026 | Versão inicial do manual |

---

**Secretaria de Desenvolvimento e Assistência Social (SEDEAS)**
**Prefeitura Municipal de Guarujá**
**© 2026 — Uso interno**