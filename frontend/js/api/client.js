(function () {
  const API_BASE_URL = "http://localhost:3006/api";

  async function request(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };
    const token = window.DOZEMECSession && window.DOZEMECSession.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });
    const payload = await response.json().catch(() => ({ success: false, message: "Resposta invalida da API" }));

    if (response.status === 401 && window.DOZEMECSession) {
      window.DOZEMECSession.clear();
      if (!window.location.pathname.endsWith("login.html")) window.location.href = "login.html";
    }

    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || "Erro ao comunicar com a API");
    }

    return payload.data !== undefined ? payload.data : payload;
  }

  window.DOZEMECApi = {
    API_BASE_URL,
    get: (path) => request(path),
    post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
    put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) })
  };
})();
