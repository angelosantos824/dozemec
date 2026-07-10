(function () {
  function ensureRegion() {
    let region = document.querySelector(".toast-region");
    if (!region) {
      region = document.createElement("div");
      region.className = "toast-region";
      region.setAttribute("aria-live", "polite");
      document.body.appendChild(region);
    }
    return region;
  }
  function show(message, type) {
    const toast = document.createElement("div");
    toast.className = `toast ${type || "info"}`;
    toast.tabIndex = 0;
    const text = document.createElement("span");
    text.textContent = message;
    const close = document.createElement("button");
    close.type = "button";
    close.className = "secondary";
    close.textContent = "Fechar";
    close.addEventListener("click", () => toast.remove());
    toast.appendChild(text);
    toast.appendChild(close);
    ensureRegion().appendChild(toast);
    setTimeout(() => toast.remove(), 4500);
  }
  window.DOZEMECToast = {
    showSuccess: (message) => show(message, "success"),
    showError: (message) => show(message, "error"),
    showWarning: (message) => show(message, "warning"),
    showInfo: (message) => show(message, "info")
  };
})();
