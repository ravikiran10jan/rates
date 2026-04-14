import { addDays, addMonths, addWeeks, addYears, differenceInCalendarDays, format, isAfter, isBefore, parseISO } from 'date-fns';
import type { BusinessDayConvention, DayCountFraction, Period, CalculationPeriodDates } from '../model/common';

// ---------- Date helpers ----------

export function iso(d: Date): string { return format(d, 'yyyy-MM-dd'); }
export function parse(s: string): Date { return parseISO(s); }

export function addPeriod(d: Date, p: Period): Date {
  switch (p.unit) {
    case 'D': return addDays(d, p.length);
    case 'W': return addWeeks(d, p.length);
    case 'M': return addMonths(d, p.length);
    case 'Y': return addYears(d, p.length);
  }
}

// ---------- Business day adjustment (weekend-only; holidays omitted for playground) ----------

function isWeekend(d: Date): boolean {
  const g = d.getUTCDay();
  return g === 0 || g === 6;
}

export function adjust(d: Date, bdc: BusinessDayConvention): Date {
  if (bdc === 'NONE') return d;
  const roll = (step: number, modified: boolean) => {
    let cur = new Date(d);
    while (isWeekend(cur)) cur = addDays(cur, step);
    if (modified && cur.getUTCMonth() !== d.getUTCMonth()) {
      cur = new Date(d);
      while (isWeekend(cur)) cur = addDays(cur, -step);
    }
    return cur;
  };
  switch (bdc) {
    case 'FOLLOWING': return roll(1, false);
    case 'MODIFIED_FOLLOWING': return roll(1, true);
    case 'PRECEDING': return roll(-1, false);
    case 'MODIFIED_PRECEDING': return roll(-1, true);
  }
}

// ---------- Day count fractions ----------

export function yearFraction(start: Date, end: Date, dcf: DayCountFraction): number {
  const days = differenceInCalendarDays(end, start);
  switch (dcf) {
    case 'ACT/360': return days / 360;
    case 'ACT/365.FIXED': return days / 365;
    case 'BUS/252': return days / 252; // approximation (no holiday cal)
    case 'ACT/ACT.ISDA': {
      // split the period at year boundaries
      let frac = 0;
      let cur = new Date(start);
      while (isBefore(cur, end)) {
        const yearEnd = new Date(Date.UTC(cur.getUTCFullYear() + 1, 0, 1));
        const segEnd = isBefore(yearEnd, end) ? yearEnd : end;
        const daysInYear = isLeapYear(cur.getUTCFullYear()) ? 366 : 365;
        frac += differenceInCalendarDays(segEnd, cur) / daysInYear;
        cur = segEnd;
      }
      return frac;
    }
    case '30/360': return thirty360(start, end, false);
    case '30E/360':
    case '30E/360.ISDA': return thirty360(start, end, true);
  }
}

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function thirty360(start: Date, end: Date, european: boolean): number {
  let d1 = start.getUTCDate();
  let d2 = end.getUTCDate();
  const m1 = start.getUTCMonth() + 1;
  const m2 = end.getUTCMonth() + 1;
  const y1 = start.getUTCFullYear();
  const y2 = end.getUTCFullYear();
  if (european) {
    if (d1 === 31) d1 = 30;
    if (d2 === 31) d2 = 30;
  } else {
    if (d1 === 31) d1 = 30;
    if (d2 === 31 && d1 === 30) d2 = 30;
  }
  return (360 * (y2 - y1) + 30 * (m2 - m1) + (d2 - d1)) / 360;
}

// ---------- Period schedule generation ----------

export interface SchedulePeriod {
  startDate: string;           // unadjusted
  endDate: string;             // unadjusted
  adjustedStartDate: string;
  adjustedEndDate: string;
  paymentDate: string;
  yearFraction: number;
}

export function generateSchedule(cpd: CalculationPeriodDates, dcf: DayCountFraction, paymentOffsetDays = 0): SchedulePeriod[] {
  const start = parse(cpd.effectiveDate);
  const end = parse(cpd.terminationDate);
  const freq = cpd.calculationPeriodFrequency.period;
  const bdc = cpd.businessDayConvention;

  const periods: SchedulePeriod[] = [];
  let cur = start;
  let safety = 0;
  while (isBefore(cur, end) && safety++ < 2000) {
    const next = addPeriod(cur, freq);
    const segEnd = isAfter(next, end) ? end : next;
    const adjStart = adjust(cur, bdc);
    const adjEnd = adjust(segEnd, bdc);
    const payDate = adjust(addDays(adjEnd, paymentOffsetDays), bdc);
    periods.push({
      startDate: iso(cur),
      endDate: iso(segEnd),
      adjustedStartDate: iso(adjStart),
      adjustedEndDate: iso(adjEnd),
      paymentDate: iso(payDate),
      yearFraction: yearFraction(adjStart, adjEnd, dcf),
    });
    cur = segEnd;
  }
  return periods;
}
