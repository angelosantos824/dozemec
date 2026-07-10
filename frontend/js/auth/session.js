(function () {
  const tokenKey = "dozemec_token";
  const userKey = "dozemec_user";

  function save(token, user) {
    localStorage.setItem(tokenKey, token);
    localStorage.setItem(userKey, JSON.stringify(user));
  }

  function getToken() {
    return localStorage.getItem(tokenKey);
  }

  function getUser() {
    const raw = localStorage.getItem(userKey);
    return raw ? JSON.parse(raw) : null;
  }

  async function refreshUser() {
    if (!getToken() || !window.DOZEMECApi) return getUser();
    const me = await window.DOZEMECApi.get("/auth/me");
    const current = getUser() || {};
    const updated = { ...current, ...me };
    localStorage.setItem(userKey, JSON.stringify(updated));
    return updated;
  }

  function hasPermission(code) {
    const user = getUser();
    return Boolean(user && Array.isArray(user.permissions) && user.permissions.includes(code));
  }

  function clear() {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
  }

  function requireAuth() {
    if (!getToken()) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  }

  function bindLogout() {
    const button = document.getElementById("logoutButton");
    if (!button) return;
    button.addEventListener("click", () => {
      clear();
      window.location.href = "login.html";
    });
  }

  window.DOZEMECSession = {
    save,
    getToken,
    getUser,
    refreshUser,
    hasPermission,
    clear,
    requireAuth,
    bindLogout
  };
})();
