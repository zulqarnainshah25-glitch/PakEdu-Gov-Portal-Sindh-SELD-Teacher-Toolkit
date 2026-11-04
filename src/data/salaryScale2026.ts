export interface BPSDataRow {
  bps: number;
  label: string;
  minBasic2022: number;
  increment2022: number;
  maxBasic2022: number;
  minBasic2026: number;
  increment2026: number;
  maxBasic2026: number;
  houseRent: number;
  conveyanceBase: number;
  conveyance2026: number; // 50% increased rate based on BPS
  medical: number;
  gpFund: number;
  benevolentFund: number;
  groupInsurance: number;
}

/**
 * Official-structured Sindh Government Basic Pay Scale (BPS-01 to BPS-22)
 * Includes 2022 Running Pay Scale, 2026 Revised Scale, Fixed House Rent,
 * 50% Increased Conveyance Rate, Fixed Standard Medical, and Statutory Deductions.
 */
export const SINDH_BPS_CHART_2026: BPSDataRow[] = [
  { bps: 1, label: 'BPS-01 (Naib Qasid / Chowkidar)', minBasic2022: 13550, increment2022: 430, maxBasic2022: 26450, minBasic2026: 18970, increment2026: 600, maxBasic2026: 36970, houseRent: 2400, conveyanceBase: 1785, conveyance2026: 2678, medical: 3500, gpFund: 1000, benevolentFund: 380, groupInsurance: 150 },
  { bps: 2, label: 'BPS-02 (Daftari / Lab Attendant)', minBasic2022: 13820, increment2022: 490, maxBasic2022: 28520, minBasic2026: 19350, increment2026: 690, maxBasic2026: 40050, houseRent: 2450, conveyanceBase: 1785, conveyance2026: 2678, medical: 3500, gpFund: 1100, benevolentFund: 390, groupInsurance: 150 },
  { bps: 3, label: 'BPS-03 (Dispatch Rider)', minBasic2022: 14260, increment2022: 580, maxBasic2022: 31660, minBasic2026: 19960, increment2026: 810, maxBasic2026: 44260, houseRent: 2550, conveyanceBase: 1785, conveyance2026: 2678, medical: 3500, gpFund: 1200, benevolentFund: 400, groupInsurance: 150 },
  { bps: 4, label: 'BPS-04 (Driver / Record Sorter)', minBasic2022: 14690, increment2022: 660, maxBasic2022: 34490, minBasic2026: 20570, increment2026: 920, maxBasic2026: 48170, houseRent: 2650, conveyanceBase: 1785, conveyance2026: 2678, medical: 3500, gpFund: 1300, benevolentFund: 420, groupInsurance: 150 },
  { bps: 5, label: 'BPS-05 (Junior Clerk / Tube-Well Op)', minBasic2022: 15230, increment2022: 750, maxBasic2022: 37730, minBasic2026: 21320, increment2026: 1050, maxBasic2026: 52820, houseRent: 2800, conveyanceBase: 1932, conveyance2026: 2898, medical: 3500, gpFund: 1500, benevolentFund: 450, groupInsurance: 200 },
  { bps: 6, label: 'BPS-06 (Lab Assistant)', minBasic2022: 15760, increment2022: 840, maxBasic2022: 40960, minBasic2026: 22060, increment2026: 1180, maxBasic2026: 57460, houseRent: 2950, conveyanceBase: 1932, conveyance2026: 2898, medical: 3500, gpFund: 1600, benevolentFund: 470, groupInsurance: 200 },
  { bps: 7, label: 'BPS-07 (Primary Teacher Old / Storekeeper)', minBasic2022: 16310, increment2022: 910, maxBasic2022: 43610, minBasic2026: 22830, increment2026: 1270, maxBasic2026: 60930, houseRent: 3100, conveyanceBase: 1932, conveyance2026: 2898, medical: 3500, gpFund: 1800, benevolentFund: 500, groupInsurance: 200 },
  { bps: 8, label: 'BPS-08 (Work Mistry / Tracer)', minBasic2022: 16890, increment2022: 1000, maxBasic2022: 46890, minBasic2026: 23650, increment2026: 1400, maxBasic2026: 65650, houseRent: 3250, conveyanceBase: 1932, conveyance2026: 2898, medical: 3500, gpFund: 1900, benevolentFund: 520, groupInsurance: 200 },
  { bps: 9, label: 'BPS-09 (PST Initial / Drawing Teacher)', minBasic2022: 17470, increment2022: 1090, maxBasic2022: 50170, minBasic2026: 24460, increment2026: 1530, maxBasic2026: 70360, houseRent: 3450, conveyanceBase: 1932, conveyance2026: 2898, medical: 3500, gpFund: 2100, benevolentFund: 550, groupInsurance: 250 },
  { bps: 10, label: 'BPS-10 (Senior Clerk / Surveyor)', minBasic2022: 18050, increment2022: 1190, maxBasic2022: 53750, minBasic2026: 25270, increment2026: 1670, maxBasic2026: 75370, houseRent: 3650, conveyanceBase: 1932, conveyance2026: 2898, medical: 3500, gpFund: 2300, benevolentFund: 580, groupInsurance: 250 },
  { bps: 11, label: 'BPS-11 (Junior Clerk Upgraded / Assistant)', minBasic2022: 18650, increment2022: 1310, maxBasic2022: 57950, minBasic2026: 26110, increment2026: 1830, maxBasic2026: 81010, houseRent: 3900, conveyanceBase: 2856, conveyance2026: 4284, medical: 3500, gpFund: 2500, benevolentFund: 620, groupInsurance: 300 },
  { bps: 12, label: 'BPS-12 (Computer Operator / Cataloguer)', minBasic2022: 19770, increment2022: 1430, maxBasic2022: 62670, minBasic2026: 27680, increment2026: 2000, maxBasic2026: 87680, houseRent: 4200, conveyanceBase: 2856, conveyance2026: 4284, medical: 3500, gpFund: 2800, benevolentFund: 660, groupInsurance: 300 },
  { bps: 13, label: 'BPS-13 (Accountant / Statistical Asst)', minBasic2022: 21160, increment2022: 1560, maxBasic2022: 67960, minBasic2026: 29620, increment2026: 2180, maxBasic2026: 95020, houseRent: 4550, conveyanceBase: 2856, conveyance2026: 4284, medical: 3500, gpFund: 3000, benevolentFund: 700, groupInsurance: 350 },
  { bps: 14, label: 'BPS-14 (PST / JEST / Stenographer)', minBasic2022: 22530, increment2022: 1740, maxBasic2022: 74730, minBasic2026: 31540, increment2026: 2440, maxBasic2026: 104740, houseRent: 4950, conveyanceBase: 2856, conveyance2026: 4284, medical: 3500, gpFund: 3300, benevolentFund: 750, groupInsurance: 350 },
  { bps: 15, label: 'BPS-15 (JEST Upgraded / Senior PST)', minBasic2022: 23920, increment2022: 1980, maxBasic2022: 83320, minBasic2026: 33490, increment2026: 2770, maxBasic2026: 116590, houseRent: 5400, conveyanceBase: 2856, conveyance2026: 4284, medical: 3500, gpFund: 3600, benevolentFund: 820, groupInsurance: 400 },
  { bps: 16, label: 'BPS-16 (HST / SST / Superintendent)', minBasic2022: 28070, increment2022: 2260, maxBasic2022: 95870, minBasic2026: 39300, increment2026: 3160, maxBasic2026: 134100, houseRent: 6500, conveyanceBase: 5000, conveyance2026: 7500, medical: 4500, gpFund: 4200, benevolentFund: 950, groupInsurance: 500 },
  { bps: 17, label: 'BPS-17 (Subject Specialist / Lecturer / HM)', minBasic2022: 45070, increment2022: 3420, maxBasic2022: 113470, minBasic2026: 63100, increment2026: 4790, maxBasic2026: 158900, houseRent: 9800, conveyanceBase: 5000, conveyance2026: 7500, medical: 6500, gpFund: 6000, benevolentFund: 1350, groupInsurance: 700 },
  { bps: 18, label: 'BPS-18 (Senior Subject Specialist / TEO / Assistant Prof)', minBasic2022: 56880, increment2022: 4260, maxBasic2022: 142080, minBasic2026: 79630, increment2026: 5960, maxBasic2026: 198830, houseRent: 12800, conveyanceBase: 5000, conveyance2026: 7500, medical: 8000, gpFund: 7500, benevolentFund: 1700, groupInsurance: 850 },
  { bps: 19, label: 'BPS-19 (Principal / DEO / Associate Prof)', minBasic2022: 87840, increment2022: 4530, maxBasic2022: 178440, minBasic2026: 122980, increment2026: 6340, maxBasic2026: 249780, houseRent: 18500, conveyanceBase: 6000, conveyance2026: 9000, medical: 10500, gpFund: 10000, benevolentFund: 2300, groupInsurance: 1000 },
  { bps: 20, label: 'BPS-20 (Director School Education / Professor)', minBasic2022: 102470, increment2022: 6690, maxBasic2022: 196130, minBasic2026: 143460, increment2026: 9370, maxBasic2026: 274640, houseRent: 23000, conveyanceBase: 7000, conveyance2026: 10500, medical: 12500, gpFund: 12500, benevolentFund: 2800, groupInsurance: 1200 },
  { bps: 21, label: 'BPS-21 (Additional Secretary / DG)', minBasic2022: 113790, increment2022: 7420, maxBasic2022: 217670, minBasic2026: 159310, increment2026: 10390, maxBasic2026: 304770, houseRent: 27000, conveyanceBase: 8000, conveyance2026: 12000, medical: 15000, gpFund: 15000, benevolentFund: 3200, groupInsurance: 1500 },
  { bps: 22, label: 'BPS-22 (Secretary to Govt of Sindh)', minBasic2022: 122190, increment2022: 8710, maxBasic2022: 244130, minBasic2026: 171070, increment2026: 12190, maxBasic2026: 341730, houseRent: 32000, conveyanceBase: 9000, conveyance2026: 13500, medical: 18000, gpFund: 18000, benevolentFund: 3800, groupInsurance: 1800 },
];

