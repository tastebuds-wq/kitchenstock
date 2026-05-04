import React, { useState, useRef, useEffect, useCallback } from "react";

const CATEGORIES = ["All","Produce","Dairy","Dry Goods","Meat & Seafood","Beverages","Cleaning Supplies"];
const INIT_VENDORS = [
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

const sColor = i => i.qty / i.par <= 0.25 ? "#E24B4A" : i.qty / i.par <= 0.5 ? "#EF9F27" : "#1D9E75";
const sLabel = i => i.qty / i.par <= 0.25 ? "Critical" : i.qty / i.par <= 0.5 ? "Low" : "OK";

const NAV = [
  { id: "Inventory", label: "Inventory", icon: <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { id: "Scan", label: "Scan", icon: <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg> },
  { id: "Order", label: "Order", icon: <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
  { id: "Vendors", label: "Vendors", icon: <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
];

const fs = { xs: 20, sm: 24, md: 28, lg: 34, xl: 42, xxl: 52 };

const T = {
  screen: { minHeight: "100vh", paddingBottom: 60, boxSizing: "border-box", fontFamily: "system-ui,sans-serif" },
  pageHeader: { padding: "36px 24px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  pageTitle: { fontSize: fs.xxl, fontWeight: 800, color: "var(--color-text-primary)", margin: 0 },
  pageSub: { fontSize: fs.sm, color: "var(--color-text-secondary)", marginTop: 8 },
  card: { background: "var(--color-background-primary)", borderRadius: 26, border: "1.5px solid var(--color-border-tertiary)", padding: "28px", margin: "0 20px 20px" },
  input: { width: "100%", padding: "24px 26px", borderRadius: 20, border: "1.5px solid var(--color-border-secondary)", fontSize: fs.md, background: "var(--color-background-secondary)", color: "var(--color-text-primary)", boxSizing: "border-box" },
  chip: a => ({ padding: "16px 28px", borderRadius: 36, border: "1.5px solid " + (a ? "#185FA5" : "var(--color-border-tertiary)"), background: a ? "#E6F1FB" : "var(--color-background-secondary)", color: a ? "#185FA5" : "var(--color-text-secondary)", fontSize: fs.sm, cursor: "pointer", whiteSpace: "nowrap", fontWeight: a ? 700 : 500, flexShrink: 0 }),
  badge: c => ({ fontSize: fs.xs, padding: "8px 20px", borderRadius: 36, background: c + "22", color: c, fontWeight: 700, whiteSpace: "nowrap" }),
  bigBtn: (bg = "#185FA5", color = "#fff") => ({ width: "100%", padding: "28px", borderRadius: 22, border: "none", background: bg, color, fontSize: fs.md, fontWeight: 700, cursor: "pointer", marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, boxSizing: "border-box" }),
  label: { fontSize: fs.sm, color: "var(--color-text-secondary)", marginBottom: 10, display: "block", fontWeight: 600 },
  formInput: { width: "100%", padding: "24px 26px", borderRadius: 20, border: "1.5px solid var(--color-border-secondary)", fontSize: fs.md, background: "var(--color-background-secondary)", color: "var(--color-text-primary)", boxSizing: "border-box", marginBottom: 20 },
  toast: { position: "fixed", top: 40, left: "50%", transform: "translateX(-50%)", background: "#185FA5", color: "#fff", padding: "20px 44px", borderRadius: 48, fontSize: fs.sm, fontWeight: 700, zIndex: 500, whiteSpace: "nowrap", maxWidth: "92vw", textAlign: "center" },
  backBtn: { background: "var(--color-background-secondary)", border: "1.5px solid var(--color-border-secondary)", borderRadius: 18, padding: "16px 28px", fontSize: fs.sm, fontWeight: 700, cursor: "pointer", color: "var(--color-text-primary)" },
  deleteBtn: { background: "#FCEBEB", border: "none", borderRadius: 18, padding: "16px 24px", fontSize: fs.sm, fontWeight: 700, cursor: "pointer", color: "#A32D2D" },
  topNav: { display: "flex", background: "var(--color-background-primary)", borderBottom: "1.5px solid var(--color-border-tertiary)", overflowX: "auto", scrollbarWidth: "none", position: "sticky", top: 0, zIndex: 10 },
  topBtn: a => ({ flex: "0 0 auto", padding: "24px 28px 20px", border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: a ? "#185FA5" : "var(--color-text-secondary)", borderBottom: a ? "5px solid #185FA5" : "5px solid transparent", fontSize: fs.xs, fontWeight: a ? 700 : 500 }),
};

function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [msg, setMsg] = useState("Starting camera...");
  const [err, setErr] = useState(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    let active = true;
    if (!("mediaDevices" in navigator)) { setErr("Camera not available in this browser."); return; }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } } })
      .then(stream => {
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
        setMsg("Point at a barcode");
      })
      .catch(() => setErr("Camera access denied. Go to Settings > Safari > Camera and allow access."));

    return () => { active = false; cleanup(); };
  }, []);

  const cleanup = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const onPlay = () => {
      if (!window.BarcodeDetector) { setMsg("Native scanning not supported — enter SKU manually below"); setSupported(false); return; }
      BarcodeDetector.getSupportedFormats().then(fmts => {
        const want = ["ean_13","ean_8","upc_a","upc_e","code_128","code_39","qr_code","itf","codabar"];
        const use = want.filter(f => fmts.includes(f));
        const detector = new BarcodeDetector({ formats: use.length ? use : fmts });
        let lastTime = 0;
        const tick = async ts => {
          if (ts - lastTime > 500 && video.readyState >= 2) {
            lastTime = ts;
            try {
              const res = await detector.detect(video);
              if (res.length > 0) { cleanup(); onDetected(res[0].rawValue); return; }
            } catch(e) {}
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      });
    };
    video.addEventListener("playing", onPlay);
    return () => video.removeEventListener("playing", onPlay);
  }, [onDetected]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 300, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, padding: "40px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(to bottom,rgba(0,0,0,0.8),transparent)" }}>
        <p style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: fs.xl }}>Scan Barcode</p>
        <button onClick={() => { cleanup(); onClose(); }} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 28, padding: "18px 36px", cursor: "pointer", fontSize: fs.md, fontWeight: 700 }}>Cancel</button>
      </div>
      {err ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", padding: 48, textAlign: "center" }}>
          <p style={{ fontSize: 80, margin: "0 0 24px" }}>📷</p>
          <p style={{ fontWeight: 700, fontSize: fs.md, marginBottom: 16, lineHeight: 1.4 }}>{err}</p>
          <button onClick={onClose} style={{ background: "#185FA5", border: "none", color: "#fff", borderRadius: 22, padding: "24px 48px", fontSize: fs.md, fontWeight: 700, cursor: "pointer", marginTop: 16 }}>Go Back</button>
        </div>
      ) : (
        <>
          <video ref={videoRef} playsInline muted autoPlay style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ width: "85%", height: 220, position: "relative" }}>
              {[[0,0],[0,1],[1,0],[1,1]].map(([t,r],i) => (
                <div key={i} style={{ position: "absolute", top: t ? "auto" : 0, bottom: t ? 0 : "auto", left: r ? "auto" : 0, right: r ? 0 : "auto", width: 52, height: 52, borderTop: !t ? "6px solid #fff" : "none", borderBottom: t ? "6px solid #fff" : "none", borderLeft: !r ? "6px solid #fff" : "none", borderRight: r ? "6px solid #fff" : "none" }} />
              ))}
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 4, background: "rgba(255,60,60,0.9)", transform: "translateY(-50%)" }} />
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "36px 28px 64px", background: "linear-gradient(to top,rgba(0,0,0,0.8),transparent)", textAlign: "center" }}>
            <p style={{ margin: 0, color: "#fff", fontSize: fs.md, fontWeight: 600 }}>{msg}</p>
            {!supported && <p style={{ margin: "12px 0 0", color: "rgba(255,255,255,0.7)", fontSize: fs.sm }}>Try iOS 17+ for native scanning</p>}
          </div>
        </>
      )}
    </div>
  );
}

