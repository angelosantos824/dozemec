(function () {
  function metric(label, value) {
    const card = document.createElement("div");
    card.className = "metric";
    const strong = document.createElement("strong");
    strong.textContent = value;
    const span = document.createElement("span");
    span.textContent = label;
    card.appendChild(strong);
    card.appendChild(document.createElement("br"));
    card.appendChild(span);
    return card;
  }
  async function load() {
    if (!window.DOZEMECSession.requireAuth()) return;
    window.DOZEMECSession.bindLogout();
    const data = await window.DOZEMECApi.get("/workshop/map");
    const summary = document.getElementById("mapSummary");
    summary.textContent = "";
    [["Total de baias", data.summary.totalBays], ["Livres", data.summary.availableBays], ["Reservadas", data.summary.reservedBays], ["Ocupadas", data.summary.occupiedBays], ["Em manutenção", data.summary.maintenanceBays], ["Indisponíveis", data.summary.unavailableBays], ["Equip. manutenção", data.summary.equipmentInMaintenance]].forEach(([label, value]) => summary.appendChild(metric(label, value)));
    const areas = document.getElementById("mapAreas");
    areas.textContent = "";
    data.areas.forEach((area) => {
      const section = document.createElement("section");
      const title = document.createElement("h2");
      title.textContent = area.name;
      const grid = document.createElement("div");
      grid.className = "bay-grid";
      area.bays.forEach((bay) => {
        const card = document.createElement("article");
        card.className = "bay-card";
        card.style.borderColor = bay.color || "#293244";
        const name = document.createElement("strong");
        name.textContent = bay.name;
        const status = document.createElement("span");
        status.className = "status-pill";
        status.textContent = bay.operationalStatus;
        const type = document.createElement("p");
        type.textContent = bay.bayType;
        card.appendChild(name);
        card.appendChild(document.createElement("br"));
        card.appendChild(status);
        card.appendChild(type);
        bay.equipment.forEach((item) => {
          const equipment = document.createElement("p");
          equipment.textContent = `${item.name} (${item.operationalStatus})`;
          card.appendChild(equipment);
        });
        grid.appendChild(card);
      });
      section.appendChild(title);
      section.appendChild(grid);
      areas.appendChild(section);
    });
  }
  load().catch((error) => window.DOZEMECTable.message(error.message, "error"));
})();
