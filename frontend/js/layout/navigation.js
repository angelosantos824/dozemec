(function () {
  const pages = [
    { id: "dashboard", title: "Inicio", href: "/dashboard/", group: "Inicio" },
    { id: "users", title: "Usuarios", href: "/administration/users.html", group: "Administracao", permission: "users.read" },
    { id: "sectors", title: "Setores", href: "/administration/sectors.html", group: "Administracao", permission: "sectors.read" },
    { id: "roles", title: "Perfis e Permissoes", href: "/administration/roles.html", group: "Administracao", permission: "roles.read" },
    { id: "audit", title: "Auditoria", href: "/administration/audit.html", group: "Administracao", permission: "audit_logs.read" },
    { id: "workshop-map", title: "Mapa da Oficina", href: "/workshop/map.html", group: "Oficina", permission: "workshop_map.read" },
    { id: "workshop-areas", title: "Areas", href: "/workshop/areas.html", group: "Oficina", permission: "workshop_areas.read" },
    { id: "workshop-bays", title: "Baias", href: "/workshop/bays.html", group: "Oficina", permission: "workshop_bays.read" },
    { id: "equipment-types", title: "Tipos de Equipamento", href: "/workshop/equipment-types.html", group: "Oficina", permission: "equipment_types.read" },
    { id: "equipment", title: "Equipamentos", href: "/workshop/equipment.html", group: "Oficina", permission: "equipment.read" },
    { id: "equipment-maintenance", title: "Manutencoes", href: "/workshop/maintenance.html", group: "Oficina", permission: "equipment_maintenance.read" },
    { id: "employees", title: "Lista de Funcionarios", href: "/employees/", group: "Funcionarios", permission: "employees.read" },
    { id: "job-positions", title: "Cargos", href: "/employees/job-positions.html", group: "Funcionarios", permission: "job_positions.read" },
    { id: "employee-specialties", title: "Especialidades", href: "/employees/specialties.html", group: "Funcionarios", permission: "employee_specialties.read" },
    { id: "employee-details", title: "Detalhes do funcionario", href: "/employees/details.html", group: "Funcionarios", permission: "employees.read" },
    { id: "settings", title: "Empresa e Oficina", href: "/settings/company.html", group: "Configuracoes", permission: "company.read" }
  ];

  function canSee(page, permissions) {
    return !page.permission || permissions.includes(page.permission);
  }

  function byId(id) {
    return pages.find((page) => page.id === id) || pages[0];
  }

  window.DOZEMEC_NAVIGATION = { pages, canSee, byId };
})();
