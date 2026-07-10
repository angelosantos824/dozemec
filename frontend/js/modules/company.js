(function () {
  async function loadHome() {
    if (!window.DOZEMECSession.requireAuth()) return;
    window.DOZEMECSession.bindLogout();

    const message = document.getElementById("homeMessage");
    const companyName = document.getElementById("companyName");
    const userName = document.getElementById("userName");
    const user = window.DOZEMECSession.getUser();
    if (user) userName.textContent = `Utilizador: ${user.name}`;

    try {
      const company = await window.DOZEMECApi.get("/company");
      companyName.textContent = company.tradeName || company.legalName || "DOZEMEC";
      message.textContent = "Sessão ativa.";
    } catch (error) {
      message.className = "message error";
      message.textContent = error.message;
    }
  }

  loadHome();
})();
