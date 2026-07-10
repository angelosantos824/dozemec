(function () {
  const tableEl = document.getElementById("auditTable");
  const details = document.getElementById("auditDetails");

  async function load() {
    const action = document.getElementById("action").value;
    const entity = document.getElementById("entity").value;
    const data = await window.DOZEMECApi.get(`/audit-logs?action=${encodeURIComponent(action)}&entity=${encodeURIComponent(entity)}`);
    window.DOZEMECTable.table(tableEl, [{ key: "created_at", label: "Data" }, { key: "action", label: "Ação" }, { key: "entity", label: "Entidade" }, { key: "user_id", label: "Usuário" }], data.items, [
      { label: "Detalhes", run: (row) => { details.textContent = JSON.stringify({ oldData: row.old_data, newData: row.new_data }, null, 2); } }
    ]);
  }

  document.getElementById("loadButton").addEventListener("click", load);
  if (window.DOZEMECSession.requireAuth()) { window.DOZEMECSession.bindLogout(); load(); }
})();
