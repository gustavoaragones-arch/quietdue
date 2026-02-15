/**
 * QuietDue Fertility Window Estimator — Phase 1.5
 * Runs entirely in the browser. No data is saved, stored, or sent anywhere.
 * PRIVACY: No fetch, localStorage, sessionStorage, cookies, analytics.
 * Pure JS only. No API. No Worker. No storage.
 */
(function () {
  "use strict";

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

  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

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

  /**
   * Calculation logic (client-side only, pure JS):
   * - ovulationDay = cycleLength - 14
   * - Fertile window: Start = ovulationDay - 5, End = ovulationDay + 1
   * - If variability: Start -= variability, End += variability
   * - Clamp to day 1 .. cycleLength
   * - Higher likelihood: ovulation - 2 through ovulation + 1 (peak fertility)
   * - Lower likelihood: rest of fertile window (sperm survival days)
   */
  function calculate(lmpDate, cycleLength, variability) {
    var ovulationDay = cycleLength - 14;
    var fertileStartDay = ovulationDay - 5 - variability;
    var fertileEndDay = ovulationDay + 1 + variability;

    fertileStartDay = Math.max(1, fertileStartDay);
    fertileEndDay = Math.min(cycleLength, fertileEndDay);

    var higherStartDay = Math.max(fertileStartDay, ovulationDay - 2);
    var higherEndDay = Math.min(fertileEndDay, ovulationDay + 1);

    var startDate = addDays(lmpDate, fertileStartDay - 1);
    var endDate = addDays(lmpDate, fertileEndDay - 1);
    var ovulationDate = addDays(lmpDate, ovulationDay - 1);
    var higherStartDate = addDays(lmpDate, higherStartDay - 1);
    var higherEndDate = addDays(lmpDate, higherEndDay - 1);

    return {
      startDate: startDate,
      endDate: endDate,
      ovulationDate: ovulationDate,
      higherStartDate: higherStartDate,
      higherEndDate: higherEndDate,
      fertileStartDay: fertileStartDay,
      fertileEndDay: fertileEndDay,
      higherStartDay: higherStartDay,
      higherEndDay: higherEndDay,
      cycle: cycleLength,
      variability: variability,
    };
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

    var result = calculate(lmpDate, cycleNum, variNum);

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

    resultsSection.hidden = false;
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }

  var printBtn = document.getElementById("fertility-print-btn");
  if (printBtn) {
    printBtn.addEventListener("click", function () {
      window.print();
    });
  }
})();
