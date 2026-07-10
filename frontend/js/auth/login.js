(function () {
  const form = document.getElementById("loginForm");
  const message = document.getElementById("loginMessage");
  const togglePassword = document.getElementById("togglePassword");
  const password = document.getElementById("password");

  if (window.DOZEMECSession.getToken()) {
    window.location.href = "/dashboard/";
  }

  togglePassword.addEventListener("click", () => {
    const visible = password.type === "text";
    password.type = visible ? "password" : "text";
    togglePassword.textContent = visible ? "Mostrar senha" : "Esconder senha";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.className = "message";
    message.textContent = "A autenticar...";

    try {
      const data = await window.DOZEMECApi.post("/auth/login", {
        email: form.email.value,
        password: form.password.value
      });
      window.DOZEMECSession.save(data.token, data.user);
      window.location.href = "/dashboard/";
    } catch (error) {
      message.className = "message error";
      message.textContent = error.message;
    }
  });
})();
