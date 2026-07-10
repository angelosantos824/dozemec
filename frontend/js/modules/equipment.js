(function () {
  const form = document.getElementById("equipmentForm");
  const table = document.getElementById("equipmentTable");
  async function loadOptions() {
    const [types, bays] = await Promise.all([window.DOZEMECApi.get("/equipment-types?limit=100"), window.DOZEMECApi.get("/workshop/bays?limit=100")]);
    window.DOZEMECWorkshop.fillSelect(form.equipmentTypeId, types.items);
    window.DOZEMECWorkshop.fillSelect(form.bayId, bays.items);
  }
  async function load() {
    const data = await window.DOZEMECApi.get("/equipment?limit=100");
    window.DOZEMECTable.table(table, [{ key: "name", label: "Nome" }, { key: "code", label: "Código" }, { key: "operational_status", label: "Estado" }, { key: "next_maintenance_date", label: "Próx. manutenção" }], data.items, [
      { label: "Editar", run: (row) => window.DOZEMECTable.fillForm(form, { ...row, equipmentTypeId: row.equipment_type_id, bayId: row.bay_id, assetNumber: row.asset_number, operationalStatus: row.operational_status }) },
      { label: "Manutenção", run: async (row) => { await window.DOZEMECWorkshop.patch(`/equipment/${row.id}/status`, { operationalStatus: "maintenance", reason: "Alterado pelo painel" }); await load(); } },
      { label: "Histórico", run: history },
      { label: "Excluir", run: async (row) => { await window.DOZEMECWorkshop.requestDelete(`/equipment/${row.id}`); await load(); } }
    ]);
  }
  async function history(row) {
    const data = await window.DOZEMECApi.get(`/equipment/${row.id}/history`);
    const panel = document.getElementById("historyPanel");
    panel.textContent = "";
    window.DOZEMECTable.table(panel, [{ key: "createdAt", label: "Data" }, { key: "previousStatus", label: "Anterior" }, { key: "newStatus", label: "Novo" }, { key: "reason", label: "Motivo" }], data, []);
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = window.DOZEMECTable.formObject(form);
    if (data.id) await window.DOZEMECApi.put(`/equipment/${data.id}`, data); else await window.DOZEMECApi.post("/equipment", data);
    form.reset();
    await load();
  });
  document.getElementById("clearButton").addEventListener("click", () => form.reset());
  if (window.DOZEMECSession.requireAuth()) { window.DOZEMECSession.bindLogout(); loadOptions().then(load).catch((e) => window.DOZEMECTable.message(e.message, "error")); }
})();
