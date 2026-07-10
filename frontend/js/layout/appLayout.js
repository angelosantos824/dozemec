(function () {
  const VERSION = "0.5.1";
  let state = { user: null, permissions: [], company: null, content: null, page: null };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  async function init() {
    if (!window.DOZEMECSession.requireAuth()) return;
    state.page = window.DOZEMEC_NAVIGATION.byId(document.body.dataset.page);
    document.title = `${state.page.title} | DOZEMEC`;
    state.user = window.DOZEMECSession.getUser() || {};
    state.permissions = state.user.permissions || [];
    state.company = {};
    window.DOZEMECTheme.applyTheme("dark");
    buildShell();
    document.dispatchEvent(new CustomEvent("dozemec:layout-ready"));

    try {
      state.user = await window.DOZEMECSession.refreshUser();
      state.permissions = state.user.permissions || [];
      state.company = await window.DOZEMECApi.get("/company").catch(() => ({}));
      window.DOZEMECTheme.applyTheme(state.company.theme);
      window.DOZEMECTheme.applyCompany(state.company);
      refreshChrome();
    } catch (error) {
      window.DOZEMECToast.showError(error.message);
    }
  }

  function buildShell() {
    const app = document.getElementById("app");
    app.textContent = "";
    const shell = el("div", "app-shell");
    if (localStorage.getItem("dozemec_sidebar_collapsed") === "true") shell.classList.add("sidebar-collapsed");
    const sidebar = buildSidebar(shell);
    const main = el("div", "app-main");
    main.appendChild(buildTopbar(shell));
    state.content = el("main", "app-content");
    state.content.id = "pageContent";
    if (window.DOZEMECPageTemplates) window.DOZEMECPageTemplates.render(state.page.id, state.content);
    main.appendChild(state.content);
    main.appendChild(buildFooter());
    shell.appendChild(sidebar);
    shell.appendChild(main);
    app.appendChild(shell);
  }

  function refreshChrome() {
    const shell = document.querySelector(".app-shell");
    if (!shell) return;
    const oldSidebar = shell.querySelector(".app-sidebar");
    const oldTopbar = shell.querySelector(".app-topbar");
    if (oldSidebar) oldSidebar.replaceWith(buildSidebar(shell));
    if (oldTopbar) oldTopbar.replaceWith(buildTopbar(shell));
  }

  function buildSidebar(shell) {
    const aside = el("aside", "app-sidebar");
    aside.appendChild(el("div", "sidebar-brand", ""));
    aside.firstChild.appendChild(el("span", "", state.company.tradeName || "DOZEMEC"));
    const toggle = el("button", "secondary sidebar-toggle", "Menu");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", () => {
      if (innerWidth <= 860) shell.classList.toggle("sidebar-open");
      else {
        shell.classList.toggle("sidebar-collapsed");
        localStorage.setItem("dozemec_sidebar_collapsed", shell.classList.contains("sidebar-collapsed"));
      }
      toggle.setAttribute("aria-expanded", shell.classList.contains("sidebar-open") ? "true" : "false");
    });
    aside.appendChild(toggle);
    const groups = new Map();
    window.DOZEMEC_NAVIGATION.pages.forEach((page) => {
      if (!window.DOZEMEC_NAVIGATION.canSee(page, state.permissions)) return;
      if (!groups.has(page.group)) groups.set(page.group, []);
      groups.get(page.group).push(page);
    });
    groups.forEach((pages, group) => {
      const section = el("nav", "sidebar-group");
      section.setAttribute("aria-label", group);
      section.appendChild(el("div", "sidebar-group-title", group));
      pages.forEach((page) => {
        const link = el("a", "sidebar-link", "");
        link.href = page.href;
        if (page.id === state.page.id) link.classList.add("active");
        link.appendChild(el("span", "", page.title));
        section.appendChild(link);
      });
      aside.appendChild(section);
    });
    return aside;
  }

  function buildTopbar(shell) {
    const header = el("header", "app-topbar");
    const left = el("div", "topbar-left");
    const mobile = el("button", "secondary", "☰");
    mobile.type = "button";
    mobile.setAttribute("aria-label", "Abrir menu");
    mobile.addEventListener("click", () => shell.classList.toggle("sidebar-open"));
    left.appendChild(mobile);
    const titleWrap = el("div");
    titleWrap.appendChild(el("div", "breadcrumb", breadcrumb()));
    titleWrap.appendChild(el("h1", "topbar-title", state.page.title));
    left.appendChild(titleWrap);
    const right = el("div", "topbar-right");
    const theme = el("button", "secondary", "Tema");
    theme.type = "button";
    theme.addEventListener("click", window.DOZEMECTheme.toggle);
    const user = el("div", "user-chip");
    user.appendChild(el("div", "avatar", initials(state.user.name || state.user.email)));
    user.appendChild(el("span", "", state.user.name || state.user.email));
    const logout = el("button", "secondary", "Sair");
    logout.type = "button";
    logout.addEventListener("click", window.DOZEMECSession.logout);
    right.appendChild(el("span", "muted", state.company.tradeName || ""));
    right.appendChild(theme);
    right.appendChild(user);
    right.appendChild(logout);
    header.appendChild(left);
    header.appendChild(right);
    return header;
  }

  function buildFooter() {
    return el("footer", "app-footer", `DOZEMEC · DOZEDEV · Versão ${VERSION}`);
  }

  function breadcrumb() {
    return state.page.group === "Início" ? "Início" : `${state.page.group} / ${state.page.title}`;
  }

  function initials(value) {
    return String(value || "D").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }

  function setPageTitle(title) {
    if (state.content) {
      const h = state.content.querySelector("[data-page-title]");
      if (h) h.textContent = title;
    }
  }

  window.DOZEMEC_LAYOUT = {
    init,
    getUser: () => state.user,
    getPermissions: () => state.permissions,
    getCompany: () => state.company,
    getContentElement: () => state.content,
    setPageTitle,
    showToast: (message, type) => {
      const map = { success: "showSuccess", error: "showError", warning: "showWarning", info: "showInfo" };
      return window.DOZEMECToast[map[type] || "showInfo"](message);
    },
    showLoader: (message) => window.DOZEMECLoader.showLoader(message),
    hideLoader: () => window.DOZEMECLoader.hideLoader(),
    confirm: (options) => window.DOZEMECConfirm.confirmDialog(options)
  };

  if (document.getElementById("app")) init();
  else document.addEventListener("DOMContentLoaded", init);
})();
