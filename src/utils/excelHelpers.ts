import * as XLSX from 'xlsx';

export interface BatchInvoiceData {
    invoiceNo: string;
    invoiceDate: string;
    billingPeriod: string;
    currency: string;
    items: {
        date: string;
        description: string;
        amount: string;
    }[];
}

export const downloadBatchTemplate = () => {
    const headers = [
        'Invoice No',
        'Invoice Date',
        'Billing Period',
        'Currency',
        'Item Date',
        'Item Description',
        'Item Amount'
    ];

    const sampleData = [
        ['20260101', '01/01/2026', '2026/01/01-2026/01/31', 'USD', '2026年1月', '服务费', '1000.00'],
        ['20260101', '01/01/2026', '2026/01/01-2026/01/31', 'USD', '2026年1月', '咨询费', '500.00'],
        ['20260102', '02/01/2026', '2026/01/01-2026/01/31', 'CNY', '2026年1月', '设备采购', '50000.00']
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.writeFile(wb, "invoice_batch_template.xlsx");
};

export const parseExcelFile = (file: File): Promise<BatchInvoiceData[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];

                const invoiceMap = new Map<string, BatchInvoiceData>();

                jsonData.forEach((row) => {
                    const invoiceNo = String(row['Invoice No'] || row['InvoiceNo'] || '');
                    if (!invoiceNo) return;

                    if (!invoiceMap.has(invoiceNo)) {
                        invoiceMap.set(invoiceNo, {
                            invoiceNo,
                            invoiceDate: String(row['Invoice Date'] || row['InvoiceDate'] || ''),
                            billingPeriod: String(row['Billing Period'] || row['BillingPeriod'] || ''),
                            currency: String(row['Currency'] || 'USD'),
                            items: []
                        });
                    }

                    const invoice = invoiceMap.get(invoiceNo)!;
                    invoice.items.push({
                        date: String(row['Item Date'] || row['ItemDate'] || ''),
                        description: String(row['Item Description'] || row['ItemDescription'] || ''),
                        amount: String(row['Item Amount'] || row['ItemAmount'] || '0')
                    });
                });

                resolve(Array.from(invoiceMap.values()));
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};
