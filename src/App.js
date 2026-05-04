import React, { useState, useRef, useEffect, useCallback } from "react";

const CATEGORIES = ["All","Produce","Dairy","Dry Goods","Meat & Seafood","Beverages","Cleaning Supplies"];
const VENDORS = [
  { id: "v1", name: "Fresh Farms Co." },
  { id: "v2", name: "Metro Food Supply" },
  { id: "v3", name: "CleanPro Supplies" },
];
const INIT_ITEMS = [
  { id: 1, name: "Roma Tomatoes", sku: "074175604517", category: "Produce", unit: "lbs", qty: 4, par: 20, vendor: "v1" },
  { id: 2, name: "Whole Milk", sku: "041303005484", category: "Dairy", unit: "gal", qty: 2, par: 10, vendor: "v2" },
  { id: 3, name: "All-Purpose Flour", sku: "016000275287", category: "Dry Goods", unit: "lbs", qty: 15, par: 25, vendor: "v2" },
  { id: 4, name: "Chicken Breast", sku: "021000617418", category: "Meat & Seafood", unit: "lbs", qty: 8, par: 30, vendor: "v1" },
  { id: 5, name: "Olive Oil", sku: "071026001102", category: "Dry Goods", unit: "btl", qty: 3, par: 6, vendor: "v2" },
  { id: 6, name: "Heavy Cream", sku: "041303004593", category: "Dairy", unit: "qt", qty: 1, par: 8, vendor: "v1" },
  { id: 7, name: "Dish Soap", sku: "037000864868", category: "Cleaning Supplies", unit: "btl", qty: 5, par: 8, vendor: "v3" },
  { id: 8, name: "Sparkling Water", sku: "078915001010", category: "Beverages", unit: "cs", qty: 2, par: 5, vendor: "v2" },
];

const statusColor = q => q.qty / q.par <= 0.25 ? "#E24B4A" : q.qty / q.par <= 0.5 ? "#EF9F27" : "#1D9E75";
const statusLabel = q => q.qty / q.par <= 0.25 ? "Critical" : q.qty / q.par <= 0.5 ? "Low" : "OK";

