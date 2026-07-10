(function () {
  const form = document.getElementById("employeeForm");
  const tableEl = document.getElementById("employeesTable");

  function permissions() {
    return window.DOZEMEC_LAYOUT ? window.DOZEMEC_LAYOUT.getPermissions() : [];
  }

  function fillSelect(select, items, label, includeEmpty) {
    select.textContent = "";
    if (includeEmpty) {
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = includeEmpty;
      select.appendChild(empty);
    }
    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item[label] || item.name || item.email;
      select.appendChild(option);
    });
  }

  async function loadOptions() {
    const [sectors, jobs, specialties, users] = await Promise.all([
      window.DOZEMECApi.get("/sectors?limit=100"),
      window.DOZEMECApi.get("/job-positions?limit=100&sortBy=displayOrder&sortOrder=asc"),
      window.DOZEMECApi.get("/employee-specialties?limit=100&sortBy=displayOrder&sortOrder=asc"),
      window.DOZEMECApi.get("/users?limit=100")
    ]);
    fillSelect(form.sectorId, sectors.items, "name", "Sem setor");
    fillSelect(form.jobPositionId, jobs.items, "name", "Sem cargo");
    fillSelect(form.userId, users.items, "email", "Sem usuario");
    fillSelect(form.specialtyIds, specialties.items, "name");
    fillSelect(form.primarySpecialtyId, specialties.items, "name", "Sem principal");
    fillSelect(document.getElementById("sectorFilter"), sectors.items, "name", "Setor");
    fillSelect(document.getElementById("jobFilter"), jobs.items, "name", "Cargo");
    fillSelect(document.getElementById("specialtyFilter"), specialties.items, "name", "Especialidade");
    if (!permissions().includes("employees.view_financial_data")) document.querySelectorAll(".financial-field").forEach((el) => el.remove());
  }

  function formData() {
    const data = window.DOZEMECTable.formObject(form);
    data.specialtyIds = Array.from(form.specialtyIds.selectedOptions).map((option) => Number(option.value));
    if (!data.primarySpecialtyId) delete data.primarySpecialtyId;
    if (!data.userId) data.userId = null;
    return data;
  }

  async function load() {
    const params = new URLSearchParams();
    [["search", "search"], ["sectorId", "sectorFilter"], ["jobPositionId", "jobFilter"], ["contractStatus", "contractFilter"], ["status", "statusFilter"], ["specialtyId", "specialtyFilter"], ["hasUser", "hasUserFilter"]].forEach(([key, id]) => {
      const value = document.getElementById(id).value;
      if (value) params.set(key, value);
    });
    const data = await window.DOZEMECApi.get(`/employees?${params.toString()}`);
    window.DOZEMECTable.table(
      tableEl,
      [{ key: "employeeNumber", label: "Numero" }, { key: "fullName", label: "Nome" }, { key: "sectorName", label: "Setor" }, { key: "jobPositionName", label: "Cargo" }, { key: "contractStatus", label: "Contrato" }, { key: "status", label: "Status" }, { key: "hasUser", label: "Usuario" }],
      data.items,
      [
        { label: "Editar", run: (row) => edit(row.id) },
        { label: "Detalhes", run: (row) => { window.location.href = `/employees/details.html?id=${row.id}`; } },
        { label: "Ativar", run: (row) => action(row.id, "activate") },
        { label: "Desativar", run: (row) => deactivate(row.id) },
        { label: "Encerrar", run: (row) => terminate(row.id) },
        { label: "Excluir", run: (row) => remove(row.id) }
      ]
    );
  }

  async function edit(id) {
    const item = await window.DOZEMECApi.get(`/employees/${id}`);
    window.DOZEMECTable.fillForm(form, item);
    Array.from(form.specialtyIds.options).forEach((option) => {
      option.selected = (item.specialties || []).some((specialty) => Number(specialty.id) === Number(option.value));
    });
    const primary = (item.specialties || []).find((specialty) => specialty.isPrimary);
    if (primary) form.primarySpecialtyId.value = primary.id;
  }

  async function action(id, name, body) {
    await window.DOZEMECApi.patch(`/employees/${id}/${name}`, body || {});
    await load();
  }

  async function deactivate(id) {
    const reason = prompt("Motivo da desativacao");
    if (!reason) return;
    await action(id, "deactivate", { reason, userAction: "keep_active" });
  }

  async function terminate(id) {
    const terminationDate = prompt("Data de encerramento (AAAA-MM-DD)");
    const reason = terminationDate && prompt("Motivo do encerramento");
    if (!terminationDate || !reason) return;
    await action(id, "terminate", { terminationDate, reason, userAction: "keep_active" });
  }

  async function remove(id) {
    if (!await window.DOZEMEC_LAYOUT.confirm({ title: "Excluir funcionario", message: "Confirmar exclusao logica?" })) return;
    await window.DOZEMECApi.delete(`/employees/${id}`);
    await load();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const data = formData();
      if (data.id) await window.DOZEMECApi.put(`/employees/${data.id}`, data);
      else await window.DOZEMECApi.post("/employees", data);
      form.reset();
      await load();
      window.DOZEMECTable.message("Funcionario salvo.", "success");
    } catch (error) {
      window.DOZEMECTable.message(error.message, "error");
    }
  });

  document.getElementById("clearButton").addEventListener("click", () => form.reset());
  document.getElementById("loadButton").addEventListener("click", load);
  if (window.DOZEMECSession.requireAuth()) loadOptions().then(load).catch((error) => window.DOZEMECTable.message(error.message, "error"));
})();
