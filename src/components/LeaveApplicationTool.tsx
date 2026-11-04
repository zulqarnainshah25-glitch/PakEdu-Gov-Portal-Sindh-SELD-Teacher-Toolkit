import React, { useState } from 'react';
import { Printer, FileCheck2, RotateCcw, Calendar, ShieldCheck } from 'lucide-react';
import {
  SELD_38_LEAVE_TYPES,
  SINDH_DISTRICTS,
  SELD_DESIGNATIONS,
  calculateTotalService,
  calculateTotalLeaveDays,
} from '../data/seldLeaveTypes';
import { triggerPrintDocument } from '../utils/printDocument';

export const LeaveApplicationTool: React.FC = () => {
  // School Location
  const [district, setDistrict] = useState('Hyderabad');
  const [taluka, setTaluka] = useState('Latifabad');
  const [uc, setUc] = useState('UC-07 Latifabad');
  const [locationType, setLocationType] = useState<'Rural' | 'Urban'>('Urban');

  // Employee Details
  const [fullName, setFullName] = useState('Zulqarnain Ali Shah');
  const [personnelId, setPersonnelId] = useState('10849231');
  const [infoRegId, setInfoRegId] = useState('SELD-2026-88412');
  const [staffId, setStaffId] = useState('STF-403201');
  const [cnic, setCnic] = useState('41304-1234567-1');
  const [mobile, setMobile] = useState('0300-1234567');
  const [designation, setDesignation] = useState('HST (High School Teacher)');
  const [staffType, setStaffType] = useState<'Teaching' | 'Non-Teaching'>('Teaching');
  const [bps, setBps] = useState('BPS-16');
  const [appointmentDate, setAppointmentDate] = useState('2016-04-15');

  // School Details
  const [semisCode, setSemisCode] = useState('403020198');
  const [institutionName, setInstitutionName] = useState(
    'Government Boys High School Latifabad No. 7, Hyderabad'
  );

  // Leave Details
  const [natureOfLeave, setNatureOfLeave] = useState(SELD_38_LEAVE_TYPES[0]); // Default 1. Casual Leave (CL)
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });

  // Leave Balance
  const [totalAllowed, setTotalAllowed] = useState<number>(25);
  const [alreadyAvailed, setAlreadyAvailed] = useState<number>(6);

  // Auto-calculated logic
  const totalService = calculateTotalService(appointmentDate);
  const totalLeaveDays = calculateTotalLeaveDays(fromDate, toDate);
  const leaveBalance = Math.max(0, totalAllowed - alreadyAvailed);
  const remainingAfterCurrent = Math.max(0, leaveBalance - totalLeaveDays);

  return (
    <div className="space-y-6">
      {/* Input Form Card (Hidden in Print) */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              SELD FRAMES Official Leave Application Proforma Generator
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Auto-calculates Total Service (Years & Months), Applied Leave Days, and renders the 38-Leave Checklist Proforma.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFullName('');
                setPersonnelId('');
                setCnic('');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Name/IDs
            </button>
            <button
              type="button"
              onClick={triggerPrintDocument}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#00563B] hover:bg-[#0F5E30] rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              📥 Print / Download Leave Proforma (A4)
            </button>
          </div>
        </div>

        {/* Section 1: School Location & Institution */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#00563B] mb-3">
            A. School Location & SEMIS Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                District
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B]"
              >
                {SINDH_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Taluka / Town
              </label>
              <input
                type="text"
                value={taluka}
                onChange={(e) => setTaluka(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Union Council (UC)
              </label>
              <input
                type="text"
                value={uc}
                onChange={(e) => setUc(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location (Rural / Urban)
              </label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value as 'Rural' | 'Urban')}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B]"
              >
                <option value="Urban">Urban</option>
                <option value="Rural">Rural</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SEMIS Code (9-Digit)
              </label>
              <input
                type="text"
                value={semisCode}
                onChange={(e) => setSemisCode(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B]"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institution / School Name
              </label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Employee Details */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#00563B] mb-3">
            B. Employee Service & Identification Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Personnel ID (PID)
              </label>
              <input
                type="text"
                value={personnelId}
                onChange={(e) => setPersonnelId(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Info Reg ID
              </label>
              <input
                type="text"
                value={infoRegId}
                onChange={(e) => setInfoRegId(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Staff ID (FRAMES)
              </label>
              <input
                type="text"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CNIC Number
              </label>
              <input
                type="text"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                placeholder="41304-1234567-1"
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number
              </label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Designation
              </label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B]"
              >
                {SELD_DESIGNATIONS.map((des) => (
                  <option key={des} value={des}>
                    {des}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Staff Type & BPS
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={staffType}
                  onChange={(e) => setStaffType(e.target.value as 'Teaching' | 'Non-Teaching')}
                  className="w-full px-2.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B]"
                >
                  <option value="Teaching">Teaching</option>
                  <option value="Non-Teaching">Non-Teaching</option>
                </select>
                <select
                  value={bps}
                  onChange={(e) => setBps(e.target.value)}
                  className="w-full px-2.5 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B]"
                >
                  {Array.from({ length: 22 }, (_, i) => `BPS-${String(i + 1).padStart(2, '0')}`).map(
                    (b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Appointment
              </label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B]"
              />
            </div>

            <div className="sm:col-span-3 flex items-center bg-emerald-50/70 border border-emerald-200 rounded-lg px-4 py-2.5 text-xs">
              <Calendar className="w-4 h-4 text-[#00563B] mr-2 shrink-0" />
              <span className="text-slate-700">
                Auto-Calculated Total Service up to Today:{' '}
                <strong className="font-mono text-[#00563B] text-sm">
                  {totalService.formatted}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Leave Details & Balance */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#00563B] mb-3">
            C. Leave Details (38 Official Options) & Balance Record
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nature of Leave (Select from 38 SELD Options)
              </label>
              <select
                value={natureOfLeave}
                onChange={(e) => setNatureOfLeave(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B] font-medium"
              >
                {SELD_38_LEAVE_TYPES.map((lt) => (
                  <option key={lt} value={lt}>
                    {lt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Allowed (Days)
              </label>
              <input
                type="number"
                value={totalAllowed}
                onChange={(e) => setTotalAllowed(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Already Availed (Days)
              </label>
              <input
                type="number"
                value={alreadyAvailed}
                onChange={(e) => setAlreadyAvailed(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00563B]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* OFFICIAL SELD FRAMES LEAVE APPLICATION PROFORMA (A4 PRINTABLE)      */}
      {/* =================================================================== */}
      <div className="printable-a4-sheet bg-white border border-slate-300 rounded-xl p-6 sm:p-8 shadow-xs space-y-5 text-slate-900">
        {/* Top Official Header with Dummy Logo Space on Top Left */}
        <div className="border-b-2 border-[#00563B] pb-4 flex items-center gap-4">
          {/* Dummy Logo Space on Top Left */}
          <div className="w-20 h-20 border-2 border-[#00563B] rounded-lg bg-[#00563B]/5 flex flex-col items-center justify-center text-center p-1.5 shrink-0">
            <ShieldCheck className="w-8 h-8 text-[#00563B]" />
            <span className="text-[9px] font-bold uppercase tracking-tighter text-[#00563B] leading-tight mt-0.5">
              GOVT OF SINDH
              <br />
              SELD LOGO
            </span>
          </div>

          <div className="flex-1 text-center">
            <h1 className="text-base sm:text-xl font-extrabold tracking-tight uppercase text-[#00563B]">
              GOVERNMENT OF SINDH, SCHOOL EDUCATION &amp; LITERACY DEPARTMENT
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-700 mt-0.5">
              FRAMES — Human Resource Management &amp; Leave Application Proforma
            </p>
            <p className="text-[11px] font-mono text-slate-500 mt-0.5">
              Official Application for Leave · Form Ref: SELD/FRAMES/{infoRegId || '2026'}
            </p>
          </div>

          <div className="hidden sm:flex flex-col items-end justify-center text-right font-mono text-[11px] text-slate-600 shrink-0">
            <span className="border border-slate-300 px-2 py-1 rounded bg-slate-50 font-bold text-slate-900">
              SEMIS: {semisCode}
            </span>
            <span className="mt-1">PID: {personnelId}</span>
          </div>
        </div>

        {/* Section 1: Structured Employee & School Details Table */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider bg-[#00563B] text-white px-3 py-1.5 rounded-t">
            1. Employee &amp; Institution Particulars
          </h2>
          <table className="w-full border-collapse border border-slate-300 text-xs">
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-600 w-1/6 border-r border-slate-300">
                  Full Name:
                </td>
                <td className="py-2 px-3 font-bold text-slate-900 w-2/6 border-r border-slate-300">
                  {fullName}
                </td>
                <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-600 w-1/6 border-r border-slate-300">
                  Personnel ID:
                </td>
                <td className="py-2 px-3 font-mono font-bold text-slate-900 w-2/6">
                  {personnelId} (Staff ID: {staffId})
                </td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-600 border-r border-slate-300">
                  CNIC &amp; Mobile:
                </td>
                <td className="py-2 px-3 font-mono text-slate-900 border-r border-slate-300">
                  {cnic} · {mobile}
                </td>
                <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-600 border-r border-slate-300">
                  Designation / BPS:
                </td>
                <td className="py-2 px-3 font-semibold text-slate-900">
                  {designation} ({bps} · {staffType})
                </td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-600 border-r border-slate-300">
                  Appointment Date:
                </td>
                <td className="py-2 px-3 font-mono text-slate-900 border-r border-slate-300">
                  {appointmentDate}
                </td>
                <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-600 border-r border-slate-300">
                  Total Service:
                </td>
                <td className="py-2 px-3 font-mono font-bold text-[#00563B]">
                  {totalService.formatted}
                </td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-600 border-r border-slate-300">
                  School Name:
                </td>
                <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-300">
                  {institutionName}
                </td>
                <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-600 border-r border-slate-300">
                  SEMIS &amp; Reg ID:
                </td>
                <td className="py-2 px-3 font-mono text-slate-900">
                  SEMIS: {semisCode} · Reg: {infoRegId}
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-600 border-r border-slate-300">
                  District / Taluka:
                </td>
                <td className="py-2 px-3 text-slate-900 border-r border-slate-300">
                  {district} / {taluka}
                </td>
                <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-600 border-r border-slate-300">
                  UC &amp; Area Type:
                </td>
                <td className="py-2 px-3 text-slate-900">
                  {uc} ({locationType})
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Checklist of All 38 Leave Types ([☑] Selected, [☐] Others) */}
        <div>
          <div className="flex items-center justify-between bg-[#00563B] text-white px-3 py-1.5 rounded-t">
            <h2 className="text-xs font-bold uppercase tracking-wider">
              2. Nature of Leave Applied For (38 Official SELD Categories)
            </h2>
            <span className="text-[11px] font-mono">
              Selected: {natureOfLeave}
            </span>
          </div>
          <div className="border border-slate-300 p-3 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-[11px] leading-snug">
            {SELD_38_LEAVE_TYPES.map((leaveItem) => {
              const isChecked = leaveItem === natureOfLeave;
              return (
                <div
                  key={leaveItem}
                  onClick={() => setNatureOfLeave(leaveItem)}
                  className={`flex items-center gap-1.5 py-0.5 px-1.5 rounded cursor-pointer ${
                    isChecked
                      ? 'bg-[#00563B]/10 font-bold text-[#00563B]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-mono text-xs shrink-0">
                    {isChecked ? '[☑]' : '[☐]'}
                  </span>
                  <span className="truncate">{leaveItem}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Applied Leave Period & Previous Leave Balance Table */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider bg-[#00563B] text-white px-3 py-1.5 rounded-t">
            3. Applied Leave Period &amp; Previous Leave Balance Record
          </h2>
          <table className="w-full border-collapse border border-slate-300 text-xs text-center">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold">
                <th className="py-2 px-2 border-r border-slate-300">From Date</th>
                <th className="py-2 px-2 border-r border-slate-300">To Date</th>
                <th className="py-2 px-2 border-r border-slate-300">Applied Total Days</th>
                <th className="py-2 px-2 border-r border-slate-300">Total Leave Allowed</th>
                <th className="py-2 px-2 border-r border-slate-300">Already Availed</th>
                <th className="py-2 px-2 border-r border-slate-300">Previous Balance</th>
                <th className="py-2 px-2">Remaining Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-mono tabular-nums font-bold text-slate-900">
                <td className="py-2.5 px-2 border-r border-slate-300">{fromDate}</td>
                <td className="py-2.5 px-2 border-r border-slate-300">{toDate}</td>
                <td className="py-2.5 px-2 border-r border-slate-300 bg-emerald-50 text-[#00563B] text-sm">
                  {totalLeaveDays} Day{totalLeaveDays === 1 ? '' : 's'}
                </td>
                <td className="py-2.5 px-2 border-r border-slate-300">{totalAllowed} Days</td>
                <td className="py-2.5 px-2 border-r border-slate-300">{alreadyAvailed} Days</td>
                <td className="py-2.5 px-2 border-r border-slate-300 text-blue-800">
                  {leaveBalance} Days
                </td>
                <td className="py-2.5 px-2 text-[#00563B]">{remainingAfterCurrent} Days</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 4: Solemn Affirmation Box */}
        <div className="border-2 border-[#00563B]/40 bg-emerald-50/40 rounded-lg p-3.5 flex items-start gap-3">
          <FileCheck2 className="w-5 h-5 text-[#00563B] shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-slate-800">
            <span className="font-bold uppercase text-[#00563B] block mb-0.5">
              Solemn Affirmation &amp; Undertaking by Applicant:
            </span>
            <p className="font-semibold italic text-slate-900">
              &ldquo;I state on solemn affirmation that I am neither absconder nor habitual absentee.&rdquo;
            </p>
          </div>
        </div>

        {/* Section 5: 3 Official Signature Boxes at the Bottom */}
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          {/* Box 1: Signature of Applicant */}
          <div className="border border-slate-300 rounded-lg p-4 flex flex-col justify-between h-28 bg-slate-50/30">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              1. Applicant Undertaking
            </span>
            <div>
              <div className="border-b border-slate-400 mb-1.5" />
              <p className="font-bold text-slate-900">Signature of Applicant</p>
              <p className="text-[11px] text-slate-600 truncate">
                {fullName} ({designation.split(' ')[0]})
              </p>
            </div>
          </div>

          {/* Box 2: Recommended By */}
          <div className="border border-slate-300 rounded-lg p-4 flex flex-col justify-between h-28 bg-slate-50/30">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              2. Forwarding Authority
            </span>
            <div>
              <div className="border-b border-slate-400 mb-1.5" />
              <p className="font-bold text-slate-900">Recommended By</p>
              <p className="text-[11px] text-slate-600">
                Headmaster / Principal (With Official Stamp)
              </p>
            </div>
          </div>

          {/* Box 3: Approved By */}
          <div className="border border-slate-300 rounded-lg p-4 flex flex-col justify-between h-28 bg-slate-50/30">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              3. Sanctioning Authority
            </span>
            <div>
              <div className="border-b border-slate-400 mb-1.5" />
              <p className="font-bold text-slate-900">Approved By</p>
              <p className="text-[11px] text-slate-600">
                TEO / DEO / Competent Authority (SELD)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
