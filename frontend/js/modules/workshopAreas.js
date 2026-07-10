(function () {
  const form = document.getElementById("areaForm");
  const table = document.getElementById("areasTable");
  async function load() {
    const data = await window.DOZEMECApi.get("/workshop/areas?limit=100");
    window.DOZEMECTable.table(table, [{ key: "name", label: "Nome" }, { key: "code", label: "Código" }, { key: "status", label: "Status" }], data.items, [
      { label: "Editar", run: (row) => window.DOZEMECTable.fillForm(form, row) },
      { label: "Excluir", run: async (row) => { await window.DOZEMECWorkshop.requestDelete(`/workshop/areas/${row.id}`); await load(); } }
    ]);
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = window.DOZEMECTable.formObject(form);
    if (data.id) await window.DOZEMECApi.put(`/workshop/areas/${data.id}`, data); else await window.DOZEMECApi.post("/workshop/areas", data);
    form.reset();
    await load();
  });
  document.getElementById("clearButton").addEventListener("click", () => form.reset());
  if (window.DOZEMECSession.requireAuth()) { window.DOZEMECSession.bindLogout(); load().catch((e) => window.DOZEMECTable.message(e.message, "error")); }
})();
