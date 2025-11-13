/**
 * XLSX Export Generator for Vibe University
 * 
 * Generates Excel spreadsheets from data
 * Supports formulas, charts, formatting, and multiple sheets
 */

import * as XLSX from 'xlsx-js-style';

export interface XLSXExportOptions {
  title?: string;
  author?: string;
  subject?: string;
  
  // Sheet settings
  sheetName?: string;
  
  // Formatting
  includeHeaders?: boolean;
  autoWidth?: boolean;
  freezeHeader?: boolean;
  
  // Styling
  headerStyle?: XLSX.CellStyle;
  dataStyle?: XLSX.CellStyle;
}

export interface XLSXSheet {
  name: string;
  data: any[][];
  headers?: string[];
  formulas?: { [cell: string]: string };
  styles?: { [cell: string]: XLSX.CellStyle };
  columnWidths?: number[];
  merges?: string[];
}

const DEFAULT_OPTIONS: Required<XLSXExportOptions> = {
  title: 'Spreadsheet',
  author: '',
  subject: '',
  sheetName: 'Sheet1',
  includeHeaders: true,
  autoWidth: true,
  freezeHeader: true,
  headerStyle: {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '4472C4' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  },
  dataStyle: {
    alignment: { vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'D0D0D0' } },
      bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
      left: { style: 'thin', color: { rgb: 'D0D0D0' } },
      right: { style: 'thin', color: { rgb: 'D0D0D0' } },
    },
  },
};

/**
 * Generate XLSX from data
 */
export async function generateXLSX(
  sheets: XLSXSheet[],
  options: XLSXExportOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  
  // Set workbook properties
  workbook.Props = {
    Title: opts.title,
    Author: opts.author,
    Subject: opts.subject,
    CreatedDate: new Date(),
  };
  
  // Add sheets
  for (const sheetData of sheets) {
    addSheet(workbook, sheetData, opts);
  }
  
  // Generate blob
  const wbout = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    cellStyles: true,
  });
  
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Add sheet to workbook
 */
function addSheet(
  workbook: XLSX.WorkBook,
  sheetData: XLSXSheet,
  options: Required<XLSXExportOptions>
): void {
  let data = sheetData.data;
  
  // Add headers if provided
  if (sheetData.headers && options.includeHeaders) {
    data = [sheetData.headers, ...data];
  }
  
  // Create worksheet from data
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // Apply styles
  applyStyles(worksheet, data, sheetData, options);
  
  // Apply formulas
  if (sheetData.formulas) {
    applyFormulas(worksheet, sheetData.formulas);
  }
  
  // Set column widths
  if (sheetData.columnWidths) {
    worksheet['!cols'] = sheetData.columnWidths.map((w) => ({ wch: w }));
  } else if (options.autoWidth) {
    worksheet['!cols'] = calculateColumnWidths(data);
  }
  
  // Freeze header row
  if (options.freezeHeader && sheetData.headers) {
    worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };
  }
  
  // Apply merges
  if (sheetData.merges) {
    worksheet['!merges'] = sheetData.merges.map((range) =>
      XLSX.utils.decode_range(range)
    );
  }
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetData.name);
}

/**
 * Apply styling to cells
 */
function applyStyles(
  worksheet: XLSX.WorkSheet,
  data: any[][],
  sheetData: XLSXSheet,
  options: Required<XLSXExportOptions>
): void {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      
      if (!cell) continue;
      
      // Apply header style
      if (row === 0 && sheetData.headers && options.includeHeaders) {
        cell.s = options.headerStyle;
      }
      // Apply data style
      else {
        cell.s = options.dataStyle;
      }
      
      // Apply custom styles
      if (sheetData.styles && sheetData.styles[cellAddress]) {
        cell.s = { ...cell.s, ...sheetData.styles[cellAddress] };
      }
      
      // Format numbers
      if (typeof cell.v === 'number') {
        cell.z = '#,##0.00';
      }
    }
  }
}

/**
 * Apply formulas to cells
 */
