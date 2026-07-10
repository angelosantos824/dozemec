(function () {
  function validColor(value) {
    return /^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/.test(value || "");
  }
  function applyCompany(company) {
    const root = document.documentElement;
    if (validColor(company.primaryColor)) root.style.setProperty("--color-primary", company.primaryColor);
    if (validColor(company.secondaryColor)) root.style.setProperty("--color-secondary", company.secondaryColor);
    if (validColor(company.accentColor)) root.style.setProperty("--color-accent", company.accentColor);
  }
  function applyTheme(theme) {
    const local = localStorage.getItem("dozemec_theme");
    const selected = local || theme || "dark";
    const resolved = selected === "system" ? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : selected;
    document.documentElement.dataset.theme = resolved;
  }
  function toggle() {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    localStorage.setItem("dozemec_theme", next);
    applyTheme(next);
  }
  window.DOZEMECTheme = { applyCompany, applyTheme, toggle };
})();
