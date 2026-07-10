(function () {
  async function load(customerId, resource, tableEl, headers, formId) {
    const data = await window.DOZEMECApi.get(`/customers/${customerId}/${resource}`);
    const actions = [];
    if (!["consents", "relationships"].includes(resource) && formId) actions.push({ label: "Editar", run: (row) => window.DOZEMECTable.fillForm(document.getElementById(formId), row) });
    if (!["consents"].includes(resource)) actions.push({ label: "Excluir", run: (row) => remove(customerId, resource, row.id, tableEl, headers, formId) });
    window.DOZEMECTable.table(tableEl, headers, data.items || data, actions);
  }

  async function save(customerId, resource, form, tableEl, headers) {
    const data = window.DOZEMECTable.formObject(form);
    ["isPrimary", "isBilling", "isServiceLocation", "receivesNotifications", "isConfidential", "granted", "allowServiceReminders", "allowPromotions", "allowSatisfactionSurveys"].forEach((key) => {
      if (data[key] !== undefined) data[key] = data[key] === true || data[key] === "true";
    });
    if (resource === "consents") {
      const type = data.consentType;
      delete data.consentType;
      await window.DOZEMECApi.put(`/customers/${customerId}/consents/${type}`, data);
    } else if (resource === "relationships") await window.DOZEMECApi.post(`/customers/${customerId}/${resource}`, data);
    else if (data.id) await window.DOZEMECApi.put(`/customers/${customerId}/${resource}/${data.id}`, data);
    else await window.DOZEMECApi.post(`/customers/${customerId}/${resource}`, data);
    form.reset();
    await load(customerId, resource, tableEl, headers, form.id);
  }

  async function remove(customerId, resource, id, tableEl, headers, formId) {
    if (!id || !await window.DOZEMEC_LAYOUT.confirm({ title: "Excluir registro", message: "Confirmar exclusao logica?" })) return;
    await window.DOZEMECApi.delete(`/customers/${customerId}/${resource}/${id}`);
    await load(customerId, resource, tableEl, headers, formId);
  }

  window.DOZEMECCustomerResource = { load, save };
})();
