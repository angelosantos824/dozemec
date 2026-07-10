# Instalacao DOZEMEC

Versao: `0.5.0`.

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

A migration `005_create_employees_module.sql` cria o modulo de funcionarios. O seed adiciona cargos e especialidades iniciais de forma idempotente, sem criar funcionarios ficticios.

Inicie:

```bash
npm.cmd run dev
```

Teste:

```bash
curl http://localhost:3006/api/health
```

Abra `http://localhost:3006/auth/login.html` e entre com `admin@dozemec.com` / `Admin@123`.

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
- `http://localhost:3006/dashboard/`
- `http://localhost:3006/workshop/map.html`
- `http://localhost:3006/employees/`
- `http://localhost:3006/employees/job-positions.html`
- `http://localhost:3006/employees/specialties.html`

Use `npm.cmd` no PowerShell se `npm.ps1` for bloqueado pela politica de execucao.
