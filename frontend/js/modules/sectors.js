(function () {
  const form = document.getElementById("sectorForm");
  const tableEl = document.getElementById("sectorsTable");

  async function load() {
    const data = await window.DOZEMECApi.get("/sectors?limit=100");
    window.DOZEMECTable.table(tableEl, [{ key: "name", label: "Nome" }, { key: "code", label: "Código" }, { key: "status", label: "Status" }], data.items, [
      { label: "Editar", run: (row) => window.DOZEMECTable.fillForm(form, row) },
      { label: "Excluir", run: async (row) => { await requestDelete(row.id); await load(); } }
    ]);
  }

  async function requestDelete(id) {
    const response = await fetch(`${window.DOZEMECApi.API_BASE_URL}/sectors/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${window.DOZEMECSession.getToken()}` } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = window.DOZEMECTable.formObject(form);
    try {
      if (data.id) await window.DOZEMECApi.put(`/sectors/${data.id}`, data);
      else await window.DOZEMECApi.post("/sectors", data);
      form.reset();
      await load();
      window.DOZEMECTable.message("Setor salvo.", "success");
    } catch (error) {
      window.DOZEMECTable.message(error.message, "error");
    }
  });
  document.getElementById("clearButton").addEventListener("click", () => form.reset());
  if (window.DOZEMECSession.requireAuth()) { window.DOZEMECSession.bindLogout(); load(); }
})();
