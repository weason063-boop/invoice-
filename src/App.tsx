import { useState, useRef } from 'react';
import { Download, Plus, Trash2, Printer, FileSpreadsheet, Upload, FolderDown } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { downloadBatchTemplate, parseExcelFile, BatchInvoiceData } from './utils/excelHelpers';

interface InvoiceItem {
    id: string;
    date: string;
    description: string;
    amount: string;
}

const App = () => {
    const [invoiceNo, setInvoiceNo] = useState('2026010600102');
    const [invoiceDate, setInvoiceDate] = useState('06/01/2025');
    const [billingPeriod, setBillingPeriod] = useState('2025/12/01-2025/12/31');
    const [currency, setCurrency] = useState('USD');
    const [items, setItems] = useState<InvoiceItem[]>([
        { id: '1', date: '2025年12月', description: '广告推广费用', amount: '104,893.06' }
    ]);
    const [total, setTotal] = useState('104,893.06');

    // Batch Mode State
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [batchData, setBatchData] = useState<BatchInvoiceData[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    const previewRef = useRef<HTMLDivElement>(null);

    const addItem = () => {
        const newItem = { id: Date.now().toString(), date: '', description: '', amount: '' };
        setItems([...items, newItem]);
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, field: keyof InvoiceItem, value: string) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleDownloadPDF = async (filename?: string) => {
        if (!previewRef.current) return null;

        const canvas = await html2canvas(previewRef.current, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

        if (filename) {
            return pdf.output('blob');
        } else {
            pdf.save(`Invoice_${invoiceNo}.pdf`);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const data = await parseExcelFile(file);
            setBatchData(data);
        } catch (err) {
            alert('解析 Excel 失败，请确保格式正确');
            console.error(err);
        }
    };

    const processBatch = async () => {
        if (batchData.length === 0) return;
        setIsGenerating(true);
        const zip = new JSZip();
        const folder = zip.folder("Invoices");

        for (let i = 0; i < batchData.length; i++) {
            const inv = batchData[i];
            setProgress(((i + 1) / batchData.length) * 100);

            // Update State
            setInvoiceNo(inv.invoiceNo);
            setInvoiceDate(inv.invoiceDate);
            setBillingPeriod(inv.billingPeriod);
            setCurrency(inv.currency);
            setItems(inv.items.map((item, idx) => ({
                id: idx.toString(),
                date: item.date,
                description: item.description,
                amount: item.amount
            })));

            // Wait for render
            await new Promise(resolve => setTimeout(resolve, 100));

            // Calculate total
            // Simple string parsing logic, relies on cleaned data. 
            // In a real app we'd need robust number handling.
            // For now, assume excel helper or user entered valid numbers.
            // We'll leave total calculation manual or implementation specific.
            // But wait, the total state isn't auto-updated in parseExcel.
            // We should calculate it here or in excel helper.
            // Simple sum for now:
            const sum = inv.items.reduce((acc, item) => {
                const val = parseFloat(item.amount.replace(/,/g, ''));
                return acc + (isNaN(val) ? 0 : val);
            }, 0);
            setTotal(sum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

            await new Promise(resolve => setTimeout(resolve, 300)); // Ensure robust render

            const pdfBlob = await handleDownloadPDF('blob');
            if (pdfBlob && folder) {
                folder.file(`Invoice_${inv.invoiceNo}.pdf`, pdfBlob);
            }
        }

        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "Invoices_Batch.zip";
        link.click();

        setIsGenerating(false);
        alert('批量生成完成！');
    };

    return (
        <div className="app-container">
            {/* Sidebar Form */}
            <div className="form-sidebar">
                <h1 className="form-title">
                    <Printer size={24} /> 发票编辑器
                </h1>

                <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600 }}>批量模式</span>
                        <input
                            type="checkbox"
                            checked={isBatchMode}
                            onChange={(e) => setIsBatchMode(e.target.checked)}
                            style={{ width: '20px', height: '20px' }}
                        />
                    </div>
                    {isBatchMode && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <button onClick={downloadBatchTemplate} className="download-btn" style={{ background: '#fff', color: '#333', border: '1px solid #ccc', fontSize: '0.8rem' }}>
                                <FileSpreadsheet size={16} /> 下载导入模板
                            </button>
                            <label className="download-btn" style={{ background: '#fff', color: '#333', border: '1px solid #ccc', fontSize: '0.8rem', cursor: 'pointer' }}>
                                <Upload size={16} /> 上传 Excel 文件
                                <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileUpload} />
                            </label>
                            {batchData.length > 0 && (
                                <div style={{ fontSize: '0.8rem', color: 'green' }}>
                                    已读取 {batchData.length} 张发票
                                </div>
                            )}
                            <button
                                onClick={processBatch}
                                disabled={isGenerating || batchData.length === 0}
                                className="download-btn"
                                style={{ background: isGenerating ? '#999' : '#10b981' }}
                            >
                                {isGenerating ? `生成中 ${Math.round(progress)}%...` : <><FolderDown size={16} /> 一键生成并下载 ZIP</>}
                            </button>
                        </div>
                    )}
                </div>

                {!isBatchMode && (
                    <>
                        <div className="form-group">
                            <label className="form-label">发票号码 (Invoice #)</label>
                            <input
                                className="form-input"
                                value={invoiceNo}
                                onChange={(e) => setInvoiceNo(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">发票日期 (Invoice Date)</label>
                            <input
                                className="form-input"
                                value={invoiceDate}
                                onChange={(e) => setInvoiceDate(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">账单周期 (Billing Period)</label>
                            <input
                                className="form-input"
                                value={billingPeriod}
                                onChange={(e) => setBillingPeriod(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">币种 (Currency)</label>
                            <input
                                className="form-input"
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                            />
                        </div>


                        <div className="form-group">
                            <label className="form-label">项目列表</label>
                            {items.map((item) => (
                                <div key={item.id} style={{ marginBottom: '1rem', border: '1px solid #eee', padding: '0.5rem', borderRadius: '4px' }}>
                                    <input
                                        placeholder="日期"
                                        className="form-input"
                                        style={{ marginBottom: '0.5rem' }}
                                        value={item.date}
                                        onChange={(e) => updateItem(item.id, 'date', e.target.value)}
                                    />
                                    <input
                                        placeholder="项目描述"
                                        className="form-input"
                                        style={{ marginBottom: '0.5rem' }}
                                        value={item.description}
                                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                    />
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            placeholder="金额"
                                            className="form-input"
                                            value={item.amount}
                                            onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                                        />
                                        <button onClick={() => removeItem(item.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button className="download-btn" onClick={addItem} style={{ backgroundColor: '#666', marginTop: '0.5rem' }}>
                                <Plus size={18} /> 添加项目
                            </button>
                        </div>

                        <div className="form-group">
                            <label className="form-label">总计金额 (Total)</label>
                            <input
                                className="form-input"
                                value={total}
                                onChange={(e) => setTotal(e.target.value)}
                            />
                        </div>

                        <button className="download-btn" onClick={() => handleDownloadPDF()}>
                            <Download size={18} /> 下载 PDF
                        </button>
                    </>
                )}
            </div>

            {/* Preview Area */}
            <div className="preview-area">
                <div className="invoice-page" ref={previewRef}>
                    {/* Watermark Logo */}
                    <div className="watermark">
                        <img src="/logo.png" alt="watermark" style={{ opacity: 0.05, height: '150px' }} />
                    </div>

                    <div className="invoice-header">
                        <div className="logo-container">
                            <div className="company-logo">
                                <img src="/logo.png" alt="Company Logo" style={{ height: '40px' }} />
                            </div>
                            <div className="company-name">PINGWORTH TECHNOLOGY LIMITED</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div className="invoice-title">INVOICE</div>
                            <div className="invoice-info">
                                <div><span className="info-item">INVOICE #:</span><span className="info-value">{invoiceNo}</span></div>
                                <div><span className="info-item">INVOICE DATE:</span><span className="info-value">{invoiceDate}</span></div>
                                <div><span className="info-item">BILLING PERIOD:</span><span className="info-value">{billingPeriod}</span></div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <div className="section-title">Bill To:</div>
                        <table className="invoice-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '25%' }}>日期</th>
                                    <th style={{ width: '50%', textAlign: 'center' }}>项目</th>
                                    <th style={{ width: '25%', textAlign: 'right' }}>金额({currency})</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.date}</td>
                                        <td style={{ textAlign: 'center' }}>{item.description}</td>
                                        <td style={{ textAlign: 'right' }}>{item.amount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bank-details">
                        <p><strong>Bank Details:</strong></p>
                        <p>Account Name (公司名称): PINGWORTH TECHNOLOGY LIMITED</p>
                        <p>Account Number 账号 (in {currency}): 1010 5060 14</p>
                        <p>Address (地址): WORKSHOP F8, 4F VALIANT IND, CTR NO 2-12 AU PUI WAN ST, SHATIN NT,</p>
                        <p>HONG KONG</p>
                        <p>Beneficiary BANK (开户银行): Citibank N.A., Hong Kong Branch</p>
                        <p>Beneficiary BANK Address: (开户地址): 3 Garden Road, Central, Hong Kong</p>
                        <p>SWIFT Code(开户银行行号): CITIH KHXXXX</p>
                        <p>Bank code: 006</p>
                        <p style={{ marginTop: '1rem' }}><strong>Invoice Total: {total}</strong></p>
                        <p><strong>Invoice Currency: {currency}</strong></p>
                    </div>

                    <div className="footer">
                        <p>If you have any questions concerning this invoice, contact Email: finance@sevensmarketing.com</p>
                        <div className="footer-thanks">THANK YOU FOR YOUR BUSINESS!</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
