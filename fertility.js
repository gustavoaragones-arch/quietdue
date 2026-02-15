/**
 * QuietDue Fertility Window Estimator — Phase 1.5
 * Runs entirely in the browser. No data is saved, stored, or sent anywhere.
 * PRIVACY: No fetch, localStorage, sessionStorage, cookies, analytics.
 * Pure JS only. No API. No Worker. No storage.
 * // Future: allow PDF download generation (client-side only)
 */
import {
  addDays,
  calculateFertilityWindowExtended,
} from "./assets/js/timing-engine.js";

const form = document.getElementById("fertility-form");
const lmpInput = document.getElementById("fertility-lmp");
const cycleInput = document.getElementById("fertility-cycle");
const variabilityInput = document.getElementById("fertility-variability");
const resultsSection = document.getElementById("fertility-results");
const ovulationResult = document.getElementById("fertility-ovulation-result");
const windowResult = document.getElementById("fertility-window-result");
const higherResult = document.getElementById("fertility-higher-result");
const lowerResult = document.getElementById("fertility-lower-result");
const basedOnResult = document.getElementById("fertility-based-on");
const calendarBlock = document.getElementById("fertility-calendar-block");

const lmpError = document.getElementById("fertility-lmp-error");
const cycleError = document.getElementById("fertility-cycle-error");
const varError = document.getElementById("fertility-var-error");
const printOverlay = document.getElementById("print-overlay");

let lastResult = null;

