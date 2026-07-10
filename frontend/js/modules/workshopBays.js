(function () {
  const form = document.getElementById("bayForm");
  const table = document.getElementById("baysTable");
  const i18n = window.DOZEMEC_I18N;

  async function loadOptions() {
    const areas = await window.DOZEMECApi.get("/workshop/areas?limit=100");
    window.DOZEMECWorkshop.fillSelect(form.areaId, areas.items);
  }

  function mapRow(row) {
    return { ...row, bayTypeLabel: i18n.text(row.bay_type), operationalStatusLabel: i18n.text(row.operational_status) };
  }

  function renderActions(rows) {
    Array.from(table.querySelectorAll("tbody tr")).forEach((tr, index) => {
      const row = rows[index];
      const td = tr.lastElementChild;
      td.textContent = "";
      [
        { label: "Editar", run: () => window.DOZEMECTable.fillForm(form, { ...row, areaId: row.area_id, bayType: row.bay_type, operationalStatus: row.operational_status }) },
        row.operational_status === "maintenance" ? { label: "Liberar baia", run: () => releaseBay(row) } : { label: "Manutencao", run: () => openMaintenance(row) },
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
    const data = await window.DOZEMECApi.get("/workshop/bays?limit=100");
    const rows = data.items.map(mapRow);
    window.DOZEMECTable.table(table, [
      { key: "name", label: "Nome" },
      { key: "code", label: "Codigo" },
      { key: "bayTypeLabel", label: "Tipo" },
      { key: "operationalStatusLabel", label: "Situacao" }
    ], rows, [{ label: "", run: () => {} }]);
    renderActions(rows);
  }

  async function openMaintenance(row) {
    try {
      const bay = await window.DOZEMECApi.get(`/workshop/bays/${row.id}`);
      const equipment = bay.equipment || [];
      const data = await window.DOZEMECWorkshop.formDialog({
        title: "Abrir manutencao",
        confirmText: "Confirmar",
        fields: [
          { name: "blockOnly", label: "Somente bloquear a baia", type: "checkbox", value: equipment.length === 0 },
          { name: "equipmentId", label: "Equipamento", type: "select", value: equipment.length === 1 ? equipment[0].id : "", options: [{ value: "", label: "Sem equipamento" }, ...equipment.map((item) => ({ value: item.id, label: `${item.name} (${i18n.text(item.operationalStatus)})` }))] },
          { name: "maintenanceType", label: "Tipo de manutencao", type: "select", value: "preventive", options: ["preventive", "corrective", "inspection", "calibration", "other"].map((value) => ({ value, label: i18n.text(value) })) },
          { name: "scheduledDate", label: "Data agendada", type: "date", value: new Date().toISOString().slice(0, 10) },
          { name: "description", label: "Descricao" },
          { name: "serviceProvider", label: "Prestador" },
          { name: "technicianName", label: "Tecnico" },
          { name: "reason", label: "Motivo", required: true }
        ]
      });
      if (!data) return;
      if (equipment.length === 0) data.blockOnly = true;
      if (!data.blockOnly && !data.equipmentId) throw new Error("Selecione um equipamento ou use Somente bloquear a baia.");
      await window.DOZEMECApi.post(`/workshop/bays/${row.id}/maintenance`, data);
      window.DOZEMECWorkshop.notifySuccess(data.blockOnly ? "Baia bloqueada para manutencao." : "Manutencao agendada e baia bloqueada.");
      await load();
    } catch (error) {
      window.DOZEMECWorkshop.notifyError(error);
    }
  }

  async function releaseBay(row) {
    try {
      const data = await window.DOZEMECWorkshop.formDialog({
        title: "Liberar baia",
        confirmText: "Liberar",
        fields: [
          { name: "operationalStatus", label: "Nova situacao", type: "select", value: "available", options: [{ value: "available", label: "Disponivel" }, { value: "unavailable", label: "Indisponivel" }] },
          { name: "releaseEquipment", label: "Liberar equipamentos vinculados em manutencao", type: "checkbox" },
          { name: "reason", label: "Motivo", required: true }
        ]
      });
      if (!data) return;
      await window.DOZEMECWorkshop.patch(`/workshop/bays/${row.id}/release`, data);
      window.DOZEMECWorkshop.notifySuccess("Baia liberada.");
      await load();
    } catch (error) {
      window.DOZEMECWorkshop.notifyError(error);
    }
  }

  async function remove(row) {
    try {
      if (!(await window.DOZEMECWorkshop.confirm("Excluir esta baia?", "Excluir baia"))) return;
      await window.DOZEMECWorkshop.requestDelete(`/workshop/bays/${row.id}`);
      await load();
    } catch (error) {
      window.DOZEMECWorkshop.notifyError(error);
    }
  }

  async function history(row) {
    try {
      const data = await window.DOZEMECApi.get(`/workshop/bays/${row.id}/history`);
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
      if (data.id) await window.DOZEMECApi.put(`/workshop/bays/${data.id}`, data);
      else await window.DOZEMECApi.post("/workshop/bays", data);
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
