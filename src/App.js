import React, { useState, useRef, useEffect } from “react”;

const SB_URL = “https://vkosasytwgyhcxvxiksv.supabase.co/rest/v1”;
const SB_KEY = “sb_publishable_60HXdM9pOV6u_vFn_LQ2ng_K1Z__Db2”;
const H = {
“Content-Type”: “application/json”,
“apikey”: SB_KEY,
“Authorization”: “Bearer “ + SB_KEY
};

const sbGet = async (table) => {
const r = await fetch(SB_URL + “/” + table + “?order=name”, { headers: H });
return r.json();
};
const sbUpsert = async (table, body) => {
return fetch(SB_URL + “/” + table, {
method: “POST”,
headers: { …H, “Prefer”: “resolution=merge-duplicates,return=representation” },
body: JSON.stringify(body)
});
};
const sbPatch = async (table, id, body) => {
return fetch(SB_URL + “/” + table + “?id=eq.” + id, {
method: “PATCH”,
headers: { …H, “Prefer”: “return=representation” },
body: JSON.stringify(body)
});
};
const sbDelete = async (table, query) => {
return fetch(SB_URL + “/” + table + “?” + query, { method: “DELETE”, headers: H });
};

const CATEGORIES = [“All”, “Produce”, “Dairy”, “Dry Goods”, “Meat & Seafood”, “Beverages”, “Cleaning Supplies”];

const SEED_VENDORS = [
{ id: “v1”, name: “Fresh Farms Co.” },
{ id: “v2”, name: “Metro Food Supply” },
{ id: “v3”, name: “CleanPro Supplies” }
];

const SEED_ITEMS = [
{ id: 1, name: “Roma Tomatoes”, sku: “074175604517”, category: “Produce”, unit: “lbs”, qty: 4, par: 20, vendor: “v1”, brand: “”, notes: “” },
{ id: 2, name: “Whole Milk”, sku: “041303005484”, category: “Dairy”, unit: “gal”, qty: 2, par: 10, vendor: “v2”, brand: “”, notes: “” },
{ id: 3, name: “All-Purpose Flour”, sku: “016000275287”, category: “Dry Goods”, unit: “lbs”, qty: 15, par: 25, vendor: “v2”, brand: “”, notes: “” },
{ id: 4, name: “Chicken Breast”, sku: “021000617418”, category: “Meat & Seafood”, unit: “lbs”, qty: 8, par: 30, vendor: “v1”, brand: “”, notes: “” },
{ id: 5, name: “Olive Oil”, sku: “071026001102”, category: “Dry Goods”, unit: “btl”, qty: 3, par: 6, vendor: “v2”, brand: “”, notes: “” },
{ id: 6, name: “Heavy Cream”, sku: “041303004593”, category: “Dairy”, unit: “qt”, qty: 1, par: 8, vendor: “v1”, brand: “”, notes: “” },
{ id: 7, name: “Dish Soap”, sku: “037000864868”, category: “Cleaning Supplies”, unit: “btl”, qty: 5, par: 8, vendor: “v3”, brand: “”, notes: “” },
{ id: 8, name: “Sparkling Water”, sku: “078915001010”, category: “Beverages”, unit: “cs”, qty: 2, par: 5, vendor: “v2”, brand: “”, notes: “” }
];

const sColor = (item) => {
const r = item.qty / item.par;
if (r <= 0.25) return “#E24B4A”;
if (r <= 0.5) return “#EF9F27”;
return “#1D9E75”;
};
const sLabel = (item) => {
const r = item.qty / item.par;
if (r <= 0.25) return “Critical”;
if (r <= 0.5) return “Low”;
return “OK”;
};

const fs = { xs: 20, sm: 24, md: 30, lg: 36, xl: 44, xxl: 56 };

const navStyle = (active) => ({
flex: “0 0 auto”,
padding: “24px 28px 20px”,
border: “none”,
background: “none”,
cursor: “pointer”,
display: “flex”,
flexDirection: “column”,
alignItems: “center”,
gap: 8,
color: active ? “#185FA5” : “var(–color-text-secondary)”,
borderBottom: active ? “5px solid #185FA5” : “5px solid transparent”,
fontSize: fs.xs,
fontWeight: active ? 700 : 500
});

const cardStyle = {
background: “var(–color-background-primary)”,
borderRadius: 26,
border: “1.5px solid var(–color-border-tertiary)”,
padding: 28,
margin: “0 20px 20px”
};

const inputStyle = {
width: “100%”,
padding: “24px 26px”,
borderRadius: 20,
border: “1.5px solid var(–color-border-secondary)”,
fontSize: fs.md,
background: “var(–color-background-secondary)”,
color: “var(–color-text-primary)”,
boxSizing: “border-box”,
marginBottom: 20
};

const btnStyle = {
width: “100%”,
padding: 28,
borderRadius: 22,
border: “none”,
background: “#185FA5”,
color: “#fff”,
fontSize: fs.md,
fontWeight: 700,
cursor: “pointer”,
marginTop: 16,
display: “flex”,
alignItems: “center”,
justifyContent: “center”,
gap: 14,
boxSizing: “border-box”
};

const backBtnStyle = {
background: “var(–color-background-secondary)”,
border: “1.5px solid var(–color-border-secondary)”,
borderRadius: 18,
padding: “18px 30px”,
fontSize: fs.sm,
fontWeight: 700,
cursor: “pointer”,
color: “var(–color-text-primary)”
};

const lblStyle = {
fontSize: fs.sm,
color: “var(–color-text-secondary)”,
marginBottom: 10,
display: “block”,
fontWeight: 600
};

