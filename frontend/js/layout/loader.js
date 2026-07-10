(function () {
  let loader = null;
  function showLoader(message) {
    if (loader) return;
    loader = document.createElement("div");
    loader.className = "loader-overlay";
    loader.setAttribute("role", "status");
    const box = document.createElement("div");
    box.className = "loader-box";
    box.textContent = message || "Carregando...";
    loader.appendChild(box);
    document.body.appendChild(loader);
  }
  function hideLoader() {
    if (loader) loader.remove();
    loader = null;
  }
  window.DOZEMECLoader = { showLoader, hideLoader };
})();
