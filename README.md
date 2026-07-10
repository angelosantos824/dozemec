# DOZEMEC

Base inicial do DOZEMEC, um SaaS multiempresa da DOZEDEV para gerenciamento de oficinas.

Nesta etapa o projeto inclui somente a fundacao do sistema: API Express, conexao MySQL, migrations, seed inicial, autenticacao JWT, setores, perfis, permissoes, auditoria inicial e estrutura frontend vazia.

## Tecnologias

- Node.js
- Express
- MySQL
- mysql2
- dotenv
- cors
- bcryptjs
- jsonwebtoken
- nodemon
- CommonJS

## Instalacao

```bash
npm install
```

Crie o arquivo `.env` a partir do exemplo:

```bash
copy .env.example .env
```

Atualize as credenciais do MySQL no `.env`.

## Banco de dados

Crie o banco antes de executar as migrations:

```sql
CREATE DATABASE dozemec CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Execute as migrations:

```bash
npm run migrate
```

Execute o seed inicial:

```bash
npm run seed
```

## Executar o servidor

Ambiente de desenvolvimento:

```bash
npm run dev
```

Ambiente normal:

```bash
npm start
```

## Rotas iniciais

Verificacao da API:

```http
GET /api/health
```

Resposta:

```json
{
  "success": true,
  "message": "API DOZEMEC funcionando"
}
```

Login:

```http
POST /api/auth/login
Content-Type: application/json
```

Body:

```json
{
  "email": "admin@dozemec.com",
  "password": "Admin@123"
}
```

Resposta esperada:

```json
{
  "success": true,
  "data": {
    "token": "token_jwt",
    "user": {
      "id": 1,
      "name": "Administrador DOZEMEC",
      "email": "admin@dozemec.com",
      "tenantId": 1,
      "sector": "Administração",
      "role": "Admin"
    }
  }
}
```

## Multiempresa

As tabelas operacionais iniciais usam `tenant_id`. As constraints e consultas iniciais foram preparadas para impedir mistura de dados entre empresas.

O middleware `authenticate` valida o JWT e disponibiliza:

```js
req.user = {
  id,
  tenantId,
  sectorId,
  roleId,
  email
};
```

O middleware `authorize("codigo.permissao")` verifica se o perfil do usuario autenticado possui a permissao informada dentro do tenant atual.

## Estrutura

```text
server/
  config/
  controllers/
  database/
    migrations/
    seeds/
  middlewares/
  repositories/
  routes/
  services/
  utils/
  validators/
frontend/
  assets/
    css/
    images/
    icons/
  js/
    api/
    auth/
    modules/
    ui/
    utils/
scripts/
```
