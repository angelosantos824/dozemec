(function () {
  async function load(employeeId, tableEl) {
    const data = await window.DOZEMECApi.get(`/employees/${employeeId}/documents`);
    window.DOZEMECTable.table(
      tableEl,
      [{ key: "documentType", label: "Tipo" }, { key: "documentNumber", label: "Numero" }, { key: "expiryDate", label: "Validade" }, { key: "status", label: "Status" }],
      data.items,
      [
        { label: "Editar", run: (row) => window.DOZEMECTable.fillForm(document.getElementById("documentForm"), row) },
        { label: "Excluir", run: (row) => remove(employeeId, row.id, tableEl) }
      ]
    );
  }

  async function save(employeeId, form, tableEl) {
    const data = window.DOZEMECTable.formObject(form);
    if (data.id) await window.DOZEMECApi.put(`/employees/${employeeId}/documents/${data.id}`, data);
    else await window.DOZEMECApi.post(`/employees/${employeeId}/documents`, data);
    form.reset();
    await load(employeeId, tableEl);
  }

  async function remove(employeeId, id, tableEl) {
    if (!await window.DOZEMEC_LAYOUT.confirm({ title: "Excluir documento", message: "Confirmar exclusao logica?" })) return;
    await window.DOZEMECApi.delete(`/employees/${employeeId}/documents/${id}`);
    await load(employeeId, tableEl);
  }

  window.DOZEMECEmployeeDocuments = { load, save };
})();
