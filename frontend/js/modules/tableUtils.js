(function () {
  function message(text, type) {
    const element = document.getElementById("pageMessage");
    if (!element) return;
    element.className = `message ${type || ""}`;
    element.textContent = text || "";
  }

  function formObject(form) {
    const data = {};
    new FormData(form).forEach((value, key) => {
      if (value === "") return;
      if (form.elements[key] && form.elements[key].type === "number") data[key] = Number(value);
      else data[key] = value;
    });
    return data;
  }

  function fillForm(form, data) {
    Object.entries(data || {}).forEach(([key, value]) => {
      if (form.elements[key] && value !== null && value !== undefined) form.elements[key].value = value;
    });
  }

  function table(container, headers, rows, actions) {
    container.textContent = "";
    const tableEl = document.createElement("table");
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    headers.forEach((header) => {
      const th = document.createElement("th");
      th.textContent = header.label;
      headRow.appendChild(th);
    });
    const actionTh = document.createElement("th");
    actionTh.textContent = "Ações";
    headRow.appendChild(actionTh);
    thead.appendChild(headRow);
    tableEl.appendChild(thead);

    const tbody = document.createElement("tbody");
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      headers.forEach((header) => {
        const td = document.createElement("td");
        td.textContent = row[header.key] === null || row[header.key] === undefined ? "" : String(row[header.key]);
        tr.appendChild(td);
      });
      const td = document.createElement("td");
      actions.forEach((action) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "secondary";
        button.textContent = action.label;
        button.addEventListener("click", () => action.run(row));
        td.appendChild(button);
      });
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
    tableEl.appendChild(tbody);
    container.appendChild(tableEl);
  }

  window.DOZEMECTable = { message, formObject, fillForm, table };
})();
