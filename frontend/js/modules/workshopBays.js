(function () {
  const form = document.getElementById("bayForm");
  const table = document.getElementById("baysTable");
  async function loadOptions() {
    const areas = await window.DOZEMECApi.get("/workshop/areas?limit=100");
    window.DOZEMECWorkshop.fillSelect(form.areaId, areas.items);
  }
  async function load() {
    const data = await window.DOZEMECApi.get("/workshop/bays?limit=100");
    window.DOZEMECTable.table(table, [{ key: "name", label: "Nome" }, { key: "code", label: "Código" }, { key: "bay_type", label: "Tipo" }, { key: "operational_status", label: "Estado" }], data.items, [
      { label: "Editar", run: (row) => window.DOZEMECTable.fillForm(form, { ...row, areaId: row.area_id, bayType: row.bay_type, operationalStatus: row.operational_status }) },
      { label: "Manutenção", run: async (row) => { await window.DOZEMECWorkshop.patch(`/workshop/bays/${row.id}/status`, { operationalStatus: "maintenance", reason: "Alterado pelo painel" }); await load(); } },
      { label: "Histórico", run: history },
      { label: "Excluir", run: async (row) => { await window.DOZEMECWorkshop.requestDelete(`/workshop/bays/${row.id}`); await load(); } }
    ]);
  }
  async function history(row) {
    const data = await window.DOZEMECApi.get(`/workshop/bays/${row.id}/history`);
    const panel = document.getElementById("historyPanel");
    panel.textContent = "";
    window.DOZEMECTable.table(panel, [{ key: "createdAt", label: "Data" }, { key: "previousStatus", label: "Anterior" }, { key: "newStatus", label: "Novo" }, { key: "reason", label: "Motivo" }], data, []);
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = window.DOZEMECTable.formObject(form);
    if (data.id) await window.DOZEMECApi.put(`/workshop/bays/${data.id}`, data); else await window.DOZEMECApi.post("/workshop/bays", data);
    form.reset();
    await load();
  });
  document.getElementById("clearButton").addEventListener("click", () => form.reset());
  if (window.DOZEMECSession.requireAuth()) { window.DOZEMECSession.bindLogout(); loadOptions().then(load).catch((e) => window.DOZEMECTable.message(e.message, "error")); }
})();
