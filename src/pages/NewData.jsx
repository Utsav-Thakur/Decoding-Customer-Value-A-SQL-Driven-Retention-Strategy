import React, { useState, useRef, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { computeStats } from '../utils/featureEngineering';
import { Upload, Plus, RefreshCw, FileText, CheckCircle2, AlertCircle, Database, HelpCircle, Download, Star } from 'lucide-react';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

export default function NewData() {
  const { customers, isCustomData, lastUpdated, addCustomers, replaceCustomers, resetToOriginal } = useData();

  // Tab Selection
  const [activeSubTab, setActiveSubTab] = useState('csv');

  // Success / Error Alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ------------------------------------------
  // TAB 1: CSV Upload States
  // ------------------------------------------
  const fileInputRef = useRef(null);
  const [csvProgress, setCsvProgress] = useState('idle'); // idle, reading, validating, engineering, done
  const [isDragOver, setIsDragOver] = useState(false);
  const [csvPreview, setCsvPreview] = useState([]);
  const [parsedRowsStore, setParsedRowsStore] = useState([]);
  const [replaceMode, setReplaceMode] = useState(false);

  const CSV_HEADER = "Customer ID,Age,Gender,Item Purchased,Category,Purchase Amount (USD),Location,Size,Color,Season,Review Rating,Subscription Status,Shipping Type,Discount Applied,Promo Code Used,Previous Purchases,Payment Method,Frequency of Purchases";

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_HEADER + "\n"], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brandiq_customer_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const parseCSVText = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) throw new Error('CSV is empty');

    const headers = lines[0].split(',').map(h => h.trim());
    const required = ['Age', 'Purchase Amount (USD)', 'Location', 'Item Purchased'];
    const missing = required.filter(field => !headers.includes(field));
    if (missing.length > 0) {
      throw new Error(`CSV is missing required headers: ${missing.join(', ')}`);
    }

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) continue;

      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx];
      });
      data.push(row);
    }
    return data;
  };

  const processFile = (file) => {
    setErrorMsg('');
    setSuccessMsg('');
    setCsvProgress('reading');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setCsvProgress('validating');
        const text = event.target?.result;
        if (typeof text !== 'string') throw new Error('Failed to read file text');

        const parsed = parseCSVText(text);
        if (parsed.length === 0) throw new Error('No valid records parsed');

        setCsvProgress('engineering');
        setParsedRowsStore(parsed);
        setCsvPreview(parsed.slice(0, 5));
        setCsvProgress('done');
      } catch (err) {
        setCsvProgress('idle');
        setErrorMsg(err.message || 'Error processing CSV file');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmCSV = () => {
    if (parsedRowsStore.length === 0) return;
    if (replaceMode) {
      replaceCustomers(parsedRowsStore);
    } else {
      addCustomers(parsedRowsStore);
    }
    setSuccessMsg(`Successfully uploaded and feature engineered ${parsedRowsStore.length} customers! Dashboard updated.`);
    setCsvPreview([]);
    setParsedRowsStore([]);
    setCsvProgress('idle');
  };

  const handleCancelCSV = () => {
    setCsvPreview([]);
    setParsedRowsStore([]);
    setCsvProgress('idle');
  };

  // ------------------------------------------
  // TAB 2: Manual Form Entry States
  // ------------------------------------------
  const [age, setAge] = useState(35);
  const [gender, setGender] = useState('Female');
  const [item, setItem] = useState('Blouse');
  const [category, setCategory] = useState('Clothing');
  const [spend, setSpend] = useState(65);
  const [location, setLocation] = useState('New York');
  const [size, setSize] = useState('M');
  const [color, setColor] = useState('Maroon');
  const [season, setSeason] = useState('Spring');
  const [rating, setRating] = useState(4);
  const [subStatus, setSubStatus] = useState('Yes');
  const [shipping, setShipping] = useState('Express');
  const [discount, setDiscount] = useState(false);
  const [promo, setPromo] = useState(false);
  const [prevPurchases, setPrevPurchases] = useState(10);
  const [payment, setPayment] = useState('Credit Card');
  const [frequency, setFrequency] = useState('Monthly');

  const [predictedTier, setPredictedTier] = useState('');

  const resetForm = () => {
    setAge(35);
    setGender('Female');
    setItem('Blouse');
    setCategory('Clothing');
    setSpend(65);
    setLocation('New York');
    setSize('M');
    setColor('Maroon');
    setSeason('Spring');
    setRating(4);
    setSubStatus('Yes');
    setShipping('Express');
    setDiscount(false);
    setPromo(false);
    setPrevPurchases(10);
    setPayment('Credit Card');
    setFrequency('Monthly');
    setPredictedTier('');
  };

  const handleManualAdd = () => {
    setErrorMsg('');
    setSuccessMsg('');

    const newCustomer = {
      'Customer ID': Date.now(), // temp ID
      'Age': Number(age),
      'Gender': gender,
      'Item Purchased': item,
      'Category': category,
      'Purchase Amount (USD)': Number(spend),
      'Location': location,
      'Size': size,
      'Color': color,
      'Season': season,
      'Review Rating': Number(rating),
      'Subscription Status': subStatus,
      'Shipping Type': shipping,
      'Discount Applied': discount ? 'Yes' : 'No',
      'Promo Code Used': promo ? 'Yes' : 'No',
      'Previous Purchases': Number(prevPurchases),
      'Payment Method': payment,
      'Frequency of Purchases': frequency
    };

    // Before adding, run a single prediction to show the tier to the user
    const tempCombined = [...customers, newCustomer];
    const tempEnriched = replaceCustomers ? tempCombined : []; // dummy run helper
    // Let's call the addCustomers context directly which will calculate values
    addCustomers([newCustomer]);

    // Simple tier lookup logic based on newly updated customer record
    setSuccessMsg(`Customer profile appended successfully to memory!`);
    
    // Auto predicted tier is Gold or similar
    setPredictedTier(spend > 80 ? 'Platinum' : spend > 50 ? 'Gold' : 'Silver');
  };

  // ------------------------------------------
  // TAB 3: Data Overview
  // ------------------------------------------
  const dataStats = useMemo(() => {
    if (!customers) return { count: 0, platinum: 0, gold: 0, silver: 0, bronze: 0 };
    const plat = customers.filter(c => c.value_tier === 'Platinum').length;
    const gold = customers.filter(c => c.value_tier === 'Gold').length;
    const sil = customers.filter(c => c.value_tier === 'Silver').length;
    const bro = customers.filter(c => c.value_tier === 'Bronze').length;

    let source = 'Original pre-computed dataset';
    if (isCustomData) {
      source = `Mixed (Original + Custom data additions)`;
    }

    return {
      count: customers.length,
      platinum: plat,
      gold,
      silver: sil,
      bronze: bro,
      source
    };
  }, [customers, isCustomData]);

  const handleExportCSV = () => {
    if (!customers || customers.length === 0) return;
    const header = "Customer ID,Age,Gender,Item Purchased,Category,Purchase Amount (USD),Location,Size,Color,Season,Review Rating,Subscription Status,Shipping Type,Discount Applied,Promo Code Used,Previous Purchases,Payment Method,Frequency of Purchases";
    const rows = customers.map(c => [
      c.customer_id, c.age, c.gender, c.item_purchased, c.category, c.purchase_amount, c.location, c.size, c.color, c.season, c.review_rating, c.subscription_status, c.shipping_type, c.discount_applied, c.promo_code_used, c.previous_purchases, c.payment_method, c.frequency_of_purchases
    ].join(','));

    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brandiq_exported_customers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-8 w-full fade-up">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="heading-serif text-text-primary text-3xl font-semibold mb-2">
            Add New Customer Data
          </h1>
          <p className="text-sm text-text-secondary">
            Upload a CSV or enter customers manually — all charts update instantly
          </p>
        </div>
      </div>

      {/* Tab selection */}
      <div className="flex border-b border-border">
        {[
          { id: 'csv', label: 'CSV Bulk Ingestion' },
          { id: 'manual', label: 'Manual Single Profile' },
          { id: 'overview', label: 'Database Overview' }
        ].map(tab => (
          <div
            key={tab.id}
            onClick={() => { setActiveSubTab(tab.id); setErrorMsg(''); setSuccessMsg(''); }}
            className={`px-6 py-3 cursor-pointer text-xs font-semibold border-b-2 transition-all duration-200 ${
              activeSubTab === tab.id 
                ? 'border-burgundy text-burgundy font-bold' 
                : 'border-transparent text-text-secondary hover:text-burgundy'
            }`}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* Feedback Banner Alerts */}
      {successMsg && (
        <div className="p-4 bg-success/15 border border-success/30 rounded-xl flex items-center gap-3 text-success text-xs font-medium">
          <CheckCircle2 size={18} />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-danger/15 border border-danger/30 rounded-xl flex items-center gap-3 text-danger text-xs font-medium">
          <AlertCircle size={18} />
          {errorMsg}
        </div>
      )}

      {/* TAB 1: CSV Upload */}
      {activeSubTab === 'csv' && (
        <div className="premium-card p-6 flex flex-col gap-6">
          <div>
            <h3 className="heading-serif text-lg font-semibold text-text-primary">Bulk CSV Data Drop</h3>
            <p className="text-xs text-text-secondary">Ingest custom customer matrices into the in-memory React Context</p>
          </div>

          {/* Drap Zone */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files?.[0]; if (file) processFile(file); }}
            className={`upload-zone flex flex-col items-center justify-center p-8 text-center ${isDragOver ? 'drag-over' : ''}`}
            style={{ minHeight: '200px' }}
          >
            <Upload size={36} className="text-gold mb-3" />
            <span className="text-sm font-semibold text-burgundy">Drop your CSV here or click to browse</span>
            <span className="text-[10px] text-text-muted mt-1">Accepts UTF-8 comma-separated files</span>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              style={{ display: 'none' }}
            />
          </div>

          {/* Import Modes and controls */}
          <div className="flex justify-between items-center bg-bg-2 p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary font-medium">Upload Mode:</span>
              <div 
                onClick={() => setReplaceMode(!replaceMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                  replaceMode 
                    ? 'bg-danger text-[#ffffff] border-danger' 
                    : 'bg-card text-text-primary border-border hover:bg-bg'
                }`}
              >
                {replaceMode ? 'Replace Database' : 'Merge with Existing'}
              </div>
            </div>
            <div onClick={handleDownloadTemplate} className="btn-ghost flex items-center gap-1.5 py-1.5 text-xs">
              <Download size={14} /> Download Template CSV
            </div>
          </div>

          {/* CSV File Read Preview */}
          {csvPreview.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-border pt-4">
              <span className="heading-serif text-sm font-semibold text-text-primary">Parsed File Preview (First 5 Rows)</span>
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-left text-[11px]" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr className="bg-bg-2 border-b border-border">
                      <th className="p-2">Age</th>
                      <th className="p-2">Gender</th>
                      <th className="p-2">Category</th>
                      <th className="p-2">Item Purchased</th>
                      <th className="p-2">Spend</th>
                      <th className="p-2">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.map((row, idx) => (
                      <tr key={idx} className="border-b border-border bg-[#ffffff]">
                        <td className="p-2">{row['Age'] || row['age']}</td>
                        <td className="p-2">{row['Gender'] || row['gender']}</td>
                        <td className="p-2">{row['Category'] || row['category']}</td>
                        <td className="p-2">{row['Item Purchased'] || row['item_purchased']}</td>
                        <td className="p-2">${row['Purchase Amount (USD)'] || row['purchase_amount']}</td>
                        <td className="p-2">{row['Location'] || row['location']}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2 justify-end">
                <div onClick={handleCancelCSV} className="btn-ghost text-xs py-2">Cancel</div>
                <div onClick={handleConfirmCSV} className="btn-primary text-xs py-2">Confirm &amp; Add</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Manual Form Entry */}
      {activeSubTab === 'manual' && (
        <div className="premium-card p-6 flex flex-col gap-6">
          <div>
            <h3 className="heading-serif text-lg font-semibold text-text-primary">Manual Profile Constructor</h3>
            <p className="text-xs text-text-secondary">Inject a single custom shopper record directly into the context state</p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-xs">
            {/* Age slider */}
            <div className="flex flex-col">
              <span className="form-label">Age ({age} y/o)</span>
              <input type="range" min="18" max="90" value={age} onChange={(e) => setAge(e.target.value)} className="w-full" />
            </div>

            {/* Gender pill selector */}
            <div className="flex flex-col">
              <span className="form-label">Gender</span>
              <div className="flex gap-2">
                {['Female', 'Male', 'Unspecified'].map(g => (
                  <div
                    key={g}
                    onClick={() => setGender(g)}
                    className={`px-4 py-2 border rounded-lg font-bold text-center cursor-pointer transition-all flex-grow ${
                      gender === g ? 'bg-burgundy text-[#ffffff] border-burgundy' : 'bg-card text-text-secondary border-border hover:bg-bg-2'
                    }`}
                  >
                    {g}
                  </div>
                ))}
              </div>
            </div>

            {/* Category selection */}
            <div className="flex flex-col">
              <span className="form-label">Category</span>
              <div className="flex gap-1.5">
                {['Clothing', 'Footwear', 'Outerwear', 'Accessories'].map(cat => (
                  <div
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-2 py-1 text-[11px] border rounded font-semibold text-center cursor-pointer transition-all ${
                      category === cat ? 'bg-burgundy text-[#ffffff] border-burgundy' : 'bg-card text-text-secondary border-border hover:bg-bg-2'
                    }`}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            </div>

            {/* Item Name */}
            <div className="flex flex-col">
              <span className="form-label">Item Purchased</span>
              <input type="text" value={item} onChange={(e) => setItem(e.target.value)} className="form-input" />
            </div>

            {/* Spend Slider */}
            <div className="flex flex-col">
              <span className="form-label">Purchase Amount (${spend})</span>
              <input type="range" min="10" max="150" value={spend} onChange={(e) => setSpend(e.target.value)} className="w-full" />
            </div>

            {/* State selection */}
            <div className="flex flex-col">
              <span className="form-label">Location (State)</span>
              <select value={location} onChange={(e) => setLocation(e.target.value)} className="form-input" style={{ cursor: 'pointer' }}>
                {US_STATES.map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>

            {/* Sizes selector */}
            <div className="flex flex-col">
              <span className="form-label">Garment Size</span>
              <div className="flex gap-2">
                {['S', 'M', 'L', 'XL'].map(sz => (
                  <div
                    key={sz}
                    onClick={() => setSize(sz)}
                    className={`px-3 py-1.5 border rounded-lg text-center font-bold cursor-pointer transition-all flex-grow ${
                      size === sz ? 'bg-burgundy text-[#ffffff] border-burgundy' : 'bg-card text-text-secondary border-border hover:bg-bg-2'
                    }`}
                  >
                    {sz}
                  </div>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="flex flex-col">
              <span className="form-label">Aesthetic Color</span>
              <input type="text" value={color} onChange={(e) => setColor(e.target.value)} className="form-input" />
            </div>

            {/* Season Selector */}
            <div className="flex flex-col">
              <span className="form-label">Season</span>
              <div className="flex gap-2">
                {['Spring', 'Summer', 'Fall', 'Winter'].map(ss => (
                  <div
                    key={ss}
                    onClick={() => setSeason(ss)}
                    className={`px-3 py-1.5 border rounded-lg text-center font-semibold cursor-pointer transition-all flex-grow ${
                      season === ss ? 'bg-burgundy text-[#ffffff] border-burgundy' : 'bg-card text-text-secondary border-border hover:bg-bg-2'
                    }`}
                  >
                    {ss}
                  </div>
                ))}
              </div>
            </div>

            {/* 5 Stars Rating Component */}
            <div className="flex flex-col">
              <span className="form-label">Review Rating (★ {rating})</span>
              <div className="flex gap-1.5 mt-1.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <div key={star} onClick={() => setRating(star)} className="cursor-pointer">
                    <Star size={20} fill={star <= rating ? 'var(--gold)' : 'none'} color={star <= rating ? 'var(--gold)' : 'var(--text-muted)'} />
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription Toggle */}
            <div className="flex flex-col">
              <span className="form-label">Subscription Member?</span>
              <div 
                onClick={() => setSubStatus(subStatus === 'Yes' ? 'No' : 'Yes')}
                className={`py-2 text-center rounded-lg border font-bold cursor-pointer transition-all ${
                  subStatus === 'Yes' ? 'bg-success/10 text-success border-success' : 'bg-bg text-text-secondary border-border'
                }`}
              >
                {subStatus === 'Yes' ? 'Subscribed (Yes)' : 'No'}
              </div>
            </div>

            {/* Shipping selection */}
            <div className="flex flex-col">
              <span className="form-label">Shipping Type</span>
              <select value={shipping} onChange={(e) => setShipping(e.target.value)} className="form-input" style={{ cursor: 'pointer' }}>
                <option value="Standard">Standard</option>
                <option value="Express">Express</option>
                <option value="2-Day Shipping">2-Day Shipping</option>
                <option value="Next Day Air">Next Day Air</option>
                <option value="Free Shipping">Free Shipping</option>
              </select>
            </div>

            {/* Discount Applied Toggle */}
            <div className="flex flex-col">
              <span className="form-label">Discount Applied?</span>
              <div 
                onClick={() => setDiscount(!discount)}
                className={`py-2 text-center rounded-lg border font-bold cursor-pointer transition-all ${
                  discount ? 'bg-gold-light text-burgundy border-gold' : 'bg-bg text-text-secondary border-border'
                }`}
              >
                {discount ? 'Applied (Yes)' : 'No'}
              </div>
            </div>

            {/* Promo Code Used Toggle */}
            <div className="flex flex-col">
              <span className="form-label">Promo Code Used?</span>
              <div 
                onClick={() => setPromo(!promo)}
                className={`py-2 text-center rounded-lg border font-bold cursor-pointer transition-all ${
                  promo ? 'bg-gold-light text-burgundy border-gold' : 'bg-bg text-text-secondary border-border'
                }`}
              >
                {promo ? 'Used (Yes)' : 'No'}
              </div>
            </div>

            {/* Previous Purchases Slider */}
            <div className="flex flex-col">
              <span className="form-label">Previous Orders ({prevPurchases})</span>
              <input type="range" min="0" max="50" value={prevPurchases} onChange={(e) => setPrevPurchases(e.target.value)} className="w-full animate-pulse" />
            </div>

            {/* Payment dropdown */}
            <div className="flex flex-col">
              <span className="form-label">Payment Method</span>
              <select value={payment} onChange={(e) => setPayment(e.target.value)} className="form-input" style={{ cursor: 'pointer' }}>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="PayPal">PayPal</option>
                <option value="Venmo">Venmo</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            {/* Purchase Frequency */}
            <div className="flex flex-col">
              <span className="form-label">Purchases Frequency</span>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="form-input" style={{ cursor: 'pointer' }}>
                <option value="Weekly">Weekly</option>
                <option value="Fortnightly">Fortnightly</option>
                <option value="Bi-Weekly">Bi-Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Every 3 Months">Every 3 Months</option>
                <option value="Annually">Annually</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            {predictedTier && (
              <div className="p-3 bg-gold-light border border-gold/40 rounded-xl text-xs flex gap-2 items-center">
                <span>Customer Added! Predicted value level:</span>
                <span className="badge-gold font-bold">{predictedTier}</span>
              </div>
            )}
            <div className="flex gap-2 ml-auto">
              <div onClick={resetForm} className="btn-ghost text-xs py-2">Clear Form</div>
              <div onClick={handleManualAdd} className="btn-primary text-xs py-2">Add Customer Profile</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Data Overview */}
      {activeSubTab === 'overview' && (
        <div className="premium-card p-6 flex flex-col gap-6">
          <div>
            <h3 className="heading-serif text-lg font-semibold text-text-primary">Database Overview</h3>
            <p className="text-xs text-text-secondary">Summary and stats of active memory records</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-bg border border-border rounded-xl">
              <strong className="text-burgundy text-sm block mb-1">Status Details</strong>
              <p className="mb-2"><strong>Data Source:</strong> {dataStats.source}</p>
              <p className="mb-2"><strong>Customer Count:</strong> {dataStats.count.toLocaleString()}</p>
              <p><strong>Last Modified:</strong> {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}</p>
            </div>

            <div className="p-4 bg-bg border border-border rounded-xl">
              <strong className="text-burgundy text-sm block mb-1">Value Level Breakdown</strong>
              <div className="flex flex-col gap-1.5 mt-2">
                <div className="flex justify-between">
                  <span>Platinum:</span>
                  <strong>{dataStats.platinum.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Gold:</span>
                  <strong>{dataStats.gold.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Silver:</span>
                  <strong>{dataStats.silver.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Bronze:</span>
                  <strong>{dataStats.bronze.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Database Admin control buttons */}
          <div className="flex gap-3 justify-end border-t border-border pt-4">
            <div onClick={handleExportCSV} className="btn-ghost flex items-center gap-1.5 text-xs py-2">
              <Download size={14} /> Export Portfolio Data (CSV)
            </div>
            {isCustomData && (
              <div 
                onClick={resetToOriginal} 
                className="btn-primary flex items-center gap-1.5 text-xs py-2"
                style={{ background: 'var(--danger)', color: '#ffffff' }}
              >
                <RefreshCw size={14} /> Reset to Pre-computed Dataset
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
