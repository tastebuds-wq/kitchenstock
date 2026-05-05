import { useState, useRef, useEffect } from "react";

// ── SUPABASE ─────────────────────────────────────────────────────
const SB = "https://vkosasytwgyhcxvxiksv.supabase.co/rest/v1";
const KEY = "sb_publishable_60HXdM9pOV6u_vFn_LQ2ng_K1Z__Db2";
const H = { "Content-Type": "application/json", apikey: KEY, Authorization: "Bearer " + KEY };
const api = {
  get: (t, q) => fetch(SB + "/" + t + (q || ""), { headers: H }).then(r => r.json()),
  upsert: (t, b) => fetch(SB + "/" + t, { method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(b) }),
  patch: (t, q, b) => fetch(SB + "/" + t + q, { method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(b) }),
  del: (t, q) => fetch(SB + "/" + t + q, { method: "DELETE", headers: H }),
};

// ── SEED DATA ────────────────────────────────────────────────────
const SEED_VENDORS = [
  { id: "v1", name: "Fresh Farms Co." },
  { id: "v2", name: "Metro Food Supply" },
  { id: "v3", name: "CleanPro Supplies" },
];
const SEED_ITEMS = [
  { id: 1, name: "Roma Tomatoes", sku: "074175604517", category: "Produce", unit: "lbs", qty: 4, par: 20, vendor: "v1", brand: "", notes: "" },
  { id: 2, name: "Whole Milk", sku: "041303005484", category: "Dairy", unit: "gal", qty: 2, par: 10, vendor: "v2", brand: "", notes: "" },
  { id: 3, name: "All-Purpose Flour", sku: "016000275287", category: "Dry Goods", unit: "lbs", qty: 15, par: 25, vendor: "v2", brand: "", notes: "" },
  { id: 4, name: "Chicken Breast", sku: "021000617418", category: "Meat & Seafood", unit: "lbs", qty: 8, par: 30, vendor: "v1", brand: "", notes: "" },
  { id: 5, name: "Olive Oil", sku: "071026001102", category: "Dry Goods", unit: "btl", qty: 3, par: 6, vendor: "v2", brand: "", notes: "" },
  { id: 6, name: "Heavy Cream", sku: "041303004593", category: "Dairy", unit: "qt", qty: 1, par: 8, vendor: "v1", brand: "", notes: "" },
  { id: 7, name: "Dish Soap", sku: "037000864868", category: "Cleaning Supplies", unit: "btl", qty: 5, par: 8, vendor: "v3", brand: "", notes: "" },
  { id: 8, name: "Sparkling Water", sku: "078915001010", category: "Beverages", unit: "cs", qty: 2, par: 5, vendor: "v2", brand: "", notes: "" },
];
const CATS = ["All", "Produce", "Dairy", "Dry Goods", "Meat & Seafood", "Beverages", "Cleaning Supplies"];

// ── HELPERS ──────────────────────────────────────────────────────
const pct = (i) => i.par > 0 ? Math.min(100, (i.qty / i.par) * 100) : 0;
const statusColor = (i) => pct(i) <= 25 ? "#E24B4A" : pct(i) <= 50 ? "#EF9F27" : "#1D9E75";
const statusLabel = (i) => pct(i) <= 25 ? "Critical" : pct(i) <= 50 ? "Low" : "OK";

