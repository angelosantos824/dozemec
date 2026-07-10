# DOZEMEC

SaaS multiempresa da DOZEDEV para gestao de oficinas. Versao atual: `0.5.1`.

## v0.5.1 - Correcao do fluxo de manutencoes

Esta versao corrige o fluxo existente de manutencao de equipamentos sem criar novo modulo de negocio e sem migration.

- `Iniciar`, `Concluir` e `Cancelar` usam os endpoints oficiais de manutencao.
- Baias podem abrir manutencao para equipamento vinculado ou ser apenas bloqueadas por motivo operacional.
- Baias e equipamentos em manutencao so podem ser liberados quando nao houver manutencao agendada ou em andamento bloqueando a acao.
- A tela de manutencoes exibe equipamento por nome, tipo, situacao, datas, custo e acoes validas.
- Codigos internos continuam no backend, mas o frontend exibe rotulos em portugues, datas no locale da empresa e valores em EUR por padrao.

## Sprint 06

Esta Sprint adiciona o modulo de clientes da oficina, com suporte a clientes particulares e empresariais. Cliente continua separado de usuario do sistema; nao ha autenticacao, portal ou acesso de cliente nesta Sprint.

Novas areas:

- Clientes particulares e empresas.
- Contatos multiplos.
- Enderecos multiplos.
- Documentos sem upload real.
- Preferencias de contato.
- Consentimentos com historico.
- Notas internas.
- Relacionamentos entre clientes.
- Bloqueio, desbloqueio e historico.

Novas tabelas:

- `customers`
- `customer_contacts`
- `customer_addresses`
- `customer_documents`
- `customer_consents`
- `customer_preferences`
- `customer_notes`
- `customer_status_history`
- `customer_change_history`
- `customer_relationships`

Endpoints principais:

- `/api/customers`
- `/api/customers/:id/contacts`
- `/api/customers/:id/addresses`
- `/api/customers/:id/documents`
- `/api/customers/:id/consents`
- `/api/customers/:id/preferences`
- `/api/customers/:id/notes`
- `/api/customers/:id/relationships`
- `/api/customers/:id/history`
- `/api/customers/:id/summary`

Dados sensiveis sao protegidos por permissao. Documentos sao mascarados, dados financeiros exigem `customers.view_financial_data`, documentos exigem `customers.view_documents`, e notas confidenciais exigem `customer_notes.read_confidential`.

## Sprint 05

Esta Sprint adiciona o modulo de funcionarios da oficina, mantendo funcionario e usuario como entidades separadas. O vinculo com usuario de acesso e opcional, limitado ao mesmo tenant e exclusivo para um unico funcionario.

Novas areas:

- Funcionarios, cargos e especialidades.
- Horarios individuais de trabalho.
- Documentos profissionais sem upload real de arquivos.
- Notas internas com controle de confidencialidade.
- Historico de status, contrato e vinculo com usuario.
- Resumo profissional do funcionario.

Novas tabelas principais:

- `job_positions`
- `employee_specialties`
- `employees`
- `employee_specialty_assignments`
- `employee_work_schedules`
- `employee_documents`
- `employee_status_history`
- `employee_user_link_history`
- `employee_notes`

Endpoints principais:

- `/api/job-positions`
- `/api/employee-specialties`
- `/api/employees`
- `/api/employees/:id/schedule`
- `/api/employees/:id/documents`
- `/api/employees/:id/notes`
- `/api/employees/:id/history`
- `/api/employees/:id/summary`

Dados sensiveis sao protegidos por permissao: salario e valor hora exigem `employees.view_financial_data`, documentos exigem `employees.view_documents`, e notas confidenciais exigem `employee_notes.read_confidential`. Listagens gerais mascaram documentos e nao retornam informacao financeira.

## Sprint 04.1

Esta Sprint reorganiza o frontend em um layout administrativo compartilhado, sem criar modulo de negocio, migration, seed ou endpoint novo.

## Execucao

```bash
npm install
copy .env.example .env
npm.cmd run migrate
npm.cmd run seed
npm.cmd run dev
```

Porta padrao: `3006`.

## Nova Estrutura Frontend

```text
frontend/
  auth/login.html
  dashboard/index.html
  administration/
  workshop/
  settings/company.html
  assets/css/
  js/layout/
  js/modules/
```

URLs antigas continuam funcionando por redirecionamento:

- `/login.html` -> `/auth/login.html`
- `/index.html` -> `/dashboard/`
- `/settings.html` -> `/settings/company.html`
- `/users.html` -> `/administration/users.html`
- `/workshop-map.html` -> `/workshop/map.html`

## Layout Compartilhado

Cada pagina interna usa:

```html
<body data-page="workshop-map">
  <div id="app"></div>
  <script src="/js/layout/appLayout.js"></script>
  <script src="/js/modules/workshopMap.js"></script>
</body>
```

O layout cria sidebar, topbar, breadcrumb, conteudo, rodape, toast, loader e confirmacao. Os modulos continuam responsaveis pela regra de interface da pagina.

## Como Criar Uma Nova Pagina Administrativa

1. Criar HTML no dominio correto.
2. Definir `data-page`.
3. Carregar scripts de API, sessao, layout e modulo.
4. Criar modulo em `frontend/js/modules`.
5. Registrar a pagina em `frontend/js/layout/navigation.js`.
6. Informar permissao minima.
7. Adicionar template em `frontend/js/layout/pageTemplates.js`.
8. Testar desktop e mobile.
9. Atualizar documentacao.

## Componentes

- Toast: `window.DOZEMECToast.showSuccess|showError|showWarning|showInfo`.
- Loader: `window.DOZEMEC_LAYOUT.showLoader()` e `hideLoader()`.
- Confirmacao: `await window.DOZEMEC_LAYOUT.confirm({ title, message })`.

## API

O client usa caminho relativo `/api`, evitando `localhost` fixo e facilitando reverse proxy/producao.

## Segurança Frontend

- Menu baseado em permissoes vindas de `/api/auth/me`.
- Backend segue sendo autoridade.
- Dados de API sao renderizados com `textContent`.
- Tema e cores da empresa sao validados antes de aplicar CSS variables.
- Token fica centralizado em `session.js`.

## Paginas Principais

- `/auth/login.html`
- `/dashboard/`
- `/settings/company.html`
- `/administration/users.html`
- `/administration/sectors.html`
- `/administration/roles.html`
- `/administration/audit.html`
- `/workshop/map.html`
- `/workshop/areas.html`
- `/workshop/bays.html`
- `/workshop/equipment-types.html`
- `/workshop/equipment.html`
- `/workshop/maintenance.html`
- `/customers/`
- `/customers/details.html`
