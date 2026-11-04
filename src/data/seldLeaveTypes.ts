/**
 * All 38 Official Nature of Leave Options for SELD FRAMES (Government of Sindh)
 */
export const SELD_38_LEAVE_TYPES: string[] = [
  '1. Casual Leave (CL)',
  '2. Earned Leave (Full Pay)',
  '3. Earned Leave (Half Pay)',
  '4. Medical Leave (With Medical Certificate)',
  '5. Maternity Leave (1st Birth - 90 Days)',
  '6. Maternity Leave (2nd Birth - 90 Days)',
  '7. Maternity Leave (3rd Birth - 90 Days)',
  '8. Paternity Leave (30 Days)',
  '9. Iddat Leave (Special Leave - 130 Days)',
  '10. Hajj Leave (Special Religious Leave - 45 Days)',
  '11. Umrah Leave (Earned / Ex-Pakistan)',
  '12. Ziarat Leave (Ex-Pakistan)',
  '13. Ex-Pakistan Leave (Full Pay)',
  '14. Ex-Pakistan Leave (Half Pay)',
  '15. Ex-Pakistan Leave (Without Pay / EOL)',
  '16. Extraordinary Leave (EOL - Without Pay)',
  '17. Study Leave (In-Country - Full Pay)',
  '18. Study Leave (In-Country - Half Pay)',
  '19. Study Leave (Abroad / Foreign Scholarship)',
  '20. Leave Preparatory to Retirement (LPR - Up to 365 Days)',
  '21. Disability Leave (Special Medical)',
  '22. Hospital Leave (In-Patient Treatment)',
  '23. Quarantine Leave (Infectious Disease)',
  '24. Recreation Leave (15 Days)',
  '25. Special Leave for Female Civil Servants',
  '26. Leave on Account of Accident on Duty',
  '27. Departmental Examination Leave',
  '28. Professional Training / B.Ed / M.Ed Leave',
  '29. Blood Donation Special Leave',
  '30. Court Attendance / Official Witness Leave',
  '31. Election Duty Compensatory Leave',
  '32. Polio / National Census Duty Compensatory Leave',
  '33. Natural Calamity / Flood Relief Special Leave',
  '34. Bereavement / Emergency Family Leave',
  '35. Post-Retirement Encashment / Commuted Leave',
  '36. Deputation / Lien Transition Leave',
  '37.Leave Not Due (Advance against Future Earned Leave)',
  '38. Special Minority Religious Festival Leave',
];

export const SINDH_DISTRICTS: string[] = [
  'Karachi Central',
  'Karachi East',
  'Karachi South',
  'Karachi West',
  'Korangi',
  'Malir',
  'Keamari',
  'Hyderabad',
  'Jamshoro',
  'Matiari',
  'Tando Allahyar',
  'Tando Muhammad Khan',
  'Badin',
  'Dadu',
  'Thatta',
  'Sujawal',
  'Sukkur',
  'Khairpur Mirs',
  'Ghotki',
  'Shaheed Benazirabad (Nawabshah)',
  'Naushahro Feroze',
  'Sanghar',
  'Larkana',
  'Kamber Shahdadkot',
  'Shikarpur',
  'Jacobabad',
  'Kashmore @ Kandhkot',
  'Mirpurkhas',
  'Umerkot',
  'Tharparkar @ Mithi',
];

export const SELD_DESIGNATIONS: string[] = [
  'PST (Primary School Teacher)',
  'JEST (Junior Elementary School Teacher)',
  'HST (High School Teacher)',
  'SST (Secondary School Teacher)',
  'SS (Subject Specialist)',
  'SSS (Senior Subject Specialist)',
  'DT (Drawing Teacher)',
  'OT (Oriental Teacher)',
  'PET (Physical Education Teacher)',
  'WIT (Workshop Instructor)',
  'HM (Headmaster / Headmistress)',
  'Principal',
  'TEO (Taluka Education Officer)',
  'DEO (District Education Officer)',
  'Junior Clerk',
  'Senior Clerk',
  'Assistant / Superintendent',
  'Lab Assistant',
  'Naib Qasid / Chowkidar',
];

export interface ServiceDuration {
  years: number;
  months: number;
  days: number;
  formatted: string;
}

/**
 * Auto-calculates Total Service (Years and Months) from Date of Appointment up to today
 */
export function calculateTotalService(appointmentDateStr: string): ServiceDuration {
  if (!appointmentDateStr) {
    return { years: 0, months: 0, days: 0, formatted: '0 Years, 0 Months' };
  }

  const start = new Date(appointmentDateStr);
  const now = new Date();

  if (isNaN(start.getTime()) || start > now) {
    return { years: 0, months: 0, days: 0, formatted: '0 Years, 0 Months' };
  }

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return {
    years,
    months,
    days,
    formatted: `${years} Year${years === 1 ? '' : 's'}, ${months} Month${months === 1 ? '' : 's'}`,
  };
}

/**
 * Auto-calculates Total Days of leave based on From Date and To Date (inclusive)
 */
export function calculateTotalLeaveDays(fromDateStr: string, toDateStr: string): number {
  if (!fromDateStr || !toDateStr) return 0;
  const from = new Date(fromDateStr);
  const to = new Date(toDateStr);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return 0;
  const diffMs = to.getTime() - from.getTime();
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}
