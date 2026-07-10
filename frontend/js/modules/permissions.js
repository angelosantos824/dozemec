(function () {
  async function loadPermissions(selectedIds) {
    const container = document.getElementById("permissionsList");
    if (!container) return;
    const groups = await window.DOZEMECApi.get("/permissions");
    container.textContent = "";
    groups.forEach((group) => {
      group.permissions.forEach((permission) => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = permission.id;
        input.checked = selectedIds && selectedIds.includes(permission.id);
        const span = document.createElement("span");
        span.textContent = `${group.module}: ${permission.code}`;
        label.appendChild(input);
        label.appendChild(span);
        container.appendChild(label);
      });
    });
  }

  function selectedPermissions() {
    return Array.from(document.querySelectorAll("#permissionsList input:checked")).map((input) => Number(input.value));
  }

  window.DOZEMECPermissions = { loadPermissions, selectedPermissions };
})();
