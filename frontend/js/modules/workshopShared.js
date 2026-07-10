(function () {
  function fillSelect(select, items, labelKey) {
    select.textContent = "";
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "Nenhum";
    select.appendChild(empty);
    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item[labelKey || "name"];
      select.appendChild(option);
    });
  }
  async function requestDelete(path) {
    const response = await fetch(`${window.DOZEMECApi.API_BASE_URL}${path}`, { method: "DELETE", headers: { Authorization: `Bearer ${window.DOZEMECSession.getToken()}` } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message);
    return payload.data;
  }
  async function patch(path, body) {
    const response = await fetch(`${window.DOZEMECApi.API_BASE_URL}${path}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${window.DOZEMECSession.getToken()}` }, body: JSON.stringify(body || {}) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message);
    return payload.data;
  }
  window.DOZEMECWorkshop = { fillSelect, requestDelete, patch };
})();
