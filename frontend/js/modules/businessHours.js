(function () {
  const form = document.getElementById("hoursForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const days = window.DOZEMECSettings.collectHours();
      const updated = await window.DOZEMECApi.put("/company/business-hours", { days });
      window.DOZEMECSettings.renderHours(updated);
      window.DOZEMECSettings.setMessage("Horários salvos.", "success");
    } catch (error) {
      window.DOZEMECSettings.setMessage(error.message, "error");
    }
  });
})();
