(function () {
  async function load(employeeId, tableEl) {
    const data = await window.DOZEMECApi.get(`/employees/${employeeId}/notes`);
    window.DOZEMECTable.table(
      tableEl,
      [{ key: "noteType", label: "Tipo" }, { key: "content", label: "Conteudo" }, { key: "isConfidential", label: "Confidencial" }],
      data.items,
      [
        { label: "Editar", run: (row) => window.DOZEMECTable.fillForm(document.getElementById("noteForm"), row) },
        { label: "Excluir", run: (row) => remove(employeeId, row.id, tableEl) }
      ]
    );
  }

  async function save(employeeId, form, tableEl) {
    const data = window.DOZEMECTable.formObject(form);
    data.isConfidential = data.isConfidential === "true";
    if (data.id) await window.DOZEMECApi.put(`/employees/${employeeId}/notes/${data.id}`, data);
    else await window.DOZEMECApi.post(`/employees/${employeeId}/notes`, data);
    form.reset();
    await load(employeeId, tableEl);
  }

  async function remove(employeeId, id, tableEl) {
    if (!await window.DOZEMEC_LAYOUT.confirm({ title: "Excluir nota", message: "Confirmar exclusao logica?" })) return;
    await window.DOZEMECApi.delete(`/employees/${employeeId}/notes/${id}`);
    await load(employeeId, tableEl);
  }

  window.DOZEMECEmployeeNotes = { load, save };
})();
