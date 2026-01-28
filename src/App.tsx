import { useState, useRef } from 'react';
import { Download, Plus, Trash2, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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

    const handleDownloadPDF = async () => {
        if (!previewRef.current) return;

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
        pdf.save(`Invoice_${invoiceNo}.pdf`);
    };

    return (
        <div className="app-container">
            {/* Sidebar Form */}
            <div className="form-sidebar">
                <h1 className="form-title">
                    <Printer size={24} /> 发票编辑器
                </h1>

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

                <button className="download-btn" onClick={handleDownloadPDF}>
                    <Download size={18} /> 下载 PDF
                </button>
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
