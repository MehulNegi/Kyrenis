import React, { useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import { BookOpen, Search, AlertTriangle, Pill, Activity } from "lucide-react";

const QUICK = ["Ibuprofen", "Metformin", "Atorvastatin", "Amoxicillin", "Aspirin"];

export default function OpenFDADirectory() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);

  const run = async (q) => {
    const term = (q || query).trim();
    if (!term) return;
    setBusy(true);
    setResults([]);
    setSearched(true);
    try {
      const { data } = await api.get(`/consumer/openfda?q=${encodeURIComponent(term)}`);
      setResults(data.results);
      if (data.results.length === 0) toast.info("No OpenFDA labels found for that query.");
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail) || e.message);
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-6" data-testid="openfda-directory">
      <div className="k-panel p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen size={18} className="text-[#10B981]" />
          <h2 className="font-display text-white text-xl">OpenFDA Drug Safety Directory</h2>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
          className="flex gap-3 flex-wrap"
        >
          <div className="flex-1 min-w-[260px] flex items-center gap-2 border border-[#E2E8F0]/20 px-3 focus-within:border-[#10B981] transition-colors">
            <Search size={16} className="text-[#E2E8F0]/60" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by generic or brand medicine name (e.g. Ibuprofen)"
              data-testid="openfda-search-input"
              className="flex-1 py-3 bg-transparent text-white font-mono text-sm focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={busy || !query}
            data-testid="openfda-search-btn"
            className="px-5 bg-white text-[#1E2B4E] font-mono text-xs tracking-[0.28em] uppercase hover:bg-[#E2E8F0] active:scale-[0.98] transition-colors disabled:opacity-50"
          >
            {busy ? "Fetching…" : "Query FDA"}
          </button>
        </form>

        <div className="mt-4 flex gap-2 flex-wrap">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setQuery(q);
                run(q);
              }}
              data-testid={`openfda-quick-${q.toLowerCase()}`}
              className="border border-[#E2E8F0]/20 px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] uppercase text-[#E2E8F0]/70 hover:text-white hover:border-[#10B981] transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {busy && (
        <div className="k-panel p-6 text-center font-mono text-[10px] tracking-[0.3em] uppercase text-[#E2E8F0]/50">
          Fetching openFDA label data…
        </div>
      )}

      {!busy && results.map((r, i) => (
        <ResultCard key={i} r={r} idx={i} />
      ))}

      {!busy && searched && results.length === 0 && (
        <div className="k-panel p-8 text-center text-[#E2E8F0]/50" data-testid="openfda-empty">
          No results for "{query}".
        </div>
      )}
    </div>
  );
}

function ResultCard({ r, idx }) {
  return (
    <div className="k-panel p-6 md:p-8" data-testid={`openfda-result-${idx}`}>
      <div className="flex items-start justify-between flex-wrap gap-2 mb-6">
        <div>
          <p className="k-label">Result {idx + 1}</p>
          <h3 className="font-display text-white text-2xl mt-2 tracking-tight">
            {r.brand_name}
          </h3>
          <p className="text-[#E2E8F0]/60 text-sm mt-1">
            {r.generic_name || "—"} {r.manufacturer_name ? `· ${r.manufacturer_name}` : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Panel
          icon={<AlertTriangle size={16} className="text-[#EF4444]" />}
          title="Warnings"
          testid={`openfda-warnings-${idx}`}
          content={r.warnings}
        />
        <Panel
          icon={<Activity size={16} className="text-[#F59E0B]" />}
          title="Adverse Reactions"
          testid={`openfda-adverse-${idx}`}
          content={r.adverse_reactions}
        />
        <Panel
          icon={<Pill size={16} className="text-[#10B981]" />}
          title="Dosage & Administration"
          testid={`openfda-dosage-${idx}`}
          content={r.dosage_and_administration}
        />
      </div>
    </div>
  );
}

function Panel({ icon, title, content, testid }) {
  const text =
    Array.isArray(content) && content.length > 0
      ? content.join("\n\n")
      : "No data provided by OpenFDA for this section.";
  return (
    <div className="border border-[#E2E8F0]/15 p-4 flex flex-col" data-testid={testid}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white">{title}</p>
      </div>
      <div className="max-h-[280px] overflow-auto pr-1">
        <p className="text-[#E2E8F0]/80 text-xs leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}