function QtyScreen({ item, onSave, onBack }) {
  const [val, setVal] = useState(String(item.qty));
  const num = Math.max(0, parseInt(val) || 0);
  const color = sColor({ qty: num, par: item.par });
  return (
    <div style={{ ...T.screen, padding: "0 0 60px", fontFamily: "system-ui,sans-serif" }}>
      <div style={T.pageHeader}>
        <button onClick={onBack} style={T.backBtn}>← Back</button>
      </div>
      <div style={{ padding: "0 28px" }}>
        <p style={{ fontSize: fs.xl, fontWeight: 800, color: "var(--color-text-primary)", margin: "0 0 10px" }}>{item.name}</p>
        <p style={{ fontSize: fs.md, color: "var(--color-text-secondary)", margin: "0 0 48px" }}>Par: {item.par} {item.unit}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 40 }}>
          <button onClick={() => setVal(String(Math.max(0, num - 1)))} style={{ width: 100, height: 100, borderRadius: 24, border: "none", background: "#E6F1FB", color: "#185FA5", fontSize: 64, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>−</button>
          <input type="number" min="0" value={val} onChange={e => setVal(e.target.value)}
            style={{ flex: 1, textAlign: "center", fontSize: 100, fontWeight: 800, border: "2px solid var(--color-border-secondary)", borderRadius: 24, padding: "20px 8px", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", minWidth: 0 }}
            autoFocus />
          <button onClick={() => setVal(String(num + 1))} style={{ width: 100, height: 100, borderRadius: 24, border: "none", background: "#185FA5", color: "#fff", fontSize: 64, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>+</button>
        </div>
        <div style={{ height: 20, borderRadius: 12, background: "var(--color-border-tertiary)", overflow: "hidden", marginBottom: 18 }}>
          <div style={{ height: "100%", width: Math.min(100, (num / item.par) * 100) + "%", background: color, borderRadius: 12, transition: "width 0.2s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 48 }}>
          <span style={{ fontSize: fs.md, color: "var(--color-text-secondary)" }}>{num} of {item.par} {item.unit}</span>
          <span style={{ fontSize: fs.md, fontWeight: 700, color }}>{sLabel({ qty: num, par: item.par })}</span>
        </div>
        <button onClick={() => { onSave(item.id, num); onBack(); }} style={T.bigBtn()}>Save Quantity</button>
      </div>
    </div>
  );
}

function AddItemScreen({ onSave, onBack, prefillSku = "", vendors }) {
  const [form, setForm] = useState({ name: "", sku: prefillSku, category: "Produce", unit: "", qty: "0", par: "0", vendor: vendors[0]?.id || "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = () => {
    if (!form.name.trim()) return;
    onSave({ ...form, qty: Number(form.qty), par: Number(form.par), id: Date.now() });
    onBack();
  };
  return (
    <div style={{ ...T.screen, fontFamily: "system-ui,sans-serif" }}>
      <div style={T.pageHeader}>
        <button onClick={onBack} style={T.backBtn}>← Back</button>
        <p style={{ ...T.pageTitle, fontSize: fs.xl }}>Add Product</p>
      </div>
      <div style={{ padding: "0 28px 60px" }}>
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
          {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <button onClick={save} style={T.bigBtn()}>Add to Inventory</button>
      </div>
    </div>
  );
}

function AddVendorScreen({ onSave, onBack }) {
  const [name, setName] = useState("");
  const save = () => { if (!name.trim()) return; onSave({ id: "v" + Date.now(), name: name.trim() }); onBack(); };
  return (
    <div style={{ ...T.screen, fontFamily: "system-ui,sans-serif" }}>
      <div style={T.pageHeader}>
        <button onClick={onBack} style={T.backBtn}>← Back</button>
        <p style={{ ...T.pageTitle, fontSize: fs.xl }}>Add Vendor</p>
      </div>
      <div style={{ padding: "0 28px" }}>
        <label style={T.label}>Vendor Name</label>
        <input style={T.formInput} placeholder="e.g. City Produce Co." value={name} onChange={e => setName(e.target.value)} autoFocus />
        <button onClick={save} style={T.bigBtn()}>Add Vendor</button>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("Inventory");
  const [items, setItems] = useState(INIT_ITEMS);
  const [vendors, setVendors] = useState(INIT_VENDORS);
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanInput, setScanInput] = useState("");
  const [orderVendor, setOrderVendor] = useState("all");
  const [toast, setToast] = useState(null);
  const [screen, setScreen] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const setQty = (id, qty) => { setItems(p => p.map(i => i.id === id ? { ...i, qty } : i)); showToast("Quantity saved!"); };
  const addItem = item => { setItems(p => [...p, item]); showToast("Item added!"); };
  const deleteItem = id => { setItems(p => p.filter(i => i.id !== id)); showToast("Item deleted."); };
  const addVendor = v => { setVendors(p => [...p, v]); showToast("Vendor added!"); };
  const deleteVendor = id => { setVendors(p => p.filter(v => v.id !== id)); setItems(p => p.filter(i => i.vendor !== id)); showToast("Vendor deleted."); };

  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
  const filtered = sorted.filter(i =>
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
    const txt = orderFiltered.map(i => `${i.name} | Need: ${i.par - i.qty} ${i.unit} | ${vendors.find(v => v.id === i.vendor)?.name}`).join("\n");
    navigator.clipboard.writeText(txt).then(() => showToast("Order copied!"));
  };

  if (screen?.type === "qty") return <QtyScreen item={screen.item} onSave={setQty} onBack={() => setScreen(null)} />;
  if (screen?.type === "addItem") return <AddItemScreen prefillSku={screen.sku || ""} vendors={vendors} onSave={addItem} onBack={() => setScreen(null)} />;
  if (screen?.type === "addVendor") return <AddVendorScreen onSave={addVendor} onBack={() => setScreen(null)} />;

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
      {toast && <div style={T.toast}>{toast}</div>}
      {showCamera && <BarcodeScanner onDetected={handleDetected} onClose={() => setShowCamera(false)} />}

      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
          <div style={{ background: "var(--color-background-primary)", borderRadius: 28, padding: "40px 32px", width: "100%", maxWidth: 480 }}>
            <p style={{ fontSize: fs.lg, fontWeight: 800, color: "var(--color-text-primary)", margin: "0 0 16px" }}>Delete {confirmDelete.label}?</p>
            <p style={{ fontSize: fs.md, color: "var(--color-text-secondary)", margin: "0 0 36px", lineHeight: 1.5 }}>{confirmDelete.warning}</p>
            <div style={{ display: "flex", gap: 16 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: "24px", borderRadius: 20, border: "1.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", fontSize: fs.md, fontWeight: 700, cursor: "pointer", color: "var(--color-text-primary)" }}>Cancel</button>
              <button onClick={() => { confirmDelete.action(); setConfirmDelete(null); }} style={{ flex: 1, padding: "24px", borderRadius: 20, border: "none", background: "#E24B4A", color: "#fff", fontSize: fs.md, fontWeight: 700, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={T.topNav}>
        {NAV.map(n => (
          <button key={n.id} style={T.topBtn(view === n.id)} onClick={() => setView(n.id)}>
            {n.icon}
            {n.label}
            {n.id === "Order" && needsOrder.length > 0 && (
              <span style={{ background: "#E24B4A", color: "#fff", borderRadius: 24, fontSize: fs.xs, fontWeight: 700, padding: "4px 12px" }}>{needsOrder.length}</span>
            )}
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
            <button onClick={() => setScreen({ type: "addItem" })} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: 20, padding: "20px 32px", fontSize: fs.md, fontWeight: 700, cursor: "pointer" }}>+ Add</button>
          </div>
          <div style={{ padding: "0 20px 18px" }}>
            <input style={T.input} placeholder="Search items or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 14, overflowX: "auto", padding: "0 20px 20px", scrollbarWidth: "none" }}>
            {CATEGORIES.map(c => <button key={c} style={T.chip(cat === c)} onClick={() => setCat(c)}>{c}</button>)}
          </div>
          {filtered.map(item => {
            const color = sColor(item);
            const v = vendors.find(v => v.id === item.vendor)?.name || "";
            return (
              <div key={item.id} style={T.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                  <div style={{ flex: 1, marginRight: 16 }}>
                    <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: fs.lg, color: "var(--color-text-primary)" }}>{item.name}</p>
                    <p style={{ margin: 0, fontSize: fs.sm, color: "var(--color-text-secondary)" }}>{item.category} · {v}</p>
                  </div>
                  <span style={T.badge(color)}>{sLabel(item)}</span>
                </div>
                <div style={{ height: 14, borderRadius: 10, background: "var(--color-border-tertiary)", overflow: "hidden", marginBottom: 18 }}>
                  <div style={{ height: "100%", width: Math.min(100, (item.qty / item.par) * 100) + "%", background: color, borderRadius: 10 }} />
                </div>
                <div style={{ display: "flex", gap: 14 }}>
                  <button onClick={() => setScreen({ type: "qty", item })} style={{ flex: 1, padding: "22px 20px", borderRadius: 20, border: "1.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: fs.sm, color: "var(--color-text-secondary)", fontWeight: 600 }}>On hand</span>
                    <span style={{ fontSize: fs.xl, fontWeight: 800, color }}>{item.qty} <span style={{ fontSize: fs.sm, fontWeight: 500, color: "var(--color-text-secondary)" }}>{item.unit}</span></span>
                  </button>
                  <button onClick={() => setConfirmDelete({ label: item.name, warning: "This item will be permanently removed from your inventory.", action: () => deleteItem(item.id) })} style={{ width: 72, borderRadius: 20, border: "none", background: "#FCEBEB", color: "#A32D2D", fontSize: fs.lg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p style={{ textAlign: "center", color: "var(--color-text-secondary)", marginTop: 60, fontSize: fs.md }}>No items found.</p>}
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
          <div style={{ padding: "0 28px" }}>
            <button style={T.bigBtn()} onClick={() => { setScanResult(null); setShowCamera(true); }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              Scan with Camera
            </button>
            <p style={{ textAlign: "center", fontSize: fs.sm, color: "var(--color-text-secondary)", margin: "12px 0 32px" }}>Requires iOS 17+ for native barcode detection</p>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
              <div style={{ flex: 1, height: 2, background: "var(--color-border-tertiary)" }} />
              <span style={{ fontSize: fs.sm, color: "var(--color-text-secondary)" }}>or type manually</span>
              <div style={{ flex: 1, height: 2, background: "var(--color-border-tertiary)" }} />
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <input style={{ ...T.input, flex: 1 }} placeholder="SKU or product name" value={scanInput} onChange={e => setScanInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleManualSearch()} />
              <button onClick={handleManualSearch} style={{ padding: "24px 28px", borderRadius: 20, border: "none", background: "#185FA5", color: "#fff", fontSize: fs.md, fontWeight: 700, cursor: "pointer" }}>Find</button>
            </div>
            {scanResult && !scanResult.notFound && (
              <div style={{ ...T.card, margin: "28px 0 0", border: "2.5px solid #185FA5" }}>
                <p style={{ margin: "0 0 10px", fontWeight: 800, fontSize: fs.lg, color: "var(--color-text-primary)" }}>{scanResult.name}</p>
                <p style={{ margin: "0 0 28px", fontSize: fs.sm, color: "var(--color-text-secondary)" }}>SKU: {scanResult.sku}</p>
                <button onClick={() => setScreen({ type: "qty", item: items.find(i => i.id === scanResult.id) })} style={T.bigBtn()}>Update Quantity</button>
              </div>
            )}
            {scanResult && scanResult.notFound && (
              <div style={{ ...T.card, margin: "28px 0 0", border: "2.5px solid #E24B4A" }}>
                <p style={{ margin: "0 0 10px", fontWeight: 800, color: "#E24B4A", fontSize: fs.lg }}>Not in inventory</p>
                <p style={{ margin: "0 0 24px", fontSize: fs.sm, color: "var(--color-text-secondary)" }}>SKU: {scanResult.sku}</p>
                <button style={T.bigBtn()} onClick={() => setScreen({ type: "addItem", sku: scanResult.sku })}>Add as New Product</button>
              </div>
            )}
          </div>
        </div>
      )}

      {view === "Order" && (
        <div style={T.screen}>
          <div style={T.pageHeader}>
            <div>
              <p style={T.pageTitle}>Order</p>
              <p style={T.pageSub}>{needsOrder.length} items below par</p>
            </div>
          </div>
          <div style={{ padding: "0 24px 24px" }}>
            <select style={{ ...T.formInput, marginBottom: 0 }} value={orderVendor} onChange={e => setOrderVendor(e.target.value)}>
              <option value="all">All Vendors</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          {orderFiltered.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: 80 }}>
              <p style={{ fontSize: 80, marginBottom: 20 }}>✓</p>
              <p style={{ fontWeight: 800, color: "var(--color-text-primary)", fontSize: fs.xl }}>All stocked up!</p>
              <p style={{ fontSize: fs.md, color: "var(--color-text-secondary)" }}>No items need reordering.</p>
            </div>
          ) : (
            <>
              {vendors.filter(v => orderVendor === "all" || v.id === orderVendor).map(vendor => {
                const vItems = orderFiltered.filter(i => i.vendor === vendor.id);
                if (!vItems.length) return null;
                return (
                  <div key={vendor.id}>
                    <p style={{ fontSize: fs.sm, fontWeight: 700, color: "var(--color-text-secondary)", padding: "20px 24px 12px", textTransform: "uppercase", letterSpacing: "0.07em" }}>{vendor.name}</p>
                    {vItems.map(item => (
                      <div key={item.id} style={T.card}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: fs.md, color: "var(--color-text-primary)" }}>{item.name}</p>
                            <p style={{ margin: 0, fontSize: fs.sm, color: "var(--color-text-secondary)" }}>Have {item.qty} · Par {item.par} {item.unit}</p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: fs.xxl, color: sColor(item) }}>{item.par - item.qty}</p>
                            <p style={{ margin: 0, fontSize: fs.xs, color: "var(--color-text-secondary)" }}>{item.unit} needed</p>
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
          <div style={T.pageHeader}>
            <p style={T.pageTitle}>Vendors</p>
            <button onClick={() => setScreen({ type: "addVendor" })} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: 20, padding: "20px 32px", fontSize: fs.md, fontWeight: 700, cursor: "pointer" }}>+ Add</button>
          </div>
          {vendors.map(v => {
            const vItems = items.filter(i => i.vendor === v.id);
            const vOrder = needsOrder.filter(i => i.vendor === v.id);
            return (
              <div key={v.id} style={T.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <div>
                    <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: fs.lg, color: "var(--color-text-primary)" }}>{v.name}</p>
                    <p style={{ margin: 0, fontSize: fs.sm, color: "var(--color-text-secondary)" }}>{vItems.length} products</p>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {vOrder.length > 0 && <span style={{ background: "#FCEBEB", color: "#A32D2D", fontSize: fs.sm, fontWeight: 700, padding: "10px 20px", borderRadius: 30 }}>{vOrder.length} to order</span>}
                    <button onClick={() => setConfirmDelete({ label: v.name, warning: `This will also delete all ${vItems.length} items assigned to this vendor.`, action: () => deleteVendor(v.id) })} style={{ width: 64, height: 64, borderRadius: 18, border: "none", background: "#FCEBEB", color: "#A32D2D", fontSize: fs.lg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {vItems.map(i => <span key={i.id} style={{ fontSize: fs.xs, background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", padding: "8px 20px", borderRadius: 30, border: "1px solid var(--color-border-tertiary)" }}>{i.name}</span>)}
                  {vItems.length === 0 && <span style={{ fontSize: fs.xs, color: "var(--color-text-secondary)" }}>No items assigned</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
