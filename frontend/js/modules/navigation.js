(function () {
  const links = [
    { href: "index.html", label: "Início" },
    { href: "settings.html", label: "Configurações", permission: "company.read" },
    { href: "users.html", label: "Usuários", permission: "users.read" },
    { href: "sectors.html", label: "Setores", permission: "sectors.read" },
    { href: "roles.html", label: "Perfis e Permissões", permission: "roles.read" },
    { href: "audit.html", label: "Auditoria", permission: "audit_logs.read" },
    { href: "workshop-map.html", label: "Mapa da Oficina", permission: "workshop_map.read" },
    { href: "workshop-areas.html", label: "Áreas", permission: "workshop_areas.read" },
    { href: "workshop-bays.html", label: "Baias", permission: "workshop_bays.read" },
    { href: "equipment-types.html", label: "Tipos de Equipamento", permission: "equipment_types.read" },
    { href: "equipment.html", label: "Equipamentos", permission: "equipment.read" },
    { href: "equipment-maintenance.html", label: "Manutenções", permission: "equipment_maintenance.read" }
  ];

  async function render() {
    const nav = document.getElementById("mainNav");
    if (!nav) return;
    try {
      await window.DOZEMECSession.refreshUser();
    } catch (error) {
      return;
    }
    const current = window.location.pathname.split("/").pop() || "index.html";
    nav.textContent = "";
    links.forEach((link) => {
      if (link.permission && !window.DOZEMECSession.hasPermission(link.permission)) return;
      const anchor = document.createElement("a");
      anchor.href = link.href;
      anchor.textContent = link.label;
      if (current === link.href) anchor.className = "active";
      nav.appendChild(anchor);
    });
  }

  render();
})();
