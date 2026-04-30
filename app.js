/**
 * QuietDue calculator — Phase 1
 * Runs entirely in the browser. No data is saved, stored, or sent anywhere.
 * Uses only JavaScript date math. State disappears when the tab closes.
 *
 * PRIVACY GUARANTEE (enforced):
 * - No analytics script
 * - No cookies banner (no cookies used)
 * - No fetch() calls (no network requests with user data)
 * - No localStorage
 * - No sessionStorage
 */
import {
  addDays,
  calculateDueDate,
  calculateGestationalAge,
} from "/assets/js/timing-engine.js";

const CONFIDENCE_DAYS = 12; /* ±12 days (within ±10–14) — reinforces uncertainty framing */
  const form = document.getElementById("calculator-form");
  const lmpInput = document.getElementById("lmp-date");
  const submitBtn = document.getElementById("calc-submit");
  const resultsSection = document.getElementById("calc-results");
  const resultWeek = document.getElementById("result-week");
  const resultConfidence = document.getElementById("result-confidence");
  const confidencePreview = document.getElementById("confidence-preview");
  const confidenceLabel = document.getElementById("confidence-label");
  const btnPrint = document.querySelector('[data-action="print"]');
  const btnIcs = document.querySelector('[data-action="ics"]');
  const dateMessage = document.getElementById("date-message");
  const actionMessage = document.getElementById("action-message");

  let currentEstimate = null;

  function formatDate(date) {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  /**
   * Format gestational age: "about X weeks and Y days (approximate)"
   * Never use clinical shorthand like 6w3d.
   */
  function formatGestationalAge(weeks, days) {
    if (days > 0) {
      return "about " + weeks + " weeks and " + days + " days (approximate)";
    }
    return "about " + weeks + " weeks (approximate)";
  }

  function calculate(lmpDate) {
    const dueDate = calculateDueDate(lmpDate);
    const { weeks: gestationalWeeks, days: gestationalDays } = calculateGestationalAge(lmpDate);

    const confidenceEarly = addDays(dueDate, -CONFIDENCE_DAYS);
    const confidenceLate = addDays(dueDate, CONFIDENCE_DAYS);

    return {
      dueDate,
      gestationalWeeks,
      gestationalDays,
      confidenceEarly,
      confidenceLate,
    };
  }

  function renderResults(estimate) {
    const weekText = formatGestationalAge(
      estimate.gestationalWeeks,
      estimate.gestationalDays
    );

    if (resultWeek) resultWeek.textContent = weekText;
    if (resultConfidence) {
      resultConfidence.textContent =
        formatDate(estimate.confidenceEarly) +
        " – " +
        formatDate(estimate.confidenceLate);
    }

    if (confidenceLabel) {
      confidenceLabel.textContent =
        formatDate(estimate.confidenceEarly) +
        " – " +
        formatDate(estimate.confidenceLate);
    }

    if (confidencePreview) {
      confidencePreview.removeAttribute("aria-hidden");
    }

    if (btnPrint) btnPrint.disabled = false;
    if (btnIcs) btnIcs.disabled = false;
    clearActionMessage();
  }

  function showResults() {
    if (resultsSection) {
      resultsSection.hidden = false;
    }
  }

  function hideResults() {
    if (resultsSection) resultsSection.hidden = true;
    if (confidencePreview) confidencePreview.setAttribute("aria-hidden", "true");
    if (confidenceLabel) confidenceLabel.textContent = "Estimated due window";
    if (btnPrint) btnPrint.disabled = true;
    if (btnIcs) btnIcs.disabled = true;
  }

  function showDateMessage(text) {
    if (!dateMessage) return;
    dateMessage.textContent = text;
    dateMessage.hidden = false;
  }

  function clearDateMessage() {
    if (!dateMessage) return;
    dateMessage.textContent = "";
    dateMessage.hidden = true;
  }

  function updateSubmitButton() {
    if (submitBtn && lmpInput) {
      const hasValue = lmpInput.value && lmpInput.value.trim().length > 0;
      submitBtn.disabled = !hasValue;
    }
  }

  function runCalculation() {
    const value = lmpInput ? lmpInput.value : "";
    if (!value) {
      clearDateMessage();
      hideResults();
      return;
    }

    const lmpDate = new Date(value + "T12:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lmpDate.setHours(0, 0, 0, 0);

    if (isNaN(lmpDate.getTime()) || lmpDate > today) {
      showDateMessage("Please enter a valid past date.");
      hideResults();
      if (btnPrint) btnPrint.disabled = true;
      if (btnIcs) btnIcs.disabled = true;
      return;
    }

    clearDateMessage();
    currentEstimate = calculate(lmpDate);
    renderResults(currentEstimate);
    showResults();
  }

  function handleSubmit(e) {
    e.preventDefault();
    runCalculation();
  }

  function handleInputChange() {
    updateSubmitButton();
    const value = lmpInput ? lmpInput.value : "";
    if (!value) {
      clearDateMessage();
      hideResults();
    }
  }

  function handlePrint() {
    window.print();
  }

  function clearActionMessage() {
    if (!actionMessage) return;
    actionMessage.textContent = "";
    actionMessage.hidden = true;
  }

  function showActionMessage(text) {
    if (!actionMessage) return;
    actionMessage.textContent = text;
    actionMessage.hidden = false;
  }

  function toICSDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return y + m + d;
  }

  function generateICS(estimate) {
    const lmpVal = document.getElementById("lmp-date");
    const lmpDate = new Date(
      (lmpVal ? lmpVal.value : "") + "T12:00:00"
    );
    const dueDate = estimate.dueDate;
    const week7Date = addDays(lmpDate, 42);
    const week9Date = addDays(lmpDate, 56);

    const stamp = "20200101T000000Z";

    const events = [
      {
        uid: "quietdue-due-date@local",
        start: toICSDate(dueDate),
        end: toICSDate(addDays(dueDate, 1)),
        summary: "Estimated due date",
        description: "QuietDue estimate. For informational purposes only.",
      },
      {
        uid: "quietdue-week7@local",
        start: toICSDate(week7Date),
        end: toICSDate(addDays(week7Date, 1)),
        summary: "Estimated early ultrasound window start (week 7)",
        description: "QuietDue estimate. For informational purposes only.",
      },
      {
        uid: "quietdue-week9@local",
        start: toICSDate(week9Date),
        end: toICSDate(addDays(week9Date, 1)),
        summary: "Estimated early ultrasound window end (week 9)",
        description: "QuietDue estimate. For informational purposes only.",
      },
    ];

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//QuietDue//Calculator//EN",
    ];

    events.forEach(function (ev) {
      lines.push(
        "BEGIN:VEVENT",
        "UID:" + ev.uid,
        "DTSTAMP:" + stamp,
        "DTSTART;VALUE=DATE:" + ev.start,
        "DTEND;VALUE=DATE:" + ev.end,
        "SUMMARY:" + ev.summary,
        "DESCRIPTION:" + ev.description,
        "END:VEVENT"
      );
    });

    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }

  function handleIcs() {
    if (!currentEstimate) return;

    clearActionMessage();

    try {
      const ics = generateICS(currentEstimate);
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "quietdue-estimated-dates.ics";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      showActionMessage(
        "The calendar file could not be created. Please try again."
      );
    }
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
  if (lmpInput) {
    lmpInput.addEventListener("input", handleInputChange);
    lmpInput.addEventListener("change", handleInputChange);
    updateSubmitButton();
  }
  if (btnPrint) btnPrint.addEventListener("click", handlePrint);
  if (btnIcs) btnIcs.addEventListener("click", handleIcs);