export interface SalaryCalculationResult {
  bpsRow: BPSDataRow;
  stage: number;
  currentRunningBasic2022: number;
  revisedBasic2026: number;
  houseRent: number;
  conveyanceBase: number;
  conveyance2026: number;
  conveyanceIncrease: number;
  medical: number;
  adhoc2023RatePercent: number;
  adhoc2023: number;
  adhoc2024: number;
  adhoc2026: number;
  differential2026: number;
  grossSalary: number;
  gpFund: number;
  benevolentFund: number;
  groupInsurance: number;
  incomeTax: number;
  totalDeductions: number;
  netSalary: number;
  netMonthlyIncrease2026: number;
}

/**
 * Exact Sindh Government Salary Calculator 2026 Logic:
 * - Revised Basic Pay 2026 = Min Basic 2026 + (Stage * Increment 2026)
 * - House Rent: Fixed based on BPS
 * - Conveyance: 50% increased rate based on BPS
 * - Medical: Fixed standard rate
 * - Adhoc 2023: 35% of Current Basic (BPS 1-16) or 30% (BPS 17-22)
 * - Adhoc 2024: 25% of Revised Basic 2026
 * - Adhoc 2026: 7% of Revised Basic 2026
 * - Differential Allowance 2026: 2% of 2022 Basic Pay (Only for BPS 1-16)
 * - Gross Salary = Sum of all above
 * - Deductions: GP Fund, Benevolent Fund (BF), Group Insurance (GI), and Estimated Income Tax (1% of gross salary above 50,000)
 * - Net Salary = Gross Salary - Total Deductions
 * - Net Increase in Monthly Salary 2026 = Adhoc 2026 + Diff 2026 + Conveyance Increase
 */
