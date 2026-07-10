(function () {
  function fillSelect(select, items, labelKey) {
    select.textContent = "";
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "Nenhum";
    select.appendChild(empty);
    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item[labelKey || "name"];
      select.appendChild(option);
    });
  }
  async function requestDelete(path) {
    const response = await fetch(`${window.DOZEMECApi.API_BASE_URL}${path}`, { method: "DELETE", headers: { Authorization: `Bearer ${window.DOZEMECSession.getToken()}` } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message);
    return payload.data;
  }
  async function patch(path, body) {
    return window.DOZEMECApi.patch(path, body || {});
  }
  function notifySuccess(message) {
    if (window.DOZEMECToast) window.DOZEMECToast.showSuccess(message);
    else window.DOZEMECTable.message(message, "success");
  }
  function notifyError(error) {
    const message = error && error.message ? error.message : String(error || "Erro inesperado");
    if (window.DOZEMECToast) window.DOZEMECToast.showError(message);
    else window.DOZEMECTable.message(message, "error");
  }
  async function confirm(message, title) {
    if (window.DOZEMECConfirm) return window.DOZEMECConfirm.confirmDialog({ title: title || "Confirmar", message, confirmText: "Confirmar" });
    return window.confirm(message);
  }
  function formDialog(options) {
    return new Promise((resolve) => {
      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";
      const panel = document.createElement("section");
      panel.className = "modal-panel";
      const title = document.createElement("h2");
      title.textContent = options.title || "Informar dados";
      const form = document.createElement("form");
      (options.fields || []).forEach((field) => {
        const label = document.createElement("label");
        label.textContent = field.label;
        let input;
        if (field.type === "select") {
          input = document.createElement("select");
          (field.options || []).forEach((item) => {
            const option = document.createElement("option");
            option.value = item.value;
            option.textContent = item.label;
            input.appendChild(option);
          });
          input.value = field.value || "";
        } else if (field.type === "checkbox") {
          input = document.createElement("input");
          input.type = "checkbox";
          input.checked = Boolean(field.value);
        } else {
          input = document.createElement("input");
          input.type = field.type || "text";
          input.value = field.value || "";
        }
        input.name = field.name;
        input.required = Boolean(field.required);
        label.appendChild(input);
        form.appendChild(label);
      });
      const actions = document.createElement("div");
      actions.className = "actions";
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "secondary";
      cancel.textContent = "Cancelar";
      const ok = document.createElement("button");
      ok.type = "submit";
      ok.textContent = options.confirmText || "Confirmar";
      function close(value) { backdrop.remove(); resolve(value); }
      cancel.addEventListener("click", () => close(null));
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = {};
        (options.fields || []).forEach((field) => {
          const input = form.elements[field.name];
          data[field.name] = field.type === "checkbox" ? input.checked : input.value;
        });
        close(data);
      });
      actions.appendChild(cancel);
      actions.appendChild(ok);
      form.appendChild(actions);
      panel.appendChild(title);
      panel.appendChild(form);
      backdrop.appendChild(panel);
      document.body.appendChild(backdrop);
      const first = form.querySelector("input,select");
      if (first) first.focus();
    });
  }
  window.DOZEMECWorkshop = { fillSelect, requestDelete, patch, notifySuccess, notifyError, confirm, formDialog };
})();