function formatDate(date) {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatDateShort(date) {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
  }

  function formatRange(start, end) {
    if (start.getTime() === end.getTime()) {
      return formatDateShort(start);
    }
    return formatDateShort(start) + " – " + formatDateShort(end);
  }

  function showFieldError(el, text) {
    if (!el) return;
    el.textContent = text;
    el.hidden = false;
  }

  function clearFieldError(el) {
    if (!el) return;
    el.textContent = "";
    el.hidden = true;
  }

  function setInputInvalid(input, invalid) {
    if (input) input.setAttribute("aria-invalid", invalid ? "true" : "false");
  }

  function clearAllErrors() {
    clearFieldError(lmpError);
    clearFieldError(cycleError);
    clearFieldError(varError);
    setInputInvalid(lmpInput, false);
    setInputInvalid(cycleInput, false);
    setInputInvalid(variabilityInput, false);
  }

function handleSubmit(e) {
    e.preventDefault();
    clearAllErrors();
    resultsSection.hidden = true;

    var valid = true;

    var lmpVal = lmpInput ? lmpInput.value.trim() : "";
    if (!lmpVal) {
      showFieldError(lmpError, "Please select a date.");
      setInputInvalid(lmpInput, true);
      valid = false;
    } else {
      var lmpDate = new Date(lmpVal + "T12:00:00");
      if (isNaN(lmpDate.getTime())) {
        showFieldError(lmpError, "Please enter a valid date.");
        setInputInvalid(lmpInput, true);
        valid = false;
      } else {
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        lmpDate.setHours(0, 0, 0, 0);
        if (lmpDate > today) {
          showFieldError(lmpError, "Please enter a past date.");
          setInputInvalid(lmpInput, true);
          valid = false;
        }
      }
    }

    var cycleVal = cycleInput ? cycleInput.value : "28";
    var cycleNum = parseInt(cycleVal, 10);
    if (isNaN(cycleNum) || cycleNum < 21 || cycleNum > 40) {
      showFieldError(cycleError, "Please enter a realistic cycle length (21–40 days).");
      setInputInvalid(cycleInput, true);
      valid = false;
    }

    var variVal = variabilityInput ? variabilityInput.value : "2";
    var variNum = parseInt(variVal, 10);
    if (isNaN(variNum) || variNum < 0 || variNum > 7) {
      showFieldError(varError, "Please enter a variability between 0 and 7 days.");
      setInputInvalid(variabilityInput, true);
      valid = false;
    }

    if (!valid) return;

    var lmpDate = new Date(lmpVal + "T12:00:00");
    lmpDate.setHours(0, 0, 0, 0);

    var result = calculateFertilityWindowExtended(lmpDate, cycleNum, variNum);

    if (ovulationResult) {
      ovulationResult.textContent = formatDate(result.ovulationDate);
    }
    if (windowResult) {
      windowResult.textContent =
        formatDate(result.startDate) + " – " + formatDate(result.endDate);
    }
    if (higherResult) {
      higherResult.textContent = formatRange(result.higherStartDate, result.higherEndDate);
    }
    if (lowerResult) {
      var lowerParts = [];
      if (result.fertileStartDay < result.higherStartDay) {
        var lowerEndDate = addDays(result.startDate, result.higherStartDay - result.fertileStartDay - 1);
        lowerParts.push(formatRange(result.startDate, lowerEndDate));
      }
      if (result.higherEndDay < result.fertileEndDay) {
        var lowerStartDate = addDays(result.higherEndDate, 1);
        lowerParts.push(formatRange(lowerStartDate, result.endDate));
      }
      lowerResult.textContent = lowerParts.length ? lowerParts.join(", ") : "—";
    }
    if (basedOnResult) {
      var based = result.cycle + "-day cycle";
      if (result.variability > 0) {
        based += ", ±" + result.variability + " days variability";
      }
      basedOnResult.textContent = based;
    }

    if (calendarBlock) {
      var totalDays = (result.endDate - result.startDate) / (24 * 60 * 60 * 1000) + 1;
      var lowerBefore = Math.max(0, (result.higherStartDate - result.startDate) / (24 * 60 * 60 * 1000));
      var higherDays = (result.higherEndDate - result.higherStartDate) / (24 * 60 * 60 * 1000) + 1;
      var lowerAfter = Math.max(0, (result.endDate - result.higherEndDate) / (24 * 60 * 60 * 1000));
      var lowerBeforeRatio = totalDays > 0 ? lowerBefore / totalDays : 0;
      var higherRatio = totalDays > 0 ? higherDays / totalDays : 1;
      var lowerAfterRatio = totalDays > 0 ? lowerAfter / totalDays : 0;

      var lowerBeforeEl = calendarBlock.querySelector(".fertility-calendar-lower:not(.fertility-calendar-lower-after)");
      var higherEl = calendarBlock.querySelector(".fertility-calendar-higher");
      var lowerAfterEl = calendarBlock.querySelector(".fertility-calendar-lower-after");
      if (lowerBeforeEl) {
        lowerBeforeEl.style.flex = lowerBeforeRatio > 0 ? lowerBeforeRatio + " 1 0" : "0 0 0";
        lowerBeforeEl.style.display = lowerBeforeRatio > 0 ? "" : "none";
      }
      if (higherEl) {
        higherEl.style.flex = higherRatio > 0 ? higherRatio + " 1 0" : "1 1 0";
      }
      if (lowerAfterEl) {
        lowerAfterEl.style.flex = lowerAfterRatio > 0 ? lowerAfterRatio + " 1 0" : "0 0 0";
        lowerAfterEl.style.display = lowerAfterRatio > 0 ? "" : "none";
      }
    }

    renderCycleBar(result.cycle, result.fertileStartDay, result.fertileEndDay, result.cycle - 14);
    lastResult = result;
    resultsSection.hidden = false;
  }

  function renderCycleBar(cycleLength, fertileStart, fertileEnd, ovulationDay) {
    var container = document.getElementById("cycle-bar");
    var tapTooltip = document.getElementById("cycle-tap-tooltip");
    if (!container) return;
    container.innerHTML = "";

    for (var day = 1; day <= cycleLength; day++) {
      var div = document.createElement("div");
      div.classList.add("cycle-day");

      var tooltipText;
      if (day === ovulationDay) {
        div.classList.add("ovulation-peak");
        tooltipText = "Day " + day + " — estimated ovulation";
      } else if (day >= fertileStart && day <= fertileEnd) {
        div.classList.add("fertile-range");
        tooltipText = "Day " + day + " — within fertile window";
      } else {
        tooltipText = "Day " + day;
      }

      div.setAttribute("title", tooltipText);
      div.setAttribute("data-day-tooltip", tooltipText);

      div.addEventListener("click", function () {
        var txt = this.getAttribute("data-day-tooltip");
        if (tapTooltip) {
          if (tapTooltip.textContent === txt && !tapTooltip.hidden) {
            tapTooltip.hidden = true;
            tapTooltip.textContent = "";
          } else {
            tapTooltip.textContent = txt;
            tapTooltip.hidden = false;
          }
        }
      });

      container.appendChild(div);
    }

    if (tapTooltip) {
      tapTooltip.hidden = true;
      tapTooltip.textContent = "";
    }
  }

  function generatePrintOverlay(data) {
    var overlay = document.getElementById("print-overlay");
    if (!overlay) return;

    var fertileStartDay = data.fertileStartDay;
    var fertileEndDay = data.fertileEndDay;
    var ovulationDay = data.ovulationDay;

    var calendarHtml = '<div class="print-calendar">';
    for (var d = 1; d <= data.cycleLength; d++) {
      var cls = "print-day";
      if (d >= fertileStartDay && d <= fertileEndDay) cls += " print-fertile";
      if (d === ovulationDay) cls += " print-ovulation";
      calendarHtml += '<span class="' + cls + '">' + d + '</span>';
    }
    calendarHtml += "</div>";

    overlay.innerHTML =
      "<div class=\"print-overlay-inner\">" +
      "<h1>Fertility Window Summary</h1>" +
      "<p>Last period: " + data.lmp + "</p>" +
      "<p>Cycle length: " + data.cycleLength + " days</p>" +
      "<hr/>" +
      "<h2>Estimated Ovulation</h2>" +
      "<p>" + data.ovulationDate + "</p>" +
      "<h2>Fertile Window</h2>" +
      "<p>" + data.windowStart + " – " + data.windowEnd + "</p>" +
      "<hr/>" +
      calendarHtml +
      "<p style=\"font-size:12px;color:#555;margin-top:1rem;\">" +
      "This estimate is based on average cycle patterns and is for educational use only." +
      "</p>" +
      "</div>";
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }

  var printBtn = document.getElementById("fertility-print-btn");
  var printStatus = document.getElementById("fertility-print-status");
  if (printBtn) {
    printBtn.addEventListener("click", function () {
      if (lastResult) {
        if (printStatus) {
          printStatus.textContent = "Preparing clean print view…";
          printStatus.hidden = false;
        }
        setTimeout(function () {
          var lmpDate = lmpInput ? new Date(lmpInput.value + "T12:00:00") : null;
          var resultsData = {
            lmp: lmpDate ? formatDate(lmpDate) : "",
            cycleLength: lastResult.cycle,
            variability: lastResult.variability,
            ovulationDate: formatDate(lastResult.ovulationDate),
            windowStart: formatDate(lastResult.startDate),
            windowEnd: formatDate(lastResult.endDate),
            fertileStartDay: lastResult.fertileStartDay,
            fertileEndDay: lastResult.fertileEndDay,
            ovulationDay: lastResult.ovulationDay,
          };
          generatePrintOverlay(resultsData);
          window.print();
        }, 500);
      }
    });
  }

  window.addEventListener("afterprint", function () {
    var overlay = document.getElementById("print-overlay");
    if (overlay) overlay.innerHTML = "";
    if (printStatus) {
      printStatus.textContent = "";
      printStatus.hidden = true;
    }
  });
