(function () {
  const form = document.getElementById("typeForm");
  const table = document.getElementById("typesTable");
  async function load() {
    const data = await window.DOZEMECApi.get("/equipment-types?limit=100");
    window.DOZEMECTable.table(table, [{ key: "name", label: "Nome" }, { key: "code", label: "Código" }, { key: "status", label: "Status" }], data.items, [
      { label: "Editar", run: (row) => window.DOZEMECTable.fillForm(form, { ...row, defaultMaintenanceIntervalDays: row.default_maintenance_interval_days }) },
      { label: "Excluir", run: async (row) => { await window.DOZEMECWorkshop.requestDelete(`/equipment-types/${row.id}`); await load(); } }
    ]);
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = window.DOZEMECTable.formObject(form);
    if (data.id) await window.DOZEMECApi.put(`/equipment-types/${data.id}`, data); else await window.DOZEMECApi.post("/equipment-types", data);
    form.reset();
    await load();
  });
  document.getElementById("clearButton").addEventListener("click", () => form.reset());
  if (window.DOZEMECSession.requireAuth()) { window.DOZEMECSession.bindLogout(); load(); }
})();
