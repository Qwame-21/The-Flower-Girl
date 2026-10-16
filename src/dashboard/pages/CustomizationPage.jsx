// src/pages/CustomizationPage.jsx
// Rebuilt to query real live database table `customization_options` with real column names:
// category, option_name, estimate, display_order, visible

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../config/supabase";
import { focusAndScrollToFirstError } from "../lib/formValidationHelper";
import { getAppSettings } from "../data/settingsAdapter";
import PasswordConfirmModal from "../components/PasswordConfirmModal";
import { buildStorefrontCustomizationSnapshot, CUSTOMIZATION_SYNC_CHANNEL } from "../../shared/customizationSync";

const STORAGE_KEY = "xa12-customization-v3";

function showToast(msg) {
  window.dispatchEvent(new CustomEvent("xa12:toast", { detail: { message: msg } }));
}

function genId() { return "local-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7); }

function ToggleSwitch({ checked, onChange, id, label }) {
  return (
    <label htmlFor={id} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" }}>
      <span style={{
        position: "relative", width: "32px", height: "18px", flexShrink: 0,
        background: checked ? "#1a1a1a" : "rgba(26,26,26,0.18)",
        borderRadius: "9px", display: "inline-block",
        transition: "background var(--dur-fast) var(--ease)",
      }}>
        <input type="checkbox" id={id} checked={checked} onChange={onChange}
          style={{ opacity: 0, width: 0, height: 0, position: "absolute" }} />
        <span style={{
          position: "absolute", top: "2px",
          left: checked ? "16px" : "2px",
          width: "14px", height: "14px", borderRadius: "50%",
          background: "#fff",
          transition: "left var(--dur-fast) var(--ease)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </span>
      {label && <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{label}</span>}
    </label>
  );
}

function ConfirmModal({ title, body, confirmLabel = "Delete", onConfirm, onCancel, danger = true }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000,
      backdropFilter: "blur(4px)",
    }} onClick={onCancel}>
      <div style={{
        background: "#fff", borderRadius: "16px", padding: "24px",
        maxWidth: "400px", width: "90%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 700 }}>{title}</h3>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 20px", lineHeight: 1.5 }}>{body}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button type="button" onClick={onCancel}
            style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid rgba(26,26,26,0.15)", background: "transparent", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm}
            style={{ padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600, background: danger ? "#e11d48" : "#1a1a1a", color: "#fff" }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Drawer({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const handler = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);
  return (
    <>
      <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)",
        zIndex: 1999, opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
        transition: "opacity var(--dur) var(--ease)",
      }} onClick={onClose} />
      <div style={{
        position: "fixed", top: "16px", right: "16px", bottom: "16px",
        width: "380px", maxWidth: "calc(100vw - 32px)",
        background: "#fff", borderRadius: "24px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        zIndex: 2000,
        transform: open ? "translateX(0)" : "translateX(calc(100% + 32px))",
        transition: "transform var(--dur) var(--ease)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px", borderBottom: "1px solid rgba(26,26,26,0.08)", flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} type="button"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", padding: "4px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>{children}</div>
      </div>
    </>
  );
}

export default function CustomizationPage() {
  const [categories, setCategories] = useState([]);
  const [loadState, setLoadState] = useState("loading"); // 'loading' | 'ready' | 'error'
  const [errorDetails, setErrorDetails] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [formSaving, setFormSaving] = useState(false);
  const [settings, setSettings] = useState(() => getAppSettings());
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [pendingDeleteAction, setPendingDeleteAction] = useState(null);
  const syncChannelRef = useRef(null);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return undefined;
    const channel = new BroadcastChannel(CUSTOMIZATION_SYNC_CHANNEL);
    syncChannelRef.current = channel;
    return () => {
      syncChannelRef.current = null;
      channel.close();
    };
  }, []);

  // Load settings for password confirmation check
  useEffect(() => {
    setSettings(getAppSettings());
  }, []);

  const fetchCustomizationOptions = useCallback(async () => {
    setLoadState("loading");
    setErrorDetails(null);
    if (!supabase) {
      setLoadState("ready");
      return;
    }

    try {
      // Query REAL live database table columns: category, option_name, estimate, display_order, visible
      const { data, error } = await supabase
        .from("customization_options")
        .select("id, category, option_name, estimate, display_order, visible")
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Customization load error:", error);
        setErrorDetails(`${error.code || ''} ${error.message || ''}`);
        setLoadState("error");
        return;
      }

      if (data) {
        const catMap = {};
        const catOrder = [];
        data.forEach(row => {
          const k = row.category || "Uncategorised";
          if (!catMap[k]) {
            catMap[k] = { id: "cat-" + k.replace(/[^a-z0-9]/gi, '-').toLowerCase(), name: k, visible: true, options: [] };
            catOrder.push(k);
          }
          catMap[k].options.push({
            id: String(row.id),
            name: row.option_name,
            price: Number(row.estimate || 0),
            visible: row.visible !== false,
            displayOrder: row.display_order || 0
          });
        });
        const loaded = catOrder.map(k => catMap[k]);
        setCategories(loaded);
        setExpandedCategoryId(loaded[0]?.id ?? null);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded)); } catch {}
      }
      setLoadState("ready");
    } catch (err) {
      console.error("Customization unexpected load error:", err);
      setErrorDetails(err.message || String(err));
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    fetchCustomizationOptions();
  }, [fetchCustomizationOptions]);

  const persist = useCallback((cats) => {
    setCategories(cats);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cats)); } catch {}
    syncChannelRef.current?.postMessage(buildStorefrontCustomizationSnapshot(cats));
  }, []);

  const q = search.trim().toLowerCase();
  const visibleCats = categories
    .filter(c => filterCat === "all" || c.id === filterCat || c.name === filterCat)
    .map(c => ({ ...c, options: q ? c.options.filter(o => o.name.toLowerCase().includes(q)) : c.options }))
    .filter(c => !q || c.options.length > 0 || c.name.toLowerCase().includes(q));

  function openNewCategory() { setFormData({ name: "", visible: true }); setFormErrors({}); setDrawer({ mode: "new-category" }); }
  function openEditCategory(cat) { setFormData({ name: cat.name, visible: cat.visible }); setFormErrors({}); setDrawer({ mode: "edit-category", catId: cat.id }); }
  function openNewOption(catId) { setFormData({ catId, name: "", price: "", visible: true }); setFormErrors({}); setDrawer({ mode: "new-option", catId }); }
  function openEditOption(catId, opt) { setFormData({ catId, optId: opt.id, name: opt.name, price: String(opt.price), visible: opt.visible }); setFormErrors({}); setDrawer({ mode: "edit-option", catId, optId: opt.id }); }
  function closeDrawer() { if (formSaving) return; setDrawer(null); }

  async function saveCategory() {
    const errors = {};
    if (!formData.name?.trim()) errors.name = "Category name is required.";
    if (drawer.mode === "new-category" && categories.some(c => c.name.toLowerCase() === formData.name?.trim().toLowerCase())) errors.name = "A category with this name already exists.";
    if (Object.keys(errors).length) { setFormErrors(errors); setTimeout(() => focusAndScrollToFirstError("#customization-drawer-form"), 50); return; }
    setFormSaving(true);
    try {
      if (drawer.mode === "new-category") {
        const nc = { id: genId(), name: formData.name.trim(), visible: formData.visible ?? true, options: [] };
        persist([...categories, nc]);
        showToast(`Category "${nc.name}" added.`);
      } else {
        persist(categories.map(c => c.id === drawer.catId ? { ...c, name: formData.name.trim(), visible: formData.visible ?? true } : c));
        showToast("Category updated.");
      }
      setDrawer(null);
    } finally { setFormSaving(false); }
  }

  async function saveOption() {
    const errors = {};
    if (!formData.name?.trim()) errors.name = "Option name is required.";
    const priceVal = parseFloat(formData.price);
    if (isNaN(priceVal) || priceVal < 0) errors.price = "Enter a valid price (0 or more).";
    if (Object.keys(errors).length) { setFormErrors(errors); setTimeout(() => focusAndScrollToFirstError("#customization-drawer-form"), 50); return; }
    setFormSaving(true);
    try {
      const cat = categories.find(c => c.id === formData.catId || c.name === formData.catId);
      if (!cat) { showToast("Category not found."); return; }
      if (drawer.mode === "new-option") {
        const nO = { id: genId(), name: formData.name.trim(), price: priceVal, visible: formData.visible ?? true };
        persist(categories.map(c => c.name === cat.name ? { ...c, options: [...c.options, nO] } : c));
        if (supabase) {
          try {
            await supabase.from("customization_options").insert({
              category: cat.name,
              option_name: nO.name,
              estimate: nO.price,
              visible: nO.visible
            });
          } catch (e) {
            console.error("DB insert option failed:", e);
          }
        }
        showToast(`"${nO.name}" added to ${cat.name}.`);
      } else {
        persist(categories.map(c => c.name === cat.name ? { ...c, options: c.options.map(o => o.id === formData.optId ? { ...o, name: formData.name.trim(), price: priceVal, visible: formData.visible ?? true } : o) } : c));
        if (supabase && formData.optId && !String(formData.optId).startsWith('local-')) {
          try {
            await supabase.from("customization_options").update({
              option_name: formData.name.trim(),
              estimate: priceVal,
              visible: formData.visible ?? true
            }).eq("id", formData.optId);
          } catch (e) {
            console.error("DB update option failed:", e);
          }
        }
        showToast("Option updated.");
      }
      setDrawer(null);
    } finally { setFormSaving(false); }
  }

  function handleDrawerSave() { if (drawer.mode === "new-category" || drawer.mode === "edit-category") saveCategory(); else saveOption(); }

  async function toggleCategoryVisible(catId) {
    const prevCategories = categories;
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    const nextVisible = !cat.visible;

    // Optimistically update category and all its child options
    const updatedCategories = categories.map(c =>
      c.id === catId
        ? {
            ...c,
            visible: nextVisible,
            options: c.options.map(o => ({ ...o, visible: nextVisible }))
          }
        : c
    );
    persist(updatedCategories);

    if (supabase) {
      try {
        const { error } = await supabase
          .from("customization_options")
          .update({ visible: nextVisible })
          .eq("category", cat.name);

        if (error) throw error;
        showToast(`Category "${cat.name}" is now ${nextVisible ? 'visible' : 'hidden'}.`);
      } catch (err) {
        console.error("Failed to update category visibility:", err);
        persist(prevCategories);
        showToast("Failed to update category visibility. Rolled back.");
      }
    }
  }

  async function toggleOptionVisible(catId, optId) {
    const prevCategories = categories;
    const cat = categories.find(c => c.id === catId);
    const targetOpt = cat?.options?.find(o => o.id === optId);
    if (!targetOpt) return;
    const nextVisible = !targetOpt.visible;

    // Optimistically update option visibility
    const updatedCategories = categories.map(c => {
      if (c.id === catId) {
        const newOptions = c.options.map(o => (o.id === optId ? { ...o, visible: nextVisible } : o));
        // Category is visible if at least one option is visible
        const catVisible = newOptions.some(o => o.visible);
        return { ...c, visible: catVisible, options: newOptions };
      }
      return c;
    });
    persist(updatedCategories);

    if (supabase && optId && !String(optId).startsWith('local-')) {
      try {
        const { error } = await supabase
          .from("customization_options")
          .update({ visible: nextVisible })
          .eq("id", optId);

        if (error) throw error;
        showToast(`"${targetOpt.name}" is now ${nextVisible ? 'visible' : 'hidden'}.`);
      } catch (err) {
        console.error("Failed to update option visibility:", err);
        persist(prevCategories);
        showToast("Failed to update option visibility. Rolled back.");
      }
    }
  }

  function requestDeleteCategory(cat) {
    const inUse = cat.options.length > 0;
    setConfirm({ type: "delete-category", catId: cat.id, title: `Delete "${cat.name}"?`, body: inUse ? "This category has " + cat.options.length + " option" + (cat.options.length !== 1 ? "s" : "") + ". Delete the options first." : "This will permanently remove the category.", blocked: inUse });
  }

  function requestDeleteOption(catId, opt) {
    setConfirm({ type: "delete-option", catId, optId: opt.id, title: `Delete "${opt.name}"?`, body: "This option will be permanently removed. Existing requests that included it are not affected.", blocked: false });
  }

  async function executeDelete() {
    if (!confirm) return;

    if (settings?.security?.requirePasswordForDestructive) {
      setPendingDeleteAction(() => async () => {
        if (confirm.type === "delete-category") {
          persist(categories.filter(c => c.id !== confirm.catId));
          showToast("Category deleted.");
        } else {
          persist(categories.map(c => c.id === confirm.catId ? { ...c, options: c.options.filter(o => o.id !== confirm.optId) } : c));
          if (supabase && confirm.optId && !String(confirm.optId).startsWith('local-')) {
            try {
              await supabase.from("customization_options").delete().eq("id", confirm.optId);
            } catch (e) { console.error("DB delete option failed:", e); }
          }
          showToast("Option removed.");
        }
        setConfirm(null);
      });
      setShowPwConfirm(true);
      return;
    }

    if (confirm.type === "delete-category") {
      persist(categories.filter(c => c.id !== confirm.catId));
      showToast("Category deleted.");
    } else {
      persist(categories.map(c => c.id === confirm.catId ? { ...c, options: c.options.filter(o => o.id !== confirm.optId) } : c));
      if (supabase && confirm.optId && !String(confirm.optId).startsWith('local-')) {
        try {
          await supabase.from("customization_options").delete().eq("id", confirm.optId);
        } catch (e) { console.error("DB delete option failed:", e); }
      }
      showToast("Option removed.");
    }
    setConfirm(null);
  }

  const handlePasswordConfirm = async (password) => {
    try {
      const { confirmDestructive } = await import("../utils/confirmDestructive");
      await confirmDestructive(password);
      if (pendingDeleteAction) {
        await pendingDeleteAction();
        setPendingDeleteAction(null);
      }
      setShowPwConfirm(false);
    } catch (err) {
      throw err;
    }
  };

  const drawerTitle = drawer ? (drawer.mode === "new-category" ? "New Category" : drawer.mode === "edit-category" ? "Edit Category" : drawer.mode === "new-option" ? "New Option" : "Edit Option") : "";
  const isCategory = drawer && (drawer.mode === "new-category" || drawer.mode === "edit-category");

  const fieldStyle = (hasErr) => ({
    width: "100%", padding: "10px 12px", borderRadius: "8px", fontSize: "14px",
    border: "1px solid " + (hasErr ? "#e11d48" : "rgba(26,26,26,0.15)"),
    outline: "none", boxSizing: "border-box", fontFamily: "var(--font-family-base)",
    transition: "border-color var(--dur-fast) var(--ease)",
  });
  const labelStyle = { display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: "6px" };
  const errStyle = { color: "#e11d48", fontSize: "12px", marginTop: "4px", display: "block" };
  const btnHover = (e, on) => { e.currentTarget.style.background = on ? "rgba(26,26,26,0.06)" : "transparent"; };
  const btnHoverDanger = (e, on) => { e.currentTarget.style.background = on ? "rgba(225,29,72,0.06)" : "transparent"; };

  return (
    <div className="page-container customization-mobile-page">
      <div className="page-header-row customization-page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
        <div className="page-title-group">
          <h2>Customization</h2>
          <p>Manage gift builder categories and options. Changes appear on the storefront immediately.</p>
        </div>
        <button className="customization-new-category" type="button" onClick={openNewCategory}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "10px", border: "none", background: "#1a1a1a", color: "#fff", fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer", flexShrink: 0, transition: "opacity var(--dur-fast) var(--ease)" }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.82"; }} onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          New Category
        </button>
      </div>

      <div className="customization-mobile-toolbar" style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "20px" }}>
        <div className="customization-search" style={{ position: "relative", flex: "1", minWidth: "200px", maxWidth: "320px" }}>
          <svg style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input className="customization-search-input" type="text" placeholder="Search options..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: "10px", border: "1px solid rgba(26,26,26,0.12)", fontSize: "13px", background: "rgba(255,255,255,0.8)", outline: "none", boxSizing: "border-box", fontFamily: "var(--font-family-base)" }} />
        </div>
        <div className="category-pills customization-category-filters" style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[{ id: "all", name: "All", count: categories.reduce((sum, c) => sum + c.options.length, 0) }, ...categories.map(c => ({ id: c.id, name: c.name, count: c.options.length, visible: c.visible }))].map(item => (
            <button key={item.id} type="button" className={`category-pill customization-filter-chip${filterCat === item.id ? " active" : ""}`} onClick={() => { setFilterCat(item.id); if (item.id !== "all") setExpandedCategoryId(item.id); }}
              style={{ padding: "6px 12px", borderRadius: "9999px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer", border: "1px solid", background: filterCat === item.id ? "#1a1a1a" : "transparent", color: filterCat === item.id ? "#fff" : "var(--text-muted)", borderColor: filterCat === item.id ? "#1a1a1a" : "rgba(26,26,26,0.15)", transition: "all var(--dur-fast) var(--ease)", opacity: item.visible === false ? 0.55 : 1 }}>
              {item.name} ({item.count})
            </button>
          ))}
        </div>
      </div>

      {loadState === "loading" && <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)", fontSize: "14px" }}>Loading customization options from database...</div>}
      {loadState === "error" && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ color: "#e11d48", fontWeight: 600, marginBottom: "8px" }}>Could not load customization data from database.</p>
          {errorDetails && <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px", fontFamily: "monospace" }}>{errorDetails}</p>}
          <button type="button" onClick={fetchCustomizationOptions} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid rgba(26,26,26,0.15)", background: "#1a1a1a", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Retry</button>
        </div>
      )}

      {loadState === "ready" && (
        <div className="customization-category-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {visibleCats.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)", fontSize: "14px" }}>
              {q ? "No options match your search." : "No categories found in database. Click New Category to get started."}
            </div>
          )}
          {visibleCats.map(cat => (
            <div key={cat.id} className="customization-category" data-expanded={expandedCategoryId === cat.id} style={{ background: "#f7f6f4", borderRadius: "16px", padding: "20px", border: "1px solid rgba(26,26,26,0.06)", opacity: cat.visible ? 1 : 0.7, transition: "opacity var(--dur-fast) var(--ease)" }}>
              <div className="category-section-header customization-category-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                <div className="customization-category-desktop-heading" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h3 className="customization-category-name" style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>{cat.name}</h3>
                  <span className="category-count customization-category-count" style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", background: "rgba(26,26,26,0.06)", padding: "2px 8px", borderRadius: "9999px" }}>{cat.options.length} option{cat.options.length !== 1 ? "s" : ""}</span>
                  {!cat.visible && <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#c9612e", background: "rgba(201,97,46,0.08)", padding: "2px 8px", borderRadius: "9999px" }}>Hidden</span>}
                </div>
                <button type="button" className="customization-category-heading" aria-expanded={expandedCategoryId === cat.id} onClick={() => setExpandedCategoryId(expandedCategoryId === cat.id ? null : cat.id)} style={{ alignItems: "center", gap: "10px", padding: 0, border: 0, background: "transparent", color: "inherit", font: "inherit", textAlign: "left", cursor: "pointer" }}>
                  <span className="customization-category-name" role="heading" aria-level="3" style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>{cat.name}</span>
                  <span className="category-count customization-category-count" style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", background: "rgba(26,26,26,0.06)", padding: "2px 8px", borderRadius: "9999px" }}>{cat.options.length} option{cat.options.length !== 1 ? "s" : ""}</span>
                </button>
                <div className="customization-collapsed-actions">
                  <ToggleSwitch id={"cat-mobile-vis-" + cat.id} checked={cat.visible} onChange={() => toggleCategoryVisible(cat.id)} label={`${cat.name} visibility`} />
                  <button type="button" aria-label={`${expandedCategoryId === cat.id ? "Collapse" : "Expand"} ${cat.name}`} aria-expanded={expandedCategoryId === cat.id} onClick={() => setExpandedCategoryId(expandedCategoryId === cat.id ? null : cat.id)} className="customization-category-chevron">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                  </button>
                </div>
                <div className="category-action-row customization-category-actions" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ToggleSwitch id={"cat-vis-" + cat.id} checked={cat.visible} onChange={() => toggleCategoryVisible(cat.id)} label={cat.visible ? "Visible" : "Hidden"} />
                  <button type="button" onClick={() => openNewOption(cat.id)} className="add-option-btn" style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(26,26,26,0.15)", background: "transparent", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "#1a1a1a", transition: "background var(--dur-fast) var(--ease)" }} onMouseEnter={e => btnHover(e, true)} onMouseLeave={e => btnHover(e, false)}>+ Add Option</button>
                  <button type="button" onClick={() => openEditCategory(cat)} title="Edit category" className="icon-action" style={{ padding: "6px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", transition: "background var(--dur-fast) var(--ease)" }} onMouseEnter={e => btnHover(e, true)} onMouseLeave={e => btnHover(e, false)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  </button>
                  <button type="button" onClick={() => requestDeleteCategory(cat)} title="Delete category" className="icon-action" style={{ padding: "6px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", color: "#e11d48", display: "flex", alignItems: "center", transition: "background var(--dur-fast) var(--ease)" }} onMouseEnter={e => btnHoverDanger(e, true)} onMouseLeave={e => btnHoverDanger(e, false)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                  </button>
                </div>
              </div>
              <div className="customization-category-content">
                {cat.options.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "13px", fontStyle: "italic" }}>No options yet. Click + Add Option above.</div>
                ) : (
                  <div className="customization-options-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "8px" }}>
                    {cat.options.map(opt => (
                      <div key={opt.id} className="option-row customization-option-row" style={{ background: opt.visible ? "#fff" : "rgba(26,26,26,0.03)", border: "1px solid rgba(26,26,26,0.08)", borderRadius: "10px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: opt.visible ? 1 : 0.6, transition: "opacity var(--dur-fast) var(--ease)" }}>
                        <div>
                          <div className="option-name" style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a" }}>{opt.name}</div>
                          <div className="option-price" style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>+ GHS {Number(opt.price).toLocaleString()}</div>
                        </div>
                        <div className="option-actions" style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                          <button type="button" onClick={() => toggleOptionVisible(cat.id, opt.id)} title={opt.visible ? "Hide" : "Show"} className="icon-action" style={{ padding: "4px", borderRadius: "6px", border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex", transition: "background var(--dur-fast) var(--ease)" }} onMouseEnter={e => btnHover(e, true)} onMouseLeave={e => btnHover(e, false)}>
                            {opt.visible
                              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            }
                          </button>
                          <button type="button" onClick={() => openEditOption(cat.id, opt)} title="Edit" className="icon-action" style={{ padding: "4px", borderRadius: "6px", border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex", transition: "background var(--dur-fast) var(--ease)" }} onMouseEnter={e => btnHover(e, true)} onMouseLeave={e => btnHover(e, false)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                          <button type="button" onClick={() => requestDeleteOption(cat.id, opt)} title="Delete" className="icon-action" style={{ padding: "4px", borderRadius: "6px", border: "none", background: "transparent", cursor: "pointer", color: "#e11d48", display: "flex", transition: "background var(--dur-fast) var(--ease)" }} onMouseEnter={e => btnHoverDanger(e, true)} onMouseLeave={e => btnHoverDanger(e, false)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer open={!!drawer} onClose={closeDrawer} title={drawerTitle}>
        {drawer && (
          <form id="customization-drawer-form" onSubmit={e => { e.preventDefault(); handleDrawerSave(); }} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {isCategory ? (
              <>
                <div>
                  <label style={labelStyle} htmlFor="d-cat-name">Category Name *</label>
                  <input id="d-cat-name" type="text" value={formData.name || ""} onChange={e => { setFormData(d => ({ ...d, name: e.target.value })); setFormErrors({}); }} placeholder="e.g. Add gifts" style={fieldStyle(formErrors.name)} />
                  {formErrors.name && <span style={errStyle}>{formErrors.name}</span>}
                </div>
                <div>
                  <label style={labelStyle}>Visibility</label>
                  <ToggleSwitch id="d-cat-visible" checked={formData.visible ?? true} onChange={e => setFormData(d => ({ ...d, visible: e.target.checked }))} label={formData.visible ? "Visible on storefront" : "Hidden from storefront"} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={labelStyle} htmlFor="d-opt-name">Option Name *</label>
                  <input id="d-opt-name" type="text" value={formData.name || ""} onChange={e => { setFormData(d => ({ ...d, name: e.target.value })); setFormErrors({}); }} placeholder="e.g. Silk Ribbon Wrapping" style={fieldStyle(formErrors.name)} />
                  {formErrors.name && <span style={errStyle}>{formErrors.name}</span>}
                </div>
                <div>
                  <label style={labelStyle} htmlFor="d-opt-price">Estimate Price (GHS) *</label>
                  <input id="d-opt-price" type="number" min="0" step="any" value={formData.price || ""} onChange={e => { setFormData(d => ({ ...d, price: e.target.value })); setFormErrors({}); }} placeholder="0.00" style={fieldStyle(formErrors.price)} />
                  {formErrors.price && <span style={errStyle}>{formErrors.price}</span>}
                </div>
                <div>
                  <label style={labelStyle}>Visibility</label>
                  <ToggleSwitch id="d-opt-visible" checked={formData.visible ?? true} onChange={e => setFormData(d => ({ ...d, visible: e.target.checked }))} label={formData.visible ? "Visible to customers" : "Hidden from customers"} />
                </div>
              </>
            )}
            <div style={{ display: "flex", gap: "10px", paddingTop: "8px" }}>
              <button type="submit" disabled={formSaving} style={{ flex: 1, padding: "10px 16px", borderRadius: "10px", border: "none", background: "#1a1a1a", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: formSaving ? "not-allowed" : "pointer", opacity: formSaving ? 0.65 : 1, transition: "opacity var(--dur-fast) var(--ease)" }}>{formSaving ? "Saving..." : "Save"}</button>
              <button type="button" onClick={closeDrawer} disabled={formSaving} style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid rgba(26,26,26,0.15)", background: "transparent", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            </div>
          </form>
        )}
      </Drawer>

      {confirm && (confirm.blocked ? (
        <ConfirmModal title={confirm.title} body={confirm.body} confirmLabel="OK" danger={false} onConfirm={() => setConfirm(null)} onCancel={() => setConfirm(null)} />
      ) : (
        <ConfirmModal title={confirm.title} body={confirm.body} confirmLabel="Delete" danger onConfirm={executeDelete} onCancel={() => setConfirm(null)} />
      ))}

      <PasswordConfirmModal
        isOpen={showPwConfirm}
        onClose={() => { setShowPwConfirm(false); setPendingDeleteAction(null); }}
        onConfirm={handlePasswordConfirm}
        title="Confirm Deletion"
      />
    </div>
  );
}