const NAV = [
  { id: "Inventory", label: "Inventory", icon: <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { id: "Scan", label: "Scan", icon: <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg> },
  { id: "Order", label: "Order", icon: <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
  { id: "Vendors", label: "Vendors", icon: <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
];

const T = {
  wrap: { fontFamily: "system-ui, sans-serif", width: "100%", boxSizing: "border-box", overflowX: "hidden", fontSize: 26 },
  topNav: { display: "flex", background: "var(--color-background-primary)", borderBottom: "1.5px solid var(--color-border-tertiary)", overflowX: "auto", scrollbarWidth: "none" },
  topBtn: (a) => ({ flex: "0 0 auto", padding: "22px 28px 18px", border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: a ? "#185FA5" : "var(--color-text-secondary)", borderBottom: a ? "4px solid #185FA5" : "4px solid transparent", fontSize: 19, fontWeight: a ? 700 : 500 }),
  screen: { minHeight: "100vh", paddingBottom: 40, boxSizing: "border-box" },
  pageHeader: { padding: "36px 24px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  pageTitle: { fontSize: 46, fontWeight: 800, color: "var(--color-text-primary)", margin: 0 },
  pageSub: { fontSize: 24, color: "var(--color-text-secondary)", marginTop: 6 },
  card: { background: "var(--color-background-primary)", borderRadius: 24, border: "1.5px solid var(--color-border-tertiary)", padding: "28px", margin: "0 20px 20px" },
  input: { width: "100%", padding: "22px 24px", borderRadius: 18, border: "1.5px solid var(--color-border-secondary)", fontSize: 26, background: "var(--color-background-secondary)", color: "var(--color-text-primary)", boxSizing: "border-box" },
  chip: (a) => ({ padding: "14px 26px", borderRadius: 32, border: "1.5px solid " + (a ? "#185FA5" : "var(--color-border-tertiary)"), background: a ? "#E6F1FB" : "var(--color-background-secondary)", color: a ? "#185FA5" : "var(--color-text-secondary)", fontSize: 22, cursor: "pointer", whiteSpace: "nowrap", fontWeight: a ? 700 : 500, flexShrink: 0 }),
  badge: (c) => ({ fontSize: 21, padding: "8px 18px", borderRadius: 32, background: c + "22", color: c, fontWeight: 700, whiteSpace: "nowrap" }),
  bigBtn: (bg="#185FA5") => ({ width: "100%", padding: "26px", borderRadius: 20, border: "none", background: bg, color: "#fff", fontSize: 26, fontWeight: 700, cursor: "pointer", marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, boxSizing: "border-box" }),
  label: { fontSize: 23, color: "var(--color-text-secondary)", marginBottom: 10, display: "block", fontWeight: 600 },
  formInput: { width: "100%", padding: "22px 24px", borderRadius: 18, border: "1.5px solid var(--color-border-secondary)", fontSize: 26, background: "var(--color-background-secondary)", color: "var(--color-text-primary)", boxSizing: "border-box", marginBottom: 20 },
  toast: { position: "fixed", top: 36, left: "50%", transform: "translateX(-50%)", background: "#185FA5", color: "#fff", padding: "20px 40px", borderRadius: 44, fontSize: 23, fontWeight: 700, zIndex: 500, whiteSpace: "nowrap", maxWidth: "92vw", textAlign: "center" },
  backBtn: { background: "var(--color-background-secondary)", border: "1.5px solid var(--color-border-secondary)", borderRadius: 16, padding: "14px 24px", fontSize: 24, fontWeight: 700, cursor: "pointer", color: "var(--color-text-primary)" },
};

function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [msg, setMsg] = useState("Starting camera...");
  const [err, setErr] = useState(null);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }
    }).then(stream => {
      if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.play().then(() => {
        setMsg("Align barcode in frame");
        startDetection();
      });
    }).catch(() => setErr("Camera access denied. Allow camera in Safari settings."));

    return () => {
      active = false;
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const startDetection = () => {
    if (!window.BarcodeDetector) { setMsg("BarcodeDetector not supported — enter SKU manually"); return; }
    const formats = ["ean_13","ean_8","upc_a","upc_e","code_128","code_39","qr_code"];
    BarcodeDetector.getSupportedFormats().then(supported => {
      const use = formats.filter(f => supported.includes(f));
      const detector = new BarcodeDetector({ formats: use.length ? use : supported });
      let last = 0;
      const tick = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) { rafRef.current = requestAnimationFrame(tick); return; }
        const now = Date.now();
        if (now - last > 400) {
          last = now;
          try {
            const results = await detector.detect(videoRef.current);
            if (results.length) { onDetected(results[0].rawValue); return; }
          } catch(e) {}
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 300, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, padding: "32px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(to bottom,rgba(0,0,0,0.75),transparent)" }}>
        <p style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: 34 }}>Scan Barcode</p>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 28, padding: "16px 32px", cursor: "pointer", fontSize: 24, fontWeight: 700 }}>Cancel</button>
      </div>
      {err ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", padding: 40, textAlign: "center" }}>
          <p style={{ fontSize: 72, margin: "0 0 20px" }}>📷</p>
          <p style={{ fontWeight: 700, fontSize: 26, marginBottom: 12 }}>{err}</p>
          <button onClick={onClose} style={{ ...T.bigBtn(), maxWidth: 340 }}>Go Back</button>
        </div>
      ) : (
        <>
          <video ref={videoRef} playsInline muted autoPlay style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ width: "85%", height: 200, position: "relative" }}>
              {[[0,0],[0,1],[1,0],[1,1]].map(([t,r],i) => (
                <div key={i} style={{ position: "absolute", top: t ? "auto" : 0, bottom: t ? 0 : "auto", left: r ? "auto" : 0, right: r ? 0 : "auto", width: 44, height: 44, borderTop: !t ? "5px solid #fff" : "none", borderBottom: t ? "5px solid #fff" : "none", borderLeft: !r ? "5px solid #fff" : "none", borderRight: r ? "5px solid #fff" : "none" }} />
              ))}
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 3, background: "rgba(255,60,60,0.9)", transform: "translateY(-50%)" }} />
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "32px 24px 60px", background: "linear-gradient(to top,rgba(0,0,0,0.75),transparent)", textAlign: "center" }}>
            <p style={{ margin: 0, color: "#fff", fontSize: 24, fontWeight: 600 }}>{msg}</p>
          </div>
        </>
      )}
    </div>
  );
}

