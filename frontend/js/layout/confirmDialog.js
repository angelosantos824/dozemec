(function () {
  function confirmDialog(options) {
    return new Promise((resolve) => {
      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";
      const panel = document.createElement("section");
      panel.className = "modal-panel";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      const title = document.createElement("h2");
      title.textContent = options.title || "Confirmar";
      const message = document.createElement("p");
      message.textContent = options.message || "Deseja continuar?";
      const actions = document.createElement("div");
      actions.className = "actions";
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "secondary";
      cancel.textContent = options.cancelText || "Cancelar";
      const ok = document.createElement("button");
      ok.type = "button";
      ok.textContent = options.confirmText || "Confirmar";
      function close(value) { backdrop.remove(); resolve(value); }
      cancel.addEventListener("click", () => close(false));
      ok.addEventListener("click", () => close(true));
      backdrop.addEventListener("keydown", (event) => { if (event.key === "Escape") close(false); });
      actions.appendChild(cancel);
      actions.appendChild(ok);
      panel.appendChild(title);
      panel.appendChild(message);
      panel.appendChild(actions);
      backdrop.appendChild(panel);
      document.body.appendChild(backdrop);
      cancel.focus();
    });
  }
  window.DOZEMECConfirm = { confirmDialog };
})();
