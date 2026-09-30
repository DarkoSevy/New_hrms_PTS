import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// PDF Export Helper
export const exportToPDF = (
    data: any[],
    columns: { header: string; dataKey: string }[],
    filename: string,
    title?: string
) => {
    const doc = new jsPDF();

    // Add title if provided
    if (title) {
        doc.setFontSize(16);
        doc.text(title, 14, 15);
    }

    // Prepare table data
    const headers = columns.map(col => col.header);
    const rows = data.map(item =>
        columns.map(col => item[col.dataKey] || '')
    );

    // Add table
    autoTable(doc, {
        head: [headers],
        body: rows,
        startY: title ? 25 : 15,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [15, 52, 67] },
    });

    // Save PDF
    doc.save(`${filename}.pdf`);
};

// Excel Export Helper
export const exportToExcel = (
    data: any[],
    filename: string,
    sheetName: string = 'Sheet1'
) => {
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Save file
    XLSX.writeFile(wb, `${filename}.xlsx`);
};

// Multi-sheet Excel Export Helper
export const exportMultipleSheetsToExcel = (
    sheets: { [sheetName: string]: any[] },
    filename: string
) => {
    const wb = XLSX.utils.book_new();

    Object.keys(sheets).forEach(sheetName => {
        const data = sheets[sheetName];
        if (Array.isArray(data) && data.length > 0) {
            // Truncate sheet name to 31 chars (Excel limit)
            const safeSheetName = sheetName.substring(0, 31);
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
        }
    });

    XLSX.writeFile(wb, `${filename}.xlsx`);
};

// CSV Export Helper
export const exportToCSV = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Format data for export
export const formatDataForExport = (data: any[], fields: string[]) => {
    return data.map(item => {
        const formatted: any = {};
        fields.forEach(field => {
            formatted[field] = item[field];
        });
        return formatted;
    });
};
