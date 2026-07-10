(function () {
  const message = document.getElementById("settingsMessage");
  const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  function setMessage(text, type) {
    message.className = `message ${type || ""}`;
    message.textContent = text;
  }

  function formToObject(form) {
    const data = {};
    const formData = new FormData(form);
    formData.forEach((value, key) => {
      if (value === "") return;
      if (value === "true" || value === "false") data[key] = value === "true";
      else if (form.elements[key] && form.elements[key].type === "number") data[key] = Number(value);
      else data[key] = value;
    });
    return data;
  }

  function fillForm(form, data) {
    Object.entries(data || {}).forEach(([key, value]) => {
      if (!form.elements[key] || value === null || value === undefined) return;
      form.elements[key].value = String(value);
    });
  }

  function setupTabs() {
    document.querySelectorAll(".tab").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
        document.querySelectorAll(".section").forEach((section) => section.classList.remove("active"));
        button.classList.add("active");
        document.getElementById(button.dataset.tab).classList.add("active");
      });
    });
  }

  function renderHours(days) {
    const list = document.getElementById("hoursList");
    list.textContent = "";
    days.forEach((day) => {
      const row = document.createElement("div");
      row.className = "day-row";
      row.dataset.day = day.dayOfWeek;

      const title = document.createElement("strong");
      title.textContent = dayNames[day.dayOfWeek];
      row.appendChild(title);

      const open = document.createElement("select");
      open.name = "isOpen";
      [["true", "Aberto"], ["false", "Fechado"]].forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        open.appendChild(option);
      });
      open.value = String(day.isOpen);
      row.appendChild(wrap("Estado", open));

      ["openingTime", "lunchStartTime", "lunchEndTime", "closingTime"].forEach((field) => {
        const input = document.createElement("input");
        input.type = "time";
        input.name = field;
        input.value = day[field] || "";
        row.appendChild(wrap(field, input));
      });

      list.appendChild(row);
    });
  }

  function wrap(labelText, element) {
    const label = document.createElement("label");
    const span = document.createElement("span");
    span.textContent = labelText;
    label.appendChild(span);
    label.appendChild(element);
    return label;
  }

  function collectHours() {
    return Array.from(document.querySelectorAll(".day-row")).map((row) => {
      const get = (name) => row.querySelector(`[name="${name}"]`).value;
      return {
        dayOfWeek: Number(row.dataset.day),
        isOpen: get("isOpen") === "true",
        openingTime: get("openingTime") || null,
        lunchStartTime: get("lunchStartTime") || null,
        lunchEndTime: get("lunchEndTime") || null,
        closingTime: get("closingTime") || null
      };
    });
  }

  function renderIntegrations(items) {
    const list = document.getElementById("integrationsList");
    list.textContent = "";
    items.forEach((item) => {
      const row = document.createElement("form");
      row.className = "integration-row";
      row.dataset.type = item.integrationType;

      const type = document.createElement("strong");
      type.textContent = item.integrationType;
      row.appendChild(type);

      const provider = document.createElement("input");
      provider.name = "provider";
      provider.value = item.provider || "default";
      row.appendChild(wrap("Provider", provider));

      const status = document.createElement("select");
      status.name = "status";
      ["inactive", "active", "error"].forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        status.appendChild(option);
      });
      status.value = item.status;
      row.appendChild(wrap("Status", status));

      const save = document.createElement("button");
      save.type = "submit";
      save.textContent = "Salvar";
      row.appendChild(save);

      row.addEventListener("submit", async (event) => {
        event.preventDefault();
        await window.DOZEMECApi.put(`/company/integrations/${row.dataset.type}`, formToObject(row));
        setMessage("Integração atualizada.", "success");
      });

      list.appendChild(row);
    });
  }

  async function load() {
    if (!window.DOZEMECSession.requireAuth()) return;
    window.DOZEMECSession.bindLogout();
    setupTabs();
    setMessage("Carregando configurações...");

    const [company, settings, hours, integrations] = await Promise.all([
      window.DOZEMECApi.get("/company"),
      window.DOZEMECApi.get("/company/settings"),
      window.DOZEMECApi.get("/company/business-hours"),
      window.DOZEMECApi.get("/company/integrations")
    ]);

    document.getElementById("settingsCompanyName").textContent = company.tradeName || company.legalName;
    fillForm(document.getElementById("companyForm"), company);
    fillForm(document.getElementById("brandingForm"), company);
    fillForm(document.getElementById("workshopForm"), settings);
    renderHours(hours);
    renderIntegrations(integrations);
    setMessage("");
  }

  document.getElementById("companyForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = await window.DOZEMECApi.put("/company", formToObject(event.currentTarget));
    fillForm(event.currentTarget, data);
    setMessage("Dados da empresa salvos.", "success");
  });

  document.getElementById("brandingForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await window.DOZEMECApi.put("/company/branding", formToObject(event.currentTarget));
    setMessage("Identidade visual salva.", "success");
  });

  document.getElementById("workshopForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await window.DOZEMECApi.put("/company/settings", formToObject(event.currentTarget));
    setMessage("Configurações da oficina salvas.", "success");
  });

  window.DOZEMECSettings = {
    renderHours,
    collectHours,
    setMessage
  };

  load().catch((error) => setMessage(error.message, "error"));
})();
