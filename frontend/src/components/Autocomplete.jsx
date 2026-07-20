import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X, Search } from "lucide-react";

/**
 * Kyrenis Autocomplete — searchable typeahead replacement for <select>.
 * Props:
 *   options       Array of items
 *   getLabel      (item) => string  — primary display label
 *   getSublabel   (item) => string  — optional secondary label
 *   getValue      (item) => string  — id/value
 *   value         string            — currently selected value id
 *   onChange      (item|null)       — invoked when user picks (or clears)
 *   placeholder   string
 *   disabled      boolean
 *   testid        string            — data-testid for the input
 *   maxResults    number            — default 8
 *   allowClear    boolean           — default true
 */
export default function Autocomplete({
  options = [],
  getLabel = (o) => String(o.label ?? o.name ?? ""),
  getSublabel = () => "",
  getValue = (o) => String(o.id ?? o.value ?? ""),
  value = "",
  onChange,
  placeholder = "Search…",
  disabled = false,
  testid,
  maxResults = 8,
  allowClear = true,
  filterFn,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef(null);

  // If controlled value is set, prefer showing its label; otherwise show query.
  const selected = useMemo(
    () => options.find((o) => getValue(o) === value) || null,
    [options, value, getValue]
  );
  const displayText = selected ? getLabel(selected) : query;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, maxResults);
    const fn =
      filterFn ||
      ((o) => {
        const l = (getLabel(o) || "").toLowerCase();
        const s = (getSublabel(o) || "").toLowerCase();
        return l.includes(q) || s.includes(q);
      });
    return options.filter(fn).slice(0, maxResults);
  }, [options, query, getLabel, getSublabel, filterFn, maxResults]);

  useEffect(() => {
    if (activeIdx >= filtered.length) setActiveIdx(0);
  }, [filtered, activeIdx]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const pick = (item) => {
    onChange?.(item);
    setQuery("");
    setOpen(false);
  };

  const onKey = (e) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIdx];
      if (item) pick(item);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div
      ref={wrapRef}
      className="relative"
      data-testid={testid ? `${testid}-wrap` : "autocomplete-wrap"}
    >
      <div
        className={`flex items-center gap-2 border px-3 transition-colors ${
          open ? "border-[#10B981]" : "border-[#E2E8F0]/20"
        } ${disabled ? "opacity-50" : ""}`}
        style={{ background: "#000" }}
      >
        <Search size={14} className="text-[#E2E8F0]/60 shrink-0" />
        <input
          data-testid={testid}
          disabled={disabled}
          value={selected && !open ? displayText : query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
            if (selected) onChange?.(null);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={selected ? getLabel(selected) : placeholder}
          className="flex-1 py-3 bg-transparent text-white text-sm focus:outline-none placeholder:text-[#E2E8F0]/40"
        />
        {selected && allowClear && !disabled && (
          <button
            type="button"
            onClick={() => {
              onChange?.(null);
              setQuery("");
            }}
            aria-label="Clear"
            data-testid={testid ? `${testid}-clear` : "autocomplete-clear"}
            className="text-[#E2E8F0]/60 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown
          size={14}
          className={`text-[#E2E8F0]/60 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>
      {open && !disabled && (
        <div
          className="absolute z-50 mt-1 w-full max-h-[280px] overflow-auto border border-[#E2E8F0]/20 shadow-2xl"
          style={{ background: "#1F2326" }}
          data-testid={testid ? `${testid}-options` : "autocomplete-options"}
        >
          {filtered.length === 0 && (
            <div className="px-4 py-3 text-[#E2E8F0]/50 text-sm">No matches for "{query}".</div>
          )}
          {filtered.map((item, i) => {
            const active = i === activeIdx;
            return (
              <button
                key={getValue(item) + "-" + i}
                type="button"
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => pick(item)}
                data-testid={testid ? `${testid}-option-${i}` : `autocomplete-option-${i}`}
                className={`w-full text-left px-4 py-2.5 flex flex-col ${
                  active ? "bg-[#1E2B4E] text-white" : "text-[#E2E8F0]/85 hover:bg-[#1E2B4E]/60"
                }`}
              >
                <span className="text-sm">{getLabel(item)}</span>
                {getSublabel(item) && (
                  <span className="text-xs text-[#E2E8F0]/50 mt-0.5">{getSublabel(item)}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
