(function () {
  const pages = [
    { id: "dashboard", title: "Início", href: "/dashboard/", group: "Início" },
    { id: "users", title: "Usuários", href: "/administration/users.html", group: "Administração", permission: "users.read" },
    { id: "sectors", title: "Setores", href: "/administration/sectors.html", group: "Administração", permission: "sectors.read" },
    { id: "roles", title: "Perfis e Permissões", href: "/administration/roles.html", group: "Administração", permission: "roles.read" },
    { id: "audit", title: "Auditoria", href: "/administration/audit.html", group: "Administração", permission: "audit_logs.read" },
    { id: "workshop-map", title: "Mapa da Oficina", href: "/workshop/map.html", group: "Oficina", permission: "workshop_map.read" },
    { id: "workshop-areas", title: "Áreas", href: "/workshop/areas.html", group: "Oficina", permission: "workshop_areas.read" },
    { id: "workshop-bays", title: "Baias", href: "/workshop/bays.html", group: "Oficina", permission: "workshop_bays.read" },
    { id: "equipment-types", title: "Tipos de Equipamento", href: "/workshop/equipment-types.html", group: "Oficina", permission: "equipment_types.read" },
    { id: "equipment", title: "Equipamentos", href: "/workshop/equipment.html", group: "Oficina", permission: "equipment.read" },
    { id: "equipment-maintenance", title: "Manutenções", href: "/workshop/maintenance.html", group: "Oficina", permission: "equipment_maintenance.read" },
    { id: "settings", title: "Empresa e Oficina", href: "/settings/company.html", group: "Configurações", permission: "company.read" }
  ];

  function canSee(page, permissions) {
    return !page.permission || permissions.includes(page.permission);
  }

  function byId(id) {
    return pages.find((page) => page.id === id) || pages[0];
  }

  window.DOZEMEC_NAVIGATION = { pages, canSee, byId };
})();