function applyFormulas(
  worksheet: XLSX.WorkSheet,
  formulas: { [cell: string]: string }
): void {
  for (const [cellAddress, formula] of Object.entries(formulas)) {
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].f = formula;
    } else {
      worksheet[cellAddress] = { t: 'n', f: formula };
    }
  }
}

/**
 * Calculate optimal column widths
 */
function calculateColumnWidths(data: any[][]): { wch: number }[] {
  if (data.length === 0) return [];
  
  const maxCols = Math.max(...data.map((row) => row.length));
  const widths: number[] = new Array(maxCols).fill(10);
  
  for (const row of data) {
    row.forEach((cell, col) => {
      const cellLength = String(cell || '').length;
      widths[col] = Math.max(widths[col], Math.min(cellLength + 2, 50));
    });
  }
  
  return widths.map((w) => ({ wch: w }));
}

/**
 * Convert object array to sheet data
 */
export function objectsToSheetData(objects: any[]): {
  headers: string[];
  data: any[][];
} {
  if (objects.length === 0) {
    return { headers: [], data: [] };
  }
  
  // Extract headers from first object
  const headers = Object.keys(objects[0]);
  
  // Convert objects to rows
  const data = objects.map((obj) => headers.map((key) => obj[key]));
  
  return { headers, data };
}

/**
 * Create sheet with statistical data
 */
export function createStatisticalSheet(
  data: number[],
  stats: {
    mean: number;
    median: number;
    mode: number;
    stdDev: number;
    variance: number;
    min: number;
    max: number;
    count: number;
  }
): XLSXSheet {
  const sheetData: any[][] = [
    ['Raw Data', ...data],
    [],
    ['Statistic', 'Value'],
    ['Mean', stats.mean],
    ['Median', stats.median],
    ['Mode', stats.mode],
    ['Standard Deviation', stats.stdDev],
    ['Variance', stats.variance],
    ['Minimum', stats.min],
    ['Maximum', stats.max],
    ['Count', stats.count],
  ];
  
  const styles: { [cell: string]: XLSX.CellStyle } = {
    A3: {
      font: { bold: true },
      fill: { fgColor: { rgb: 'E7E6E6' } },
    },
    B3: {
      font: { bold: true },
      fill: { fgColor: { rgb: 'E7E6E6' } },
    },
  };
  
  return {
    name: 'Statistics',
    data: sheetData,
    styles,
    columnWidths: [20, 15],
  };
}

/**
 * Create sheet with chart data
 */
export function createChartDataSheet(
  labels: string[],
  datasets: { name: string; data: number[] }[]
): XLSXSheet {
  const headers = ['Label', ...datasets.map((d) => d.name)];
  const data: any[][] = [];
  
  for (let i = 0; i < labels.length; i++) {
    const row: any[] = [labels[i]];
    for (const dataset of datasets) {
      row.push(dataset.data[i] || 0);
    }
    data.push(row);
  }
  
  // Add formulas for totals
  const formulas: { [cell: string]: string } = {};
  const totalRow = labels.length + 1;
  
  formulas[`A${totalRow}`] = '"Total"';
  for (let col = 1; col < headers.length; col++) {
    const colLetter = String.fromCharCode(65 + col);
    formulas[`${colLetter}${totalRow}`] = `SUM(${colLetter}2:${colLetter}${totalRow - 1})`;
  }
  
  return {
    name: 'Chart Data',
    headers,
    data,
    formulas,
    columnWidths: [15, ...new Array(datasets.length).fill(12)],
  };
}

/**
 * Export simple data to XLSX
 */
export async function exportSimpleXLSX(
  data: any[][],
  filename: string,
  options: XLSXExportOptions = {}
): Promise<void> {
  const sheets: XLSXSheet[] = [
    {
      name: options.sheetName || 'Sheet1',
      data,
    },
  ];
  
  const blob = await generateXLSX(sheets, options);
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export to XLSX and trigger download
 */
export async function exportToXLSX(
  sheets: XLSXSheet[],
  filename: string,
  options: XLSXExportOptions = {}
): Promise<void> {
  const blob = await generateXLSX(sheets, options);
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
