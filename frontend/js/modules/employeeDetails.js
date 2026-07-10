(function () {
  const employeeId = new URLSearchParams(window.location.search).get("id");
  const permissions = () => window.DOZEMEC_LAYOUT ? window.DOZEMEC_LAYOUT.getPermissions() : [];

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
    if (!perms.includes("employees.view_documents")) document.querySelectorAll(".permission-documents, #documentsTab").forEach((el) => el.remove());
    if (!perms.includes("employee_notes.read")) document.querySelectorAll(".permission-notes, #notesTab").forEach((el) => el.remove());
    if (!perms.includes("employees.view_history")) document.querySelectorAll(".permission-history, #historyTab").forEach((el) => el.remove());
    document.getElementById("employeeTabs").addEventListener("click", (event) => {
      if (!event.target.dataset.tab) return;
      document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
      document.querySelectorAll(".section").forEach((section) => section.classList.remove("active"));
      event.target.classList.add("active");
      document.getElementById(event.target.dataset.tab).classList.add("active");
    });
  }

  async function fillUserSelect() {
    const select = document.querySelector("#userLinkForm select[name='userId']");
    const users = await window.DOZEMECApi.get("/users?limit=100");
    select.textContent = "";
    users.items.forEach((user) => {
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = `${user.name} - ${user.email}`;
      select.appendChild(option);
    });
  }

  async function load() {
    if (!employeeId) throw new Error("Funcionario nao informado");
    const [employee, summary, schedule] = await Promise.all([
      window.DOZEMECApi.get(`/employees/${employeeId}`),
      window.DOZEMECApi.get(`/employees/${employeeId}/summary`),
      window.DOZEMECApi.get(`/employees/${employeeId}/schedule`)
    ]);
    document.getElementById("employeeHeader").textContent = `${employee.employeeNumber} - ${employee.fullName}`;
    showObject(document.getElementById("summaryPanel"), { documentos: summary.documentsTotal, vencendo: summary.documentsExpiringSoon, contrato: employee.contractStatus, status: employee.status, usuario: employee.userEmail || "sem usuario" });
    showObject(document.getElementById("personalPanel"), employee);
    showObject(document.getElementById("professionalPanel"), { setor: employee.sectorName, cargo: employee.jobPositionName, admissao: employee.hireDate, tipo: employee.employmentType, contrato: employee.contractStatus, comissao: employee.commissionPercentage, salario: employee.baseSalary, valorHora: employee.hourlyRate });
    window.DOZEMECTable.table(document.getElementById("specialtiesPanel"), [{ key: "name", label: "Nome" }, { key: "isPrimary", label: "Principal" }], employee.specialties || [], []);
    window.DOZEMECEmployeeSchedules.render(document.getElementById("scheduleList"), schedule.days || []);
    if (permissions().includes("employees.view_documents")) await window.DOZEMECEmployeeDocuments.load(employeeId, document.getElementById("documentsTable"));
    if (permissions().includes("employee_notes.read")) await window.DOZEMECEmployeeNotes.load(employeeId, document.getElementById("notesTable")).catch(() => {});
    if (permissions().includes("employees.view_history")) {
      const history = await window.DOZEMECApi.get(`/employees/${employeeId}/history`);
      window.DOZEMECTable.table(document.getElementById("historyTable"), [{ key: "type", label: "Tipo" }, { key: "reason", label: "Motivo" }, { key: "createdAt", label: "Data" }], history.items, []);
    }
  }

  document.getElementById("reloadButton").addEventListener("click", () => load().catch((error) => window.DOZEMECTable.message(error.message, "error")));
  document.getElementById("scheduleForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await window.DOZEMECApi.put(`/employees/${employeeId}/schedule`, window.DOZEMECEmployeeSchedules.read(event.target));
      window.DOZEMECTable.message("Horarios salvos.", "success");
    } catch (error) {
      window.DOZEMECTable.message(error.message, "error");
    }
  });
  const documentForm = document.getElementById("documentForm");
  if (documentForm) documentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try { await window.DOZEMECEmployeeDocuments.save(employeeId, documentForm, document.getElementById("documentsTable")); } catch (error) { window.DOZEMECTable.message(error.message, "error"); }
  });
  const noteForm = document.getElementById("noteForm");
  if (noteForm) noteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try { await window.DOZEMECEmployeeNotes.save(employeeId, noteForm, document.getElementById("notesTable")); } catch (error) { window.DOZEMECTable.message(error.message, "error"); }
  });
  document.getElementById("userLinkForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await window.DOZEMECApi.put(`/employees/${employeeId}/user-link`, window.DOZEMECTable.formObject(event.target));
      await load();
    } catch (error) {
      window.DOZEMECTable.message(error.message, "error");
    }
  });
  document.getElementById("removeUserLinkButton").addEventListener("click", async () => {
    const reason = prompt("Motivo da remocao do vinculo");
    if (!reason) return;
    await window.DOZEMECApi.request(`/employees/${employeeId}/user-link`, { method: "DELETE", body: JSON.stringify({ reason }) });
    await load();
  });

  if (window.DOZEMECSession.requireAuth()) {
    applyTabs();
    fillUserSelect().then(load).catch((error) => window.DOZEMECTable.message(error.message, "error"));
  }
})();
