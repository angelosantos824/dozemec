# Deploy inicial DOZEMEC

## Variaveis de ambiente

Use um `.env` proprio do ambiente e proteja:

- `JWT_SECRET`
- credenciais do MySQL
- configuracoes de rede e porta

Nunca use `altere_esta_chave` em producao.

## Execucao em producao

```bash
npm install --omit=dev
npm run migrate
npm run seed
npm start
```

Altere a senha padrao do administrador apos o primeiro acesso.

## Banco de dados

- Configure backups regulares.
- Teste restauracao de backup.
- Execute migrations antes de publicar novas versoes.

## HTTPS e proxy

Use HTTPS em producao. Um reverse proxy como Nginx, Apache ou IIS pode encaminhar trafego externo para a porta configurada da API.

## Atualizacao

Processo inicial recomendado:

1. Fazer backup do banco.
2. Atualizar arquivos da aplicacao.
3. Instalar dependencias.
4. Executar migrations.
5. Executar seed idempotente.
6. Reiniciar o processo Node.js.

Nao ha sistema automatico de atualizacao nesta etapa.

## Sprint 03

- Monitore logs de login e tentativas falhas.
- Mantenha HTTPS ativo para proteger credenciais.
- Revise periodicamente usuarios bloqueados/inativos.
- Verifique se backups incluem `audit_logs`, `user_login_history` e `user_password_resets`.
- Troque a senha inicial do administrador e use um `JWT_SECRET` forte.

## Sprint 04

- Faça backup antes de aplicar a migration `004_create_workshop_structure.sql`.
- Reexecute o seed com segurança para criar a estrutura demo inicial.
- Imagens e uploads externos ainda nao foram implementados.
- Monitore logs de auditoria para mudancas de estados e manutencoes.
- Em atualizacoes de `0.3.0` para `0.4.0`, rode migrations antes de liberar o frontend novo.

## Sprint 04.1

- O frontend e servido pelo Express como arquivos estaticos.
- O client usa `/api`, adequado para reverse proxy.
- Configure cache de estaticos com cuidado ao publicar nova versao.
- Redirecionamentos antigos devem ser preservados para compatibilidade.
- Nao ha migration nesta Sprint.
- Backup continua recomendado antes de qualquer publicacao.

## Sprint 05

- Faca backup antes de aplicar a migration `005_create_employees_module.sql`.
- Atualize de `0.4.1` para `0.5.0` executando migrations antes de liberar o frontend novo.
- Reexecute o seed para criar cargos, especialidades e permissoes sem duplicacao.
- Revise perfis com acesso a dados financeiros, documentos e notas confidenciais.
- Mantenha HTTPS ativo para proteger dados pessoais de funcionarios.
- Nao registre documentos completos, salarios ou notas confidenciais em logs externos.
- Defina politica de acesso para administradores que podem vincular funcionarios a usuarios.
