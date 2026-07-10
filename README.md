# DOZEMEC

SaaS multiempresa da DOZEDEV para gestao de oficinas. A aplicacao usa Node.js, Express, MySQL, `mysql2/promise`, JWT, CommonJS e frontend HTML/CSS/JS simples para validacao inicial.

## Sprint 02

Esta versao adiciona o modulo de configuracao da oficina e identidade visual da empresa:

- Cadastro e edicao dos dados da oficina autenticada.
- Identidade visual com URLs de imagens, cores e tema.
- Configuracoes operacionais, financeiras basicas e numeracao de OS.
- Horarios de funcionamento por dia da semana.
- Estrutura inicial para integracoes futuras.
- Auditoria das alteracoes principais.

Porta padrao:

```env
PORT=3006
```

## Instalacao rapida

```bash
npm install
copy .env.example .env
```

Configure o `.env` com as credenciais do MySQL e crie o banco:

```sql
CREATE DATABASE dozemec CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Execute:

```bash
npm run migrate
npm run seed
npm run dev
```

Frontend:

- Abra `frontend/login.html` no navegador.
- API esperada em `http://localhost:3006/api`.

Credenciais de demonstracao:

```text
E-mail: admin@dozemec.com
Senha: Admin@123
```

Altere a senha inicial antes de usar em ambiente real.

## Novas tabelas

- `tenant_settings`
- `tenant_business_hours`
- `tenant_integrations`

A migration `002_create_tenant_settings.sql` tambem adiciona em `tenants`, quando ainda nao existirem: `legal_name`, `state_registration`, `secondary_phone`, `website`, endereco detalhado, imagens, `accent_color`, `theme`, `timezone`, `locale`, `currency` e `currency_symbol`.

## Permissoes Sprint 02

```text
company.read
company.update
company_branding.read
company_branding.update
company_settings.read
company_settings.update
business_hours.read
business_hours.update
integrations.read
integrations.update
```

O seed atribui todas ao perfil Admin.

## Endpoints

Todos os endpoints abaixo exigem JWT e usam `tenant_id` exclusivamente de `req.user.tenantId`.

```http
GET /api/company
PUT /api/company
GET /api/company/branding
PUT /api/company/branding
GET /api/company/settings
PUT /api/company/settings
GET /api/company/business-hours
PUT /api/company/business-hours
GET /api/company/integrations
PUT /api/company/integrations/:integrationType
```

Exemplo de atualizacao da empresa:

```json
{
  "tradeName": "DOZEMEC Demo Lisboa",
  "city": "Lisboa",
  "country": "Portugal"
}
```

Exemplo de identidade visual:

```json
{
  "primaryColor": "#7C3AED",
  "secondaryColor": "#111827",
  "accentColor": "#22D3EE",
  "theme": "dark"
}
```

Exemplo de horarios:

```json
{
  "days": [
    {
      "dayOfWeek": 1,
      "isOpen": true,
      "openingTime": "08:00",
      "lunchStartTime": "12:00",
      "lunchEndTime": "14:00",
      "closingTime": "18:00"
    }
  ]
}
```

## Testes manuais

1. Login do administrador.
2. Consulta dos dados da empresa.
3. Alteracao do nome comercial.
4. Alteracao das cores.
5. Rejeicao de cor invalida.
6. Consulta das configuracoes.
7. Alteracao dos horarios.
8. Rejeicao de horario invalido.
9. Tentativa de enviar `tenant_id` no body.
10. Tentativa de acessar sem token.
11. Tentativa de acessar sem permissao.
12. Verificacao de auditoria em `audit_logs`.
13. Reexecucao do seed sem duplicacoes.
14. Teste da porta 3006.

## Cuidados multiempresa

- Nunca envie `tenant_id` pelo frontend.
- Queries operacionais filtram por `tenant_id`.
- Dados sensiveis, `password_hash` e segredos de integracao nao sao retornados.
- Integracoes aceitam apenas `provider` e `status` nesta fase.

## Possiveis erros

- `Variaveis de ambiente ausentes`: confira o `.env`.
- `Credenciais invalidas`: execute o seed e use as credenciais de demonstracao.
- `Permissao insuficiente`: confira se o seed foi reexecutado apos a Sprint 02.
- Erro de coluna inexistente: execute `npm run migrate` antes do seed.

Mais detalhes em `INSTALLATION.md` e `DEPLOYMENT.md`.
