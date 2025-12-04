import { Employee, PayrollEntry } from '../types';

/**
 * Formats a text file string for KWSP (EPF) Submission (Form A format)
 * NOTE: This is a simplified representation of the actual complex fixed-width format.
 */
export const generateKWSPFile = (entries: PayrollEntry[], employees: Employee[]): string => {
  const header = `H|12345678|PUNCHCLOCK MALAYSIA SDN BHD|${new Date().getMonth() + 1}|${new Date().getFullYear()}|01`;
  const body = entries.map((entry, idx) => {
    const emp = employees.find(e => e.id === entry.employeeId);
    return `D|${idx + 1}|${emp?.epfNo || '000000'}|${emp?.name.toUpperCase()}|${emp?.id}|${entry.basicSalary.toFixed(2)}|${entry.epf.toFixed(2)}`;
  }).join('\n');
  
  return `${header}\n${body}`;
};

/**
 * Formats a text file string for SOCSO (PERKESO) Submission
 */
export const generateSOCSOFile = (entries: PayrollEntry[], employees: Employee[]): string => {
  const header = `01${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}A3100012345PUNCHCLOCK MY`;
  const body = entries.map((entry, idx) => {
    const emp = employees.find(e => e.id === entry.employeeId);
    return `02${emp?.socsoNo || '000000000000'}${emp?.name.padEnd(40, ' ')}${entry.socso.toFixed(2).padStart(6, '0')}`;
  }).join('\n');

  return `${header}\n${body}`;
};

/**
 * Formats for LHDN (CP39)
 */
export const generateLHDNFile = (entries: PayrollEntry[], employees: Employee[]): string => {
  return entries.map(entry => {
     const emp = employees.find(e => e.id === entry.employeeId);
     return `${emp?.taxNo || 'OG0000000'}|${emp?.name}|${entry.pcb.toFixed(2)}`;
  }).join('\n');
};