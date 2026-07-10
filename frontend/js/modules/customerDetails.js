(function () {
  const customerId = new URLSearchParams(window.location.search).get("id");
  const resourceConfigs = [];

  function permissions() {
    return window.DOZEMEC_LAYOUT ? window.DOZEMEC_LAYOUT.getPermissions() : [];
  }

  function showObject(container, data) {
    container.textContent = "";
    const dl = document.createElement("dl");
    Object.entries(data || {}).forEach(([key, value]) => {
      if (value === null || value === undefined || typeof value === "object") return;
      const dt = document.createElement("dt");
      dt.textContent = key;
      const dd = document.createElement("dd");
      dd.textContent = String(value);
      dl.appendChild(dt);
      dl.appendChild(dd);
    });
    container.appendChild(dl);
  }

  function applyTabs() {
    const perms = permissions();
    if (!perms.includes("customers.view_documents")) document.querySelectorAll(".permission-documents, #documentsTab").forEach((el) => el.remove());
    if (!perms.includes("customer_notes.read")) document.querySelectorAll(".permission-notes, #notesTab").forEach((el) => el.remove());
    if (!perms.includes("customers.view_history")) document.querySelectorAll(".permission-history, #historyTab").forEach((el) => el.remove());
    document.getElementById("customerTabs").addEventListener("click", (event) => {
      if (!event.target.dataset.tab) return;
      document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
      document.querySelectorAll(".section").forEach((section) => section.classList.remove("active"));
      event.target.classList.add("active");
      document.getElementById(event.target.dataset.tab).classList.add("active");
    });
  }

  async function loadResource(config) {
    const tableEl = document.getElementById(config.table);
    if (!tableEl) return;
    await window.DOZEMECCustomerResource.load(customerId, config.resource, tableEl, config.headers, config.form);
  }

  async function loadPreferences() {
    const data = await window.DOZEMECApi.get(`/customers/${customerId}/preferences`);
    window.DOZEMECTable.fillForm(document.getElementById("preferencesForm"), data || {});
  }

  async function load() {
    if (!customerId) throw new Error("Cliente nao informado");
    const [customer, summary] = await Promise.all([
      window.DOZEMECApi.get(`/customers/${customerId}`),
      window.DOZEMECApi.get(`/customers/${customerId}/summary`)
    ]);
    document.getElementById("customerHeader").textContent = `${customer.customerCode} - ${customer.displayName}`;
    showObject(document.getElementById("summaryPanel"), { status: customer.status, bloqueado: customer.isBlocked, contatos: summary.contacts, enderecos: summary.addresses, documentos: summary.documents, consentimentos: summary.activeConsents, relacoes: summary.relationships, veiculos: summary.vehicles });
    showObject(document.getElementById("dataPanel"), customer);
    await Promise.all(resourceConfigs.map(loadResource));
    await loadPreferences();
    if (permissions().includes("customers.view_history")) {
      const history = await window.DOZEMECApi.get(`/customers/${customerId}/history`);
      window.DOZEMECTable.table(document.getElementById("historyTable"), [{ key: "type", label: "Tipo" }, { key: "reason", label: "Motivo" }, { key: "createdAt", label: "Data" }], history.items, []);
    }
  }

  function bindResource(config) {
    resourceConfigs.push(config);
    const form = document.getElementById(config.form);
    if (!form) return;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await window.DOZEMECCustomerResource.save(customerId, config.resource, form, document.getElementById(config.table), config.headers);
      } catch (error) {
        window.DOZEMECTable.message(error.message, "error");
      }
    });
  }

  document.getElementById("reloadButton").addEventListener("click", () => load().catch((error) => window.DOZEMECTable.message(error.message, "error")));
  document.getElementById("preferencesForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const data = window.DOZEMECTable.formObject(event.target);
      ["allowServiceReminders", "allowPromotions", "allowSatisfactionSurveys"].forEach((key) => {
        if (data[key] !== undefined) data[key] = data[key] === "true";
      });
      await window.DOZEMECApi.put(`/customers/${customerId}/preferences`, data);
      window.DOZEMECTable.message("Preferencias salvas.", "success");
    } catch (error) {
      window.DOZEMECTable.message(error.message, "error");
    }
  });

  if (window.DOZEMECSession.requireAuth()) {
    applyTabs();
    bindResource(window.DOZEMECCustomerContacts);
    bindResource(window.DOZEMECCustomerAddresses);
    if (permissions().includes("customers.view_documents")) bindResource(window.DOZEMECCustomerDocuments);
    bindResource(window.DOZEMECCustomerConsents);
    if (permissions().includes("customer_notes.read")) bindResource(window.DOZEMECCustomerNotes);
    bindResource(window.DOZEMECCustomerRelationships);
    load().catch((error) => window.DOZEMECTable.message(error.message, "error"));
  }
})();
