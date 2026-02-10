/**
 * QuietDue calculator — runs entirely in the browser.
 * No data is saved, stored, or sent anywhere.
 * State resets on page refresh.
 */
(function () {
  "use strict";

  const DAYS_IN_GESTATION = 280;
  const DAYS_IN_WEEK = 7;
  const CONFIDENCE_DAYS = 12;
  const IMPLANTATION_START_DAYS = 6;
  const IMPLANTATION_END_DAYS = 12;

  const form = document.getElementById("calculator-form");
  const lmpInput = document.getElementById("lmp-date");
  const resultsSection = document.getElementById("results");
  const resultDueDate = document.querySelector(".result-due-date");
  const resultWeek = document.querySelector(".result-week");
  const resultConfidence = document.querySelector(".result-confidence");
  const milestonesList = document.querySelector(".milestones-placeholder");
  const btnPrint = document.querySelector('[data-action="print"]');
  const btnIcs = document.querySelector('[data-action="ics"]');
  const dateMessage = document.getElementById("date-message");
  const actionMessage = document.getElementById("action-message");

  // Kept in memory only; cleared when the page is refreshed or closed
  let currentEstimate = null;

  function formatDate(date) {
    // Display a date in a readable form, e.g. "15 March 2025"
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function daysBetween(start, end) {
    // Number of whole days between two dates
    const diff = end - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  // Uses the standard 280-day rule from first day of last period.
  // Same inputs always produce the same outputs.
  function calculate(lmpDate) {
    const dueDate = addDays(lmpDate, DAYS_IN_GESTATION);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysSinceLMP = daysBetween(lmpDate, today);
    const gestationalWeeks = Math.max(0, Math.floor(daysSinceLMP / DAYS_IN_WEEK));
    const gestationalDays = daysSinceLMP % DAYS_IN_WEEK;

    const confidenceEarly = addDays(dueDate, -CONFIDENCE_DAYS);
    const confidenceLate = addDays(dueDate, CONFIDENCE_DAYS);

    const implantationStart = addDays(lmpDate, IMPLANTATION_START_DAYS);
    const implantationEnd = addDays(lmpDate, IMPLANTATION_END_DAYS);

    const milestones = [
      {
        type: "implantation",
        startDate: implantationStart,
        endDate: implantationEnd,
        label: "Implantation typically occurs in this window",
      },
      {
        weekStart: 5,
        weekEnd: 6,
        label: "Early viability window often begins",
      },
      {
        weekStart: 7,
        weekEnd: 9,
        label: "First ultrasound typically offered",
      },
    ];

    return {
      dueDate,
      gestationalWeeks,
      gestationalDays,
      confidenceEarly,
      confidenceLate,
      milestones,
    };
  }

  function renderResults(estimate) {
    // Update the page with the calculated values
    const weekText =
      estimate.gestationalDays > 0
        ? `${estimate.gestationalWeeks} weeks, ${estimate.gestationalDays} days`
        : `${estimate.gestationalWeeks} weeks`;

    resultDueDate.textContent = formatDate(estimate.dueDate);
    resultWeek.textContent = weekText;
    resultConfidence.textContent = `${formatDate(estimate.confidenceEarly)} – ${formatDate(estimate.confidenceLate)}`;

    milestonesList.innerHTML = estimate.milestones
      .map((m) => {
        if (m.type === "implantation") {
          const range = `${formatDate(m.startDate)} – ${formatDate(m.endDate)}`;
          return `<li><strong>${range}</strong>: ${m.label}</li>`;
        }
        const weekRange =
          m.weekStart === m.weekEnd
            ? `Week ${m.weekStart}`
            : `Weeks ${m.weekStart}–${m.weekEnd}`;
        return `<li><strong>${weekRange}</strong>: ${m.label}</li>`;
      })
      .join("");

    btnPrint.disabled = false;
    btnIcs.disabled = false;
    clearActionMessage();
  }

  function showResults() {
    resultsSection.hidden = false;
    resultsSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
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

  function handleDateInput() {
    const value = lmpInput.value;
    if (!value) {
      clearDateMessage();
      resultsSection.hidden = true;
      if (btnPrint) btnPrint.disabled = true;
      if (btnIcs) btnIcs.disabled = true;
      return;
    }

    const lmpDate = new Date(value + "T12:00:00");
    if (isNaN(lmpDate.getTime())) {
      showDateMessage("Please enter a valid date.");
      resultsSection.hidden = true;
      if (btnPrint) btnPrint.disabled = true;
      if (btnIcs) btnIcs.disabled = true;
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lmpDate.setHours(0, 0, 0, 0);
    if (lmpDate > today) {
      showDateMessage("That date is in the future. Please enter the first day of your last period.");
      resultsSection.hidden = true;
      if (btnPrint) btnPrint.disabled = true;
      if (btnIcs) btnIcs.disabled = true;
      return;
    }

    clearDateMessage();
    currentEstimate = calculate(lmpDate);
    renderResults(currentEstimate);
    showResults();
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
    const lmpDate = new Date(document.getElementById("lmp-date").value + "T12:00:00");
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
    } catch (e) {
      showActionMessage("The calendar file could not be created. Please try again.");
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    handleDateInput();
  });
  lmpInput.addEventListener("input", handleDateInput);
  lmpInput.addEventListener("change", handleDateInput);
  if (btnPrint) btnPrint.addEventListener("click", handlePrint);
  if (btnIcs) btnIcs.addEventListener("click", handleIcs);
})();
