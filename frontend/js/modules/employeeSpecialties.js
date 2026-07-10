(function () {
  const form = document.getElementById("specialtyForm");
  const tableEl = document.getElementById("specialtiesTable");

  async function load() {
    const data = await window.DOZEMECApi.get("/employee-specialties?limit=100&sortBy=displayOrder&sortOrder=asc");
    window.DOZEMECTable.table(
      tableEl,
      [{ key: "name", label: "Nome" }, { key: "code", label: "Codigo" }, { key: "status", label: "Status" }],
      data.items,
      [
        { label: "Editar", run: (row) => window.DOZEMECTable.fillForm(form, row) },
        { label: "Excluir", run: (row) => remove(row.id) }
      ]
    );
  }

  async function remove(id) {
    if (!await window.DOZEMEC_LAYOUT.confirm({ title: "Excluir especialidade", message: "Confirmar exclusao logica?" })) return;
    await window.DOZEMECApi.delete(`/employee-specialties/${id}`);
    await load();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const data = window.DOZEMECTable.formObject(form);
      if (data.id) await window.DOZEMECApi.put(`/employee-specialties/${data.id}`, data);
      else await window.DOZEMECApi.post("/employee-specialties", data);
      form.reset();
      await load();
      window.DOZEMECTable.message("Especialidade salva.", "success");
    } catch (error) {
      window.DOZEMECTable.message(error.message, "error");
    }
  });

  document.getElementById("clearButton").addEventListener("click", () => form.reset());
  if (window.DOZEMECSession.requireAuth()) load().catch((error) => window.DOZEMECTable.message(error.message, "error"));
})();
