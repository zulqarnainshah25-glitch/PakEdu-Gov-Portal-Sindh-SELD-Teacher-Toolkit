import React, { useState } from 'react';
import { Calculator, Printer, RotateCcw, TrendingUp, Wallet, ShieldAlert, Landmark } from 'lucide-react';
import { SINDH_BPS_CHART_2026, calculateSindhSalary2026 } from '../data/salaryScale2026';
import { triggerPrintDocument } from '../utils/printDocument';

export const SalaryCalculatorTool: React.FC = () => {
  const [employeeName, setEmployeeName] = useState('Muhammad Aslam Memon');
  const [selectedBps, setSelectedBps] = useState<number>(14); // Default BPS-14 (PST/JEST)
  const [selectedStage, setSelectedStage] = useState<number>(5);
  const [customRunningBasic, setCustomRunningBasic] = useState<string>('');

  // Auto-calculated running basic pay when BPS and Stage are selected
  const bpsRow =
    SINDH_BPS_CHART_2026.find((r) => r.bps === selectedBps) || SINDH_BPS_CHART_2026[13];
  const autoRunningBasic = bpsRow.minBasic2022 + selectedStage * bpsRow.increment2022;

  const effectiveRunningBasic =
    customRunningBasic.trim() !== '' && !isNaN(Number(customRunningBasic))
      ? Number(customRunningBasic)
      : autoRunningBasic;

  const handleBpsChange = (newBps: number) => {
    setSelectedBps(newBps);
    setCustomRunningBasic(''); // Reset manual override so auto-fill takes effect immediately
  };

  const handleStageChange = (newStage: number) => {
    setSelectedStage(newStage);
    setCustomRunningBasic(''); // Reset manual override so auto-fill takes effect immediately
  };

  const result = calculateSindhSalary2026(selectedBps, selectedStage, effectiveRunningBasic);

  const formatPKR = (amount: number) =>
    `Rs. ${amount.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      {/* Input Form Card (Hidden in Print) */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Sindh Government Salary Calculator 2026
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Computes 2026 Revised Basic Pay, 50% Increased Conveyance, Adhoc 2023/2024/2026, Differential Allowance, and Deductions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEmployeeName('');
                setSelectedBps(14);
                setSelectedStage(0);
                setCustomRunningBasic('');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={triggerPrintDocument}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#00563B] hover:bg-[#0F5E30] rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print 2026 Salary Slip (A4)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Employee Name (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Employee Name <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Enter Employee Name"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B] focus:bg-white"
            />
          </div>

          {/* 2. Basic Pay Scale (BPS-01 to BPS-22) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Basic Pay Scale (BPS-01 to BPS-22)
            </label>
            <select
              value={selectedBps}
              onChange={(e) => handleBpsChange(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B] focus:bg-white font-medium"
            >
              {SINDH_BPS_CHART_2026.map((row) => (
                <option key={row.bps} value={row.bps}>
                  {row.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Pay Stage (0 to 30) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pay Stage (Stage 0 to 30)
            </label>
            <select
              value={selectedStage}
              onChange={(e) => handleStageChange(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B] focus:bg-white"
            >
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i} value={i}>
                  Stage {i} {i === 0 ? '(Initial Basic)' : `(+${i} Increments)`}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Current Running Basic Pay (Auto-fill when BPS and Stage are selected) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Current Running Basic Pay (2022)
            </label>
            <input
              type="number"
              value={customRunningBasic !== '' ? customRunningBasic : autoRunningBasic}
              onChange={(e) => setCustomRunningBasic(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums font-semibold text-[#00563B] bg-emerald-50/60 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B] focus:bg-white"
            />
            <span className="block text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
              Auto-filled: {formatPKR(autoRunningBasic)} (Min {bpsRow.minBasic2022} + {selectedStage}×{bpsRow.increment2022})
            </span>
          </div>
        </div>
      </div>

      {/* Printable A4 Container */}
      <div className="printable-a4-sheet space-y-6 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
        {/* Header */}
        <div className="border-b-2 border-[#00563B] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#00563B]">
              Government of Sindh · Finance & Education Department
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
              Monthly Salary Revision Statement — Budget 2026
            </h1>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-600 sm:text-right">
            <div>Employee: <strong className="text-slate-900">{employeeName || 'Sindh Govt Employee'}</strong></div>
            <div>Scale: <strong className="text-[#00563B]">BPS-{String(selectedBps).padStart(2, '0')} (Stage {selectedStage})</strong></div>
          </div>
        </div>

        {/* 4 Prominent Colored Summary Cards (BLUE, RED, DARK GREEN, VIBRANT GREEN) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Prominent BLUE Card for Gross Salary */}
          <div className="bg-blue-700 text-white rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">
                Gross Salary 2026
              </span>
              <Wallet className="w-5 h-5 text-blue-200 shrink-0" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono tabular-nums">
                {formatPKR(result.grossSalary)}
              </div>
              <p className="text-xs text-blue-100 mt-1">
                Revised Basic + All Allowances
              </p>
            </div>
          </div>

          {/* 2. Prominent RED Card for Deductions */}
          <div className="bg-red-700 text-white rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-100">
                Total Deductions
              </span>
              <ShieldAlert className="w-5 h-5 text-red-200 shrink-0" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono tabular-nums">
                {formatPKR(result.totalDeductions)}
              </div>
              <p className="text-xs text-red-100 mt-1">
                GP Fund, BF, GI & Income Tax
              </p>
            </div>
          </div>

          {/* 3. Prominent DARK GREEN Card for Net Salary */}
          <div className="bg-[#00563B] text-white rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
                Net Take-Home Salary
              </span>
              <Landmark className="w-5 h-5 text-emerald-200 shrink-0" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono tabular-nums">
                {formatPKR(result.netSalary)}
              </div>
              <p className="text-xs text-emerald-100 mt-1">
                Gross Salary Minus Deductions
              </p>
            </div>
          </div>

          {/* 4. Prominent VIBRANT GREEN Card for Net Increase in Monthly Salary 2026 */}
          <div className="bg-emerald-500 text-slate-950 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Net Increase in Monthly Salary 2026
              </span>
              <TrendingUp className="w-5 h-5 text-slate-900 shrink-0" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-950">
                +{formatPKR(result.netMonthlyIncrease2026)}
              </div>
              <p className="text-xs font-medium text-slate-900 mt-1">
                Adhoc 2026 + Diff 2026 + Conveyance Inc.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pay & Allowances Table (2 columns wide) */}
          <div className="lg:col-span-2 border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#00563B]" />
                Part I: Pay & Monthly Allowances Breakdown
              </h3>
              <span className="text-xs font-mono text-slate-500">
                BPS-{String(selectedBps).padStart(2, '0')} · Stage {selectedStage}
              </span>
            </div>
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                  <th className="py-2.5 px-4 font-semibold">Head of Account / Allowance</th>
                  <th className="py-2.5 px-4 font-semibold">Calculation Formula</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-slate-50/60">
                  <td className="py-2.5 px-4 font-medium text-slate-600">
                    Current Running Basic Pay (2022 Scale)
                  </td>
                  <td className="py-2.5 px-4 font-mono text-xs text-slate-500">
                    {bpsRow.minBasic2022} + ({selectedStage} × {bpsRow.increment2022})
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                    {formatPKR(result.currentRunningBasic2022)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    1. Revised Basic Pay 2026
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-600">
                    Min {bpsRow.minBasic2026} + ({selectedStage} × Inc {bpsRow.increment2026})
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                    {formatPKR(result.revisedBasic2026)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-800">
                    2. House Rent Allowance (HRA)
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-500">
                    Fixed rate based on BPS-{String(selectedBps).padStart(2, '0')}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800">
                    {formatPKR(result.houseRent)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-800">
                    3. Conveyance Allowance (2026 Revised)
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-500">
                    50% increased rate (Base {formatPKR(result.conveyanceBase)} + {formatPKR(result.conveyanceIncrease)})
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800">
                    {formatPKR(result.conveyance2026)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-800">
                    4. Medical Allowance
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-500">
                    Fixed standard rate
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800">
                    {formatPKR(result.medical)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-800">
                    5. Adhoc Relief Allowance 2023
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-500">
                    {result.adhoc2023RatePercent}% of Current Basic ({selectedBps <= 16 ? 'BPS 1–16' : 'BPS 17–22'})
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800">
                    {formatPKR(result.adhoc2023)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-800">
                    6. Adhoc Relief Allowance 2024
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-500">
                    25% of Revised Basic 2026
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800">
                    {formatPKR(result.adhoc2024)}
                  </td>
                </tr>
                <tr className="bg-emerald-50/50">
                  <td className="py-2.5 px-4 font-semibold text-[#00563B]">
                    7. Adhoc Relief Allowance 2026
                  </td>
                  <td className="py-2.5 px-4 text-xs text-[#00563B]">
                    7% of Revised Basic 2026
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-[#00563B]">
                    {formatPKR(result.adhoc2026)}
                  </td>
                </tr>
                <tr className="bg-emerald-50/50">
                  <td className="py-2.5 px-4 font-semibold text-[#00563B]">
                    8. Differential Allowance 2026
                  </td>
                  <td className="py-2.5 px-4 text-xs text-[#00563B]">
                    {selectedBps <= 16
                      ? '2% of 2022 Basic Pay (BPS 1–16)'
                      : 'Not Applicable for BPS 17–22 (0%)'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-[#00563B]">
                    {formatPKR(result.differential2026)}
                  </td>
                </tr>
                <tr className="bg-blue-50 border-t-2 border-blue-200 font-bold text-blue-950">
                  <td className="py-3 px-4" colSpan={2}>
                    Total Gross Monthly Salary (Sum of Items 1 to 8)
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-base">
                    {formatPKR(result.grossSalary)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Deductions & Net Increase Breakdown (1 column wide) */}
          <div className="space-y-6">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-red-50 px-4 py-3 border-b border-red-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-900">
                  Part II: Monthly Deductions
                </h3>
              </div>
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2.5 px-4 text-slate-700">GP Fund Subscription</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900">
                      {formatPKR(result.gpFund)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-slate-700">Benevolent Fund (BF)</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900">
                      {formatPKR(result.benevolentFund)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-slate-700">Group Insurance (GI)</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900">
                      {formatPKR(result.groupInsurance)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-slate-700">
                      Estimated Income Tax
                      <span className="block text-[11px] text-slate-400">
                        1% of Gross Salary above Rs. 50,000
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900">
                      {formatPKR(result.incomeTax)}
                    </td>
                  </tr>
                  <tr className="bg-red-50/70 font-bold text-red-900">
                    <td className="py-3 px-4">Total Deductions</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {formatPKR(result.totalDeductions)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 2026 Monthly Net Increase Breakdown Card */}
            <div className="border border-emerald-300 bg-emerald-50/60 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#00563B]">
                Part III: 2026 Monthly Increase Summary
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Adhoc Relief 2026 (7%):</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    +{formatPKR(result.adhoc2026)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Differential Allowance 2026 (2%):</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    +{formatPKR(result.differential2026)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Conveyance 50% Increase:</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    +{formatPKR(result.conveyanceIncrease)}
                  </span>
                </div>
                <div className="pt-2 border-t border-emerald-300 flex justify-between text-sm font-bold text-[#00563B]">
                  <span>Net Monthly Increase 2026:</span>
                  <span className="font-mono tabular-nums">
                    +{formatPKR(result.netMonthlyIncrease2026)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
