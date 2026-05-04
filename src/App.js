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

const statusColor = (qty, par) => {
  const r = qty / par;
  if (r <= 0.25) return "#E24B4A";
  if (r <= 0.5) return "#EF9F27";
  return "#1D9E75";
};
const statusLabel = (qty, par) => {
  const r = qty / par;
  if (r <= 0.25) return "Critical";
  if (r <= 0.5) return "Low";
  return "OK";
};

const views = ["Inventory", "Scan", "Order", "Vendors"];

function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);
  const [status, setStatus] = useState("Starting camera...");
  const [error, setError] = useState(null);
  const lastScan = useRef(0);

  useEffect(() => {
    let active = true;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setStatus("Align barcode in frame");
        }
      } catch(e) {
        setError("Camera access denied. Please allow camera in Safari settings.");
      }
    };
    startCamera();
    return () => {
      active = false;
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  useEffect(() => {
    if (!window.BarcodeDetector) {
      loadZxing();
      return;
    }
    let detector;
    try {
      detector = new window.BarcodeDetector({ formats: ["ean_13","ean_8","upc_a","upc_e","code_128","code_39","qr_code","itf","codabar"] });
    } catch(e) { loadZxing(); return; }

    const scan = async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        const now = Date.now();
        if (now - lastScan.current > 300) {
          lastScan.current = now;
          try {
            const results = await detector.detect(videoRef.current);
            if (results.length > 0) {
              const code = results[0].rawValue;
              onDetected(code);
              return;
            }
          } catch(e) {}
        }
      }
      animRef.current = requestAnimationFrame(scan);
    };
    animRef.current = requestAnimationFrame(scan);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [onDetected]);

  const loadZxing = useCallback(() => {
    if (document.getElementById("zxing-script")) { initZxing(); return; }
    const s = document.createElement("script");
    s.id = "zxing-script";
    s.src = "https://unpkg.com/@zxing/library@0.19.1/umd/index.min.js";
    s.onload = initZxing;
    s.onerror = () => setError("Failed to load scanner. Try manual entry.");
    document.head.appendChild(s);
  }, []);

  const initZxing = useCallback(() => {
    if (!window.ZXing || !videoRef.current) return;
    const hints = new Map();
    const formats = [
      window.ZXing.BarcodeFormat.EAN_13, window.ZXing.BarcodeFormat.EAN_8,
      window.ZXing.BarcodeFormat.UPC_A, window.ZXing.BarcodeFormat.UPC_E,
      window.ZXing.BarcodeFormat.CODE_128, window.ZXing.BarcodeFormat.CODE_39,
    ];
    hints.set(window.ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);
    const reader = new window.ZXing.MultiFormatReader();
    reader.setHints(hints);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const tick = () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) { animRef.current = requestAnimationFrame(tick); return; }
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const luminance = new window.ZXing.RGBLuminanceSource(imgData.data, canvas.width, canvas.height);
        const binary = new window.ZXing.BinaryBitmap(new window.ZXing.HybridBinarizer(luminance));
        const result = reader.decode(binary);
        if (result) { onDetected(result.getText()); return; }
      } catch(e) {}
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }, [onDetected]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 200, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px", background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)" }}>
        <p style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: 26 }}>Scan Barcode</p>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.25)", border: "none", color: "#fff", borderRadius: 24, padding: "12px 24px", cursor: "pointer", fontSize: 20, fontWeight: 600 }}>Cancel</button>
      </div>

      {error ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", padding: 32, textAlign: "center" }}>
          <p style={{ fontSize: 60, marginBottom: 16 }}>📷</p>
          <p style={{ fontWeight: 700, marginBottom: 12, fontSize: 22 }}>{error}</p>
          <button onClick={onClose} style={{ marginTop: 24, background: "#185FA5", border: "none", color: "#fff", borderRadius: 16, padding: "18px 36px", cursor: "pointer", fontWeight: 700, fontSize: 20 }}>Go Back</button>
        </div>
      ) : (
        <>
          <video ref={videoRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} playsInline muted autoPlay />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ width: "80%", height: 180, position: "relative" }}>
              {[[0,0],[0,1],[1,0],[1,1]].map(([t,r],i) => (
                <div key={i} style={{ position: "absolute", top: t ? "auto" : 0, bottom: t ? 0 : "auto", left: r ? "auto" : 0, right: r ? 0 : "auto", width: 36, height: 36, borderTop: !t ? "4px solid #fff" : "none", borderBottom: t ? "4px solid #fff" : "none", borderLeft: !r ? "4px solid #fff" : "none", borderRight: r ? "4px solid #fff" : "none" }} />
              ))}
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 3, background: "rgba(255,60,60,0.85)", transform: "translateY(-50%)", borderRadius: 2 }} />
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px", background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)", textAlign: "center" }}>
            <p style={{ margin: 0, color: "#fff", fontSize: 20 }}>{status}</p>
          </div>
        </>
      )}
    </div>
  );
}

