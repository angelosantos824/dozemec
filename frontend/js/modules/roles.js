(function () {
  const form = document.getElementById("roleForm");
  const tableEl = document.getElementById("rolesTable");
  let selectedRoleId = null;

  async function load() {
    const data = await window.DOZEMECApi.get("/roles?limit=100");
    window.DOZEMECTable.table(tableEl, [{ key: "name", label: "Nome" }, { key: "code", label: "Código" }, { key: "status", label: "Status" }], data.items, [
      { label: "Editar", run: edit },
      { label: "Excluir", run: async (row) => { await requestDelete(row.id); await load(); } }
    ]);
  }

  async function edit(row) {
    const role = await window.DOZEMECApi.get(`/roles/${row.id}`);
    selectedRoleId = role.id;
    window.DOZEMECTable.fillForm(form, role);
    await window.DOZEMECPermissions.loadPermissions(role.permissions.map((permission) => permission.id));
  }

  async function requestDelete(id) {
    const response = await fetch(`${window.DOZEMECApi.API_BASE_URL}/roles/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${window.DOZEMECSession.getToken()}` } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const data = window.DOZEMECTable.formObject(form);
      if (data.id) await window.DOZEMECApi.put(`/roles/${data.id}`, data);
      else await window.DOZEMECApi.post("/roles", { ...data, permissionIds: [] });
      form.reset();
      selectedRoleId = null;
      await window.DOZEMECPermissions.loadPermissions([]);
      await load();
      window.DOZEMECTable.message("Perfil salvo.", "success");
    } catch (error) {
      window.DOZEMECTable.message(error.message, "error");
    }
  });

  document.getElementById("savePermissions").addEventListener("click", async () => {
    if (!selectedRoleId) return window.DOZEMECTable.message("Selecione um perfil.", "error");
    await window.DOZEMECApi.put(`/roles/${selectedRoleId}/permissions`, { permissionIds: window.DOZEMECPermissions.selectedPermissions() });
    window.DOZEMECTable.message("Permissões salvas.", "success");
  });

  document.getElementById("clearButton").addEventListener("click", () => form.reset());
  if (window.DOZEMECSession.requireAuth()) {
    window.DOZEMECSession.bindLogout();
    window.DOZEMECPermissions.loadPermissions([]).then(load);
  }
})();