export function calculateSindhSalary2026(
  bpsNumber: number,
  stage: number,
  customCurrentBasic?: number
): SalaryCalculationResult {
  const safeStage = Number.isFinite(stage) ? Math.max(0, Math.min(30, Math.floor(stage))) : 0;
  const bpsRow =
    SINDH_BPS_CHART_2026.find((r) => r.bps === bpsNumber) || SINDH_BPS_CHART_2026[13]; // default BPS-14

  const autoCurrentBasic2022 = bpsRow.minBasic2022 + safeStage * bpsRow.increment2022;
  const currentRunningBasic2022 =
    customCurrentBasic !== undefined && Number.isFinite(customCurrentBasic) && customCurrentBasic > 0
      ? customCurrentBasic
      : autoCurrentBasic2022;

  const revisedBasic2026 = bpsRow.minBasic2026 + safeStage * bpsRow.increment2026;
  const houseRent = bpsRow.houseRent;
  const conveyanceBase = bpsRow.conveyanceBase;
  const conveyance2026 = Math.round(bpsRow.conveyanceBase * 1.5);
  const conveyanceIncrease = conveyance2026 - conveyanceBase;
  const medical = bpsRow.medical;

  const isBPS1to16 = bpsRow.bps >= 1 && bpsRow.bps <= 16;
  const adhoc2023RatePercent = isBPS1to16 ? 35 : 30;
  const adhoc2023 = Math.round(currentRunningBasic2022 * (adhoc2023RatePercent / 100));
  const adhoc2024 = Math.round(revisedBasic2026 * 0.25);
  const adhoc2026 = Math.round(revisedBasic2026 * 0.07);
  const differential2026 = isBPS1to16 ? Math.round(currentRunningBasic2022 * 0.02) : 0;

  const grossSalary =
    revisedBasic2026 +
    houseRent +
    conveyance2026 +
    medical +
    adhoc2023 +
    adhoc2024 +
    adhoc2026 +
    differential2026;

  const gpFund = bpsRow.gpFund;
  const benevolentFund = bpsRow.benevolentFund;
  const groupInsurance = bpsRow.groupInsurance;
  const incomeTax = grossSalary > 50000 ? Math.round((grossSalary - 50000) * 0.01) : 0;

  const totalDeductions = gpFund + benevolentFund + groupInsurance + incomeTax;
  const netSalary = grossSalary - totalDeductions;
  const netMonthlyIncrease2026 = adhoc2026 + differential2026 + conveyanceIncrease;

  return {
    bpsRow,
    stage,
    currentRunningBasic2022,
    revisedBasic2026,
    houseRent,
    conveyanceBase,
    conveyance2026,
    conveyanceIncrease,
    medical,
    adhoc2023RatePercent,
    adhoc2023,
    adhoc2024,
    adhoc2026,
    differential2026,
    grossSalary,
    gpFund,
    benevolentFund,
    groupInsurance,
    incomeTax,
    totalDeductions,
    netSalary,
    netMonthlyIncrease2026,
  };
}