// ── STYLES ───────────────────────────────────────────────────────
const S = {
  page: { fontFamily: "system-ui,sans-serif", maxWidth: 600, margin: "0 auto", paddingBottom: 80, minHeight: "100vh" },
  topNav: { display: "flex", borderBottom: "2px solid #e5e7eb", background: "#fff", position: "sticky", top: 0, zIndex: 20, overflowX: "auto" },
  navBtn: (a) => ({ flex: "0 0 auto", padding: "20px 24px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 18, fontWeight: a ? 700 : 500, color: a ? "#2563eb" : "#6b7280", borderBottom: a ? "4px solid #2563eb" : "4px solid transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }),
  header: { padding: "32px 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  h1: { fontSize: 40, fontWeight: 800, color: "#111827", margin: 0 },
  sub: { fontSize: 20, color: "#6b7280", marginTop: 6 },
  card: { background: "#fff", borderRadius: 20, border: "1.5px solid #e5e7eb", padding: 24, margin: "0 16px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  btn: (bg, fg) => ({ width: "100%", padding: 22, borderRadius: 16, border: "none", background: bg || "#2563eb", color: fg || "#fff", fontSize: 22, fontWeight: 700, cursor: "pointer", marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }),
  outlineBtn: { padding: "16px 24px", borderRadius: 14, border: "1.5px solid #d1d5db", background: "#f9fafb", fontSize: 20, fontWeight: 600, cursor: "pointer", color: "#374151" },
  inp: { width: "100%", padding: "18px 20px", borderRadius: 14, border: "1.5px solid #d1d5db", fontSize: 20, background: "#f9fafb", color: "#111827", boxSizing: "border-box", marginBottom: 16 },
  lbl: { fontSize: 18, fontWeight: 600, color: "#374151", marginBottom: 8, display: "block" },
  badge: (c) => ({ fontSize: 18, padding: "6px 16px", borderRadius: 20, background: c + "22", color: c, fontWeight: 700 }),
  toast: { position: "fixed", top: 32, left: "50%", transform: "translateX(-50%)", background: "#2563eb", color: "#fff", padding: "16px 36px", borderRadius: 40, fontSize: 20, fontWeight: 700, zIndex: 999, whiteSpace: "nowrap" },
  backBtn: { padding: "14px 24px", borderRadius: 12, border: "1.5px solid #d1d5db", background: "#f9fafb", fontSize: 20, fontWeight: 700, cursor: "pointer", color: "#374151" },
};

// ── CAMERA SCANNER ───────────────────────────────────────────────
function Camera({ onDetect, onClose }) {
  const vidRef = useRef(null);
  const canRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const alive = useRef(true);
  const [msg, setMsg] = useState("Starting camera...");
  const [err, setErr] = useState(null);

  const kill = () => {
    alive.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  };

  useEffect(() => {
    alive.current = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } })
      .then(stream => {
        if (!alive.current) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        vidRef.current.srcObject = stream;
        vidRef.current.play().then(() => {
          setMsg("Point camera at barcode");
          if (window.Quagga) { scan(); return; }
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js";
          s.onload = () => { if (alive.current) scan(); };
          s.onerror = () => setMsg("Scanner failed — use manual entry");
          document.head.appendChild(s);
        });
      })
      .catch(() => setErr("Camera denied. Go to Settings > Safari > Camera > Allow."));
    return kill;
  }, []);

  const scan = () => {
    const v = vidRef.current;
    const c = canRef.current;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    let frame = 0, busy = false;
    const tick = () => {
      if (!alive.current) return;
      frame++;
      if (frame % 8 !== 0 || busy || v.readyState < 2 || v.videoWidth === 0) { rafRef.current = requestAnimationFrame(tick); return; }
      busy = true;
      c.width = v.videoWidth; c.height = v.videoHeight;
      ctx.drawImage(v, 0, 0);
      window.Quagga.decodeSingle({ decoder: { readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader", "code_128_reader", "code_39_reader"] }, locate: true, src: c.toDataURL("image/jpeg", 0.8) }, res => {
        busy = false;
        if (!alive.current) return;
        if (res && res.codeResult && res.codeResult.code) { kill(); onDetect(res.codeResult.code); }
        else { rafRef.current = requestAnimationFrame(tick); }
      });
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 300 }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, padding: "36px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(to bottom,rgba(0,0,0,0.8),transparent)" }}>
        <p style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: 32 }}>Scan Barcode</p>
        <button onClick={() => { kill(); onClose(); }} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 24, padding: "14px 28px", cursor: "pointer", fontSize: 20, fontWeight: 700 }}>Cancel</button>
      </div>
      {err ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>📷</div>
          <p style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.5 }}>{err}</p>
          <button onClick={() => { kill(); onClose(); }} style={{ marginTop: 24, background: "#2563eb", border: "none", color: "#fff", borderRadius: 16, padding: "18px 36px", fontSize: 20, fontWeight: 700, cursor: "pointer" }}>Go Back</button>
        </div>
      ) : (
        <>
          <video ref={vidRef} playsInline muted autoPlay style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <canvas ref={canRef} style={{ display: "none" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ width: "80%", height: 200, position: "relative" }}>
              {[[0,0],[0,1],[1,0],[1,1]].map(([t,r], i) => (
                <div key={i} style={{ position: "absolute", top: t ? "auto" : 0, bottom: t ? 0 : "auto", left: r ? "auto" : 0, right: r ? 0 : "auto", width: 48, height: 48, borderTop: !t ? "5px solid #fff" : "none", borderBottom: t ? "5px solid #fff" : "none", borderLeft: !r ? "5px solid #fff" : "none", borderRight: r ? "5px solid #fff" : "none" }} />
              ))}
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 3, background: "rgba(255,60,60,0.85)", transform: "translateY(-50%)" }} />
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 24px 48px", background: "linear-gradient(to top,rgba(0,0,0,0.8),transparent)", textAlign: "center" }}>
            <p style={{ margin: 0, color: "#fff", fontSize: 22, fontWeight: 600 }}>{msg}</p>
          </div>
        </>
      )}
    </div>
  );
}

