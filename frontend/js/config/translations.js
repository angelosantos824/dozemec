(function () {
  const labels = {
    active: "Ativo",
    inactive: "Inativo",
    blocked: "Bloqueado",
    available: "Disponivel",
    reserved: "Reservada",
    occupied: "Ocupada",
    maintenance: "Em manutencao",
    unavailable: "Indisponivel",
    in_use: "Em uso",
    retired: "Retirado de operacao",
    scheduled: "Agendada",
    in_progress: "Em andamento",
    completed: "Concluida",
    cancelled: "Cancelada",
    preventive: "Preventiva",
    corrective: "Corretiva",
    inspection: "Inspecao",
    calibration: "Calibracao",
    other: "Outra",
    general: "Geral",
    lift: "Elevador",
    alignment: "Alinhamento",
    balancing: "Balanceamento",
    diagnostics: "Diagnostico",
    electrical: "Eletrica",
    washing: "Lavagem",
    parking: "Estacionamento"
  };

  const modules = {
    equipment_maintenance: "Manutencao de equipamentos",
    equipment: "Equipamentos",
    equipment_types: "Tipos de equipamento",
    workshop_bays: "Baias",
    workshop_areas: "Areas",
    workshop_map: "Mapa da oficina",
    users: "Usuarios",
    roles: "Perfis",
    permissions: "Permissoes",
    audit_logs: "Auditoria",
    customers: "Clientes",
    customer_contacts: "Contatos de clientes",
    customer_addresses: "Enderecos de clientes",
    customer_consents: "Consentimentos de clientes",
    customer_notes: "Notas de clientes",
    customer_relationships: "Relacionamentos de clientes",
    employees: "Funcionarios",
    employee_notes: "Notas de funcionarios",
    employee_schedules: "Horarios de funcionarios",
    employee_specialties: "Especialidades",
    job_positions: "Cargos",
    company: "Empresa",
    company_settings: "Configuracoes da oficina",
    company_branding: "Identidade visual",
    business_hours: "Horarios",
    integrations: "Integracoes",
    dashboard: "Painel"
  };

  const actions = {
    create: "Cadastrar",
    read: "Visualizar",
    update: "Editar",
    delete: "Excluir",
    complete: "Concluir",
    activate: "Ativar",
    deactivate: "Desativar",
    block: "Bloquear",
    unblock: "Desbloquear",
    change_status: "Alterar estado",
    view_history: "Visualizar historico",
    manage_permissions: "Gerir permissoes",
    reset_password: "Redefinir senha",
    view_login_history: "Visualizar historico de login",
    view_financial_data: "Visualizar dados financeiros",
    view_documents: "Visualizar documentos",
    manage_documents: "Gerir documentos",
    read_confidential: "Visualizar confidenciais",
    link_user: "Vincular usuario"
  };

  function text(value) {
    return labels[value] || value || "";
  }

  function permission(code) {
    const parts = String(code || "").split(".");
    const moduleName = modules[parts[0]] || parts[0];
    const actionKey = parts.slice(1).join("_");
    const action = actions[actionKey] || actions[parts[1]] || actionKey;
    return `${action} - ${moduleName}`;
  }

  function date(value, withTime) {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    const company = window.DOZEMEC_LAYOUT && window.DOZEMEC_LAYOUT.getCompany ? window.DOZEMEC_LAYOUT.getCompany() : {};
    return new Intl.DateTimeFormat(company.locale || "pt-PT", {
      timeZone: company.timezone || "Europe/Lisbon",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {})
    }).format(parsed);
  }

  function money(value) {
    if (value === null || value === undefined || value === "") return "";
    const company = window.DOZEMEC_LAYOUT && window.DOZEMEC_LAYOUT.getCompany ? window.DOZEMEC_LAYOUT.getCompany() : {};
    return new Intl.NumberFormat(company.locale || "pt-PT", { style: "currency", currency: company.currency || "EUR" }).format(Number(value));
  }

  window.DOZEMEC_I18N = { text, badge: text, date, money, permission, modules, actions };
})();
