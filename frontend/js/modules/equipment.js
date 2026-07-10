(function () {
  const form = document.getElementById("equipmentForm");
  const table = document.getElementById("equipmentTable");
  const i18n = window.DOZEMEC_I18N;

  async function loadOptions() {
    const [types, bays] = await Promise.all([window.DOZEMECApi.get("/equipment-types?limit=100"), window.DOZEMECApi.get("/workshop/bays?limit=100")]);
    window.DOZEMECWorkshop.fillSelect(form.equipmentTypeId, types.items);
    window.DOZEMECWorkshop.fillSelect(form.bayId, bays.items);
  }

  function mapRow(row) {
    return { ...row, operationalStatusLabel: i18n.text(row.operational_status), nextMaintenanceDateLabel: i18n.date(row.next_maintenance_date) };
  }

  function renderActions(rows) {
    Array.from(table.querySelectorAll("tbody tr")).forEach((tr, index) => {
      const row = rows[index];
      const td = tr.lastElementChild;
      td.textContent = "";
      [
        { label: "Editar", run: () => window.DOZEMECTable.fillForm(form, { ...row, equipmentTypeId: row.equipment_type_id, bayId: row.bay_id, assetNumber: row.asset_number, operationalStatus: row.operational_status }) },
        row.operational_status === "maintenance" ? { label: "Retirar da manutencao", run: () => releaseEquipment(row) } : { label: "Manutencao", run: () => markMaintenance(row) },
        { label: "Historico", run: () => history(row) },
        { label: "Excluir", run: () => remove(row) }
      ].forEach((action) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "secondary";
        button.textContent = action.label;
        button.addEventListener("click", () => action.run());
        td.appendChild(button);
      });
    });
  }

  async function load() {
    const data = await window.DOZEMECApi.get("/equipment?limit=100");
    const rows = data.items.map(mapRow);
    window.DOZEMECTable.table(table, [
      { key: "name", label: "Nome" },
      { key: "code", label: "Codigo" },
      { key: "operationalStatusLabel", label: "Situacao" },
      { key: "nextMaintenanceDateLabel", label: "Prox. manutencao" }
    ], rows, [{ label: "", run: () => {} }]);
    renderActions(rows);
  }

  async function markMaintenance(row) {
    try {
      const data = await window.DOZEMECWorkshop.formDialog({ title: "Colocar em manutencao", confirmText: "Confirmar", fields: [{ name: "reason", label: "Motivo", required: true }] });
      if (!data) return;
      await window.DOZEMECWorkshop.patch(`/equipment/${row.id}/status`, { operationalStatus: "maintenance", reason: data.reason });
      window.DOZEMECWorkshop.notifySuccess("Equipamento marcado em manutencao.");
      await load();
    } catch (error) {
      window.DOZEMECWorkshop.notifyError(error);
    }
  }

  async function releaseEquipment(row) {
    try {
      const data = await window.DOZEMECWorkshop.formDialog({
        title: "Retirar da manutencao",
        confirmText: "Confirmar",
        fields: [
          { name: "operationalStatus", label: "Nova situacao", type: "select", value: "available", options: [{ value: "available", label: "Disponivel" }, { value: "unavailable", label: "Indisponivel" }] },
          { name: "reason", label: "Motivo", required: true }
        ]
      });
      if (!data) return;
      await window.DOZEMECWorkshop.patch(`/equipment/${row.id}/status`, data);
      window.DOZEMECWorkshop.notifySuccess("Equipamento retirado da manutencao.");
      await load();
    } catch (error) {
      window.DOZEMECWorkshop.notifyError(error);
    }
  }

  async function remove(row) {
    try {
      if (!(await window.DOZEMECWorkshop.confirm("Excluir este equipamento?", "Excluir equipamento"))) return;
      await window.DOZEMECWorkshop.requestDelete(`/equipment/${row.id}`);
      await load();
    } catch (error) {
      window.DOZEMECWorkshop.notifyError(error);
    }
  }

  async function history(row) {
    try {
      const data = await window.DOZEMECApi.get(`/equipment/${row.id}/history`);
      const panel = document.getElementById("historyPanel");
      panel.textContent = "";
      window.DOZEMECTable.table(panel, [
        { key: "createdAtLabel", label: "Data" },
        { key: "previousStatusLabel", label: "Anterior" },
        { key: "newStatusLabel", label: "Novo" },
        { key: "reason", label: "Motivo" }
      ], data.map((item) => ({ ...item, createdAtLabel: i18n.date(item.createdAt, true), previousStatusLabel: i18n.text(item.previousStatus), newStatusLabel: i18n.text(item.newStatus) })), []);
    } catch (error) {
      window.DOZEMECWorkshop.notifyError(error);
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const data = window.DOZEMECTable.formObject(form);
      if (data.id) await window.DOZEMECApi.put(`/equipment/${data.id}`, data);
      else await window.DOZEMECApi.post("/equipment", data);
      form.reset();
      await load();
    } catch (error) {
      window.DOZEMECWorkshop.notifyError(error);
    }
  });
  document.getElementById("clearButton").addEventListener("click", () => form.reset());
  if (window.DOZEMECSession.requireAuth()) {
    window.DOZEMECSession.bindLogout();
    loadOptions().then(load).catch(window.DOZEMECWorkshop.notifyError);
  }
})();
