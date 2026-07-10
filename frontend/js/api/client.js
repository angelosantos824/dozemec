(function () {
  const API_BASE_URL = "/api";

  async function request(path, options = {}) {
    if (options.loader !== false && window.DOZEMEC_LAYOUT) window.DOZEMEC_LAYOUT.showLoader("Carregando...");
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };
    const token = window.DOZEMECSession && window.DOZEMECSession.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
      const payload = await response.json().catch(() => ({ success: false, message: "Resposta invalida da API" }));

      if (response.status === 401 && window.DOZEMECSession) {
        window.DOZEMECSession.clear();
        if (!window.location.pathname.endsWith("/auth/login.html")) window.location.href = "/auth/login.html";
      }

      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || "Erro ao comunicar com a API");
      }

      return payload.data !== undefined ? payload.data : payload;
    } finally {
      if (options.loader !== false && window.DOZEMEC_LAYOUT) window.DOZEMEC_LAYOUT.hideLoader();
    }
  }

  window.DOZEMECApi = {
    API_BASE_URL,
    get: (path) => request(path),
    post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
    put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
    patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body || {}) }),
    delete: (path) => request(path, { method: "DELETE" }),
    request
  };
})();
