# Instalacao DOZEMEC

## Requisitos

- Node.js 20 LTS ou superior.
- MySQL 8.0 ou superior.
- Windows PowerShell, terminal integrado ou shell equivalente.

## Passos

```bash
npm install
copy .env.example .env
```

Configure:

```env
PORT=3006
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=dozemec
JWT_SECRET=troque_esta_chave
JWT_EXPIRES_IN=8h
```

Crie o banco:

```sql
CREATE DATABASE dozemec CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Rode migrations e seed:

```bash
npm.cmd run migrate
npm.cmd run seed
```

Inicie:

```bash
npm.cmd run dev
```

Teste:

```bash
curl http://localhost:3006/api/health
```

Abra `frontend/login.html` e entre com `admin@dozemec.com` / `Admin@123`.

Na area administrativa, acesse tambem:

- `frontend/users.html`
- `frontend/sectors.html`
- `frontend/roles.html`
- `frontend/audit.html`
- `frontend/workshop-map.html`
- `frontend/workshop-areas.html`
- `frontend/workshop-bays.html`
- `frontend/equipment-types.html`
- `frontend/equipment.html`
- `frontend/equipment-maintenance.html`

Use `npm.cmd` no PowerShell se `npm.ps1` for bloqueado pela politica de execucao.
