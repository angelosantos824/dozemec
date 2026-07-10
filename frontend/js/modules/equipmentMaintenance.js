(function () {
  const form = document.getElementById("maintenanceForm");
  const table = document.getElementById("maintenanceTable");
  const i18n = window.DOZEMEC_I18N;
  async function loadOptions() {
    const equipment = await window.DOZEMECApi.get("/equipment?limit=100");
    window.DOZEMECWorkshop.fillSelect(form.equipmentId, equipment.items);
  }
  function mapRow(row) {
    return {
      ...row,
      equipmentName: row.equipment_name || row.equipmentName || row.equipment_id,
      maintenanceTypeLabel: i18n.text(row.maintenance_type),
      statusLabel: i18n.text(row.status),
      scheduledDateLabel: i18n.date(row.scheduled_date),
      startedAtLabel: i18n.date(row.started_at, true),
      completedAtLabel: i18n.date(row.completed_at, true),
      costLabel: i18n.money(row.cost)
    };
  }
  function actionsFor(row) {
    const actions = [];
    if (row.status === "scheduled") {
      actions.push({ label: "Editar", run: () => window.DOZEMECTable.fillForm(form, { ...row, equipmentId: row.equipment_id, maintenanceType: row.maintenance_type, scheduledDate: String(row.scheduled_date || "").slice(0, 10) }) });
      actions.push({ label: "Iniciar", run: () => start(row) });
      actions.push({ label: "Cancelar", run: () => cancel(row) });
    } else if (row.status === "in_progress") {
      actions.push({ label: "Concluir", run: () => complete(row) });
      actions.push({ label: "Cancelar", run: () => cancel(row) });
    } else {
      actions.push({ label: "Visualizar", run: () => window.DOZEMECTable.fillForm(form, { ...row, equipmentId: row.equipment_id, maintenanceType: row.maintenance_type, scheduledDate: String(row.scheduled_date || "").slice(0, 10) }) });
    }
    return actions;
  }
  async function load() {
    const data = await window.DOZEMECApi.get("/equipment-maintenance?limit=100");
    const rows = data.items.map(mapRow);
    window.DOZEMECTable.table(table, [
      { key: "equipmentName", label: "Equipamento" },
      { key: "maintenanceTypeLabel", label: "Tipo" },
      { key: "statusLabel", label: "Situacao" },
      { key: "scheduledDateLabel", label: "Data agendada" },
      { key: "startedAtLabel", label: "Inicio" },
      { key: "completedAtLabel", label: "Conclusao" },
      { key: "costLabel", label: "Custo" }
    ], rows, [{ label: "", run: () => {} }]);
    Array.from(table.querySelectorAll("tbody tr")).forEach((tr, index) => {
      const td = tr.lastElementChild;
      td.textContent = "";
      actionsFor(rows[index]).forEach((action) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "secondary";
        button.textContent = action.label;
        button.addEventListener("click", () => action.run(rows[index]));
        td.appendChild(button);
      });
    });
  }
  async function start(row) {
    try {
      if (!(await window.DOZEMECWorkshop.confirm(`Iniciar manutencao de ${row.equipmentName}?`, "Iniciar manutencao"))) return;
      await window.DOZEMECWorkshop.patch(`/equipment-maintenance/${row.id}/start`);
      window.DOZEMECWorkshop.notifySuccess("Manutencao iniciada.");
      await load();
    } catch (error) {
      window.DOZEMECWorkshop.notifyError(error);
    }
  }
  async function complete(row) {
    try {
      const data = await window.DOZEMECWorkshop.formDialog({
        title: "Concluir manutencao",
        confirmText: "Concluir",
        fields: [
          { name: "equipmentOperationalStatus", label: "Situacao do equipamento", type: "select", value: "available", options: [{ value: "available", label: "Disponivel" }, { value: "unavailable", label: "Indisponivel" }] },
          { name: "cost", label: "Custo", type: "number" },
          { name: "notes", label: "Notas" }
        ]
      });
      if (!data) return;
      await window.DOZEMECWorkshop.patch(`/equipment-maintenance/${row.id}/complete`, { ...data, cost: data.cost === "" ? undefined : Number(data.cost) });
      window.DOZEMECWorkshop.notifySuccess("Manutencao concluida.");
      await load();
    } catch (error) {
      window.DOZEMECWorkshop.notifyError(error);
    }
  }
  async function cancel(row) {
    try {
      const data = await window.DOZEMECWorkshop.formDialog({ title: "Cancelar manutencao", confirmText: "Cancelar manutencao", fields: [{ name: "reason", label: "Motivo", required: true }] });
      if (!data) return;
      await window.DOZEMECWorkshop.patch(`/equipment-maintenance/${row.id}/cancel`, data);
      window.DOZEMECWorkshop.notifySuccess("Manutencao cancelada.");
      await load();
    } catch (error) {
      window.DOZEMECWorkshop.notifyError(error);
    }
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const data = window.DOZEMECTable.formObject(form);
      if (data.id) await window.DOZEMECApi.put(`/equipment-maintenance/${data.id}`, data); else await window.DOZEMECApi.post("/equipment-maintenance", data);
      form.reset();
      await load();
    } catch (error) {
      window.DOZEMECWorkshop.notifyError(error);
    }
  });
  document.getElementById("clearButton").addEventListener("click", () => form.reset());
  if (window.DOZEMECSession.requireAuth()) { window.DOZEMECSession.bindLogout(); loadOptions().then(load).catch(window.DOZEMECWorkshop.notifyError); }
})();