function QtyEditor({ item, onUpdate, onClose }) {
  const [val, setVal] = useState(String(item.qty));
  const color = statusColor(item.qty, item.par);
  const save = () => { const n = parseInt(val); if (!isNaN(n) && n >= 0) onUpdate(item.id, n); onClose(); };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 150, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div style={{ width: "100%", background: "var(--color-background-primary)", borderRadius: "28px 28px 0 0", padding: "32px 24px 56px" }} onClick={e => e.stopPropagation()}>
        <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 28, color: "var(--color-text-primary)" }}>{item.name}</p>
        <p style={{ margin: "0 0 28px", fontSize: 22, color: "var(--color-text-secondary)" }}>Par level: {item.par} {item.unit}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <button onClick={() => setVal(v => String(Math.max(0, parseInt(v||0) - 1)))} style={{ width: 72, height: 72, borderRadius: 18, border: "none", background: "#E6F1FB", color: "#185FA5", fontSize: 40, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
          <input
            type="number" min="0"
            value={val}
            onChange={e => setVal(e.target.value)}
            style={{ flex: 1, textAlign: "center", fontSize: 56, fontWeight: 700, border: "2px solid var(--color-border-secondary)", borderRadius: 18, padding: "16px 8px", background: "var(--color-background-secondary)", color: "var(--color-text-primary)" }}
            autoFocus
          />
          <button onClick={() => setVal(v => String(parseInt(v||0) + 1))} style={{ width: 72, height: 72, borderRadius: 18, border: "none", background: "#185FA5", color: "#fff", fontSize: 40, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 10, borderRadius: 6, background: "var(--color-border-tertiary)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: Math.min(100, (parseInt(val||0) / item.par) * 100) + "%", background: statusColor(parseInt(val||0), item.par), borderRadius: 6 }} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: statusColor(parseInt(val||0), item.par) }}>{statusLabel(parseInt(val||0), item.par)}</span>
        </div>
        <button onClick={save} style={{ width: "100%", padding: "22px", borderRadius: 18, border: "none", background: "#185FA5", color: "#fff", fontSize: 24, fontWeight: 700, cursor: "pointer" }}>Save Quantity</button>
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name:"", sku:"", category:"Produce", unit:"", qty:0, par:0, vendor:"v1" });
  const [orderVendor, setOrderVendor] = useState("all");
  const [toast, setToast] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const filtered = items.filter(i =>
    (cat === "All" || i.category === cat) &&
    (i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.includes(search))
  );
  const needsOrder = items.filter(i => i.qty < i.par);
  const orderFiltered = orderVendor === "all" ? needsOrder : needsOrder.filter(i => i.vendor === orderVendor);

  const setQty = (id, qty) => setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));

  const handleDetected = useCallback((code) => {
    setShowCamera(false);
    setScanInput(code);
    const found = items.find(i => i.sku === code);
    setScanResult(found || { notFound: true, sku: code });
    showToast(found ? `Found: ${found.name}` : `Scanned: ${code} — not in inventory`);
  }, [items]);

  const handleManualSearch = () => {
    const q = scanInput.trim().toLowerCase();
    const found = items.find(i => i.sku === scanInput.trim() || i.name.toLowerCase() === q);
    setScanResult(found || { notFound: true, sku: scanInput });
  };

  const addItem = () => {
    if (!newItem.name) return;
    setItems(prev => [...prev, { ...newItem, id: Date.now(), qty: Number(newItem.qty), par: Number(newItem.par) }]);
    setShowAddModal(false);
    setNewItem({ name:"", sku:"", category:"Produce", unit:"", qty:0, par:0, vendor:"v1" });
    showToast("Item added!");
  };

  const exportOrder = () => {
    const lines = orderFiltered.map(i => {
      const v = VENDORS.find(v => v.id === i.vendor)?.name || "";
      return `${i.name} | Need: ${i.par - i.qty} ${i.unit} | Vendor: ${v}`;
    }).join("\n");
    navigator.clipboard.writeText(lines).then(() => showToast("Order copied!"));
  };

  const s = {
    wrap: { fontFamily: "system-ui, sans-serif", width: "100%", maxWidth: "100vw", margin: 0, paddingBottom: 130, boxSizing: "border-box", overflowX: "hidden" },
    header: { padding: "36px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" },
    title: { fontSize: 40, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 },
    sub: { fontSize: 22, color: "var(--color-text-secondary)", marginTop: 6 },
    nav: { position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--color-background-primary)", borderTop: "1px solid var(--color-border-tertiary)", display: "flex", zIndex: 10 },
    navBtn: (a) => ({ flex: 1, padding: "20px 0 18px", border: "none", background: "none", cursor: "pointer", fontSize: 17, color: a ? "#185FA5" : "var(--color-text-secondary)", fontWeight: a ? 700 : 400, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }),
    navDot: { width: 9, height: 9, borderRadius: "50%", background: "#E24B4A" },
    input: { flex: 1, padding: "20px 22px", borderRadius: 18, border: "1px solid var(--color-border-secondary)", fontSize: 24, background: "var(--color-background-secondary)", color: "var(--color-text-primary)" },
    chip: (a) => ({ padding: "14px 24px", borderRadius: 30, border: "1px solid " + (a ? "#185FA5" : "var(--color-border-tertiary)"), background: a ? "#E6F1FB" : "var(--color-background-secondary)", color: a ? "#185FA5" : "var(--color-text-secondary)", fontSize: 20, cursor: "pointer", whiteSpace: "nowrap", fontWeight: a ? 700 : 400 }),
    card: { background: "var(--color-background-primary)", borderRadius: 22, border: "1px solid var(--color-border-tertiary)", padding: "24px", margin: "0 20px 16px" },
    badge: (c) => ({ fontSize: 20, padding: "8px 18px", borderRadius: 30, background: c + "22", color: c, fontWeight: 700 }),
    bigBtn: { width: "100%", padding: "24px", borderRadius: 20, border: "none", background: "#185FA5", color: "#fff", fontSize: 24, fontWeight: 700, cursor: "pointer", marginTop: 18 },
    modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "flex-end" },
    modalBox: { width: "100%", background: "var(--color-background-primary)", borderRadius: "28px 28px 0 0", padding: "32px 24px 64px" },
    label: { fontSize: 21, color: "var(--color-text-secondary)", marginBottom: 8, display: "block" },
    formInput: { width: "100%", padding: "20px 22px", borderRadius: 18, border: "1px solid var(--color-border-secondary)", fontSize: 24, background: "var(--color-background-secondary)", color: "var(--color-text-primary)", boxSizing: "border-box", marginBottom: 16 },
    toast: { position: "fixed", top: 32, left: "50%", transform: "translateX(-50%)", background: "#185FA5", color: "#fff", padding: "18px 36px", borderRadius: 40, fontSize: 21, fontWeight: 700, zIndex: 300, whiteSpace: "nowrap", maxWidth: "90vw", textAlign: "center" },
    sectionTitle: { fontSize: 20, fontWeight: 700, color: "var(--color-text-secondary)", padding: "24px 24px 12px", textTransform: "uppercase", letterSpacing: "0.06em" },
  };

  const navIcons = {
    Inventory: <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    Scan: <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>,
    Order: <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
    Vendors: <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  };

  return (
    <div style={s.wrap}>
      {toast && <div style={s.toast}>{toast}</div>}
      {showCamera && <BarcodeScanner onDetected={handleDetected} onClose={() => setShowCamera(false)} />}
      {editingItem && <QtyEditor item={editingItem} onUpdate={setQty} onClose={() => setEditingItem(null)} />}

      {view === "Inventory" && (
        <>
          <div style={s.header}>
            <div>
              <p style={s.title}>KitchenStock</p>
              <p style={s.sub}>{items.length} items · {needsOrder.length} to reorder</p>
            </div>
            <button onClick={() => setShowAddModal(true)} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: 16, padding: "14px 22px", fontSize: 22, fontWeight: 700, cursor: "pointer" }}>+ Add</button>
          </div>
          <div style={{ margin: "20px 20px 0", display: "flex", gap: 12 }}>
            <input style={s.input} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "16px 20px 0", scrollbarWidth: "none" }}>
            {CATEGORIES.map(c => <button key={c} style={s.chip(cat === c)} onClick={() => setCat(c)}>{c}</button>)}
          </div>
          <div style={{ marginTop: 18 }}>
            {filtered.map(item => {
              const color = statusColor(item.qty, item.par);
              const pct = item.qty / item.par;
              const v = VENDORS.find(v => v.id === item.vendor)?.name || "";
              return (
                <div key={item.id} style={s.card}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 24, color: "var(--color-text-primary)" }}>{item.name}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 19, color: "var(--color-text-secondary)" }}>{item.category} · {v}</p>
                    </div>
                    <span style={s.badge(color)}>{statusLabel(item.qty, item.par)}</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 6, background: "var(--color-border-tertiary)", position: "relative", overflow: "hidden", marginBottom: 16 }}>
                    <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: Math.min(100, pct * 100) + "%", background: color, borderRadius: 6 }} />
                  </div>
                  <button onClick={() => setEditingItem(item)} style={{ width: "100%", padding: "16px", borderRadius: 16, border: "2px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 22, color: "var(--color-text-secondary)" }}>Qty on hand</span>
                    <span style={{ fontSize: 36, fontWeight: 700, color }}>{item.qty} <span style={{ fontSize: 20, fontWeight: 400, color: "var(--color-text-secondary)" }}>{item.unit}</span></span>
                  </button>
                </div>
              );
            })}
            {filtered.length === 0 && <p style={{ textAlign: "center", color: "var(--color-text-secondary)", marginTop: 48, fontSize: 22 }}>No items found.</p>}
          </div>
        </>
      )}

      {view === "Scan" && (
        <>
          <div style={s.header}>
            <div>
              <p style={s.title}>Scan</p>
              <p style={s.sub}>Camera or manual entry</p>
            </div>
          </div>
          <div style={{ margin: "28px 20px 0" }}>
            <button style={{ ...s.bigBtn, marginTop: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, fontSize: 26 }} onClick={() => { setScanResult(null); setShowCamera(true); }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              Scan with Camera
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0 20px" }}>
              <div style={{ flex: 1, height: 1, background: "var(--color-border-tertiary)" }} />
              <span style={{ fontSize: 20, color: "var(--color-text-secondary)" }}>or type manually</span>
              <div style={{ flex: 1, height: 1, background: "var(--color-border-tertiary)" }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <input style={s.input} placeholder="SKU or product name" value={scanInput} onChange={e => setScanInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleManualSearch()} />
              <button onClick={handleManualSearch} style={{ padding: "20px 22px", borderRadius: 18, border: "none", background: "#185FA5", color: "#fff", fontSize: 22, fontWeight: 700, cursor: "pointer" }}>Find</button>
            </div>

            {scanResult && !scanResult.notFound && (
              <div style={{ ...s.card, margin: "20px 0 0", border: "2px solid #185FA5" }}>
                <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 26, color: "var(--color-text-primary)" }}>{scanResult.name}</p>
                <p style={{ margin: "0 0 20px", fontSize: 20, color: "var(--color-text-secondary)" }}>SKU: {scanResult.sku}</p>
                <button onClick={() => { setEditingItem(items.find(i => i.id === scanResult.id)); }} style={{ width: "100%", padding: "20px", borderRadius: 18, border: "none", background: "#185FA5", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 22 }}>Update Quantity</button>
              </div>
            )}
            {scanResult && scanResult.notFound && (
              <div style={{ ...s.card, margin: "20px 0 0", border: "2px solid #E24B4A" }}>
                <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#E24B4A", fontSize: 24 }}>Not in inventory</p>
                <p style={{ margin: "0 0 16px", fontSize: 20, color: "var(--color-text-secondary)" }}>SKU: {scanResult.sku}</p>
                <button style={{ ...s.bigBtn, marginTop: 0 }} onClick={() => { setShowAddModal(true); setNewItem(n => ({ ...n, sku: scanResult.sku })); }}>Add as New Product</button>
              </div>
            )}
          </div>
        </>
      )}

      {view === "Order" && (
        <>
          <div style={s.header}>
            <div>
              <p style={s.title}>Order Sheet</p>
              <p style={s.sub}>{needsOrder.length} items below par</p>
            </div>
          </div>
          <div style={{ margin: "20px 20px 0" }}>
            <select style={s.formInput} value={orderVendor} onChange={e => setOrderVendor(e.target.value)}>
              <option value="all">All Vendors</option>
              {VENDORS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          {orderFiltered.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: 80 }}>
              <p style={{ fontSize: 56, marginBottom: 12 }}>✓</p>
              <p style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: 26 }}>All stocked up!</p>
              <p style={{ fontSize: 22, color: "var(--color-text-secondary)" }}>No items need reordering.</p>
            </div>
          ) : (
            <>
              {VENDORS.filter(v => orderVendor === "all" || v.id === orderVendor).map(vendor => {
                const vItems = orderFiltered.filter(i => i.vendor === vendor.id);
                if (!vItems.length) return null;
                return (
                  <div key={vendor.id}>
                    <p style={s.sectionTitle}>{vendor.name}</p>
                    {vItems.map(item => {
                      const needed = item.par - item.qty;
                      const color = statusColor(item.qty, item.par);
                      return (
                        <div key={item.id} style={s.card}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: 22, color: "var(--color-text-primary)" }}>{item.name}</p>
                              <p style={{ margin: "6px 0 0", fontSize: 19, color: "var(--color-text-secondary)" }}>Have {item.qty} · Par {item.par} {item.unit}</p>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: 34, color }}>{needed}</p>
                              <p style={{ margin: 0, fontSize: 18, color: "var(--color-text-secondary)" }}>{item.unit}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <div style={{ padding: "0 20px 20px" }}>
                <button style={s.bigBtn} onClick={exportOrder}>Copy Order to Clipboard</button>
              </div>
            </>
          )}
        </>
      )}

      {view === "Vendors" && (
        <>
          <div style={s.header}><p style={s.title}>Vendors</p></div>
          <div style={{ marginTop: 20 }}>
            {VENDORS.map(v => {
              const vItems = items.filter(i => i.vendor === v.id);
              const vOrder = needsOrder.filter(i => i.vendor === v.id);
              return (
                <div key={v.id} style={s.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 24, color: "var(--color-text-primary)" }}>{v.name}</p>
                      <p style={{ margin: "6px 0 0", fontSize: 20, color: "var(--color-text-secondary)" }}>{vItems.length} products</p>
                    </div>
                    {vOrder.length > 0 && <span style={{ background: "#FCEBEB", color: "#A32D2D", fontSize: 20, fontWeight: 700, padding: "8px 16px", borderRadius: 24 }}>{vOrder.length} to order</span>}
                  </div>
                  <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {vItems.map(i => <span key={i.id} style={{ fontSize: 18, background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", padding: "6px 16px", borderRadius: 24, border: "1px solid var(--color-border-tertiary)" }}>{i.name}</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {showAddModal && (
        <div style={s.modal} onClick={() => setShowAddModal(false)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 24px" }}>Add Product</p>
            <label style={s.label}>Product Name</label>
            <input style={s.formInput} placeholder="e.g. Cherry Tomatoes" value={newItem.name} onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))} />
            <label style={s.label}>SKU / Barcode</label>
            <input style={s.formInput} placeholder="e.g. 074175604517" value={newItem.sku} onChange={e => setNewItem(n => ({ ...n, sku: e.target.value }))} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={s.label}>Category</label>
                <select style={s.formInput} value={newItem.category} onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))}>
                  {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Unit</label>
                <input style={s.formInput} placeholder="lbs, gal..." value={newItem.unit} onChange={e => setNewItem(n => ({ ...n, unit: e.target.value }))} />
              </div>
              <div>
                <label style={s.label}>Current Qty</label>
                <input style={s.formInput} type="number" min="0" value={newItem.qty} onChange={e => setNewItem(n => ({ ...n, qty: e.target.value }))} />
              </div>
              <div>
                <label style={s.label}>Par Level</label>
                <input style={s.formInput} type="number" min="0" value={newItem.par} onChange={e => setNewItem(n => ({ ...n, par: e.target.value }))} />
              </div>
            </div>
            <label style={s.label}>Vendor</label>
            <select style={s.formInput} value={newItem.vendor} onChange={e => setNewItem(n => ({ ...n, vendor: e.target.value }))}>
              {VENDORS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <button style={s.bigBtn} onClick={addItem}>Add to Inventory</button>
          </div>
        </div>
      )}

      <nav style={s.nav}>
        {views.map(v => (
          <button key={v} style={s.navBtn(view === v)} onClick={() => setView(v)}>
            {navIcons[v]}
            {v}
            {v === "Order" && needsOrder.length > 0 && <div style={s.navDot} />}
          </button>
        ))}
      </nav>
    </div>
  );
}
