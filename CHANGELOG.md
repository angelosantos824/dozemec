# CHANGELOG

## v0.5.1

- Corrigido fluxo de manutencao de equipamentos sem criar novo modulo de negocio ou migration.
- Acoes de manutencao agora respeitam transicoes validas: agendada, em andamento, concluida e cancelada.
- Baias passam a abrir manutencao com equipamento vinculado ou apenas bloqueio manual da baia.
- Liberacao de baias e equipamentos valida manutencoes ativas antes de alterar a situacao.
- Tabelas, historicos, permissoes, datas e valores exibem rotulos amigaveis em portugues.

## v0.6.0

- CRUD de clientes particulares e empresariais.
- Contatos multiplos.
- Enderecos multiplos.
- Documentos.
- Preferencias de contato.
- Consentimentos.
- Notas internas.
- Relacionamentos entre clientes.
- Bloqueio e desbloqueio.
- Historico de alteracoes.
- Protecao de dados sensiveis.

## v0.5.0

- CRUD de funcionarios.
- Gestao de cargos e especialidades.
- Vinculo opcional entre funcionario e usuario.
- Horarios individuais de trabalho.
- Documentos profissionais sem upload real.
- Notas internas com confidencialidade.
- Situacao contratual e ativacao/desativacao.
- Comissoes configuraveis.
- Historico de status, contrato e vinculo de usuario.
- Protecao de dados sensiveis por permissao.
- Frontend de funcionarios com lista, catalogos e detalhes.

## v0.4.1

- Reorganizacao do frontend por dominio.
- Layout administrativo compartilhado.
- Sidebar e topbar reutilizaveis.
- Navegacao baseada em permissoes.
- Componentes compartilhados de toast, loader e confirmacao.
- CSS modular.
- Aplicacao centralizada de tema e identidade visual.
- Compatibilidade com URLs antigas.
- Melhorias de responsividade e acessibilidade.

## v0.4.0

- Gestao de areas da oficina.
- Gestao de baias.
- Gestao de tipos de equipamento.
- Gestao de equipamentos.
- Controle de estado operacional.
- Historico de estados.
- Manutencao preventiva e corretiva.
- Mapa operacional da oficina.
- Seed da estrutura inicial.

## v0.3.0

- CRUD de usuarios.
- Gestao de setores.
- Gestao de perfis e permissoes.
- Redefinicao administrativa de senha.
- Bloqueio e ativacao de usuarios.
- Historico de login.
- Auditoria administrativa.
- Protecao do ultimo administrador.

## v0.2.0

- Cadastro e edicao dos dados da oficina.
- Configuracao da identidade visual.
- Configuracoes operacionais.
- Horarios de funcionamento.
- Estrutura inicial de integracoes.
- Permissoes da Sprint 02.
