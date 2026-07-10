(function () {
  const form = document.getElementById("jobPositionForm");
  const tableEl = document.getElementById("jobPositionsTable");

  async function load() {
    const data = await window.DOZEMECApi.get("/job-positions?limit=100&sortBy=displayOrder&sortOrder=asc");
    window.DOZEMECTable.table(
      tableEl,
      [{ key: "name", label: "Nome" }, { key: "code", label: "Codigo" }, { key: "defaultCommissionPercentage", label: "Comissao" }, { key: "status", label: "Status" }],
      data.items,
      [
        { label: "Editar", run: (row) => window.DOZEMECTable.fillForm(form, row) },
        { label: "Excluir", run: (row) => remove(row.id) }
      ]
    );
  }

  async function remove(id) {
    if (!await window.DOZEMEC_LAYOUT.confirm({ title: "Excluir cargo", message: "Confirmar exclusao logica?" })) return;
    await window.DOZEMECApi.delete(`/job-positions/${id}`);
    await load();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const data = window.DOZEMECTable.formObject(form);
      if (data.id) await window.DOZEMECApi.put(`/job-positions/${data.id}`, data);
      else await window.DOZEMECApi.post("/job-positions", data);
      form.reset();
      await load();
      window.DOZEMECTable.message("Cargo salvo.", "success");
    } catch (error) {
      window.DOZEMECTable.message(error.message, "error");
    }
  });

  document.getElementById("clearButton").addEventListener("click", () => form.reset());
  if (window.DOZEMECSession.requireAuth()) load().catch((error) => window.DOZEMECTable.message(error.message, "error"));
})();
