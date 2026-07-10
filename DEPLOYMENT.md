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
