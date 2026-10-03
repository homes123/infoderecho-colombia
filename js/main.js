/* InfoDerecho Colombia – comportamiento compartido y por página.
   Cada bloque se activa solo si encuentra sus elementos en el DOM. */

(function () {
  "use strict";

  // Valores referenciales para las simulaciones (ajustar con cifras oficiales vigentes).
  var EXTREME_POVERTY_LINE = 230000; // COP por persona / mes (DANE, pobreza monetaria extrema)
  var SMMLV = 1423500; // salario mínimo mensual legal vigente (COP)

  function formatCOP(value) {
    return "$" + Math.round(value).toLocaleString("es-CO") + " COP";
  }

  function parseCOP(text) {
    var digits = String(text).replace(/\D/g, "");
    return digits ? parseInt(digits, 10) : 0;
  }

  // Formatea un input numérico con separador de miles mientras se escribe.
  function bindMoneyInput(input) {
    input.addEventListener("input", function () {
      var n = parseCOP(input.value);
      input.value = n ? n.toLocaleString("es-CO") : "";
    });
  }

  /* ---------- Menú móvil ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var nav = document.querySelector(".nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
  }

  /* ---------- Directorio: búsqueda + filtros ---------- */
  var searchInput = document.getElementById("program-search");
  var programs = Array.prototype.slice.call(document.querySelectorAll(".program"));
  if (searchInput && programs.length) {
    var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));
    var empty = document.getElementById("programs-empty");
    var activeFilter = "all";

    var applyFilters = function () {
      var query = searchInput.value.trim().toLowerCase();
      var visible = 0;
      programs.forEach(function (card) {
        var tags = (card.dataset.tags || "").split(" ");
        var matchesChip = activeFilter === "all" || tags.indexOf(activeFilter) !== -1;
        var matchesText = !query || card.textContent.toLowerCase().indexOf(query) !== -1;
        card.hidden = !(matchesChip && matchesText);
        if (!card.hidden) visible++;
      });
      if (empty) empty.hidden = visible !== 0;
    };

    searchInput.addEventListener("input", applyFilters);
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("is-active"); });
        chip.classList.add("is-active");
        activeFilter = chip.dataset.filter;
        applyFilters();
      });
    });
  }

  /* ---------- Calculadora de línea de pobreza ---------- */
  var calcForm = document.getElementById("calc-form");
  if (calcForm) {
    var incomeInput = document.getElementById("calc-income");
    var membersSelect = document.getElementById("calc-members");
    var result = document.getElementById("calc-result");
    var amount = document.getElementById("calc-amount");
    var title = document.getElementById("calc-message-title");
    var body = document.getElementById("calc-message-body");

    bindMoneyInput(incomeInput);

    var calculate = function () {
      var income = parseCOP(incomeInput.value);
      var members = parseInt(membersSelect.value, 10) || 1;
      var perPerson = income / members;
      var below = perPerson < EXTREME_POVERTY_LINE;

      amount.textContent = formatCOP(perPerson);
      result.classList.toggle("result--warn", !below);
      if (below) {
        title.textContent = "Su hogar se encuentra por debajo del umbral oficial de pobreza extrema.";
        body.textContent =
          "El costo de vida mínimo de subsistencia alimentaria por persona se calcula oficialmente por debajo de la línea establecida. Le recomendamos consultar de manera prioritaria el directorio de programas de ayuda del Estado.";
      } else {
        title.textContent = "Su hogar se encuentra por encima del umbral de pobreza extrema.";
        body.textContent =
          "Aun así, puede cumplir requisitos de otros programas según su perfil. Revise el directorio de programas o complete el checklist de elegibilidad.";
      }
      result.hidden = false;
    };

    calcForm.addEventListener("submit", function (e) {
      e.preventDefault();
      calculate();
    });
    calculate();
  }

  /* ---------- Checklist de elegibilidad ---------- */
  var checkForm = document.getElementById("checklist-form");
  if (checkForm) {
    var incomeField = document.getElementById("check-income");
    var resultBox = document.getElementById("check-result");
    var resultList = document.getElementById("check-result-list");
    bindMoneyInput(incomeField);

    var rules = [
      { name: "Renta Ciudadana (Familias en Acción)", test: function (p) { return p.minors > 0 && p.income < SMMLV; } },
      { name: "Devolución del IVA", test: function (p) { return p.income < SMMLV; } },
      { name: "Colombia Mayor", test: function (p) { return p.age === "60+" && p.income < SMMLV; } },
      { name: "Jóvenes en Paz", test: function (p) { return p.age === "18-29"; } },
      { name: "Mi Casa Ya", test: function (p) { return p.income < 4 * SMMLV; } },
      { name: "Jóvenes Propietarios", test: function (p) { return p.age === "18-29" && p.income < 2 * SMMLV; } }
    ];

    checkForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var profile = {
        age: document.getElementById("check-age").value,
        income: parseCOP(incomeField.value),
        minors: parseInt(document.getElementById("check-minors").value, 10) || 0
      };
      var matches = rules.filter(function (r) { return r.test(profile); });

      resultList.textContent = "";
      matches.forEach(function (r) {
        var li = document.createElement("li");
        li.textContent = r.name;
        resultList.appendChild(li);
      });
      document.getElementById("check-result-title").textContent = matches.length
        ? "Programas que podrían aplicar a su hogar"
        : "No encontramos programas con los datos ingresados";
      resultBox.hidden = false;
      resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    var back = document.getElementById("check-back");
    if (back) {
      back.addEventListener("click", function () {
        window.location.href = "../index.html";
      });
    }
  }
})();