// ── QTY SCREEN ───────────────────────────────────────────────────
function QtyScreen({ item, onSave, onBack }) {
  const [val, setVal] = useState(String(item.qty));
  const num = Math.max(0, parseInt(val) || 0);
  const col = statusColor({ qty: num, par: item.par });
  return (
    <div style={{ ...S.page, padding: "0 0 60px" }}>
      <div style={S.header}><button onClick={onBack} style={S.backBtn}>← Back</button></div>
      <div style={{ padding: "0 24px" }}>
        <p style={{ fontSize: 36, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>{item.name}</p>
        <p style={{ fontSize: 22, color: "#6b7280", margin: "0 0 40px" }}>Par level: {item.par} {item.unit}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <button onClick={() => setVal(String(Math.max(0, num - 1)))} style={{ width: 88, height: 88, borderRadius: 20, border: "none", background: "#dbeafe", color: "#2563eb", fontSize: 52, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>−</button>
          <input type="number" min="0" value={val} onChange={e => setVal(e.target.value)} autoFocus style={{ flex: 1, textAlign: "center", fontSize: 88, fontWeight: 800, border: "2px solid #d1d5db", borderRadius: 20, padding: "16px 8px", background: "#f9fafb", color: "#111827", minWidth: 0 }} />
          <button onClick={() => setVal(String(num + 1))} style={{ width: 88, height: 88, borderRadius: 20, border: "none", background: "#2563eb", color: "#fff", fontSize: 52, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>+</button>
        </div>
        <div style={{ height: 16, borderRadius: 10, background: "#e5e7eb", overflow: "hidden", marginBottom: 14 }}>
          <div style={{ height: "100%", width: Math.min(100, item.par > 0 ? (num / item.par) * 100 : 0) + "%", background: col, borderRadius: 10, transition: "width 0.2s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40 }}>
          <span style={{ fontSize: 20, color: "#6b7280" }}>{num} of {item.par} {item.unit}</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: col }}>{statusLabel({ qty: num, par: item.par })}</span>
        </div>
        <button onClick={() => { onSave(item.id, num); onBack(); }} style={S.btn()}>Save Quantity</button>
      </div>
    </div>
  );
}

// ── ITEM FORM ────────────────────────────────────────────────────
function ItemForm({ init, vendors, onSave, onBack, title }) {
  const blank = { name: "", sku: "", category: "Produce", unit: "", qty: "0", par: "0", vendor: vendors[0] ? vendors[0].id : "", brand: "", notes: "" };
  const start = init ? { ...init, qty: String(init.qty || 0), par: String(init.par || 0) } : blank;
  const [f, setF] = useState(start);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const save = () => {
    if (!f.name.trim()) return;
    onSave({ ...f, qty: Number(f.qty), par: Number(f.par) });
    onBack();
  };
  return (
    <div style={S.page}>
      <div style={{ ...S.header, marginBottom: 8 }}>
        <button onClick={onBack} style={S.backBtn}>← Back</button>
        <p style={{ fontSize: 32, fontWeight: 800, color: "#111827", margin: 0 }}>{title || "Add Product"}</p>
      </div>
      <div style={{ padding: "0 24px 80px" }}>
        <label style={S.lbl}>Product Name *</label>
        <input style={S.inp} value={f.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Cherry Tomatoes" />
        <label style={S.lbl}>Brand</label>
        <input style={S.inp} value={f.brand} onChange={e => set("brand", e.target.value)} placeholder="e.g. King Arthur" />
        <label style={S.lbl}>SKU / Barcode</label>
        <input style={S.inp} value={f.sku} onChange={e => set("sku", e.target.value)} placeholder="e.g. 074175604517" />
        <label style={S.lbl}>Category</label>
        <select style={S.inp} value={f.category} onChange={e => set("category", e.target.value)}>
          {CATS.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
        </select>
        <label style={S.lbl}>Unit</label>
        <input style={S.inp} value={f.unit} onChange={e => set("unit", e.target.value)} placeholder="lbs, gal, cs, btl..." />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={S.lbl}>Current Qty</label>
            <input style={S.inp} type="number" min="0" value={f.qty} onChange={e => set("qty", e.target.value)} />
          </div>
          <div>
            <label style={S.lbl}>Par Level</label>
            <input style={S.inp} type="number" min="0" value={f.par} onChange={e => set("par", e.target.value)} />
          </div>
        </div>
        <label style={S.lbl}>Vendor</label>
        <select style={S.inp} value={f.vendor} onChange={e => set("vendor", e.target.value)}>
          {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <label style={S.lbl}>Notes</label>
        <textarea style={{ ...S.inp, minHeight: 100, resize: "vertical" }} value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="e.g. refrigerate after opening..." />
        <button onClick={save} style={S.btn()}>Save</button>
      </div>
    </div>
  );
}

// ── CONFIRM NEW ITEM ─────────────────────────────────────────────
function ConfirmNew({ init, vendors, onSave, onBack }) {
  const [f, setF] = useState({ category: "Dry Goods", unit: "", par: "0", vendor: vendors[0] ? vendors[0].id : "", ...init, qty: "0" });
  const [qty, setQty] = useState("0");
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const num = Math.max(0, parseInt(qty) || 0);
  return (
    <div style={S.page}>
      <div style={{ ...S.header, marginBottom: 8 }}>
        <button onClick={onBack} style={S.backBtn}>← Back</button>
        <p style={{ fontSize: 32, fontWeight: 800, color: "#111827", margin: 0 }}>Confirm & Add</p>
      </div>
      <div style={{ padding: "0 24px 80px" }}>
        <div style={{ background: "#dbeafe", borderRadius: 14, padding: "14px 20px", marginBottom: 24 }}>
          <p style={{ margin: 0, fontSize: 20, color: "#1d4ed8", fontWeight: 600 }}>Found in product database — confirm details</p>
        </div>
        <label style={S.lbl}>Product Name</label>
        <input style={S.inp} value={f.name} onChange={e => set("name", e.target.value)} />
        <label style={S.lbl}>Brand</label>
        <input style={S.inp} value={f.brand} onChange={e => set("brand", e.target.value)} />
        <label style={S.lbl}>SKU</label>
        <input style={S.inp} value={f.sku} onChange={e => set("sku", e.target.value)} />
        <label style={S.lbl}>Category</label>
        <select style={S.inp} value={f.category} onChange={e => set("category", e.target.value)}>
          {CATS.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
        </select>
        <label style={S.lbl}>Unit</label>
        <input style={S.inp} value={f.unit} onChange={e => set("unit", e.target.value)} placeholder="lbs, gal, cs..." />
        <label style={S.lbl}>Par Level</label>
        <input style={S.inp} type="number" min="0" value={f.par} onChange={e => set("par", e.target.value)} />
        <label style={S.lbl}>Vendor</label>
        <select style={S.inp} value={f.vendor} onChange={e => set("vendor", e.target.value)}>
          {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <label style={S.lbl}>Notes</label>
        <input style={S.inp} value={f.notes || ""} onChange={e => set("notes", e.target.value)} placeholder="size, weight..." />
        <div style={{ borderTop: "2px solid #e5e7eb", paddingTop: 24, marginTop: 8 }}>
          <label style={{ ...S.lbl, fontSize: 22 }}>Quantity on hand</label>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <button onClick={() => setQty(String(Math.max(0, num - 1)))} style={{ width: 80, height: 80, borderRadius: 18, border: "none", background: "#dbeafe", color: "#2563eb", fontSize: 48, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>−</button>
            <input type="number" min="0" value={qty} onChange={e => setQty(e.target.value)} style={{ flex: 1, textAlign: "center", fontSize: 72, fontWeight: 800, border: "2px solid #d1d5db", borderRadius: 18, padding: "14px 8px", background: "#f9fafb", color: "#111827", minWidth: 0 }} />
            <button onClick={() => setQty(String(num + 1))} style={{ width: 80, height: 80, borderRadius: 18, border: "none", background: "#2563eb", color: "#fff", fontSize: 48, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>+</button>
          </div>
        </div>
        <button onClick={() => { if (!f.name.trim()) return; onSave({ ...f, qty: num, par: Number(f.par), id: Date.now() }); }} style={S.btn()}>Add to Inventory</button>
      </div>
    </div>
  );
}

// ── VENDOR FORM ──────────────────────────────────────────────────
function VendorForm({ init, onSave, onBack }) {
  const [name, setName] = useState(init ? init.name : "");
  return (
    <div style={S.page}>
      <div style={{ ...S.header, marginBottom: 8 }}>
        <button onClick={onBack} style={S.backBtn}>← Back</button>
        <p style={{ fontSize: 32, fontWeight: 800, color: "#111827", margin: 0 }}>{init ? "Edit Vendor" : "Add Vendor"}</p>
      </div>
      <div style={{ padding: "0 24px" }}>
        <label style={S.lbl}>Vendor Name</label>
        <input style={S.inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. City Produce Co." autoFocus />
        <button onClick={() => { if (!name.trim()) return; onSave({ id: init ? init.id : "v" + Date.now(), name: name.trim() }); onBack(); }} style={S.btn()}>Save Vendor</button>
      </div>
    </div>
  );
}

// ── CONFIRM DIALOG ───────────────────────────────────────────────
function Confirm({ title, msg, onOk, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(0,0,0,0.3)" }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: "40px 32px 32px", width: "100%", maxWidth: 480, boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }}>
        <p style={{ fontSize: 28, fontWeight: 800, color: "#111827", margin: "0 0 14px" }}>{title}</p>
        <p style={{ fontSize: 20, color: "#6b7280", margin: "0 0 36px", lineHeight: 1.5 }}>{msg}</p>
        <div style={{ display: "flex", gap: 14 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 22, borderRadius: 16, border: "1.5px solid #d1d5db", background: "#f9fafb", fontSize: 20, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          <button onClick={onOk} style={{ flex: 1, padding: 22, borderRadius: 16, border: "none", background: "#E24B4A", color: "#fff", fontSize: 20, fontWeight: 700, cursor: "pointer" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── SCAN SCREEN ──────────────────────────────────────────────────
function ScanScreen({ items, vendors, onUpdateQty, onAddItem }) {
  const [step, setStep] = useState("menu");
  const [result, setResult] = useState(null);
  const [sku, setSku] = useState("");
  const [sub, setSub] = useState(null);

  if (sub && sub.type === "qty") return <QtyScreen item={sub.item} onSave={onUpdateQty} onBack={() => setSub(null)} />;
  if (sub && sub.type === "add") return <ItemForm vendors={vendors} onSave={onAddItem} onBack={() => setSub(null)} init={{ sku: sub.sku || "" }} title="Add Product" />;

  const handleCode = async (code) => {
    setStep("lookup");
    const found = items.find(i => i.sku === code);
    if (found) { setResult({ ...found, inInventory: true }); setStep("result"); return; }
    try {
      const res = await fetch("https://world.openfoodfacts.org/api/v0/product/" + code + ".json");
      const d = await res.json();
      if (d.status === 1 && d.product) {
        const p = d.product;
        setResult({ foundOnline: true, sku: code, name: p.product_name || p.product_name_en || "", brand: p.brands || "", notes: p.quantity || "", category: "Dry Goods", unit: "", qty: 0, par: 0, vendor: "" });
      } else { setResult({ notFound: true, sku: code }); }
    } catch (e) { setResult({ notFound: true, sku: code }); }
    setStep("result");
  };

  const handleManual = () => {
    const q = sku.trim();
    if (!q) return;
    const found = items.find(i => i.sku === q || i.name.toLowerCase() === q.toLowerCase());
    if (found) { setResult({ ...found, inInventory: true }); setStep("result"); }
    else handleCode(q);
  };

  if (step === "camera") return <Camera onDetect={handleCode} onClose={() => setStep("menu")} />;

  if (step === "lookup") return (
    <div style={{ ...S.page, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
      <div style={{ width: 72, height: 72, borderRadius: "50%", border: "6px solid #2563eb", borderTopColor: "transparent", animation: "spin 1s linear infinite", marginBottom: 24 }} />
      <p style={{ fontSize: 26, fontWeight: 700, color: "#111827" }}>Looking up barcode...</p>
    </div>
  );

  if (step === "result" && result) {
    if (result.inInventory) return (
      <div style={S.page}>
        <div style={S.header}><button onClick={() => setStep("menu")} style={S.backBtn}>← Back</button></div>
        <div style={{ padding: "0 16px" }}>
          <div style={{ ...S.card, border: "2px solid #2563eb" }}>
            <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 28, color: "#111827" }}>{result.name}</p>
            {result.brand && <p style={{ margin: "0 0 6px", fontSize: 20, color: "#6b7280" }}>{result.brand}</p>}
            <p style={{ margin: "0 0 20px", fontSize: 18, color: "#6b7280" }}>{result.category}</p>
            <div style={{ background: "#f9fafb", borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 20, color: "#6b7280" }}>Current: <strong style={{ color: "#111827" }}>{result.qty} {result.unit}</strong> · Par: {result.par}</p>
            </div>
            <button onClick={() => setSub({ type: "qty", item: items.find(i => i.id === result.id) })} style={S.btn()}>Update Quantity</button>
          </div>
        </div>
      </div>
    );
    if (result.foundOnline) return (
      <ConfirmNew init={result} vendors={vendors} onSave={item => { onAddItem(item); setStep("menu"); setResult(null); }} onBack={() => setStep("menu")} />
    );
    return (
      <div style={S.page}>
        <div style={S.header}><button onClick={() => setStep("menu")} style={S.backBtn}>← Back</button></div>
        <div style={{ padding: "0 16px" }}>
          <div style={{ ...S.card, border: "2px solid #E24B4A" }}>
            <p style={{ margin: "0 0 10px", fontWeight: 800, color: "#E24B4A", fontSize: 26 }}>Not found anywhere</p>
            <p style={{ margin: "0 0 20px", fontSize: 20, color: "#6b7280" }}>SKU {result.sku} not found in inventory or database.</p>
            <button style={S.btn()} onClick={() => setSub({ type: "add", sku: result.sku })}>Add Manually</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.header}><div><p style={S.h1}>Scan</p><p style={S.sub}>Camera or manual entry</p></div></div>
      <div style={{ padding: "0 16px" }}>
        <button style={S.btn()} onClick={() => { setResult(null); setStep("camera"); }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          Scan with Camera
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0 20px" }}>
          <div style={{ flex: 1, height: 2, background: "#e5e7eb" }} />
          <span style={{ fontSize: 18, color: "#9ca3af" }}>or enter manually</span>
          <div style={{ flex: 1, height: 2, background: "#e5e7eb" }} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <input style={{ ...S.inp, flex: 1, marginBottom: 0 }} placeholder="SKU or product name" value={sku} onChange={e => setSku(e.target.value)} onKeyDown={e => e.key === "Enter" && handleManual()} />
          <button onClick={handleManual} style={{ padding: "18px 24px", borderRadius: 14, border: "none", background: "#2563eb", color: "#fff", fontSize: 20, fontWeight: 700, cursor: "pointer" }}>Find</button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("Inventory");
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [orderVendor, setOrderVendor] = useState("all");
  const [toast, setToast] = useState(null);
  const [screen, setScreen] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbErr, setDbErr] = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    (async () => {
      try {
        let v = await api.get("vendors", "?order=name");
        let i = await api.get("items", "?order=name");
        if (!Array.isArray(v) || !Array.isArray(i)) { setDbErr("Cannot connect to database. Check Supabase settings."); setLoading(false); return; }
        if (!v.length) { await api.upsert("vendors", SEED_VENDORS); v = SEED_VENDORS; }
        if (!i.length) { await api.upsert("items", SEED_ITEMS); i = SEED_ITEMS; }
        setVendors(v);
        setItems(i);
      } catch (e) { setDbErr("Error: " + e.message); }
      setLoading(false);
    })();
  }, []);

  const updateQty = async (id, qty) => { setItems(p => p.map(i => i.id === id ? { ...i, qty } : i)); await api.patch("items", "?id=eq." + id, { qty }); showToast("Saved!"); };
  const saveItem = async (item) => { setItems(p => p.map(i => i.id === item.id ? { ...i, ...item } : i)); await api.patch("items", "?id=eq." + item.id, item); showToast("Updated!"); };
  const addItem = async (item) => { const n = { brand: "", notes: "", ...item, id: Date.now() }; setItems(p => [...p, n].sort((a, b) => a.name.localeCompare(b.name))); await api.upsert("items", n); showToast("Item added!"); };
  const deleteItem = async (id) => { setItems(p => p.filter(i => i.id !== id)); await api.del("items", "?id=eq." + id); showToast("Deleted."); };
  const saveVendor = async (v) => {
    const exists = vendors.find(x => x.id === v.id);
    if (exists) { setVendors(p => p.map(x => x.id === v.id ? v : x)); await api.patch("vendors", "?id=eq." + v.id, v); showToast("Vendor updated!"); }
    else { setVendors(p => [...p, v]); await api.upsert("vendors", v); showToast("Vendor added!"); }
  };
  const deleteVendor = async (id) => { setVendors(p => p.filter(v => v.id !== id)); setItems(p => p.filter(i => i.vendor !== id)); await api.del("items", "?vendor=eq." + id); await api.del("vendors", "?id=eq." + id); showToast("Vendor deleted."); };

  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
  const filtered = sorted.filter(i => (cat === "All" || i.category === cat) && (i.name.toLowerCase().includes(search.toLowerCase()) || (i.sku || "").includes(search)));
  const needsOrder = items.filter(i => i.qty < i.par);
  const orderFiltered = orderVendor === "all" ? needsOrder : needsOrder.filter(i => i.vendor === orderVendor);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "system-ui,sans-serif" }}>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
      <div style={{ width: 72, height: 72, borderRadius: "50%", border: "6px solid #2563eb", borderTopColor: "transparent", animation: "spin 1s linear infinite", marginBottom: 24 }} />
      <p style={{ fontSize: 24, color: "#6b7280" }}>Loading KitchenStock...</p>
    </div>
  );

  if (dbErr) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "system-ui,sans-serif", padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>⚠️</div>
      <p style={{ fontSize: 26, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Database Error</p>
      <p style={{ fontSize: 20, color: "#6b7280" }}>{dbErr}</p>
    </div>
  );

  if (screen && screen.type === "qty") return <QtyScreen item={screen.item} onSave={updateQty} onBack={() => setScreen(null)} />;
  if (screen && screen.type === "addItem") return <ItemForm vendors={vendors} onSave={addItem} onBack={() => setScreen(null)} init={{ sku: screen.sku || "" }} title="Add Product" />;
  if (screen && screen.type === "editItem") return <ItemForm vendors={vendors} onSave={saveItem} onBack={() => setScreen(null)} init={screen.item} title="Edit Product" />;
  if (screen && screen.type === "addVendor") return <VendorForm onSave={saveVendor} onBack={() => setScreen(null)} />;
  if (screen && screen.type === "editVendor") return <VendorForm init={screen.vendor} onSave={saveVendor} onBack={() => setScreen(null)} />;

  const navIcon = {
    Inventory: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    Scan: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>,
    Order: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
    Vendors: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  };

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", maxWidth: 600, margin: "0 auto", minHeight: "100vh" }}>
      {toast && <div style={S.toast}>{toast}</div>}
      {confirm && <Confirm title={confirm.title} msg={confirm.msg} onOk={() => { confirm.action(); setConfirm(null); }} onCancel={() => setConfirm(null)} />}

      <div style={S.topNav}>
        {["Inventory", "Scan", "Order", "Vendors"].map(n => (
          <button key={n} style={S.navBtn(view === n)} onClick={() => setView(n)}>
            {navIcon[n]}
            {n}
            {n === "Order" && needsOrder.length > 0 && <span style={{ background: "#E24B4A", color: "#fff", borderRadius: 20, fontSize: 16, fontWeight: 700, padding: "3px 10px" }}>{needsOrder.length}</span>}
          </button>
        ))}
      </div>

      {view === "Scan" && <ScanScreen items={items} vendors={vendors} onUpdateQty={updateQty} onAddItem={addItem} />}

      {view === "Inventory" && (
        <div style={{ paddingBottom: 60 }}>
          <div style={S.header}>
            <div><p style={S.h1}>Inventory</p><p style={S.sub}>{items.length} items · {needsOrder.length} to reorder</p></div>
            <button onClick={() => setScreen({ type: "addItem" })} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 14, padding: "16px 26px", fontSize: 20, fontWeight: 700, cursor: "pointer" }}>+ Add</button>
          </div>
          <div style={{ padding: "0 16px 14px" }}>
            <input style={{ ...S.inp, marginBottom: 0 }} placeholder="Search items or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 16px 16px", scrollbarWidth: "none" }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{ padding: "12px 20px", borderRadius: 28, border: "1.5px solid " + (cat === c ? "#2563eb" : "#e5e7eb"), background: cat === c ? "#dbeafe" : "#f9fafb", color: cat === c ? "#2563eb" : "#6b7280", fontSize: 18, cursor: "pointer", whiteSpace: "nowrap", fontWeight: cat === c ? 700 : 500, flexShrink: 0 }}>{c}</button>
            ))}
          </div>
          {filtered.map(item => {
            const col = statusColor(item);
            const vname = (vendors.find(v => v.id === item.vendor) || {}).name || "";
            return (
              <div key={item.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div style={{ flex: 1, marginRight: 12 }}>
                    <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 26, color: "#111827" }}>{item.name}</p>
                    {item.brand && <p style={{ margin: "0 0 4px", fontSize: 18, color: "#6b7280" }}>{item.brand}</p>}
                    <p style={{ margin: 0, fontSize: 18, color: "#9ca3af" }}>{item.category} · {vname}</p>
                  </div>
                  <span style={S.badge(col)}>{statusLabel(item)}</span>
                </div>
                <div style={{ height: 12, borderRadius: 8, background: "#e5e7eb", overflow: "hidden", marginBottom: 14 }}>
                  <div style={{ height: "100%", width: pct(item) + "%", background: col, borderRadius: 8 }} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setScreen({ type: "qty", item })} style={{ flex: 1, padding: "18px 16px", borderRadius: 14, border: "1.5px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 18, color: "#6b7280", fontWeight: 600 }}>On hand</span>
                    <span style={{ fontSize: 32, fontWeight: 800, color: col }}>{item.qty} <span style={{ fontSize: 18, fontWeight: 500, color: "#9ca3af" }}>{item.unit}</span></span>
                  </button>
                  <button onClick={() => setScreen({ type: "editItem", item })} style={{ width: 64, borderRadius: 14, border: "1.5px solid #e5e7eb", background: "#f9fafb", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✏️</button>
                  <button onClick={() => setConfirm({ title: "Delete " + item.name + "?", msg: "This item will be permanently removed from your inventory.", action: () => deleteItem(item.id) })} style={{ width: 64, borderRadius: 14, border: "none", background: "#fee2e2", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p style={{ textAlign: "center", color: "#9ca3af", marginTop: 60, fontSize: 22 }}>No items found.</p>}
        </div>
      )}

      {view === "Order" && (
        <div style={{ paddingBottom: 60 }}>
          <div style={S.header}><div><p style={S.h1}>Order</p><p style={S.sub}>{needsOrder.length} items below par</p></div></div>
          <div style={{ padding: "0 16px 20px" }}>
            <select style={{ ...S.inp, marginBottom: 0 }} value={orderVendor} onChange={e => setOrderVendor(e.target.value)}>
              <option value="all">All Vendors</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          {orderFiltered.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: 80 }}>
              <div style={{ fontSize: 72, marginBottom: 16 }}>✓</div>
              <p style={{ fontWeight: 800, color: "#111827", fontSize: 32 }}>All stocked up!</p>
              <p style={{ fontSize: 20, color: "#6b7280" }}>No items need reordering.</p>
            </div>
          ) : (
            <>
              {vendors.filter(v => orderVendor === "all" || v.id === orderVendor).map(vendor => {
                const vItems = orderFiltered.filter(i => i.vendor === vendor.id);
                if (!vItems.length) return null;
                return (
                  <div key={vendor.id}>
                    <p style={{ fontSize: 18, fontWeight: 700, color: "#9ca3af", padding: "16px 24px 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{vendor.name}</p>
                    {vItems.map(item => (
                      <div key={item.id} style={S.card}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 24, color: "#111827" }}>{item.name}</p>
                            <p style={{ margin: 0, fontSize: 18, color: "#6b7280" }}>Have {item.qty} · Par {item.par} {item.unit}</p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 44, color: statusColor(item) }}>{item.par - item.qty}</p>
                            <p style={{ margin: 0, fontSize: 16, color: "#9ca3af" }}>{item.unit} needed</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
              <div style={{ padding: "0 16px 40px" }}>
                <button style={S.btn()} onClick={() => {
                  const txt = orderFiltered.map(i => i.name + " | Need: " + (i.par - i.qty) + " " + i.unit + " | " + ((vendors.find(v => v.id === i.vendor) || {}).name || "")).join("\n");
                  navigator.clipboard.writeText(txt).then(() => showToast("Order copied!"));
                }}>Copy Order to Clipboard</button>
              </div>
            </>
          )}
        </div>
      )}

      {view === "Vendors" && (
        <div style={{ paddingBottom: 60 }}>
          <div style={S.header}>
            <p style={S.h1}>Vendors</p>
            <button onClick={() => setScreen({ type: "addVendor" })} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 14, padding: "16px 26px", fontSize: 20, fontWeight: 700, cursor: "pointer" }}>+ Add</button>
          </div>
          {vendors.map(v => {
            const vItems = items.filter(i => i.vendor === v.id);
            const vOrder = needsOrder.filter(i => i.vendor === v.id);
            return (
              <div key={v.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 26, color: "#111827" }}>{v.name}</p>
                    <p style={{ margin: 0, fontSize: 18, color: "#6b7280" }}>{vItems.length} products</p>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {vOrder.length > 0 && <span style={{ background: "#fee2e2", color: "#991b1b", fontSize: 18, fontWeight: 700, padding: "8px 16px", borderRadius: 24 }}>{vOrder.length} to order</span>}
                    <button onClick={() => setScreen({ type: "editVendor", vendor: v })} style={{ width: 56, height: 56, borderRadius: 14, border: "1.5px solid #e5e7eb", background: "#f9fafb", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✏️</button>
                    <button onClick={() => setConfirm({ title: "Delete " + v.name + "?", msg: "This will also delete all " + vItems.length + " items assigned to this vendor.", action: () => deleteVendor(v.id) })} style={{ width: 56, height: 56, borderRadius: 14, border: "none", background: "#fee2e2", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {vItems.map(i => <span key={i.id} style={{ fontSize: 16, background: "#f3f4f6", color: "#6b7280", padding: "6px 14px", borderRadius: 20 }}>{i.name}</span>)}
                  {vItems.length === 0 && <span style={{ fontSize: 16, color: "#9ca3af" }}>No items assigned</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
