import React, { useState, useRef, useEffect } from 'react'

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

const QUAGGA_URL = "https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js";

function BarcodeScanner({ onDetected, onClose }) {
  const containerRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const quaggaRef = useRef(null);

  useEffect(() => {
    let script = document.getElementById("quagga-script");
    const init = () => {
      setLoaded(true);
    };
    if (window.Quagga) { setLoaded(true); return; }
    if (!script) {
      script = document.createElement("script");
      script.id = "quagga-script";
      script.src = QUAGGA_URL;
      script.onload = init;
      script.onerror = () => setError("Failed to load scanner library.");
      document.head.appendChild(script);
    } else {
      script.addEventListener("load", init);
    }
    return () => script.removeEventListener("load", init);
  }, []);

  useEffect(() => {
    if (!loaded || !containerRef.current) return;
    const Q = window.Quagga;
    quaggaRef.current = Q;

    Q.init({
      inputStream: {
        type: "LiveStream",
        target: containerRef.current,
        constraints: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      },
      locator: { patchSize: "medium", halfSample: true },
      numOfWorkers: 2,
      frequency: 10,
      decoder: { readers: ["ean_reader","ean_8_reader","upc_reader","upc_e_reader","code_128_reader","code_39_reader"] },
      locate: true,
    }, (err) => {
      if (err) { setError("Camera access denied or unavailable."); return; }
      Q.start();
    });

    const handler = (result) => {
      if (result.codeResult) {
        Q.stop();
        onDetected(result.codeResult.code);
      }
    };
    Q.onDetected(handler);

    return () => {
      try { Q.offDetected(handler); Q.stop(); } catch(e) {}
    };
  }, [loaded, onDetected]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 200, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "rgba(0,0,0,0.7)" }}>
        <p style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: 16 }}>Scan Barcode</p>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 20, padding: "6px 14px", cursor: "pointer", fontSize: 14 }}>Cancel</button>
      </div>

      {error ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", padding: 24, textAlign: "center" }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📷</p>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>{error}</p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>Please allow camera access in your browser settings, then try again.</p>
          <button onClick={onClose} style={{ marginTop: 20, background: "#185FA5", border: "none", color: "#fff", borderRadius: 10, padding: "12px 24px", cursor: "pointer", fontWeight: 600 }}>Go Back</button>
        </div>
      ) : (
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
          {/* Viewfinder overlay */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ width: 260, height: 140, position: "relative" }}>
              {/* Corner markers */}
              {[["0,0","borderTop","borderLeft"],["0,auto","borderBottom","borderLeft"],["auto,0","borderTop","borderRight"],["auto,auto","borderBottom","borderRight"]].map(([pos,b1,b2],i) => {
                const [t,b] = pos.split(",");
                return <div key={i} style={{ position: "absolute", top: t === "0" ? 0 : "auto", bottom: b === "0" ? 0 : "auto", left: b2 === "borderLeft" ? 0 : "auto", right: b2 === "borderRight" ? 0 : "auto", width: 24, height: 24, [b1]: "3px solid #185FA5", [b2]: "3px solid #185FA5" }} />;
              })}
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "rgba(24,95,165,0.7)", transform: "translateY(-50%)" }} />
            </div>
          </div>
          {!loaded && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <p>Loading scanner...</p>
            </div>
          )}
        </div>
      )}
      <div style={{ background: "rgba(0,0,0,0.7)", padding: "12px 24px", textAlign: "center" }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontSize: 13 }}>Hold steady — align barcode within the frame</p>
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

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const filtered = items.filter(i =>
    (cat === "All" || i.category === cat) &&
    (i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.includes(search))
  );
  const needsOrder = items.filter(i => i.qty < i.par);
  const orderFiltered = orderVendor === "all" ? needsOrder : needsOrder.filter(i => i.vendor === orderVendor);

  const updateQty = (id, delta) => setItems(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i));

  const handleDetected = (code) => {
    setShowCamera(false);
    setScanInput(code);
    const found = items.find(i => i.sku === code);
    setScanResult(found || { notFound: true, sku: code });
    showToast(found ? `Found: ${found.name}` : "Barcode not in inventory");
  };

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
    wrap: { fontFamily: "system-ui, sans-serif", maxWidth: 420, margin: "0 auto", paddingBottom: 70 },
    header: { padding: "16px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" },
    title: { fontSize: 20, fontWeight: 600, color: "var(--color-text-primary)", margin: 0 },
    sub: { fontSize: 13, color: "var(--color-text-secondary)", marginTop: 2 },
    nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, background: "var(--color-background-primary)", borderTop: "0.5px solid var(--color-border-tertiary)", display: "flex", zIndex: 10 },
    navBtn: (a) => ({ flex: 1, padding: "10px 0 8px", border: "none", background: "none", cursor: "pointer", fontSize: 11, color: a ? "#185FA5" : "var(--color-text-secondary)", fontWeight: a ? 600 : 400, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }),
    navDot: { width: 5, height: 5, borderRadius: "50%", background: "#E24B4A" },
    input: { flex: 1, padding: "9px 12px", borderRadius: 10, border: "0.5px solid var(--color-border-secondary)", fontSize: 14, background: "var(--color-background-secondary)", color: "var(--color-text-primary)" },
    chip: (a) => ({ padding: "6px 12px", borderRadius: 20, border: "0.5px solid " + (a ? "#185FA5" : "var(--color-border-tertiary)"), background: a ? "#E6F1FB" : "var(--color-background-secondary)", color: a ? "#185FA5" : "var(--color-text-secondary)", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", fontWeight: a ? 600 : 400 }),
    card: { background: "var(--color-background-primary)", borderRadius: 14, border: "0.5px solid var(--color-border-tertiary)", padding: "12px 14px", margin: "0 16px 10px" },
    badge: (c) => ({ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: c + "22", color: c, fontWeight: 600 }),
    qtyBtn: { width: 30, height: 30, borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-primary)" },
    bigBtn: { width: "100%", padding: "13px", borderRadius: 12, border: "none", background: "#185FA5", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 12 },
    modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "flex-end" },
    modalBox: { width: "100%", maxWidth: 420, margin: "0 auto", background: "var(--color-background-primary)", borderRadius: "18px 18px 0 0", padding: "20px 16px 36px" },
    label: { fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 4, display: "block" },
    formInput: { width: "100%", padding: "9px 12px", borderRadius: 10, border: "0.5px solid var(--color-border-secondary)", fontSize: 14, background: "var(--color-background-secondary)", color: "var(--color-text-primary)", boxSizing: "border-box", marginBottom: 10 },
    toast: { position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#185FA5", color: "#fff", padding: "10px 20px", borderRadius: 24, fontSize: 13, fontWeight: 600, zIndex: 300, whiteSpace: "nowrap" },
    sectionTitle: { fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", padding: "14px 16px 6px", textTransform: "uppercase", letterSpacing: "0.05em" },
  };

  const navIcons = {
    Inventory: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    Scan: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>,
    Order: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
    Vendors: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  };

  return (
    <div style={s.wrap}>
      {toast && <div style={s.toast}>{toast}</div>}
      {showCamera && <BarcodeScanner onDetected={handleDetected} onClose={() => setShowCamera(false)} />}

      {/* INVENTORY */}
      {view === "Inventory" && (
        <>
          <div style={s.header}>
            <div>
              <p style={s.title}>KitchenStock</p>
              <p style={s.sub}>{items.length} items · {needsOrder.length} need reorder</p>
            </div>
            <button onClick={() => setShowAddModal(true)} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Add</button>
          </div>
          <div style={{ margin: "12px 16px 0", display: "flex", gap: 8 }}>
            <input style={s.input} placeholder="Search items or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "10px 16px 0", scrollbarWidth: "none" }}>
            {CATEGORIES.map(c => <button key={c} style={s.chip(cat === c)} onClick={() => setCat(c)}>{c}</button>)}
          </div>
          <div style={{ marginTop: 14 }}>
            {filtered.map(item => {
              const color = statusColor(item.qty, item.par);
              const pct = item.qty / item.par;
              const v = VENDORS.find(v => v.id === item.vendor)?.name || "";
              return (
                <div key={item.id} style={s.card}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "var(--color-text-primary)" }}>{item.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-secondary)" }}>{item.category} · {v}</p>
                    </div>
                    <span style={s.badge(color)}>{statusLabel(item.qty, item.par)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                    <button style={s.qtyBtn} onClick={() => updateQty(item.id, -1)}>−</button>
                    <div style={{ textAlign: "center", minWidth: 60 }}>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)" }}>{item.qty}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>of {item.par} {item.unit}</p>
                    </div>
                    <button style={s.qtyBtn} onClick={() => updateQty(item.id, 1)}>+</button>
                    <div style={{ flex: 1, height: 6, borderRadius: 4, background: "var(--color-border-tertiary)", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: Math.min(100, pct * 100) + "%", background: color, borderRadius: 4, transition: "width 0.3s" }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p style={{ textAlign: "center", color: "var(--color-text-secondary)", marginTop: 40 }}>No items found.</p>}
          </div>
        </>
      )}

      {/* SCAN */}
      {view === "Scan" && (
        <>
          <div style={s.header}>
            <div>
              <p style={s.title}>Scan Product</p>
              <p style={s.sub}>Use camera or enter barcode manually</p>
            </div>
          </div>
          <div style={{ margin: "20px 16px 0" }}>
            <button style={{ ...s.bigBtn, marginTop: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }} onClick={() => { setScanResult(null); setShowCamera(true); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              Scan with Camera
            </button>
            <p style={{ textAlign: "center", fontSize: 12, color: "var(--color-text-secondary)", margin: "6px 0 0" }}>Works with UPC, EAN, Code 128 barcodes</p>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0 12px" }}>
              <div style={{ flex: 1, height: "0.5px", background: "var(--color-border-tertiary)" }} />
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>or enter manually</span>
              <div style={{ flex: 1, height: "0.5px", background: "var(--color-border-tertiary)" }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={s.input} placeholder="Barcode / SKU / product name" value={scanInput} onChange={e => setScanInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleManualSearch()} />
              <button onClick={handleManualSearch} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "#185FA5", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Find</button>
            </div>

            {scanResult && !scanResult.notFound && (
              <div style={{ ...s.card, margin: "14px 0 0", border: "1.5px solid #185FA5" }}>
                <p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: 16, color: "var(--color-text-primary)" }}>{scanResult.name}</p>
                <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--color-text-secondary)" }}>{scanResult.category} · SKU {scanResult.sku}</p>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--color-text-secondary)" }}>Current qty: <strong>{scanResult.qty} {scanResult.unit}</strong> · Par: {scanResult.par}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#E6F1FB", color: "#185FA5", fontWeight: 600, cursor: "pointer" }} onClick={() => { updateQty(scanResult.id, -1); setScanResult(p => ({ ...p, qty: Math.max(0, p.qty - 1) })); showToast("Qty updated!"); }}>− Remove 1</button>
                  <button style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#185FA5", color: "#fff", fontWeight: 600, cursor: "pointer" }} onClick={() => { updateQty(scanResult.id, 1); setScanResult(p => ({ ...p, qty: p.qty + 1 })); showToast("Qty updated!"); }}>+ Add 1</button>
                </div>
              </div>
            )}
            {scanResult && scanResult.notFound && (
              <div style={{ ...s.card, margin: "14px 0 0", border: "1.5px solid #E24B4A" }}>
                <p style={{ margin: "0 0 4px", fontWeight: 600, color: "#E24B4A" }}>Product not found</p>
                <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--color-text-secondary)" }}>SKU: {scanResult.sku}</p>
                <button style={{ ...s.bigBtn, marginTop: 0 }} onClick={() => { setShowAddModal(true); setNewItem(n => ({ ...n, sku: scanResult.sku })); }}>Add as New Product</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ORDER */}
      {view === "Order" && (
        <>
          <div style={s.header}>
            <div>
              <p style={s.title}>Order Sheet</p>
              <p style={s.sub}>{needsOrder.length} items below par level</p>
            </div>
          </div>
          <div style={{ margin: "14px 16px 0" }}>
            <select style={s.formInput} value={orderVendor} onChange={e => setOrderVendor(e.target.value)}>
              <option value="all">All Vendors</option>
              {VENDORS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          {orderFiltered.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: 60 }}>
              <p style={{ fontSize: 40, marginBottom: 8 }}>✓</p>
              <p style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>All stocked up!</p>
              <p style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>No items need reordering.</p>
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
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "var(--color-text-primary)" }}>{item.name}</p>
                              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-secondary)" }}>Have {item.qty} · Par {item.par} {item.unit}</p>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: 18, color }}>{needed}</p>
                              <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>{item.unit} needed</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <div style={{ padding: "0 16px 16px" }}>
                <button style={s.bigBtn} onClick={exportOrder}>Copy Order to Clipboard</button>
              </div>
            </>
          )}
        </>
      )}

      {/* VENDORS */}
      {view === "Vendors" && (
        <>
          <div style={s.header}><p style={s.title}>Vendors</p></div>
          <div style={{ marginTop: 14 }}>
            {VENDORS.map(v => {
              const vItems = items.filter(i => i.vendor === v.id);
              const vOrder = needsOrder.filter(i => i.vendor === v.id);
              return (
                <div key={v.id} style={s.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "var(--color-text-primary)" }}>{v.name}</p>
                      <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--color-text-secondary)" }}>{vItems.length} products</p>
                    </div>
                    {vOrder.length > 0 && <span style={{ background: "#FCEBEB", color: "#A32D2D", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>{vOrder.length} to order</span>}
                  </div>
                  <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {vItems.map(i => <span key={i.id} style={{ fontSize: 12, background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", padding: "3px 10px", borderRadius: 20, border: "0.5px solid var(--color-border-tertiary)" }}>{i.name}</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <div style={s.modal} onClick={() => setShowAddModal(false)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <p style={{ ...s.title, marginBottom: 16 }}>Add Product</p>
            <label style={s.label}>Product Name</label>
            <input style={s.formInput} placeholder="e.g. Cherry Tomatoes" value={newItem.name} onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))} />
            <label style={s.label}>SKU / Barcode</label>
            <input style={s.formInput} placeholder="e.g. 074175604517" value={newItem.sku} onChange={e => setNewItem(n => ({ ...n, sku: e.target.value }))} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <label style={s.label}>Category</label>
                <select style={s.formInput} value={newItem.category} onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))}>
                  {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Unit</label>
                <input style={s.formInput} placeholder="lbs, gal, cs..." value={newItem.unit} onChange={e => setNewItem(n => ({ ...n, unit: e.target.value }))} />
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