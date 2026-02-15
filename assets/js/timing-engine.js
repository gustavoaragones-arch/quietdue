/*
 * QuietDue Timing Engine
 * ----------------------
 * Pure calculation module.
 * No DOM.
 * No persistence.
 * No analytics.
 * Deterministic and offline-safe.
 */


/**
 * Add days to a date.
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Estimate due date from LMP (280 days).
 * @param {Date|string} lmpDate
 * @returns {Date}
 */
export function calculateDueDate(lmpDate) {
  const lmp = new Date(lmpDate);
  const due = new Date(lmp);
  due.setDate(lmp.getDate() + 280);
  return due;
}

/**
 * Gestational week from LMP to today.
 * @param {Date|string} lmpDate
 * @returns {number}
 */
export function calculateGestationalWeek(lmpDate) {
  const lmp = new Date(lmpDate);
  const today = new Date();
  const diffDays = Math.floor((today - lmp) / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
}

/**
 * Gestational age (weeks and days) from LMP to today.
 * @param {Date|string} lmpDate
 * @returns {{ weeks: number, days: number }}
 */
export function calculateGestationalAge(lmpDate) {
  const lmp = new Date(lmpDate);
  const today = new Date();
  const diffDays = Math.max(0, Math.floor((today - lmp) / (1000 * 60 * 60 * 24)));
  return {
    weeks: Math.floor(diffDays / 7),
    days: diffDays % 7,
  };
}

/**
 * Fertility window: ovulation, fertile start, fertile end.
 * @param {Date|string} lmpDate
 * @param {number} [cycleLength=28]
 * @returns {{ ovulationDate: Date, fertileStart: Date, fertileEnd: Date }}
 */
export function calculateFertilityWindow(lmpDate, cycleLength = 28) {
  const lmp = new Date(lmpDate);
  const ovulationOffset = cycleLength - 14;

  const ovulationDate = new Date(lmp);
  ovulationDate.setDate(lmp.getDate() + ovulationOffset);

  const fertileStart = new Date(ovulationDate);
  fertileStart.setDate(ovulationDate.getDate() - 5);

  const fertileEnd = new Date(ovulationDate);
  fertileEnd.setDate(ovulationDate.getDate() + 1);

  return {
    ovulationDate,
    fertileStart,
    fertileEnd,
  };
}

/**
 * Fertility window with variability. Clamps to cycle range.
 * @param {Date|string} lmpDate
 * @param {number} cycleLength
 * @param {number} variability
 * @returns {Object}
 */
export function calculateFertilityWindowExtended(lmpDate, cycleLength, variability) {
  const lmp = new Date(lmpDate);
  const ovulationDay = cycleLength - 14;
  let fertileStartDay = ovulationDay - 5 - variability;
  let fertileEndDay = ovulationDay + 1 + variability;

  fertileStartDay = Math.max(1, fertileStartDay);
  fertileEndDay = Math.min(cycleLength, fertileEndDay);

  const higherStartDay = Math.max(fertileStartDay, ovulationDay - 2);
  const higherEndDay = Math.min(fertileEndDay, ovulationDay + 1);

  return {
    startDate: addDays(lmp, fertileStartDay - 1),
    endDate: addDays(lmp, fertileEndDay - 1),
    ovulationDate: addDays(lmp, ovulationDay - 1),
    higherStartDate: addDays(lmp, higherStartDay - 1),
    higherEndDate: addDays(lmp, higherEndDay - 1),
    fertileStartDay,
    fertileEndDay,
    higherStartDay,
    higherEndDay,
    ovulationDay,
    cycle: cycleLength,
    variability,
  };
}

/**
 * Cycle likelihood mapping for visualization.
 * Returns { day, likelihood } per cycle day. No percentages.
 * @param {number} [cycleLength=28]
 * @returns {{ day: number, likelihood: "low"|"moderate"|"peak" }[]}
 */
export function buildCycleLikelihoodMap(cycleLength = 28) {
  const ovulationDay = cycleLength - 14;
  const fertileStart = ovulationDay - 5;
  const fertileEnd = ovulationDay + 1;

  const days = [];

  for (let i = 1; i <= cycleLength; i++) {
    let likelihood = "low";

    if (i >= fertileStart && i <= fertileEnd) {
      likelihood = "moderate";
    }

    if (i === ovulationDay) {
      likelihood = "peak";
    }

    days.push({ day: i, likelihood });
  }

  return days;
}
