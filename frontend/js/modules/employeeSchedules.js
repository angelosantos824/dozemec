(function () {
  function render(container, days) {
    container.textContent = "";
    for (let index = 0; index < 7; index += 1) {
      const day = days.find((item) => Number(item.dayOfWeek) === index) || { dayOfWeek: index, isWorkingDay: index > 0 && index < 6, startTime: "08:00", lunchStartTime: "12:00", lunchEndTime: "14:00", endTime: "18:00" };
      const row = document.createElement("div");
      row.className = "grid";
      ["dayOfWeek", "isWorkingDay", "startTime", "lunchStartTime", "lunchEndTime", "endTime"].forEach((name) => {
        const input = document.createElement("input");
        input.name = `${name}_${index}`;
        input.value = name === "isWorkingDay" ? String(Boolean(day.isWorkingDay)) : (day[name] || "");
        if (name.includes("Time")) input.type = "time";
        if (name === "dayOfWeek") input.type = "number";
        const label = document.createElement("label");
        label.textContent = name;
        label.appendChild(input);
        row.appendChild(label);
      });
      container.appendChild(row);
    }
  }

  function read(form) {
    const days = [];
    for (let index = 0; index < 7; index += 1) {
      days.push({
        dayOfWeek: Number(form[`dayOfWeek_${index}`].value),
        isWorkingDay: form[`isWorkingDay_${index}`].value !== "false",
        startTime: form[`startTime_${index}`].value || null,
        lunchStartTime: form[`lunchStartTime_${index}`].value || null,
        lunchEndTime: form[`lunchEndTime_${index}`].value || null,
        endTime: form[`endTime_${index}`].value || null
      });
    }
    return { days };
  }

  window.DOZEMECEmployeeSchedules = { render, read };
})();