function CameraScanner({ onDetected, onClose }) {
const videoRef = useRef(null);
const canvasRef = useRef(null);
const streamRef = useRef(null);
const rafRef = useRef(null);
const activeRef = useRef(true);
const [status, setStatus] = useState(“Requesting camera…”);
const [error, setError] = useState(null);

const stop = () => {
activeRef.current = false;
if (rafRef.current) cancelAnimationFrame(rafRef.current);
if (streamRef.current) streamRef.current.getTracks().forEach(function(t) { t.stop(); });
};

useEffect(function() {
activeRef.current = true;
navigator.mediaDevices.getUserMedia({
video: { facingMode: { ideal: “environment” }, width: { ideal: 1280 }, height: { ideal: 720 } }
}).then(function(stream) {
if (!activeRef.current) { stream.getTracks().forEach(function(t) { t.stop(); }); return; }
streamRef.current = stream;
const v = videoRef.current;
v.srcObject = stream;
v.play().then(function() {
if (!activeRef.current) return;
setStatus(“Point camera at barcode”);
if (window.Quagga) { startScan(v); return; }
const s = document.createElement(“script”);
s.src = “https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js”;
s.onload = function() { if (activeRef.current) startScan(v); };
s.onerror = function() { if (activeRef.current) setStatus(“Scanner unavailable - use manual entry”); };
document.head.appendChild(s);
});
}).catch(function() {
if (activeRef.current) setError(“Camera access denied. Go to Settings > Safari > Camera > Allow.”);
});
return stop;
}, []);

const startScan = function(v) {
const canvas = canvasRef.current;
const ctx = canvas.getContext(“2d”, { willReadFrequently: true });
let frame = 0;
let busy = false;
const tick = function() {
if (!activeRef.current) return;
frame++;
if (frame % 8 !== 0 || busy || v.readyState < 2 || v.videoWidth === 0) {
rafRef.current = requestAnimationFrame(tick);
return;
}
busy = true;
canvas.width = v.videoWidth;
canvas.height = v.videoHeight;
ctx.drawImage(v, 0, 0);
window.Quagga.decodeSingle({
decoder: { readers: [“ean_reader”, “ean_8_reader”, “upc_reader”, “upc_e_reader”, “code_128_reader”, “code_39_reader”] },
locate: true,
src: canvas.toDataURL(“image/jpeg”, 0.8)
}, function(result) {
busy = false;
if (!activeRef.current) return;
if (result && result.codeResult && result.codeResult.code) {
stop();
onDetected(result.codeResult.code);
} else {
rafRef.current = requestAnimationFrame(tick);
}
});
};
rafRef.current = requestAnimationFrame(tick);
};

return (
<div style={{ position: “fixed”, inset: 0, background: “#000”, zIndex: 300 }}>
<div style={{ position: “absolute”, top: 0, left: 0, right: 0, zIndex: 20, padding: “40px 28px”, display: “flex”, justifyContent: “space-between”, alignItems: “center”, background: “linear-gradient(to bottom,rgba(0,0,0,0.75),transparent)” }}>
<p style={{ margin: 0, color: “#fff”, fontWeight: 800, fontSize: fs.xl }}>Scan</p>
<button onClick={function() { stop(); onClose(); }} style={{ background: “rgba(255,255,255,0.2)”, border: “none”, color: “#fff”, borderRadius: 28, padding: “18px 36px”, cursor: “pointer”, fontSize: fs.md, fontWeight: 700 }}>Cancel</button>
</div>
{error ? (
<div style={{ position: “absolute”, inset: 0, display: “flex”, flexDirection: “column”, alignItems: “center”, justifyContent: “center”, color: “#fff”, padding: 48, textAlign: “center” }}>
<p style={{ fontSize: 72, margin: “0 0 24px” }}>📷</p>
<p style={{ fontSize: fs.md, fontWeight: 700, lineHeight: 1.5 }}>{error}</p>
<button onClick={function() { stop(); onClose(); }} style={{ background: “#185FA5”, border: “none”, color: “#fff”, borderRadius: 22, padding: “24px 48px”, fontSize: fs.md, fontWeight: 700, cursor: “pointer”, marginTop: 28 }}>Go Back</button>
</div>
) : (
<div>
<video ref={videoRef} playsInline muted autoPlay style={{ position: “absolute”, inset: 0, width: “100%”, height: “100%”, objectFit: “cover” }} />
<canvas ref={canvasRef} style={{ display: “none” }} />
<div style={{ position: “absolute”, inset: 0, display: “flex”, alignItems: “center”, justifyContent: “center”, pointerEvents: “none”, zIndex: 10 }}>
<div style={{ width: “85%”, height: 220, position: “relative” }}>
<div style={{ position: “absolute”, top: 0, left: 0, width: 52, height: 52, borderTop: “6px solid #fff”, borderLeft: “6px solid #fff” }} />
<div style={{ position: “absolute”, top: 0, right: 0, width: 52, height: 52, borderTop: “6px solid #fff”, borderRight: “6px solid #fff” }} />
<div style={{ position: “absolute”, bottom: 0, left: 0, width: 52, height: 52, borderBottom: “6px solid #fff”, borderLeft: “6px solid #fff” }} />
<div style={{ position: “absolute”, bottom: 0, right: 0, width: 52, height: 52, borderBottom: “6px solid #fff”, borderRight: “6px solid #fff” }} />
<div style={{ position: “absolute”, top: “50%”, left: 0, right: 0, height: 4, background: “rgba(255,60,60,0.9)”, transform: “translateY(-50%)” }} />
</div>
</div>
<div style={{ position: “absolute”, bottom: 0, left: 0, right: 0, padding: “32px 28px 56px”, background: “linear-gradient(to top,rgba(0,0,0,0.75),transparent)”, textAlign: “center”, zIndex: 10 }}>
<p style={{ margin: 0, color: “#fff”, fontSize: fs.md, fontWeight: 600 }}>{status}</p>
</div>
</div>
)}
</div>
);
}

function QtyScreen({ item, onSave, onBack }) {
const [val, setVal] = useState(String(item.qty));
const num = Math.max(0, parseInt(val) || 0);
const color = sColor({ qty: num, par: item.par });
return (
<div style={{ minHeight: “100vh”, paddingBottom: 60, fontFamily: “system-ui,sans-serif” }}>
<div style={{ padding: “36px 24px 20px” }}>
<button onClick={onBack} style={backBtnStyle}>Back</button>
</div>
<div style={{ padding: “0 28px” }}>
<p style={{ fontSize: fs.xl, fontWeight: 800, color: “var(–color-text-primary)”, margin: “0 0 10px” }}>{item.name}</p>
<p style={{ fontSize: fs.md, color: “var(–color-text-secondary)”, margin: “0 0 48px” }}>Par: {item.par} {item.unit}</p>
<div style={{ display: “flex”, alignItems: “center”, gap: 20, marginBottom: 40 }}>
<button onClick={function() { setVal(String(Math.max(0, num - 1))); }} style={{ width: 100, height: 100, borderRadius: 24, border: “none”, background: “#E6F1FB”, color: “#185FA5”, fontSize: 64, fontWeight: 700, cursor: “pointer”, display: “flex”, alignItems: “center”, justifyContent: “center”, flexShrink: 0 }}>-</button>
<input type=“number” min=“0” value={val} onChange={function(e) { setVal(e.target.value); }} style={{ flex: 1, textAlign: “center”, fontSize: 100, fontWeight: 800, border: “2px solid var(–color-border-secondary)”, borderRadius: 24, padding: “20px 8px”, background: “var(–color-background-secondary)”, color: “var(–color-text-primary)”, minWidth: 0 }} autoFocus />
<button onClick={function() { setVal(String(num + 1)); }} style={{ width: 100, height: 100, borderRadius: 24, border: “none”, background: “#185FA5”, color: “#fff”, fontSize: 64, fontWeight: 700, cursor: “pointer”, display: “flex”, alignItems: “center”, justifyContent: “center”, flexShrink: 0 }}>+</button>
</div>
<div style={{ height: 20, borderRadius: 12, background: “var(–color-border-tertiary)”, overflow: “hidden”, marginBottom: 18 }}>
<div style={{ height: “100%”, width: Math.min(100, (num / item.par) * 100) + “%”, background: color, borderRadius: 12 }} />
</div>
<div style={{ display: “flex”, justifyContent: “space-between”, marginBottom: 48 }}>
<span style={{ fontSize: fs.md, color: “var(–color-text-secondary)” }}>{num} of {item.par} {item.unit}</span>
<span style={{ fontSize: fs.md, fontWeight: 700, color: color }}>{sLabel({ qty: num, par: item.par })}</span>
</div>
<button onClick={function() { onSave(item.id, num); onBack(); }} style={btnStyle}>Save Quantity</button>
</div>
</div>
);
}

function ItemFormScreen({ initial, vendors, onSave, onBack, title }) {
initial = initial || {};
title = title || “Add Product”;
const [form, setForm] = useState({
name: initial.name || “”,
sku: initial.sku || “”,
category: initial.category || “Produce”,
unit: initial.unit || “”,
qty: String(initial.qty || 0),
par: String(initial.par || 0),
vendor: initial.vendor || (vendors[0] ? vendors[0].id : “”),
brand: initial.brand || “”,
notes: initial.notes || “”,
id: initial.id || null
});

const set = function(k, v) { setForm(function(f) { const n = Object.assign({}, f); n[k] = v; return n; }); };

const save = function() {
if (!form.name.trim()) return;
onSave(Object.assign({}, form, { qty: Number(form.qty), par: Number(form.par) }));
onBack();
};

return (
<div style={{ minHeight: “100vh”, paddingBottom: 80, fontFamily: “system-ui,sans-serif” }}>
<div style={{ padding: “36px 24px 20px”, display: “flex”, justifyContent: “space-between”, alignItems: “center” }}>
<button onClick={onBack} style={backBtnStyle}>Back</button>
<p style={{ fontSize: fs.xl, fontWeight: 800, color: “var(–color-text-primary)”, margin: 0 }}>{title}</p>
</div>
<div style={{ padding: “0 28px” }}>
<label style={lblStyle}>Product Name</label>
<input style={inputStyle} value={form.name} onChange={function(e) { set(“name”, e.target.value); }} placeholder=“e.g. Cherry Tomatoes” />
<label style={lblStyle}>Brand</label>
<input style={inputStyle} value={form.brand} onChange={function(e) { set(“brand”, e.target.value); }} placeholder=“e.g. King Arthur” />
<label style={lblStyle}>SKU / Barcode</label>
<input style={inputStyle} value={form.sku} onChange={function(e) { set(“sku”, e.target.value); }} placeholder=“e.g. 074175604517” />
<label style={lblStyle}>Category</label>
<select style={inputStyle} value={form.category} onChange={function(e) { set(“category”, e.target.value); }}>
{CATEGORIES.filter(function(c) { return c !== “All”; }).map(function(c) { return <option key={c}>{c}</option>; })}
</select>
<label style={lblStyle}>Unit (lbs, gal, cs, btl…)</label>
<input style={inputStyle} value={form.unit} onChange={function(e) { set(“unit”, e.target.value); }} placeholder=“lbs” />
<div style={{ display: “grid”, gridTemplateColumns: “1fr 1fr”, gap: 16 }}>
<div>
<label style={lblStyle}>Current Qty</label>
<input style={inputStyle} type=“number” min=“0” value={form.qty} onChange={function(e) { set(“qty”, e.target.value); }} />
</div>
<div>
<label style={lblStyle}>Par Level</label>
<input style={inputStyle} type=“number” min=“0” value={form.par} onChange={function(e) { set(“par”, e.target.value); }} />
</div>
</div>
<label style={lblStyle}>Vendor</label>
<select style={inputStyle} value={form.vendor} onChange={function(e) { set(“vendor”, e.target.value); }}>
{vendors.map(function(v) { return <option key={v.id} value={v.id}>{v.name}</option>; })}
</select>
<label style={lblStyle}>Notes</label>
<textarea style={Object.assign({}, inputStyle, { minHeight: 120, resize: “vertical” })} value={form.notes} onChange={function(e) { set(“notes”, e.target.value); }} placeholder=“e.g. 50lb bag…” />
<button onClick={save} style={btnStyle}>Save</button>
</div>
</div>
);
}

function ConfirmNewItem({ initial, vendors, onSave, onBack }) {
const [form, setForm] = useState({
name: initial.name || “”,
brand: initial.brand || “”,
sku: initial.sku || “”,
category: initial.category || “Dry Goods”,
unit: initial.unit || “”,
par: “0”,
vendor: vendors[0] ? vendors[0].id : “”,
notes: initial.notes || “”
});
const [qtyVal, setQtyVal] = useState(“0”);
const set = function(k, v) { setForm(function(f) { const n = Object.assign({}, f); n[k] = v; return n; }); };
const num = Math.max(0, parseInt(qtyVal) || 0);

return (
<div style={{ minHeight: “100vh”, paddingBottom: 80, fontFamily: “system-ui,sans-serif” }}>
<div style={{ padding: “36px 24px 20px”, display: “flex”, justifyContent: “space-between”, alignItems: “center” }}>
<button onClick={onBack} style={backBtnStyle}>Back</button>
<p style={{ fontSize: fs.xl, fontWeight: 800, color: “var(–color-text-primary)”, margin: 0 }}>Confirm & Add</p>
</div>
<div style={{ padding: “0 28px 80px” }}>
<div style={{ background: “#E6F1FB”, borderRadius: 20, padding: “16px 24px”, marginBottom: 28 }}>
<p style={{ margin: 0, fontSize: fs.sm, color: “#185FA5”, fontWeight: 600 }}>Found in product database - confirm details</p>
</div>
<label style={lblStyle}>Product Name</label>
<input style={inputStyle} value={form.name} onChange={function(e) { set(“name”, e.target.value); }} />
<label style={lblStyle}>Brand</label>
<input style={inputStyle} value={form.brand} onChange={function(e) { set(“brand”, e.target.value); }} />
<label style={lblStyle}>SKU</label>
<input style={inputStyle} value={form.sku} onChange={function(e) { set(“sku”, e.target.value); }} />
<label style={lblStyle}>Category</label>
<select style={inputStyle} value={form.category} onChange={function(e) { set(“category”, e.target.value); }}>
{CATEGORIES.filter(function(c) { return c !== “All”; }).map(function(c) { return <option key={c}>{c}</option>; })}
</select>
<label style={lblStyle}>Unit</label>
<input style={inputStyle} value={form.unit} onChange={function(e) { set(“unit”, e.target.value); }} placeholder=“lbs” />
<label style={lblStyle}>Par Level</label>
<input style={inputStyle} type=“number” min=“0” value={form.par} onChange={function(e) { set(“par”, e.target.value); }} />
<label style={lblStyle}>Vendor</label>
<select style={inputStyle} value={form.vendor} onChange={function(e) { set(“vendor”, e.target.value); }}>
{vendors.map(function(v) { return <option key={v.id} value={v.id}>{v.name}</option>; })}
</select>
<label style={lblStyle}>Notes</label>
<input style={inputStyle} value={form.notes} onChange={function(e) { set(“notes”, e.target.value); }} />
<div style={{ borderTop: “2px solid var(–color-border-tertiary)”, marginBottom: 28, paddingTop: 28 }}>
<label style={Object.assign({}, lblStyle, { fontSize: fs.md })}>Quantity on hand</label>
<div style={{ display: “flex”, alignItems: “center”, gap: 20, marginBottom: 16 }}>
<button onClick={function() { setQtyVal(String(Math.max(0, num - 1))); }} style={{ width: 90, height: 90, borderRadius: 22, border: “none”, background: “#E6F1FB”, color: “#185FA5”, fontSize: 56, fontWeight: 700, cursor: “pointer”, display: “flex”, alignItems: “center”, justifyContent: “center”, flexShrink: 0 }}>-</button>
<input type=“number” min=“0” value={qtyVal} onChange={function(e) { setQtyVal(e.target.value); }} style={{ flex: 1, textAlign: “center”, fontSize: 80, fontWeight: 800, border: “2px solid var(–color-border-secondary)”, borderRadius: 22, padding: “16px 8px”, background: “var(–color-background-secondary)”, color: “var(–color-text-primary)”, minWidth: 0 }} />
<button onClick={function() { setQtyVal(String(num + 1)); }} style={{ width: 90, height: 90, borderRadius: 22, border: “none”, background: “#185FA5”, color: “#fff”, fontSize: 56, fontWeight: 700, cursor: “pointer”, display: “flex”, alignItems: “center”, justifyContent: “center”, flexShrink: 0 }}>+</button>
</div>
</div>
<button onClick={function() {
if (!form.name.trim()) return;
onSave(Object.assign({}, form, { qty: num, par: Number(form.par), id: Date.now() }));
}} style={btnStyle}>Add to Inventory</button>
</div>
</div>
);
}

function AddVendorScreen({ onSave, onBack }) {
const [name, setName] = useState(””);
return (
<div style={{ minHeight: “100vh”, fontFamily: “system-ui,sans-serif” }}>
<div style={{ padding: “36px 24px 20px”, display: “flex”, justifyContent: “space-between”, alignItems: “center” }}>
<button onClick={onBack} style={backBtnStyle}>Back</button>
<p style={{ fontSize: fs.xl, fontWeight: 800, color: “var(–color-text-primary)”, margin: 0 }}>Add Vendor</p>
</div>
<div style={{ padding: “0 28px” }}>
<label style={lblStyle}>Vendor Name</label>
<input style={inputStyle} placeholder=“e.g. City Produce Co.” value={name} onChange={function(e) { setName(e.target.value); }} autoFocus />
<button onClick={function() {
if (!name.trim()) return;
onSave({ id: “v” + Date.now(), name: name.trim() });
onBack();
}} style={btnStyle}>Add Vendor</button>
</div>
</div>
);
}

function ConfirmDialog({ label, message, onConfirm, onCancel }) {
return (
<div style={{ position: “fixed”, inset: 0, zIndex: 400, display: “flex”, alignItems: “center”, justifyContent: “center”, padding: 32, background: “rgba(0,0,0,0.35)” }}>
<div style={{ background: “var(–color-background-primary)”, borderRadius: 28, padding: “44px 36px 36px”, width: “100%”, maxWidth: 500, boxShadow: “0 8px 40px rgba(0,0,0,0.18)” }}>
<p style={{ fontSize: fs.lg, fontWeight: 800, color: “var(–color-text-primary)”, margin: “0 0 18px” }}>Delete {label}?</p>
<p style={{ fontSize: fs.md, color: “var(–color-text-secondary)”, margin: “0 0 40px”, lineHeight: 1.5 }}>{message}</p>
<div style={{ display: “flex”, gap: 16 }}>
<button onClick={onCancel} style={{ flex: 1, padding: 26, borderRadius: 20, border: “1.5px solid var(–color-border-secondary)”, background: “var(–color-background-secondary)”, fontSize: fs.md, fontWeight: 700, cursor: “pointer”, color: “var(–color-text-primary)” }}>Cancel</button>
<button onClick={onConfirm} style={{ flex: 1, padding: 26, borderRadius: 20, border: “none”, background: “#E24B4A”, color: “#fff”, fontSize: fs.md, fontWeight: 700, cursor: “pointer” }}>Delete</button>
</div>
</div>
</div>
);
}

function ScanScreen({ items, vendors, onUpdateQty, onAddItem }) {
const [step, setStep] = useState(“menu”);
const [scanResult, setScanResult] = useState(null);
const [manualSku, setManualSku] = useState(””);
const [subScreen, setSubScreen] = useState(null);

if (subScreen && subScreen.type === “qty”) {
return <QtyScreen item={subScreen.item} onSave={onUpdateQty} onBack={function() { setSubScreen(null); }} />;
}
if (subScreen && subScreen.type === “addItem”) {
return <ItemFormScreen vendors={vendors} onSave={onAddItem} onBack={function() { setSubScreen(null); }} initial={{ sku: subScreen.sku || “” }} title=“Add Product” />;
}

const handleCode = async function(code) {
setStep(“lookup”);
const found = items.find(function(i) { return i.sku === code; });
if (found) { setScanResult(Object.assign({}, found, { inInventory: true })); setStep(“result”); return; }
try {
const res = await fetch(“https://world.openfoodfacts.org/api/v0/product/” + code + “.json”);
const data = await res.json();
if (data.status === 1 && data.product) {
const p = data.product;
setScanResult({ foundOnline: true, sku: code, name: p.product_name || p.product_name_en || “”, brand: p.brands || “”, notes: p.quantity || “”, category: “Dry Goods”, unit: “”, qty: 0, par: 0, vendor: “” });
} else {
setScanResult({ notFound: true, sku: code });
}
} catch(e) { setScanResult({ notFound: true, sku: code }); }
setStep(“result”);
};

const handleManual = function() {
const q = manualSku.trim();
if (!q) return;
const found = items.find(function(i) { return i.sku === q || i.name.toLowerCase() === q.toLowerCase(); });
if (found) { setScanResult(Object.assign({}, found, { inInventory: true })); setStep(“result”); }
else { handleCode(q); }
};

if (step === “camera”) return <CameraScanner onDetected={handleCode} onClose={function() { setStep(“menu”); }} />;

if (step === “lookup”) return (
<div style={{ minHeight: “100vh”, display: “flex”, flexDirection: “column”, alignItems: “center”, justifyContent: “center”, padding: 48, textAlign: “center” }}>
<style>{”@keyframes spin{to{transform:rotate(360deg)}}”}</style>
<div style={{ width: 80, height: 80, borderRadius: “50%”, border: “6px solid #185FA5”, borderTopColor: “transparent”, marginBottom: 32, animation: “spin 1s linear infinite” }} />
<p style={{ fontSize: fs.lg, fontWeight: 700, color: “var(–color-text-primary)”, margin: “0 0 12px” }}>Looking up barcode…</p>
</div>
);

if (step === “result” && scanResult) {
if (scanResult.inInventory) return (
<div style={{ minHeight: “100vh”, paddingBottom: 60, fontFamily: “system-ui,sans-serif” }}>
<div style={{ padding: “36px 24px 20px” }}><button onClick={function() { setStep(“menu”); }} style={backBtnStyle}>Back</button></div>
<div style={{ padding: “0 28px” }}>
<div style={Object.assign({}, cardStyle, { margin: 0, border: “2.5px solid #185FA5” })}>
<p style={{ margin: “0 0 8px”, fontWeight: 800, fontSize: fs.lg, color: “var(–color-text-primary)” }}>{scanResult.name}</p>
<p style={{ margin: “0 0 20px”, fontSize: fs.sm, color: “var(–color-text-secondary)” }}>Qty: {scanResult.qty} {scanResult.unit} · Par: {scanResult.par}</p>
<button onClick={function() { setSubScreen({ type: “qty”, item: items.find(function(i) { return i.id === scanResult.id; }) }); }} style={btnStyle}>Update Quantity</button>
</div>
</div>
</div>
);
if (scanResult.foundOnline) return (
<ConfirmNewItem initial={scanResult} vendors={vendors} onSave={function(item) { onAddItem(item); setStep(“menu”); setScanResult(null); }} onBack={function() { setStep(“menu”); }} />
);
return (
<div style={{ minHeight: “100vh”, paddingBottom: 60, fontFamily: “system-ui,sans-serif” }}>
<div style={{ padding: “36px 24px 20px” }}><button onClick={function() { setStep(“menu”); }} style={backBtnStyle}>Back</button></div>
<div style={{ padding: “0 28px” }}>
<div style={Object.assign({}, cardStyle, { margin: 0, border: “2.5px solid #E24B4A” })}>
<p style={{ margin: “0 0 10px”, fontWeight: 800, color: “#E24B4A”, fontSize: fs.lg }}>Not found anywhere</p>
<p style={{ margin: “0 0 24px”, fontSize: fs.sm, color: “var(–color-text-secondary)” }}>SKU {scanResult.sku} not found.</p>
<button style={btnStyle} onClick={function() { setSubScreen({ type: “addItem”, sku: scanResult.sku }); }}>Add Manually</button>
</div>
</div>
</div>
);
}

return (
<div style={{ minHeight: “100vh”, paddingBottom: 60, fontFamily: “system-ui,sans-serif” }}>
<div style={{ padding: “36px 24px 20px” }}>
<p style={{ fontSize: fs.xxl, fontWeight: 800, color: “var(–color-text-primary)”, margin: 0 }}>Scan</p>
<p style={{ fontSize: fs.sm, color: “var(–color-text-secondary)”, marginTop: 8 }}>Camera or manual entry</p>
</div>
<div style={{ padding: “0 28px” }}>
<button style={btnStyle} onClick={function() { setScanResult(null); setStep(“camera”); }}>Scan with Camera</button>
<div style={{ display: “flex”, alignItems: “center”, gap: 16, margin: “32px 0 24px” }}>
<div style={{ flex: 1, height: 2, background: “var(–color-border-tertiary)” }} />
<span style={{ fontSize: fs.sm, color: “var(–color-text-secondary)” }}>or enter manually</span>
<div style={{ flex: 1, height: 2, background: “var(–color-border-tertiary)” }} />
</div>
<div style={{ display: “flex”, gap: 14 }}>
<input style={{ flex: 1, padding: “24px 26px”, borderRadius: 20, border: “1.5px solid var(–color-border-secondary)”, fontSize: fs.md, background: “var(–color-background-secondary)”, color: “var(–color-text-primary)”, boxSizing: “border-box” }} placeholder=“SKU or product name” value={manualSku} onChange={function(e) { setManualSku(e.target.value); }} onKeyDown={function(e) { if (e.key === “Enter”) handleManual(); }} />
<button onClick={handleManual} style={{ padding: “24px 28px”, borderRadius: 20, border: “none”, background: “#185FA5”, color: “#fff”, fontSize: fs.md, fontWeight: 700, cursor: “pointer” }}>Find</button>
</div>
</div>
</div>
);
}

export default function App() {
const [view, setView] = useState(“Inventory”);
const [items, setItems] = useState([]);
const [vendors, setVendors] = useState([]);
const [cat, setCat] = useState(“All”);
const [search, setSearch] = useState(””);
const [orderVendor, setOrderVendor] = useState(“all”);
const [toast, setToast] = useState(null);
const [screen, setScreen] = useState(null);
const [confirmDel, setConfirmDel] = useState(null);
const [loading, setLoading] = useState(true);
const [dbError, setDbError] = useState(null);

const showToast = function(msg) { setToast(msg); setTimeout(function() { setToast(null); }, 3000); };

useEffect(function() {
var load = async function() {
try {
var vRes = await fetch(SB_URL + “/vendors?order=name”, { headers: H });
var iRes = await fetch(SB_URL + “/items?order=name”, { headers: H });
var v = await vRes.json();
var i = await iRes.json();
if (!Array.isArray(v) || !Array.isArray(i)) {
setDbError(“Could not connect to database. Status: “ + vRes.status);
setLoading(false);
return;
}
if (!v.length) { await sbUpsert(“vendors”, SEED_VENDORS); v = SEED_VENDORS; }
if (!i.length) { await sbUpsert(“items”, SEED_ITEMS); i = SEED_ITEMS; }
setVendors(v);
setItems(i);
} catch(e) {
setDbError(“Error: “ + e.message);
}
setLoading(false);
};
load();
}, []);

const setQty = async function(id, qty) {
setItems(function(p) { return p.map(function(i) { return i.id === id ? Object.assign({}, i, { qty: qty }) : i; }); });
await sbPatch(“items”, id, { qty: qty });
showToast(“Quantity saved!”);
};

const saveItem = async function(item) {
setItems(function(p) { return p.map(function(i) { return i.id === item.id ? Object.assign({}, i, item) : i; }); });
await sbPatch(“items”, item.id, item);
showToast(“Item updated!”);
};

const addItem = async function(item) {
var n = Object.assign({ brand: “”, notes: “” }, item, { id: Date.now() });
setItems(function(p) { return p.concat([n]).sort(function(a, b) { return a.name.localeCompare(b.name); }); });
await sbUpsert(“items”, n);
showToast(“Item added!”);
};

const deleteItem = async function(id) {
setItems(function(p) { return p.filter(function(i) { return i.id !== id; }); });
await sbDelete(“items”, “id=eq.” + id);
showToast(“Item deleted.”);
};

const addVendor = async function(v) {
setVendors(function(p) { return p.concat([v]); });
await sbUpsert(“vendors”, v);
showToast(“Vendor added!”);
};

const deleteVendor = async function(id) {
setVendors(function(p) { return p.filter(function(v) { return v.id !== id; }); });
setItems(function(p) { return p.filter(function(i) { return i.vendor !== id; }); });
await sbDelete(“items”, “vendor=eq.” + id);
await sbDelete(“vendors”, “id=eq.” + id);
showToast(“Vendor deleted.”);
};

var sorted = items.slice().sort(function(a, b) { return a.name.localeCompare(b.name); });
var filtered = sorted.filter(function(i) {
return (cat === “All” || i.category === cat) &&
(i.name.toLowerCase().indexOf(search.toLowerCase()) !== -1 || (i.sku || “”).indexOf(search) !== -1);
});
var needsOrder = items.filter(function(i) { return i.qty < i.par; });
var orderFiltered = orderVendor === “all” ? needsOrder : needsOrder.filter(function(i) { return i.vendor === orderVendor; });

if (loading) return (
<div style={{ minHeight: “100vh”, display: “flex”, flexDirection: “column”, alignItems: “center”, justifyContent: “center”, fontFamily: “system-ui,sans-serif”, gap: 24 }}>
<style>{”@keyframes spin{to{transform:rotate(360deg)}}”}</style>
<div style={{ width: 80, height: 80, borderRadius: “50%”, border: “6px solid #185FA5”, borderTopColor: “transparent”, animation: “spin 1s linear infinite” }} />
<p style={{ fontSize: fs.md, color: “var(–color-text-secondary)”, margin: 0 }}>Loading KitchenStock…</p>
</div>
);

if (dbError) return (
<div style={{ minHeight: “100vh”, display: “flex”, flexDirection: “column”, alignItems: “center”, justifyContent: “center”, fontFamily: “system-ui,sans-serif”, padding: 40, textAlign: “center” }}>
<p style={{ fontSize: 60, margin: “0 0 20px” }}>⚠️</p>
<p style={{ fontSize: fs.md, fontWeight: 700, color: “var(–color-text-primary)”, margin: “0 0 12px” }}>Database Error</p>
<p style={{ fontSize: fs.sm, color: “var(–color-text-secondary)” }}>{dbError}</p>
</div>
);

if (screen && screen.type === “qty”) return <QtyScreen item={screen.item} onSave={setQty} onBack={function() { setScreen(null); }} />;
if (screen && screen.type === “addItem”) return <ItemFormScreen vendors={vendors} onSave={addItem} onBack={function() { setScreen(null); }} initial={{ sku: screen.sku || “” }} title=“Add Product” />;
if (screen && screen.type === “editItem”) return <ItemFormScreen vendors={vendors} onSave={saveItem} onBack={function() { setScreen(null); }} initial={screen.item} title=“Edit Product” />;
if (screen && screen.type === “addVendor”) return <AddVendorScreen onSave={addVendor} onBack={function() { setScreen(null); }} />;

const navIcons = {
Inventory: <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
Scan: <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>,
Order: <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
Vendors: <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
};

return (
<div style={{ fontFamily: “system-ui,sans-serif”, width: “100%”, boxSizing: “border-box”, overflowX: “hidden” }}>
{toast && <div style={{ position: “fixed”, top: 40, left: “50%”, transform: “translateX(-50%)”, background: “#185FA5”, color: “#fff”, padding: “20px 44px”, borderRadius: 48, fontSize: fs.sm, fontWeight: 700, zIndex: 500, whiteSpace: “nowrap”, maxWidth: “92vw”, textAlign: “center” }}>{toast}</div>}
{confirmDel && <ConfirmDialog label={confirmDel.label} message={confirmDel.message} onConfirm={function() { confirmDel.action(); setConfirmDel(null); }} onCancel={function() { setConfirmDel(null); }} />}

```
  <div style={{ display: "flex", background: "var(--color-background-primary)", borderBottom: "1.5px solid var(--color-border-tertiary)", overflowX: "auto", scrollbarWidth: "none", position: "sticky", top: 0, zIndex: 10 }}>
    {["Inventory", "Scan", "Order", "Vendors"].map(function(n) {
      return (
        <button key={n} style={navStyle(view === n)} onClick={function() { setView(n); }}>
          {navIcons[n]}
          {n}
          {n === "Order" && needsOrder.length > 0 && <span style={{ background: "#E24B4A", color: "#fff", borderRadius: 24, fontSize: fs.xs, fontWeight: 700, padding: "4px 12px" }}>{needsOrder.length}</span>}
        </button>
      );
    })}
  </div>

  {view === "Scan" && <ScanScreen items={items} vendors={vendors} onUpdateQty={setQty} onAddItem={addItem} />}

  {view === "Inventory" && (
    <div style={{ minHeight: "100vh", paddingBottom: 60 }}>
      <div style={{ padding: "36px 24px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: fs.xxl, fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>Inventory</p>
          <p style={{ fontSize: fs.sm, color: "var(--color-text-secondary)", marginTop: 8 }}>{items.length} items · {needsOrder.length} to reorder</p>
        </div>
        <button onClick={function() { setScreen({ type: "addItem" }); }} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: 20, padding: "20px 32px", fontSize: fs.md, fontWeight: 700, cursor: "pointer" }}>+ Add</button>
      </div>
      <div style={{ padding: "0 20px 18px" }}>
        <input style={{ width: "100%", padding: "24px 26px", borderRadius: 20, border: "1.5px solid var(--color-border-secondary)", fontSize: fs.md, background: "var(--color-background-secondary)", color: "var(--color-text-primary)", boxSizing: "border-box" }} placeholder="Search items or SKU..." value={search} onChange={function(e) { setSearch(e.target.value); }} />
      </div>
      <div style={{ display: "flex", gap: 14, overflowX: "auto", padding: "0 20px 20px", scrollbarWidth: "none" }}>
        {CATEGORIES.map(function(c) {
          var active = cat === c;
          return <button key={c} style={{ padding: "16px 28px", borderRadius: 36, border: "1.5px solid " + (active ? "#185FA5" : "var(--color-border-tertiary)"), background: active ? "#E6F1FB" : "var(--color-background-secondary)", color: active ? "#185FA5" : "var(--color-text-secondary)", fontSize: fs.sm, cursor: "pointer", whiteSpace: "nowrap", fontWeight: active ? 700 : 500, flexShrink: 0 }} onClick={function() { setCat(c); }}>{c}</button>;
        })}
      </div>
      {filtered.map(function(item) {
        var color = sColor(item);
        var vname = "";
        var vf = vendors.find(function(v) { return v.id === item.vendor; });
        if (vf) vname = vf.name;
        return (
          <div key={item.id} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ flex: 1, marginRight: 16 }}>
                <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: fs.lg, color: "var(--color-text-primary)" }}>{item.name}</p>
                {item.brand && <p style={{ margin: "0 0 4px", fontSize: fs.sm, color: "var(--color-text-secondary)" }}>{item.brand}</p>}
                <p style={{ margin: 0, fontSize: fs.sm, color: "var(--color-text-secondary)" }}>{item.category} · {vname}</p>
              </div>
              <span style={{ fontSize: fs.xs, padding: "8px 20px", borderRadius: 36, background: color + "22", color: color, fontWeight: 700 }}>{sLabel(item)}</span>
            </div>
            <div style={{ height: 14, borderRadius: 10, background: "var(--color-border-tertiary)", overflow: "hidden", marginBottom: 18 }}>
              <div style={{ height: "100%", width: Math.min(100, (item.qty / item.par) * 100) + "%", background: color, borderRadius: 10 }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={function() { setScreen({ type: "qty", item: item }); }} style={{ flex: 1, padding: "22px 20px", borderRadius: 20, border: "1.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: fs.sm, color: "var(--color-text-secondary)", fontWeight: 600 }}>On hand</span>
                <span style={{ fontSize: fs.xl, fontWeight: 800, color: color }}>{item.qty} <span style={{ fontSize: fs.sm, fontWeight: 500, color: "var(--color-text-secondary)" }}>{item.unit}</span></span>
              </button>
              <button onClick={function() { setScreen({ type: "editItem", item: item }); }} style={{ width: 80, borderRadius: 20, border: "1.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", fontSize: fs.lg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✏️</button>
              <button onClick={function() { setConfirmDel({ label: item.name, message: "This item will be permanently removed.", action: function() { deleteItem(item.id); } }); }} style={{ width: 80, borderRadius: 20, border: "none", background: "#FCEBEB", color: "#A32D2D", fontSize: fs.lg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          </div>
        );
      })}
      {filtered.length === 0 && <p style={{ textAlign: "center", color: "var(--color-text-secondary)", marginTop: 60, fontSize: fs.md }}>No items found.</p>}
    </div>
  )}

  {view === "Order" && (
    <div style={{ minHeight: "100vh", paddingBottom: 60 }}>
      <div style={{ padding: "36px 24px 20px" }}>
        <p style={{ fontSize: fs.xxl, fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>Order</p>
        <p style={{ fontSize: fs.sm, color: "var(--color-text-secondary)", marginTop: 8 }}>{needsOrder.length} items below par</p>
      </div>
      <div style={{ padding: "0 24px 24px" }}>
        <select style={Object.assign({}, inputStyle, { marginBottom: 0 })} value={orderVendor} onChange={function(e) { setOrderVendor(e.target.value); }}>
          <option value="all">All Vendors</option>
          {vendors.map(function(v) { return <option key={v.id} value={v.id}>{v.name}</option>; })}
        </select>
      </div>
      {orderFiltered.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: 80 }}>
          <p style={{ fontSize: 80, marginBottom: 20 }}>✓</p>
          <p style={{ fontWeight: 800, color: "var(--color-text-primary)", fontSize: fs.xl }}>All stocked up!</p>
        </div>
      ) : (
        <div>
          {vendors.filter(function(v) { return orderVendor === "all" || v.id === orderVendor; }).map(function(vendor) {
            var vItems = orderFiltered.filter(function(i) { return i.vendor === vendor.id; });
            if (!vItems.length) return null;
            return (
              <div key={vendor.id}>
                <p style={{ fontSize: fs.sm, fontWeight: 700, color: "var(--color-text-secondary)", padding: "20px 24px 12px", textTransform: "uppercase", letterSpacing: "0.07em" }}>{vendor.name}</p>
                {vItems.map(function(item) {
                  return (
                    <div key={item.id} style={cardStyle}>
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
                  );
                })}
              </div>
            );
          })}
          <div style={{ padding: "0 24px 40px" }}>
            <button style={btnStyle} onClick={function() {
              var txt = orderFiltered.map(function(i) {
                var vn = "";
                var vf = vendors.find(function(v) { return v.id === i.vendor; });
                if (vf) vn = vf.name;
                return i.name + " | Need: " + (i.par - i.qty) + " " + i.unit + " | " + vn;
              }).join("\n");
              navigator.clipboard.writeText(txt).then(function() { showToast("Order copied!"); });
            }}>Copy Order to Clipboard</button>
          </div>
        </div>
      )}
    </div>
  )}

  {view === "Vendors" && (
    <div style={{ minHeight: "100vh", paddingBottom: 60 }}>
      <div style={{ padding: "36px 24px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: fs.xxl, fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>Vendors</p>
        <button onClick={function() { setScreen({ type: "addVendor" }); }} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: 20, padding: "20px 32px", fontSize: fs.md, fontWeight: 700, cursor: "pointer" }}>+ Add</button>
      </div>
      {vendors.map(function(v) {
        var vItems = items.filter(function(i) { return i.vendor === v.id; });
        var vOrder = needsOrder.filter(function(i) { return i.vendor === v.id; });
        return (
          <div key={v.id} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: fs.lg, color: "var(--color-text-primary)" }}>{v.name}</p>
                <p style={{ margin: 0, fontSize: fs.sm, color: "var(--color-text-secondary)" }}>{vItems.length} products</p>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {vOrder.length > 0 && <span style={{ background: "#FCEBEB", color: "#A32D2D", fontSize: fs.sm, fontWeight: 700, padding: "10px 20px", borderRadius: 30 }}>{vOrder.length} to order</span>}
                <button onClick={function() { setConfirmDel({ label: v.name, message: "This will also delete all " + vItems.length + " items assigned to this vendor.", action: function() { deleteVendor(v.id); } }); }} style={{ width: 72, height: 72, borderRadius: 18, border: "none", background: "#FCEBEB", color: "#A32D2D", fontSize: fs.lg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {vItems.map(function(i) { return <span key={i.id} style={{ fontSize: fs.xs, background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", padding: "8px 20px", borderRadius: 30, border: "1px solid var(--color-border-tertiary)" }}>{i.name}</span>; })}
              {vItems.length === 0 && <span style={{ fontSize: fs.xs, color: "var(--color-text-secondary)" }}>No items assigned</span>}
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>
```

);
}
