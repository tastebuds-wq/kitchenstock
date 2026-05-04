import React, { useState, useRef, useEffect, useCallback } from "react";

const CATEGORIES = ["All","Produce","Dairy","Dry Goods","Meat & Seafood","Beverages","Cleaning Supplies"];
const INIT_VENDORS = [
  { id: "v1", name: "Fresh Farms Co." },
  { id: "v2", name: "Metro Food Supply" },
  { id: "v3", name: "CleanPro Supplies" },
];
const INIT_ITEMS = [
  { id: 1, name: "Roma Tomatoes", sku: "074175604517", category: "Produce", unit: "lbs", qty: 4, par: 20, vendor: "v1", brand: "", notes: "" },
  { id: 2, name: "Whole Milk", sku: "041303005484", category: "Dairy", unit: "gal", qty: 2, par: 10, vendor: "v2", brand: "", notes: "" },
  { id: 3, name: "All-Purpose Flour", sku: "016000275287", category: "Dry Goods", unit: "lbs", qty: 15, par: 25, vendor: "v2", brand: "", notes: "" },
  { id: 4, name: "Chicken Breast", sku: "021000617418", category: "Meat & Seafood", unit: "lbs", qty: 8, par: 30, vendor: "v1", brand: "", notes: "" },
  { id: 5, name: "Olive Oil", sku: "071026001102", category: "Dry Goods", unit: "btl", qty: 3, par: 6, vendor: "v2", brand: "", notes: "" },
  { id: 6, name: "Heavy Cream", sku: "041303004593", category: "Dairy", unit: "qt", qty: 1, par: 8, vendor: "v1", brand: "", notes: "" },
  { id: 7, name: "Dish Soap", sku: "037000864868", category: "Cleaning Supplies", unit: "btl", qty: 5, par: 8, vendor: "v3", brand: "", notes: "" },
  { id: 8, name: "Sparkling Water", sku: "078915001010", category: "Beverages", unit: "cs", qty: 2, par: 5, vendor: "v2", brand: "", notes: "" },
];

const sColor = i => i.qty/i.par <= 0.25 ? "#E24B4A" : i.qty/i.par <= 0.5 ? "#EF9F27" : "#1D9E75";
const sLabel = i => i.qty/i.par <= 0.25 ? "Critical" : i.qty/i.par <= 0.5 ? "Low" : "OK";
const fs = { xs:20, sm:24, md:30, lg:36, xl:44, xxl:56 };

