(function () {
  const form = document.getElementById("maintenanceForm");
  const table = document.getElementById("maintenanceTable");
  async function loadOptions() {
    const equipment = await window.DOZEMECApi.get("/equipment?limit=100");
    window.DOZEMECWorkshop.fillSelect(form.equipmentId, equipment.items);
  }
  async function load() {
    const data = await window.DOZEMECApi.get("/equipment-maintenance?limit=100");
    window.DOZEMECTable.table(table, [{ key: "equipment_id", label: "Equip." }, { key: "maintenance_type", label: "Tipo" }, { key: "status", label: "Status" }, { key: "scheduled_date", label: "Data" }], data.items, [
      { label: "Editar", run: (row) => window.DOZEMECTable.fillForm(form, { ...row, equipmentId: row.equipment_id, maintenanceType: row.maintenance_type, scheduledDate: String(row.scheduled_date).slice(0, 10) }) },
      { label: "Iniciar", run: async (row) => { await window.DOZEMECWorkshop.patch(`/equipment-maintenance/${row.id}/start`); await load(); } },
      { label: "Concluir", run: async (row) => { await window.DOZEMECWorkshop.patch(`/equipment-maintenance/${row.id}/complete`, { equipmentOperationalStatus: "available" }); await load(); } },
      { label: "Cancelar", run: async (row) => { await window.DOZEMECWorkshop.patch(`/equipment-maintenance/${row.id}/cancel`, { reason: "Cancelado pelo painel" }); await load(); } }
    ]);
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = window.DOZEMECTable.formObject(form);
    if (data.id) await window.DOZEMECApi.put(`/equipment-maintenance/${data.id}`, data); else await window.DOZEMECApi.post("/equipment-maintenance", data);
    form.reset();
    await load();
  });
  document.getElementById("clearButton").addEventListener("click", () => form.reset());
  if (window.DOZEMECSession.requireAuth()) { window.DOZEMECSession.bindLogout(); loadOptions().then(load).catch((e) => window.DOZEMECTable.message(e.message, "error")); }
})();