function QtyScreen({ item, onSave, onBack }) {
  const [val, setVal] = useState(String(item.qty));
  const num = Math.max(0, parseInt(val) || 0);
  const color = statusColor({ qty: num, par: item.par });
  const pct = Math.min(100, (num / item.par) * 100);
  return (
    <div style={{ ...T.screen, padding: "0 0 60px" }}>
      <div style={{ ...T.pageHeader }}>
        <button onClick={onBack} style={T.backBtn}>← Back</button>
      </div>
      <div style={{ padding: "0 24px" }}>
        <p style={{ fontSize: 40, fontWeight: 800, color: "var(--color-text-primary)", margin: "0 0 8px" }}>{item.name}</p>
        <p style={{ fontSize: 26, color: "var(--color-text-secondary)", margin: "0 0 40px" }}>Par level: {item.par} {item.unit}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36 }}>
          <button onClick={() => setVal(String(Math.max(0, num - 1)))} style={{ width: 90, height: 90, borderRadius: 22, border: "none", background: "#E6F1FB", color: "#185FA5", fontSize: 52, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>−</button>
          <input
            type="number" min="0" value={val}
            onChange={e => setVal(e.target.value)}
            style={{ flex: 1, textAlign: "center", fontSize: 80, fontWeight: 800, border: "2px solid var(--color-border-secondary)", borderRadius: 22, padding: "20px 8px", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", minWidth: 0 }}
            autoFocus
          />
          <button onClick={() => setVal(String(num + 1))} style={{ width: 90, height: 90, borderRadius: 22, border: "none", background: "#185FA5", color: "#fff", fontSize: 52, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>+</button>
        </div>
        <div style={{ height: 18, borderRadius: 10, background: "var(--color-border-tertiary)", overflow: "hidden", marginBottom: 16 }}>
          <div style={{ height: "100%", width: pct + "%", background: color, borderRadius: 10, transition: "width 0.2s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40 }}>
          <span style={{ fontSize: 24, color: "var(--color-text-secondary)" }}>{num} of {item.par} {item.unit}</span>
          <span style={{ fontSize: 24, fontWeight: 700, color }}>{statusLabel({ qty: num, par: item.par })}</span>
        </div>
        <button onClick={() => { onSave(item.id, num); onBack(); }} style={T.bigBtn()}>Save Quantity</button>
      </div>
    </div>
  );
}

function AddItemScreen({ onSave, onBack, prefillSku="" }) {
  const [form, setForm] = useState({ name:"", sku: prefillSku, category:"Produce", unit:"", qty:"0", par:"0", vendor:"v1" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = () => {
    if (!form.name.trim()) return;
    onSave({ ...form, qty: Number(form.qty), par: Number(form.par), id: Date.now() });
    onBack();
  };
  return (
    <div style={{ ...T.screen, padding: "0 0 60px" }}>
      <div style={T.pageHeader}>
        <button onClick={onBack} style={T.backBtn}>← Back</button>
        <p style={{ ...T.pageTitle, fontSize: 38 }}>Add Product</p>
      </div>
      <div style={{ padding: "0 24px" }}>
        <label style={T.label}>Product Name</label>
        <input style={T.formInput} placeholder="e.g. Cherry Tomatoes" value={form.name} onChange={e => set("name", e.target.value)} />
        <label style={T.label}>SKU / Barcode</label>
        <input style={T.formInput} placeholder="e.g. 074175604517" value={form.sku} onChange={e => set("sku", e.target.value)} />
        <label style={T.label}>Category</label>
        <select style={T.formInput} value={form.category} onChange={e => set("category", e.target.value)}>
          {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
        </select>
        <label style={T.label}>Unit (lbs, gal, cs, btl...)</label>
        <input style={T.formInput} placeholder="lbs" value={form.unit} onChange={e => set("unit", e.target.value)} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={T.label}>Current Qty</label>
            <input style={T.formInput} type="number" min="0" value={form.qty} onChange={e => set("qty", e.target.value)} />
          </div>
          <div>
            <label style={T.label}>Par Level</label>
            <input style={T.formInput} type="number" min="0" value={form.par} onChange={e => set("par", e.target.value)} />
          </div>
        </div>
        <label style={T.label}>Vendor</label>
        <select style={T.formInput} value={form.vendor} onChange={e => set("vendor", e.target.value)}>
          {VENDORS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <button onClick={save} style={T.bigBtn()}>Add to Inventory</button>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("Inventory");
  const [items, setItems] = useState(INIT_ITEMS);
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanInput, setScanInput] = useState("");
  const [orderVendor, setOrderVendor] = useState("all");
  const [toast, setToast] = useState(null);
  const [qtyItem, setQtyItem] = useState(null);
  const [addScreen, setAddScreen] = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const setQty = (id, qty) => { setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i)); showToast("Quantity saved!"); };
  const addItem = item => { setItems(prev => [...prev, item]); showToast("Item added!"); };

  const filtered = items.filter(i =>
    (cat === "All" || i.category === cat) &&
    (i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.includes(search))
  );
  const needsOrder = items.filter(i => i.qty < i.par);
  const orderFiltered = orderVendor === "all" ? needsOrder : needsOrder.filter(i => i.vendor === orderVendor);

  const handleDetected = useCallback(code => {
    setShowCamera(false);
    setScanInput(code);
    const found = items.find(i => i.sku === code);
    setScanResult(found || { notFound: true, sku: code });
    showToast(found ? `Found: ${found.name}` : `Not in inventory: ${code}`);
  }, [items]);

  const handleManualSearch = () => {
    const q = scanInput.trim().toLowerCase();
    const found = items.find(i => i.sku === scanInput.trim() || i.name.toLowerCase() === q);
    setScanResult(found || { notFound: true, sku: scanInput });
  };

  const exportOrder = () => {
    const txt = orderFiltered.map(i => `${i.name} | Need: ${i.par - i.qty} ${i.unit} | ${VENDORS.find(v => v.id === i.vendor)?.name}`).join("\n");
    navigator.clipboard.writeText(txt).then(() => showToast("Order copied!"));
  };

  if (qtyItem) return <QtyScreen item={qtyItem} onSave={setQty} onBack={() => setQtyItem(null)} />;
  if (addScreen !== null) return <AddItemScreen prefillSku={addScreen} onSave={addItem} onBack={() => setAddScreen(null)} />;

  return (
    <div style={T.wrap}>
      {toast && <div style={T.toast}>{toast}</div>}
      {showCamera && <BarcodeScanner onDetected={handleDetected} onClose={() => setShowCamera(false)} />}

      <div style={T.topNav}>
        {NAV.map(n => (
          <button key={n.id} style={T.topBtn(view === n.id)} onClick={() => setView(n.id)}>
            {n.icon}
            {n.label}
            {n.id === "Order" && needsOrder.length > 0 && <span style={{ background: "#E24B4A", color: "#fff", borderRadius: 20, fontSize: 17, fontWeight: 700, padding: "3px 10px" }}>{needsOrder.length}</span>}
          </button>
        ))}
      </div>

      {view === "Inventory" && (
        <div style={T.screen}>
          <div style={T.pageHeader}>
            <div>
              <p style={T.pageTitle}>Inventory</p>
              <p style={T.pageSub}>{items.length} items · {needsOrder.length} to reorder</p>
            </div>
            <button onClick={() => setAddScreen("")} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: 18, padding: "18px 28px", fontSize: 26, fontWeight: 700, cursor: "pointer" }}>+ Add</button>
          </div>
          <div style={{ padding: "0 20px 16px" }}>
            <input style={T.input} placeholder="Search items or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 20px 16px", scrollbarWidth: "none" }}>
            {CATEGORIES.map(c => <button key={c} style={T.chip(cat === c)} onClick={() => setCat(c)}>{c}</button>)}
          </div>
          {filtered.map(item => {
            const color = statusColor(item);
            const pct = Math.min(100, (item.qty / item.par) * 100);
            const v = VENDORS.find(v => v.id === item.vendor)?.name || "";
            return (
              <div key={item.id} style={T.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ flex: 1, marginRight: 16 }}>
                    <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 28, color: "var(--color-text-primary)" }}>{item.name}</p>
                    <p style={{ margin: 0, fontSize: 22, color: "var(--color-text-secondary)" }}>{item.category} · {v}</p>
                  </div>
                  <span style={T.badge(color)}>{statusLabel(item)}</span>
                </div>
                <div style={{ height: 12, borderRadius: 8, background: "var(--color-border-tertiary)", overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ height: "100%", width: pct + "%", background: color, borderRadius: 8 }} />
                </div>
                <button onClick={() => setQtyItem(item)} style={{ width: "100%", padding: "20px 24px", borderRadius: 18, border: "1.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 24, color: "var(--color-text-secondary)", fontWeight: 600 }}>Qty on hand</span>
                  <span style={{ fontSize: 44, fontWeight: 800, color }}>{item.qty} <span style={{ fontSize: 24, fontWeight: 500, color: "var(--color-text-secondary)" }}>{item.unit}</span></span>
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && <p style={{ textAlign: "center", color: "var(--color-text-secondary)", marginTop: 60, fontSize: 26 }}>No items found.</p>}
        </div>
      )}

      {view === "Scan" && (
        <div style={T.screen}>
          <div style={T.pageHeader}>
            <div>
              <p style={T.pageTitle}>Scan</p>
              <p style={T.pageSub}>Camera or manual entry</p>
            </div>
          </div>
          <div style={{ padding: "0 24px" }}>
            <button style={T.bigBtn()} onClick={() => { setScanResult(null); setShowCamera(true); }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              Scan with Camera
            </button>
            <p style={{ textAlign: "center", fontSize: 21, color: "var(--color-text-secondary)", margin: "10px 0 28px" }}>Supports UPC, EAN, Code 128</p>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 1.5, background: "var(--color-border-tertiary)" }} />
              <span style={{ fontSize: 22, color: "var(--color-text-secondary)" }}>or type manually</span>
              <div style={{ flex: 1, height: 1.5, background: "var(--color-border-tertiary)" }} />
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <input style={{ ...T.input, flex: 1 }} placeholder="SKU or product name" value={scanInput} onChange={e => setScanInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleManualSearch()} />
              <button onClick={handleManualSearch} style={{ padding: "22px 26px", borderRadius: 18, border: "none", background: "#185FA5", color: "#fff", fontSize: 24, fontWeight: 700, cursor: "pointer" }}>Find</button>
            </div>
            {scanResult && !scanResult.notFound && (
              <div style={{ ...T.card, margin: "24px 0 0", border: "2.5px solid #185FA5" }}>
                <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 30, color: "var(--color-text-primary)" }}>{scanResult.name}</p>
                <p style={{ margin: "0 0 24px", fontSize: 22, color: "var(--color-text-secondary)" }}>SKU: {scanResult.sku}</p>
                <button onClick={() => setQtyItem(items.find(i => i.id === scanResult.id))} style={T.bigBtn()}>Update Quantity</button>
              </div>
            )}
            {scanResult && scanResult.notFound && (
              <div style={{ ...T.card, margin: "24px 0 0", border: "2.5px solid #E24B4A" }}>
                <p style={{ margin: "0 0 8px", fontWeight: 800, color: "#E24B4A", fontSize: 28 }}>Not in inventory</p>
                <p style={{ margin: "0 0 20px", fontSize: 22, color: "var(--color-text-secondary)" }}>SKU: {scanResult.sku}</p>
                <button style={T.bigBtn()} onClick={() => setAddScreen(scanResult.sku)}>Add as New Product</button>
              </div>
            )}
          </div>
        </div>
      )}

      {view === "Order" && (
        <div style={T.screen}>
          <div style={T.pageHeader}>
            <div>
              <p style={T.pageTitle}>Order Sheet</p>
              <p style={T.pageSub}>{needsOrder.length} items below par</p>
            </div>
          </div>
          <div style={{ padding: "0 24px 20px" }}>
            <select style={{ ...T.formInput, marginBottom: 0 }} value={orderVendor} onChange={e => setOrderVendor(e.target.value)}>
              <option value="all">All Vendors</option>
              {VENDORS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          {orderFiltered.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: 80 }}>
              <p style={{ fontSize: 72, marginBottom: 16 }}>✓</p>
              <p style={{ fontWeight: 800, color: "var(--color-text-primary)", fontSize: 32 }}>All stocked up!</p>
              <p style={{ fontSize: 24, color: "var(--color-text-secondary)" }}>No items need reordering.</p>
            </div>
          ) : (
            <>
              {VENDORS.filter(v => orderVendor === "all" || v.id === orderVendor).map(vendor => {
                const vItems = orderFiltered.filter(i => i.vendor === vendor.id);
                if (!vItems.length) return null;
                return (
                  <div key={vendor.id}>
                    <p style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text-secondary)", padding: "20px 24px 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{vendor.name}</p>
                    {vItems.map(item => (
                      <div key={item.id} style={T.card}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 26, color: "var(--color-text-primary)" }}>{item.name}</p>
                            <p style={{ margin: 0, fontSize: 22, color: "var(--color-text-secondary)" }}>Have {item.qty} · Par {item.par} {item.unit}</p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 44, color: statusColor(item) }}>{item.par - item.qty}</p>
                            <p style={{ margin: 0, fontSize: 20, color: "var(--color-text-secondary)" }}>{item.unit}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
              <div style={{ padding: "0 24px 40px" }}>
                <button style={T.bigBtn()} onClick={exportOrder}>Copy Order to Clipboard</button>
              </div>
            </>
          )}
        </div>
      )}

      {view === "Vendors" && (
        <div style={T.screen}>
          <div style={T.pageHeader}><p style={T.pageTitle}>Vendors</p></div>
          {VENDORS.map(v => {
            const vItems = items.filter(i => i.vendor === v.id);
            const vOrder = needsOrder.filter(i => i.vendor === v.id);
            return (
              <div key={v.id} style={T.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 28, color: "var(--color-text-primary)" }}>{v.name}</p>
                    <p style={{ margin: 0, fontSize: 22, color: "var(--color-text-secondary)" }}>{vItems.length} products</p>
                  </div>
                  {vOrder.length > 0 && <span style={{ background: "#FCEBEB", color: "#A32D2D", fontSize: 22, fontWeight: 700, padding: "10px 20px", borderRadius: 28 }}>{vOrder.length} to order</span>}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {vItems.map(i => <span key={i.id} style={{ fontSize: 20, background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", padding: "8px 18px", borderRadius: 28, border: "1px solid var(--color-border-tertiary)" }}>{i.name}</span>)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
