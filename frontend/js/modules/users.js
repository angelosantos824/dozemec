(function () {
  const form = document.getElementById("userForm");
  const tableEl = document.getElementById("usersTable");
  const historyPanel = document.getElementById("historyPanel");

  async function loadOptions() {
    const [sectors, roles] = await Promise.all([window.DOZEMECApi.get("/sectors?limit=100"), window.DOZEMECApi.get("/roles?limit=100")]);
    fillSelect(form.sectorId, sectors.items, "id", "name");
    fillSelect(form.roleId, roles.items, "id", "name");
  }

  function fillSelect(select, items, valueKey, labelKey) {
    select.textContent = "";
    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item[valueKey];
      option.textContent = item[labelKey];
      select.appendChild(option);
    });
  }

  async function load() {
    const search = document.getElementById("search").value;
    const status = document.getElementById("status").value;
    const data = await window.DOZEMECApi.get(`/users?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`);
    window.DOZEMECTable.table(
      tableEl,
      [{ key: "name", label: "Nome" }, { key: "email", label: "E-mail" }, { key: "sector", label: "Setor" }, { key: "role", label: "Perfil" }, { key: "status", label: "Status" }],
      data.items,
      [
        { label: "Editar", run: (row) => window.DOZEMECTable.fillForm(form, row) },
        { label: "Ativar", run: (row) => action(`/users/${row.id}/activate`, "PATCH") },
        { label: "Desativar", run: (row) => action(`/users/${row.id}/deactivate`, "PATCH") },
        { label: "Bloquear", run: (row) => action(`/users/${row.id}/block`, "PATCH") },
        { label: "Histórico", run: showHistory },
        { label: "Excluir", run: (row) => remove(row.id) }
      ]
    );
  }

  async function action(path, method) {
    await request(path, method, {});
    await load();
  }

  async function request(path, method, body) {
    const options = { method, body: JSON.stringify(body), headers: { "Content-Type": "application/json", Authorization: `Bearer ${window.DOZEMECSession.getToken()}` } };
    const response = await fetch(`${window.DOZEMECApi.API_BASE_URL}${path}`, options);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message);
    return payload.data;
  }

  async function remove(id) {
    await request(`/users/${id}`, "DELETE", {});
    await load();
  }

  async function showHistory(row) {
    const data = await window.DOZEMECApi.get(`/users/${row.id}/login-history`);
    historyPanel.textContent = "";
    const title = document.createElement("h2");
    title.textContent = `Histórico de ${row.name}`;
    historyPanel.appendChild(title);
    window.DOZEMECTable.table(historyPanel, [{ key: "createdAt", label: "Data" }, { key: "success", label: "Sucesso" }, { key: "failureReason", label: "Motivo" }, { key: "ipAddress", label: "IP" }], data.items, []);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const data = window.DOZEMECTable.formObject(form);
      if (data.id) {
        delete data.password;
        await window.DOZEMECApi.put(`/users/${data.id}`, data);
      } else {
        await window.DOZEMECApi.post("/users", data);
      }
      form.reset();
      await load();
      window.DOZEMECTable.message("Usuario salvo.", "success");
    } catch (error) {
      window.DOZEMECTable.message(error.message, "error");
    }
  });

  document.getElementById("clearButton").addEventListener("click", () => form.reset());
  document.getElementById("loadButton").addEventListener("click", load);

  if (window.DOZEMECSession.requireAuth()) {
    window.DOZEMECSession.bindLogout();
    loadOptions().then(load).catch((error) => window.DOZEMECTable.message(error.message, "error"));
  }
})();
