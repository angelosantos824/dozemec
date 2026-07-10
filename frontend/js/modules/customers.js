(function () {
  const form = document.getElementById("customerForm");
  const tableEl = document.getElementById("customersTable");

  function permissions() {
    return window.DOZEMEC_LAYOUT ? window.DOZEMEC_LAYOUT.getPermissions() : [];
  }

  function syncTypeFields() {
    const type = form.customerType.value;
    document.querySelectorAll(".individual-field").forEach((el) => { el.style.display = type === "individual" ? "" : "none"; });
    document.querySelectorAll(".company-field").forEach((el) => { el.style.display = type === "company" ? "" : "none"; });
  }

  function payload() {
    const data = window.DOZEMECTable.formObject(form);
    if (data.customerType === "company") {
      delete data.fullName;
      delete data.preferredName;
      delete data.identityDocument;
      delete data.birthDate;
      delete data.gender;
    } else {
      delete data.legalName;
      delete data.tradeName;
      delete data.stateRegistration;
      delete data.municipalRegistration;
    }
    return data;
  }

  async function load() {
    const params = new URLSearchParams();
    [["search", "search"], ["customerType", "typeFilter"], ["status", "statusFilter"], ["city", "cityFilter"], ["isBlocked", "blockedFilter"], ["hasWhatsapp", "whatsappFilter"], ["hasEmail", "emailFilter"]].forEach(([key, id]) => {
      const value = document.getElementById(id).value;
      if (value) params.set(key, value);
    });
    const data = await window.DOZEMECApi.get(`/customers?${params.toString()}`);
    window.DOZEMECTable.table(
      tableEl,
      [{ key: "customerCode", label: "Codigo" }, { key: "displayName", label: "Nome" }, { key: "customerType", label: "Tipo" }, { key: "phone", label: "Telefone" }, { key: "whatsapp", label: "WhatsApp" }, { key: "email", label: "E-mail" }, { key: "status", label: "Status" }, { key: "isBlocked", label: "Bloqueado" }],
      data.items,
      [
        { label: "Editar", run: (row) => edit(row.id) },
        { label: "Detalhes", run: (row) => { window.location.href = `/customers/details.html?id=${row.id}`; } },
        { label: "Ativar", run: (row) => action(row.id, "activate") },
        { label: "Desativar", run: (row) => reasonAction(row.id, "deactivate", "Motivo da desativacao") },
        { label: "Bloquear", run: (row) => reasonAction(row.id, "block", "Motivo do bloqueio") },
        { label: "Desbloquear", run: (row) => reasonAction(row.id, "unblock", "Motivo do desbloqueio") },
        { label: "Excluir", run: (row) => remove(row.id) }
      ]
    );
  }

  async function edit(id) {
    const customer = await window.DOZEMECApi.get(`/customers/${id}`);
    window.DOZEMECTable.fillForm(form, customer);
    syncTypeFields();
  }

  async function action(id, name, body) {
    await window.DOZEMECApi.patch(`/customers/${id}/${name}`, body || {});
    await load();
  }

  async function reasonAction(id, name, label) {
    const reason = prompt(label);
    if (!reason) return;
    await action(id, name, { reason });
  }

  async function remove(id) {
    if (!await window.DOZEMEC_LAYOUT.confirm({ title: "Excluir cliente", message: "Confirmar exclusao logica?" })) return;
    await window.DOZEMECApi.delete(`/customers/${id}`);
    await load();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const data = payload();
      if (data.id) await window.DOZEMECApi.put(`/customers/${data.id}`, data);
      else await window.DOZEMECApi.post("/customers", data);
      form.reset();
      syncTypeFields();
      await load();
      window.DOZEMECTable.message("Cliente salvo.", "success");
    } catch (error) {
      window.DOZEMECTable.message(error.message, "error");
    }
  });

  form.customerType.addEventListener("change", syncTypeFields);
  document.getElementById("clearButton").addEventListener("click", () => { form.reset(); syncTypeFields(); });
  document.getElementById("loadButton").addEventListener("click", load);
  if (!permissions().includes("customers.view_financial_data")) document.querySelectorAll(".financial-field").forEach((el) => el.remove());
  if (window.DOZEMECSession.requireAuth()) {
    syncTypeFields();
    load().catch((error) => window.DOZEMECTable.message(error.message, "error"));
  }
})();
