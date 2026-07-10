# DOZEMEC

SaaS multiempresa da DOZEDEV para gestao de oficinas. Versao atual: `0.4.0`.

## Sprint 04

A Sprint 04 implementa a estrutura fisica da oficina: areas, baias, tipos de equipamento, equipamentos, historico de estados, manutencoes e mapa operacional. Nao inclui funcionarios, clientes, veiculos, estoque, financeiro ou ordens de servico.

Porta padrao:

```env
PORT=3006
```

## Execucao

```bash
npm install
copy .env.example .env
npm.cmd run migrate
npm.cmd run seed
npm.cmd run dev
```

Banco:

```sql
CREATE DATABASE dozemec CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Credenciais demo: `admin@dozemec.com` / `Admin@123`.

## Novas tabelas

- `workshop_areas`
- `workshop_bays`
- `equipment_types`
- `workshop_equipment`
- `equipment_maintenance_records`
- `bay_status_history`
- `equipment_status_history`

## Permissoes

Foram adicionadas permissoes para `workshop_areas`, `workshop_bays`, `equipment_types`, `equipment`, `equipment_maintenance` e `workshop_map`. O perfil Admin recebe todas; perfis iniciais recebem acessos coerentes.

## Endpoints

```http
GET /api/workshop/map
GET/POST /api/workshop/areas
GET/PUT/DELETE /api/workshop/areas/:id
GET/POST /api/workshop/bays
GET/PUT/DELETE /api/workshop/bays/:id
PATCH /api/workshop/bays/:id/status
GET /api/workshop/bays/:id/history
GET/POST /api/equipment-types
GET/PUT/DELETE /api/equipment-types/:id
GET/POST /api/equipment
GET/PUT/DELETE /api/equipment/:id
PATCH /api/equipment/:id/status
GET /api/equipment/:id/history
GET/POST /api/equipment-maintenance
GET/PUT/DELETE /api/equipment-maintenance/:id
PATCH /api/equipment-maintenance/:id/start
PATCH /api/equipment-maintenance/:id/complete
PATCH /api/equipment-maintenance/:id/cancel
```

## Estados

Baias: `available`, `reserved`, `occupied`, `maintenance`, `unavailable`.

Equipamentos: `available`, `in_use`, `maintenance`, `unavailable`, `retired`.

Manutencoes: `scheduled`, `in_progress`, `completed`, `cancelled`.

## Seed inicial

Cria para o tenant demo:

- Areas: Oficina principal, Alinhamento, Balanceamento.
- 8 baias: 5 com elevador, 2 de alinhamento, 1 de balanceamento.
- 8 tipos de equipamento.
- 8 equipamentos vinculados as baias.

## Frontend

Novas paginas:

- `frontend/workshop-map.html`
- `frontend/workshop-areas.html`
- `frontend/workshop-bays.html`
- `frontend/equipment-types.html`
- `frontend/equipment.html`
- `frontend/equipment-maintenance.html`

## Multiempresa e seguranca

Todas as consultas usam `tenant_id` do token. Nenhum endpoint aceita `tenant_id` do cliente. Alteracoes relevantes geram auditoria sanitizada. Exclusoes sao logicas quando ha historico operacional.

## Testes manuais

1. Aplicar migration 004.
2. Executar seed e reexecutar sem duplicar.
3. Consultar mapa da oficina.
4. Validar 3 areas, 8 baias, 8 tipos e 8 equipamentos.
5. Criar/editar area, baia, tipo e equipamento.
6. Alterar estado de baia/equipamento e consultar historico.
7. Criar, iniciar, concluir e cancelar manutencao.
8. Verificar auditoria.
9. Acessar sem token.
10. Verificar pagina 3006 e frontend.