const NAV = [
  { id:"Inventory", label:"Inventory", icon:<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { id:"Scan", label:"Scan", icon:<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg> },
  { id:"Order", label:"Order", icon:<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
  { id:"Vendors", label:"Vendors", icon:<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
];

const T = {
  screen: { minHeight:"100vh", paddingBottom:60, boxSizing:"border-box", fontFamily:"system-ui,sans-serif" },
  ph: { padding:"36px 24px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" },
  ptitle: { fontSize:fs.xxl, fontWeight:800, color:"var(--color-text-primary)", margin:0 },
  psub: { fontSize:fs.sm, color:"var(--color-text-secondary)", marginTop:8 },
  card: { background:"var(--color-background-primary)", borderRadius:26, border:"1.5px solid var(--color-border-tertiary)", padding:"28px", margin:"0 20px 20px" },
  inp: { width:"100%", padding:"24px 26px", borderRadius:20, border:"1.5px solid var(--color-border-secondary)", fontSize:fs.md, background:"var(--color-background-secondary)", color:"var(--color-text-primary)", boxSizing:"border-box" },
  finp: { width:"100%", padding:"24px 26px", borderRadius:20, border:"1.5px solid var(--color-border-secondary)", fontSize:fs.md, background:"var(--color-background-secondary)", color:"var(--color-text-primary)", boxSizing:"border-box", marginBottom:20 },
  chip: a => ({ padding:"16px 28px", borderRadius:36, border:"1.5px solid "+(a?"#185FA5":"var(--color-border-tertiary)"), background:a?"#E6F1FB":"var(--color-background-secondary)", color:a?"#185FA5":"var(--color-text-secondary)", fontSize:fs.sm, cursor:"pointer", whiteSpace:"nowrap", fontWeight:a?700:500, flexShrink:0 }),
  badge: c => ({ fontSize:fs.xs, padding:"8px 20px", borderRadius:36, background:c+"22", color:c, fontWeight:700, whiteSpace:"nowrap" }),
  btn: (bg="#185FA5",fg="#fff") => ({ width:"100%", padding:"28px", borderRadius:22, border:"none", background:bg, color:fg, fontSize:fs.md, fontWeight:700, cursor:"pointer", marginTop:16, display:"flex", alignItems:"center", justifyContent:"center", gap:14, boxSizing:"border-box" }),
  lbl: { fontSize:fs.sm, color:"var(--color-text-secondary)", marginBottom:10, display:"block", fontWeight:600 },
  toast: { position:"fixed", top:40, left:"50%", transform:"translateX(-50%)", background:"#185FA5", color:"#fff", padding:"20px 44px", borderRadius:48, fontSize:fs.sm, fontWeight:700, zIndex:500, whiteSpace:"nowrap", maxWidth:"92vw", textAlign:"center" },
  backBtn: { background:"var(--color-background-secondary)", border:"1.5px solid var(--color-border-secondary)", borderRadius:18, padding:"18px 30px", fontSize:fs.sm, fontWeight:700, cursor:"pointer", color:"var(--color-text-primary)" },
  topNav: { display:"flex", background:"var(--color-background-primary)", borderBottom:"1.5px solid var(--color-border-tertiary)", overflowX:"auto", scrollbarWidth:"none", position:"sticky", top:0, zIndex:10 },
  topBtn: a => ({ flex:"0 0 auto", padding:"24px 28px 20px", border:"none", background:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:8, color:a?"#185FA5":"var(--color-text-secondary)", borderBottom:a?"5px solid #185FA5":"5px solid transparent", fontSize:fs.xs, fontWeight:a?700:500 }),
};

// ── CONFIRM NEW ITEM SCREEN ─────────────────────────────────────
function ConfirmNewItemScreen({ initial, vendors, onSave, onBack }) {
  const [form, setForm] = useState({
    category: "Dry Goods", unit: "", par: "0", vendor: vendors[0]?.id || "",
    ...initial, qty: "0", par: String(initial.par ?? 0),
  });
  const [qtyVal, setQtyVal] = useState("0");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const num = Math.max(0, parseInt(qtyVal)||0);
  const save = () => {
    if (!form.name.trim()) return;
    onSave({ ...form, qty: num, par: Number(form.par), id: Date.now() });
  };
  return (
    <div style={{ ...T.screen, fontFamily:"system-ui,sans-serif" }}>
      <div style={T.ph}>
        <button onClick={onBack} style={T.backBtn}>← Back</button>
        <p style={{ ...T.ptitle, fontSize:fs.xl }}>Confirm & Add</p>
      </div>
      <div style={{ padding:"0 28px 80px" }}>
        <div style={{ background:"#E6F1FB", borderRadius:20, padding:"16px 24px", marginBottom:28 }}>
          <p style={{ margin:0, fontSize:fs.sm, color:"#185FA5", fontWeight:600 }}>Found in product database — confirm details below</p>
        </div>

        <label style={T.lbl}>Product Name</label>
        <input style={T.finp} value={form.name} onChange={e=>set("name",e.target.value)} />
        <label style={T.lbl}>Brand</label>
        <input style={T.finp} value={form.brand} onChange={e=>set("brand",e.target.value)} />
        <label style={T.lbl}>SKU / Barcode</label>
        <input style={T.finp} value={form.sku} onChange={e=>set("sku",e.target.value)} />
        <label style={T.lbl}>Category</label>
        <select style={T.finp} value={form.category} onChange={e=>set("category",e.target.value)}>
          {["Produce","Dairy","Dry Goods","Meat & Seafood","Beverages","Cleaning Supplies"].map(c=><option key={c}>{c}</option>)}
        </select>
        <label style={T.lbl}>Unit (lbs, gal, cs, btl...)</label>
        <input style={T.finp} value={form.unit} onChange={e=>set("unit",e.target.value)} placeholder="lbs" />
        <label style={T.lbl}>Par Level</label>
        <input style={T.finp} type="number" min="0" value={form.par} onChange={e=>set("par",e.target.value)} />
        <label style={T.lbl}>Vendor</label>
        <select style={T.finp} value={form.vendor} onChange={e=>set("vendor",e.target.value)}>
          {vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <label style={T.lbl}>Notes</label>
        <input style={T.finp} value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="e.g. 50lb bag, weight, size..." />

        <div style={{ borderTop:"2px solid var(--color-border-tertiary)", margin:"8px 0 28px", paddingTop:28 }}>
          <label style={{ ...T.lbl, fontSize:fs.md }}>Quantity on hand</label>
          <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:16 }}>
            <button onClick={() => setQtyVal(String(Math.max(0,num-1)))} style={{ width:90, height:90, borderRadius:22, border:"none", background:"#E6F1FB", color:"#185FA5", fontSize:56, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>−</button>
            <input type="number" min="0" value={qtyVal} onChange={e=>setQtyVal(e.target.value)}
              style={{ flex:1, textAlign:"center", fontSize:80, fontWeight:800, border:"2px solid var(--color-border-secondary)", borderRadius:22, padding:"16px 8px", background:"var(--color-background-secondary)", color:"var(--color-text-primary)", minWidth:0 }} />
            <button onClick={() => setQtyVal(String(num+1))} style={{ width:90, height:90, borderRadius:22, border:"none", background:"#185FA5", color:"#fff", fontSize:56, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>+</button>
          </div>
          <p style={{ textAlign:"center", fontSize:fs.sm, color:"var(--color-text-secondary)", margin:"0 0 8px" }}>{form.unit || "units"} on hand</p>
        </div>

        <button onClick={save} style={T.btn()}>Add to Inventory</button>
      </div>
    </div>
  );
}

// ── SCANNER SCREEN ──────────────────────────────────────────────
function ScannerScreen({ items, vendors, onUpdateQty, onAddItem }) {
  const [step, setStep] = useState("menu"); // menu | camera | lookup | result
  const [logs, setLogs] = useState([]);
  const [scanResult, setScanResult] = useState(null);
  const [manualSku, setManualSku] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [addScreen, setAddScreen] = useState(null);
  const [qtyItem, setQtyItem] = useState(null);

  const log = msg => setLogs(p => [`${new Date().toLocaleTimeString()}: ${msg}`, ...p.slice(0,9)]);

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    rafRef.current = null;
    streamRef.current = null;
  };

  const handleCode = useCallback(async code => {
    stopCamera();
    log(`Barcode detected: ${code}`);
    const inInventory = items.find(i => i.sku === code);
    if (inInventory) {
      setScanResult({ ...inInventory, inInventory: true });
      setStep("result");
      return;
    }
    // Not in inventory — look up globally
    log("Looking up barcode online...");
    setStep("lookup");
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        const name = p.product_name || p.product_name_en || "";
        const brand = p.brands || "";
        const qty_str = p.quantity || "";
        log(`Found online: ${name} by ${brand}`);
        setScanResult({
          notFound: false,
          foundOnline: true,
          sku: code,
          name,
          brand,
          notes: qty_str,
          category: "Dry Goods",
          unit: "",
          qty: 0,
          par: 0,
          vendor: "",
        });
      } else {
        log("Not found online either");
        setScanResult({ notFound: true, sku: code });
      }
    } catch(e) {
      log(`Lookup error: ${e.message}`);
      setScanResult({ notFound: true, sku: code });
    }
    setStep("result");
  }, [items]);

  const startCamera = async () => {
    setLogs([]);
    setStep("camera");
    log("Requesting camera...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      log("Camera granted — loading Quagga...");
      loadQuagga(stream);
    } catch(e) {
      log(`Camera error: ${e.message}`);
      setStep("menu");
    }
  };

  const loadQuagga = (stream) => {
    if (window.Quagga) { log("Quagga ready"); initQuagga(stream); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js";
    s.onload = () => { log("Quagga loaded"); initQuagga(stream); };
    s.onerror = () => log("ERROR: Quagga failed to load");
    document.head.appendChild(s);
  };

  const initQuagga = (stream) => {
    const v = videoRef.current;
    if (!v) { log("ERROR: no video ref"); return; }
    v.srcObject = stream;
    v.onloadedmetadata = () => {
      v.play().then(() => {
        log(`Video: ${v.videoWidth}x${v.videoHeight}`);
        log("Starting Quagga on video frames...");
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        let frames = 0;
        let misses = 0;

        const tick = () => {
          if (!videoRef.current || !streamRef.current) return;
          frames++;
          if (v.readyState < 2 || v.videoWidth === 0) { rafRef.current = requestAnimationFrame(tick); return; }

          // Only process every 6th frame to avoid overload
          if (frames % 6 !== 0) { rafRef.current = requestAnimationFrame(tick); return; }

          canvas.width = v.videoWidth;
          canvas.height = v.videoHeight;
          ctx.drawImage(v, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          try {
            window.Quagga.decodeSingle({
              decoder: {
                readers: ["ean_reader","ean_8_reader","upc_reader","upc_e_reader","code_128_reader","code_39_reader"]
              },
              locate: true,
              src: canvas.toDataURL("image/png"),
            }, result => {
              if (result && result.codeResult) {
                log(`Decoded: ${result.codeResult.code}`);
                handleCode(result.codeResult.code);
              } else {
                misses++;
                if (misses % 20 === 0) log(`Scanning... (${misses} attempts, frame ${frames})`);
                rafRef.current = requestAnimationFrame(tick);
              }
            });
          } catch(e) {
            log(`Quagga error: ${e.message}`);
            rafRef.current = requestAnimationFrame(tick);
          }
        };
        rafRef.current = requestAnimationFrame(tick);
      }).catch(e => log(`Play error: ${e.message}`));
    };
  };

  const handleManual = () => {
    const q = manualSku.trim();
    if (!q) return;
    log(`Manual search: ${q}`);
    const found = items.find(i => i.sku === q || i.name.toLowerCase() === q.toLowerCase());
    setScanResult(found ? { ...found } : { notFound: true, sku: q });
    setStep("result");
  };

  useEffect(() => () => stopCamera(), []);

  if (qtyItem) return <QtyScreen item={qtyItem} onSave={onUpdateQty} onBack={() => setQtyItem(null)} />;
  if (addScreen !== null) return <ItemFormScreen vendors={vendors} onSave={onAddItem} onBack={() => setAddScreen(null)} initial={{ sku: addScreen }} title="Add Product" />;

  if (step === "camera") return (
    <div style={{ position:"fixed", inset:0, background:"#000", zIndex:300, display:"flex", flexDirection:"column" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, zIndex:10, padding:"40px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", background:"linear-gradient(to bottom,rgba(0,0,0,0.8),transparent)" }}>
        <p style={{ margin:0, color:"#fff", fontWeight:800, fontSize:fs.xl }}>Scanning...</p>
        <button onClick={() => { stopCamera(); setStep("menu"); }} style={{ background:"rgba(255,255,255,0.25)", border:"none", color:"#fff", borderRadius:28, padding:"18px 36px", cursor:"pointer", fontSize:fs.md, fontWeight:700 }}>Cancel</button>
      </div>
      <video ref={videoRef} playsInline muted autoPlay style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
      <canvas ref={canvasRef} style={{ display:"none" }} />
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
        <div style={{ width:"85%", height:220, position:"relative" }}>
          {[[0,0],[0,1],[1,0],[1,1]].map(([t,r],i) => (
            <div key={i} style={{ position:"absolute", top:t?"auto":0, bottom:t?0:"auto", left:r?"auto":0, right:r?0:"auto", width:52, height:52, borderTop:!t?"6px solid #fff":"none", borderBottom:t?"6px solid #fff":"none", borderLeft:!r?"6px solid #fff":"none", borderRight:r?"6px solid #fff":"none" }} />
          ))}
          <div style={{ position:"absolute", top:"50%", left:0, right:0, height:4, background:"rgba(255,60,60,0.9)", transform:"translateY(-50%)" }} />
        </div>
      </div>
      {/* Live diagnostic log */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"24px 20px 48px", background:"rgba(0,0,0,0.7)" }}>
        {logs.slice(0,4).map((l,i) => <p key={i} style={{ margin:"4px 0", color:i===0?"#fff":"rgba(255,255,255,0.6)", fontSize:18, fontFamily:"monospace" }}>{l}</p>)}
      </div>
    </div>
  );

  if (step === "lookup") return (
    <div style={{ ...T.screen, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:48, textAlign:"center" }}>
      <div style={{ width:80, height:80, borderRadius:"50%", border:`6px solid #185FA5`, borderTopColor:"transparent", marginBottom:32, animation:"spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ fontSize:fs.lg, fontWeight:700, color:"var(--color-text-primary)", margin:"0 0 12px" }}>Looking up barcode...</p>
      <p style={{ fontSize:fs.sm, color:"var(--color-text-secondary)" }}>Searching product database</p>
    </div>
  );

  if (step === "result" && scanResult) {
    // Already in inventory — offer to update qty
    if (scanResult.inInventory) return (
      <div style={{ ...T.screen }}>
        <div style={T.ph}><button onClick={() => setStep("menu")} style={T.backBtn}>← Back</button></div>
        <div style={{ padding:"0 28px" }}>
          <div style={{ ...T.card, margin:"0 0 0", border:"2.5px solid #185FA5" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
              <div style={{ flex:1, marginRight:16 }}>
                <p style={{ margin:"0 0 8px", fontWeight:800, fontSize:fs.lg, color:"var(--color-text-primary)" }}>{scanResult.name}</p>
                {scanResult.brand && <p style={{ margin:"0 0 6px", fontSize:fs.sm, color:"var(--color-text-secondary)" }}>{scanResult.brand}</p>}
                <p style={{ margin:0, fontSize:fs.sm, color:"var(--color-text-secondary)" }}>{scanResult.category} · {vendors.find(v=>v.id===scanResult.vendor)?.name}</p>
              </div>
              <span style={T.badge(sColor(scanResult))}>{sLabel(scanResult)}</span>
            </div>
            <div style={{ background:"var(--color-background-secondary)", borderRadius:16, padding:"16px 20px", marginBottom:24 }}>
              <p style={{ margin:0, fontSize:fs.sm, color:"var(--color-text-secondary)" }}>Current qty: <strong style={{ color:"var(--color-text-primary)" }}>{scanResult.qty} {scanResult.unit}</strong> · Par: {scanResult.par}</p>
            </div>
            <button onClick={() => setQtyItem(items.find(i=>i.id===scanResult.id))} style={T.btn()}>Update Quantity</button>
          </div>
          {logs.length > 0 && (
            <div style={{ marginTop:24, background:"var(--color-background-secondary)", borderRadius:20, padding:"20px 24px" }}>
              {logs.slice(0,4).map((l,i) => <p key={i} style={{ margin:"4px 0", fontSize:18, fontFamily:"monospace", color:"var(--color-text-secondary)" }}>{l}</p>)}
            </div>
          )}
        </div>
      </div>
    );

    // Found online — confirm details and set qty before adding
    if (scanResult.foundOnline) return (
      <ConfirmNewItemScreen
        initial={scanResult}
        vendors={vendors}
        onSave={item => { onAddItem(item); setStep("menu"); setScanResult(null); }}
        onBack={() => setStep("menu")}
      />
    );

    // Not found anywhere
    return (
      <div style={{ ...T.screen }}>
        <div style={T.ph}><button onClick={() => setStep("menu")} style={T.backBtn}>← Back</button></div>
        <div style={{ padding:"0 28px" }}>
          <div style={{ ...T.card, margin:"0", border:"2.5px solid #E24B4A" }}>
            <p style={{ margin:"0 0 10px", fontWeight:800, color:"#E24B4A", fontSize:fs.lg }}>Not found anywhere</p>
            <p style={{ margin:"0 0 24px", fontSize:fs.sm, color:"var(--color-text-secondary)" }}>SKU {scanResult.sku} wasn't found in your inventory or online. Add it manually.</p>
            <button style={T.btn()} onClick={() => setAddScreen(scanResult.sku)}>Add Manually</button>
          </div>
        </div>
      </div>
    );
  }

  // menu step
  return (
    <div style={{ ...T.screen }}>
      <div style={T.ph}>
        <div>
          <p style={T.ptitle}>Scan</p>
          <p style={T.psub}>Camera or manual entry</p>
        </div>
      </div>
      <div style={{ padding:"0 28px" }}>
        <button style={T.btn()} onClick={startCamera}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          Scan with Camera
        </button>

        <div style={{ marginTop:20, background:"var(--color-background-secondary)", borderRadius:20, padding:"24px" }}>
          <p style={{ margin:"0 0 10px", fontSize:fs.sm, fontWeight:700, color:"var(--color-text-secondary)" }}>Quick diagnostic</p>
          <p style={{ margin:"0 0 4px", fontSize:fs.xs, color:"var(--color-text-secondary)" }}>BarcodeDetector: {typeof window !== "undefined" && window.BarcodeDetector ? "✅ Available" : "❌ Not available"}</p>
          <p style={{ margin:0, fontSize:fs.xs, color:"var(--color-text-secondary)" }}>Camera API: {typeof navigator !== "undefined" && navigator.mediaDevices ? "✅ Available" : "❌ Not available"}</p>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:16, margin:"32px 0 24px" }}>
          <div style={{ flex:1, height:2, background:"var(--color-border-tertiary)" }} />
          <span style={{ fontSize:fs.sm, color:"var(--color-text-secondary)" }}>or enter manually</span>
          <div style={{ flex:1, height:2, background:"var(--color-border-tertiary)" }} />
        </div>
        <div style={{ display:"flex", gap:14 }}>
          <input style={{ ...T.inp, flex:1 }} placeholder="Type SKU or product name" value={manualSku} onChange={e => setManualSku(e.target.value)} onKeyDown={e => e.key==="Enter" && handleManual()} />
          <button onClick={handleManual} style={{ padding:"24px 28px", borderRadius:20, border:"none", background:"#185FA5", color:"#fff", fontSize:fs.md, fontWeight:700, cursor:"pointer" }}>Find</button>
        </div>
        <p style={{ fontSize:fs.xs, color:"var(--color-text-secondary)", marginTop:12 }}>Try typing: <strong>074175604517</strong> (Roma Tomatoes) or <strong>Roma Tomatoes</strong></p>
      </div>
    </div>
  );
}

// ── QUANTITY SCREEN ─────────────────────────────────────────────
function QtyScreen({ item, onSave, onBack }) {
  const [val, setVal] = useState(String(item.qty));
  const num = Math.max(0, parseInt(val)||0);
  const color = sColor({ qty:num, par:item.par });
  return (
    <div style={{ ...T.screen, padding:"0 0 60px", fontFamily:"system-ui,sans-serif" }}>
      <div style={T.ph}><button onClick={onBack} style={T.backBtn}>← Back</button></div>
      <div style={{ padding:"0 28px" }}>
        <p style={{ fontSize:fs.xl, fontWeight:800, color:"var(--color-text-primary)", margin:"0 0 10px" }}>{item.name}</p>
        <p style={{ fontSize:fs.md, color:"var(--color-text-secondary)", margin:"0 0 48px" }}>Par: {item.par} {item.unit}</p>
        <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:40 }}>
          <button onClick={() => setVal(String(Math.max(0,num-1)))} style={{ width:100, height:100, borderRadius:24, border:"none", background:"#E6F1FB", color:"#185FA5", fontSize:64, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>−</button>
          <input type="number" min="0" value={val} onChange={e => setVal(e.target.value)}
            style={{ flex:1, textAlign:"center", fontSize:100, fontWeight:800, border:"2px solid var(--color-border-secondary)", borderRadius:24, padding:"20px 8px", background:"var(--color-background-secondary)", color:"var(--color-text-primary)", minWidth:0 }} autoFocus />
          <button onClick={() => setVal(String(num+1))} style={{ width:100, height:100, borderRadius:24, border:"none", background:"#185FA5", color:"#fff", fontSize:64, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>+</button>
        </div>
        <div style={{ height:20, borderRadius:12, background:"var(--color-border-tertiary)", overflow:"hidden", marginBottom:18 }}>
          <div style={{ height:"100%", width:Math.min(100,(num/item.par)*100)+"%", background:color, borderRadius:12, transition:"width 0.2s" }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:48 }}>
          <span style={{ fontSize:fs.md, color:"var(--color-text-secondary)" }}>{num} of {item.par} {item.unit}</span>
          <span style={{ fontSize:fs.md, fontWeight:700, color }}>{sLabel({ qty:num, par:item.par })}</span>
        </div>
        <button onClick={() => { onSave(item.id,num); onBack(); }} style={T.btn()}>Save Quantity</button>
      </div>
    </div>
  );
}

// ── ITEM FORM SCREEN ────────────────────────────────────────────
function ItemFormScreen({ initial={}, vendors, onSave, onBack, title="Add Product" }) {
  const [form, setForm] = useState({ name:"", sku:"", category:"Produce", unit:"", qty:"0", par:"0", vendor:vendors[0]?.id||"", brand:"", notes:"", ...initial, qty:String(initial.qty??0), par:String(initial.par??0) });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const save = () => { if (!form.name.trim()) return; onSave({ ...form, qty:Number(form.qty), par:Number(form.par) }); onBack(); };
  return (
    <div style={{ ...T.screen, fontFamily:"system-ui,sans-serif" }}>
      <div style={T.ph}>
        <button onClick={onBack} style={T.backBtn}>← Back</button>
        <p style={{ ...T.ptitle, fontSize:fs.xl }}>{title}</p>
      </div>
      <div style={{ padding:"0 28px 80px" }}>
        <label style={T.lbl}>Product Name</label>
        <input style={T.finp} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Cherry Tomatoes" />
        <label style={T.lbl}>Brand</label>
        <input style={T.finp} value={form.brand} onChange={e=>set("brand",e.target.value)} placeholder="e.g. King Arthur" />
        <label style={T.lbl}>SKU / Barcode</label>
        <input style={T.finp} value={form.sku} onChange={e=>set("sku",e.target.value)} placeholder="e.g. 074175604517" />
        <label style={T.lbl}>Category</label>
        <select style={T.finp} value={form.category} onChange={e=>set("category",e.target.value)}>
          {CATEGORIES.filter(c=>c!=="All").map(c=><option key={c}>{c}</option>)}
        </select>
        <label style={T.lbl}>Unit (lbs, gal, cs, btl...)</label>
        <input style={T.finp} value={form.unit} onChange={e=>set("unit",e.target.value)} placeholder="lbs" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div><label style={T.lbl}>Current Qty</label><input style={T.finp} type="number" min="0" value={form.qty} onChange={e=>set("qty",e.target.value)} /></div>
          <div><label style={T.lbl}>Par Level</label><input style={T.finp} type="number" min="0" value={form.par} onChange={e=>set("par",e.target.value)} /></div>
        </div>
        <label style={T.lbl}>Vendor</label>
        <select style={T.finp} value={form.vendor} onChange={e=>set("vendor",e.target.value)}>
          {vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <label style={T.lbl}>Notes</label>
        <textarea style={{ ...T.finp, minHeight:120, resize:"vertical" }} value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="e.g. 50lb bag, refrigerate after opening..." />
        <button onClick={save} style={T.btn()}>Save</button>
      </div>
    </div>
  );
}

// ── ADD VENDOR SCREEN ───────────────────────────────────────────
function AddVendorScreen({ onSave, onBack }) {
  const [name, setName] = useState("");
  return (
    <div style={{ ...T.screen, fontFamily:"system-ui,sans-serif" }}>
      <div style={T.ph}><button onClick={onBack} style={T.backBtn}>← Back</button><p style={{ ...T.ptitle, fontSize:fs.xl }}>Add Vendor</p></div>
      <div style={{ padding:"0 28px" }}>
        <label style={T.lbl}>Vendor Name</label>
        <input style={T.finp} placeholder="e.g. City Produce Co." value={name} onChange={e=>setName(e.target.value)} autoFocus />
        <button onClick={() => { if(!name.trim()) return; onSave({ id:"v"+Date.now(), name:name.trim() }); onBack(); }} style={T.btn()}>Add Vendor</button>
      </div>
    </div>
  );
}

// ── CONFIRM DIALOG ──────────────────────────────────────────────
function ConfirmDialog({ label, message, onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:32, background:"rgba(0,0,0,0.35)" }}>
      <div style={{ background:"var(--color-background-primary)", borderRadius:28, padding:"44px 36px 36px", width:"100%", maxWidth:500, boxShadow:"0 8px 40px rgba(0,0,0,0.18)" }}>
        <p style={{ fontSize:fs.lg, fontWeight:800, color:"var(--color-text-primary)", margin:"0 0 18px" }}>Delete {label}?</p>
        <p style={{ fontSize:fs.md, color:"var(--color-text-secondary)", margin:"0 0 40px", lineHeight:1.5 }}>{message}</p>
        <div style={{ display:"flex", gap:16 }}>
          <button onClick={onCancel} style={{ flex:1, padding:"26px", borderRadius:20, border:"1.5px solid var(--color-border-secondary)", background:"var(--color-background-secondary)", fontSize:fs.md, fontWeight:700, cursor:"pointer", color:"var(--color-text-primary)" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1, padding:"26px", borderRadius:20, border:"none", background:"#E24B4A", color:"#fff", fontSize:fs.md, fontWeight:700, cursor:"pointer" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("Inventory");
  const [items, setItems] = useState(INIT_ITEMS);
  const [vendors, setVendors] = useState(INIT_VENDORS);
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [orderVendor, setOrderVendor] = useState("all");
  const [toast, setToast] = useState(null);
  const [screen, setScreen] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(null),3000); };
  const setQty = (id,qty) => { setItems(p=>p.map(i=>i.id===id?{...i,qty}:i)); showToast("Quantity saved!"); };
  const saveItem = item => { setItems(p=>p.map(i=>i.id===item.id?{...i,...item}:i)); showToast("Item updated!"); };
  const addItem = item => { setItems(p=>[...p,{brand:"",notes:"",...item,id:Date.now()}]); showToast("Item added!"); };
  const deleteItem = id => { setItems(p=>p.filter(i=>i.id!==id)); showToast("Item deleted."); };
  const addVendor = v => { setVendors(p=>[...p,v]); showToast("Vendor added!"); };
  const deleteVendor = id => { setVendors(p=>p.filter(v=>v.id!==id)); setItems(p=>p.filter(i=>i.vendor!==id)); showToast("Vendor deleted."); };

  const sorted = [...items].sort((a,b)=>a.name.localeCompare(b.name));
  const filtered = sorted.filter(i=>(cat==="All"||i.category===cat)&&(i.name.toLowerCase().includes(search.toLowerCase())||i.sku.includes(search)));
  const needsOrder = items.filter(i=>i.qty<i.par);
  const orderFiltered = orderVendor==="all"?needsOrder:needsOrder.filter(i=>i.vendor===orderVendor);

  if (screen?.type==="qty") return <QtyScreen item={screen.item} onSave={setQty} onBack={()=>setScreen(null)} />;
  if (screen?.type==="addItem") return <ItemFormScreen vendors={vendors} onSave={addItem} onBack={()=>setScreen(null)} initial={{ sku:screen.sku||"" }} title="Add Product" />;
  if (screen?.type==="editItem") return <ItemFormScreen vendors={vendors} onSave={saveItem} onBack={()=>setScreen(null)} initial={screen.item} title="Edit Product" />;
  if (screen?.type==="addVendor") return <AddVendorScreen onSave={addVendor} onBack={()=>setScreen(null)} />;

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", width:"100%", boxSizing:"border-box", overflowX:"hidden" }}>
      {toast && <div style={T.toast}>{toast}</div>}
      {confirmDel && <ConfirmDialog label={confirmDel.label} message={confirmDel.message} onConfirm={()=>{ confirmDel.action(); setConfirmDel(null); }} onCancel={()=>setConfirmDel(null)} />}

      <div style={T.topNav}>
        {NAV.map(n=>(
          <button key={n.id} style={T.topBtn(view===n.id)} onClick={()=>setView(n.id)}>
            {n.icon}{n.label}
            {n.id==="Order"&&needsOrder.length>0&&<span style={{ background:"#E24B4A", color:"#fff", borderRadius:24, fontSize:fs.xs, fontWeight:700, padding:"4px 12px" }}>{needsOrder.length}</span>}
          </button>
        ))}
      </div>

      {view==="Scan" && (
        <ScannerScreen items={items} vendors={vendors} onUpdateQty={setQty} onAddItem={addItem} />
      )}

      {view==="Inventory" && (
        <div style={T.screen}>
          <div style={T.ph}>
            <div><p style={T.ptitle}>Inventory</p><p style={T.psub}>{items.length} items · {needsOrder.length} to reorder</p></div>
            <button onClick={()=>setScreen({type:"addItem"})} style={{ background:"#185FA5", color:"#fff", border:"none", borderRadius:20, padding:"20px 32px", fontSize:fs.md, fontWeight:700, cursor:"pointer" }}>+ Add</button>
          </div>
          <div style={{ padding:"0 20px 18px" }}><input style={T.inp} placeholder="Search items or SKU..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
          <div style={{ display:"flex", gap:14, overflowX:"auto", padding:"0 20px 20px", scrollbarWidth:"none" }}>
            {CATEGORIES.map(c=><button key={c} style={T.chip(cat===c)} onClick={()=>setCat(c)}>{c}</button>)}
          </div>
          {filtered.map(item=>{
            const color=sColor(item);
            const v=vendors.find(v=>v.id===item.vendor)?.name||"";
            return (
              <div key={item.id} style={T.card}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                  <div style={{ flex:1, marginRight:16 }}>
                    <p style={{ margin:"0 0 6px", fontWeight:700, fontSize:fs.lg, color:"var(--color-text-primary)" }}>{item.name}</p>
                    {item.brand&&<p style={{ margin:"0 0 4px", fontSize:fs.sm, color:"var(--color-text-secondary)" }}>{item.brand}</p>}
                    <p style={{ margin:0, fontSize:fs.sm, color:"var(--color-text-secondary)" }}>{item.category} · {v}</p>
                  </div>
                  <span style={T.badge(color)}>{sLabel(item)}</span>
                </div>
                <div style={{ height:14, borderRadius:10, background:"var(--color-border-tertiary)", overflow:"hidden", marginBottom:18 }}>
                  <div style={{ height:"100%", width:Math.min(100,(item.qty/item.par)*100)+"%", background:color, borderRadius:10 }} />
                </div>
                <div style={{ display:"flex", gap:12 }}>
                  <button onClick={()=>setScreen({type:"qty",item})} style={{ flex:1, padding:"22px 20px", borderRadius:20, border:"1.5px solid var(--color-border-secondary)", background:"var(--color-background-secondary)", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:fs.sm, color:"var(--color-text-secondary)", fontWeight:600 }}>On hand</span>
                    <span style={{ fontSize:fs.xl, fontWeight:800, color }}>{item.qty} <span style={{ fontSize:fs.sm, fontWeight:500, color:"var(--color-text-secondary)" }}>{item.unit}</span></span>
                  </button>
                  <button onClick={()=>setScreen({type:"editItem",item})} style={{ width:80, borderRadius:20, border:"1.5px solid var(--color-border-secondary)", background:"var(--color-background-secondary)", color:"var(--color-text-secondary)", fontSize:fs.lg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✏️</button>
                  <button onClick={()=>setConfirmDel({label:item.name, message:"This item will be permanently removed from your inventory.", action:()=>deleteItem(item.id)})} style={{ width:80, borderRadius:20, border:"none", background:"#FCEBEB", color:"#A32D2D", fontSize:fs.lg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                </div>
              </div>
            );
          })}
          {filtered.length===0&&<p style={{ textAlign:"center", color:"var(--color-text-secondary)", marginTop:60, fontSize:fs.md }}>No items found.</p>}
        </div>
      )}

      {view==="Order" && (
        <div style={T.screen}>
          <div style={T.ph}><div><p style={T.ptitle}>Order</p><p style={T.psub}>{needsOrder.length} items below par</p></div></div>
          <div style={{ padding:"0 24px 24px" }}>
            <select style={{ ...T.finp, marginBottom:0 }} value={orderVendor} onChange={e=>setOrderVendor(e.target.value)}>
              <option value="all">All Vendors</option>
              {vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          {orderFiltered.length===0?(
            <div style={{ textAlign:"center", marginTop:80 }}>
              <p style={{ fontSize:80, marginBottom:20 }}>✓</p>
              <p style={{ fontWeight:800, color:"var(--color-text-primary)", fontSize:fs.xl }}>All stocked up!</p>
              <p style={{ fontSize:fs.md, color:"var(--color-text-secondary)" }}>No items need reordering.</p>
            </div>
          ):(
            <>
              {vendors.filter(v=>orderVendor==="all"||v.id===orderVendor).map(vendor=>{
                const vItems=orderFiltered.filter(i=>i.vendor===vendor.id);
                if(!vItems.length) return null;
                return (
                  <div key={vendor.id}>
                    <p style={{ fontSize:fs.sm, fontWeight:700, color:"var(--color-text-secondary)", padding:"20px 24px 12px", textTransform:"uppercase", letterSpacing:"0.07em" }}>{vendor.name}</p>
                    {vItems.map(item=>(
                      <div key={item.id} style={T.card}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div>
                            <p style={{ margin:"0 0 10px", fontWeight:700, fontSize:fs.md, color:"var(--color-text-primary)" }}>{item.name}</p>
                            <p style={{ margin:0, fontSize:fs.sm, color:"var(--color-text-secondary)" }}>Have {item.qty} · Par {item.par} {item.unit}</p>
                          </div>
                          <div style={{ textAlign:"right" }}>
                            <p style={{ margin:"0 0 6px", fontWeight:800, fontSize:fs.xxl, color:sColor(item) }}>{item.par-item.qty}</p>
                            <p style={{ margin:0, fontSize:fs.xs, color:"var(--color-text-secondary)" }}>{item.unit} needed</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
              <div style={{ padding:"0 24px 40px" }}>
                <button style={T.btn()} onClick={()=>{
                  const txt=orderFiltered.map(i=>`${i.name} | Need: ${i.par-i.qty} ${i.unit} | ${vendors.find(v=>v.id===i.vendor)?.name}`).join("\n");
                  navigator.clipboard.writeText(txt).then(()=>showToast("Order copied!"));
                }}>Copy Order to Clipboard</button>
              </div>
            </>
          )}
        </div>
      )}

      {view==="Vendors" && (
        <div style={T.screen}>
          <div style={T.ph}>
            <p style={T.ptitle}>Vendors</p>
            <button onClick={()=>setScreen({type:"addVendor"})} style={{ background:"#185FA5", color:"#fff", border:"none", borderRadius:20, padding:"20px 32px", fontSize:fs.md, fontWeight:700, cursor:"pointer" }}>+ Add</button>
          </div>
          {vendors.map(v=>{
            const vItems=items.filter(i=>i.vendor===v.id);
            const vOrder=needsOrder.filter(i=>i.vendor===v.id);
            return (
              <div key={v.id} style={T.card}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                  <div>
                    <p style={{ margin:"0 0 8px", fontWeight:700, fontSize:fs.lg, color:"var(--color-text-primary)" }}>{v.name}</p>
                    <p style={{ margin:0, fontSize:fs.sm, color:"var(--color-text-secondary)" }}>{vItems.length} products</p>
                  </div>
                  <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                    {vOrder.length>0&&<span style={{ background:"#FCEBEB", color:"#A32D2D", fontSize:fs.sm, fontWeight:700, padding:"10px 20px", borderRadius:30 }}>{vOrder.length} to order</span>}
                    <button onClick={()=>setConfirmDel({label:v.name, message:`This will also delete all ${vItems.length} items assigned to this vendor.`, action:()=>deleteVendor(v.id)})} style={{ width:72, height:72, borderRadius:18, border:"none", background:"#FCEBEB", color:"#A32D2D", fontSize:fs.lg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                  </div>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:12 }}>
                  {vItems.map(i=><span key={i.id} style={{ fontSize:fs.xs, background:"var(--color-background-secondary)", color:"var(--color-text-secondary)", padding:"8px 20px", borderRadius:30, border:"1px solid var(--color-border-tertiary)" }}>{i.name}</span>)}
                  {vItems.length===0&&<span style={{ fontSize:fs.xs, color:"var(--color-text-secondary)" }}>No items assigned</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
