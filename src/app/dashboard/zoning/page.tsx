"use client";
import { useState } from "react";
import Link from "next/link";

type CityKey = "new-orleans" | "baton-rouge" | "houston";

const CITIES: { value: CityKey; label: string; placeholder: string }[] = [
  { value: "new-orleans", label: "New Orleans, LA", placeholder: "e.g. 1340 Poydras St" },
  { value: "baton-rouge", label: "Baton Rouge, LA", placeholder: "e.g. 100 Lafayette St" },
  { value: "houston", label: "Houston, TX", placeholder: "e.g. 901 Bagby St" },
];

interface ZoningResponse {
  address: string;
  city: CityKey;
  geocode: { x: number; y: number; score: number };
  zoning: {
    classification: string;
    description: string;
    ordinanceNumber: string | number | null;
    year: string | number | null;
    hyperlink: string | null;
  };
  overlays: { name: string }[];
  futureLandUse: { designation: string }[];
  conditionalUse: { name: string }[];
  inclusionaryZoning: boolean;
  note: string | null;
}

export default function ZoningPage() {
  const [city, setCity] = useState<CityKey>("new-orleans");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ZoningResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentCity = CITIES.find((c) => c.value === city)!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const params = new URLSearchParams({ address, city });
      const res = await fetch(`/api/zoning?${params}`);
      const data = await res.json();
      if (res.ok) setResult(data as ZoningResponse);
      else setError(data.error as string);
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">
            Back
          </Link>
          <h1 className="text-lg font-bold">
            <span className="text-teal-400">Zoning</span> Lookup
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="mb-8 flex flex-col sm:flex-row gap-3">
          <select
            value={city}
            onChange={(e) => {
              setCity(e.target.value as CityKey);
              setResult(null);
              setError(null);
            }}
            className="sm:w-52 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500"
          >
            {CITIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={currentCity.placeholder}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl text-sm font-bold bg-teal-600 text-white disabled:opacity-50"
          >
            {loading ? "Loading..." : "Search"}
          </button>
        </form>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700/40 rounded-xl text-sm text-red-300">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold">{result.address}</h2>
              <span className="shrink-0 text-xs text-slate-500 pt-1">
                Score: {result.geocode.score}
              </span>
            </div>

            {result.note && (
              <div className="p-4 bg-amber-900/20 border border-amber-700/40 rounded-xl text-sm text-amber-300">
                {result.note}
              </div>
            )}

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <p className="text-xs text-slate-400 uppercase font-semibold">
                {result.city === "houston" ? "Land Use" : "Zoning"}
              </p>
              <p className="text-lg font-bold text-teal-400 mt-1">
                {result.zoning.classification}
              </p>
              <p className="text-sm text-white mt-2">{result.zoning.description}</p>
              <div className="flex flex-wrap gap-4 mt-3">
                {result.zoning.year && (
                  <p className="text-xs text-slate-500">Year: {result.zoning.year}</p>
                )}
                {result.zoning.ordinanceNumber && (
                  <p className="text-xs text-slate-500">
                    Ordinance: {result.zoning.ordinanceNumber}
                  </p>
                )}
                {result.zoning.hyperlink && (
                  <a
                    href={result.zoning.hyperlink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-teal-400 hover:underline"
                  >
                    View ordinance
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Overlays</p>
                {result.overlays.length > 0 ? (
                  result.overlays.map((o, i) => (
                    <p key={i} className="text-sm text-white">
                      {o.name}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">None</p>
                )}
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                <p className="text-xs text-slate-400 uppercase font-semibold mb-2">
                  Future Land Use
                </p>
                {result.futureLandUse.length > 0 ? (
                  result.futureLandUse.map((f, i) => (
                    <p key={i} className="text-sm text-white">
                      {f.designation}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No data</p>
                )}
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Special</p>
                {result.conditionalUse.length > 0 && (
                  <div className="mb-2">
                    {result.conditionalUse.map((c, i) => (
                      <p key={i} className="text-sm text-white">
                        {c.name}
                      </p>
                    ))}
                  </div>
                )}
                <p className="text-sm">
                  {result.inclusionaryZoning ? (
                    <span className="text-purple-300">Inclusionary zoning applies</span>
                  ) : (
                    <span className="text-slate-500">No inclusionary zoning</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {!result && !error && !loading && (
          <div className="text-center py-20">
            <h3 className="text-slate-400 mb-2">Enter an address to look up zoning</h3>
            <p className="text-sm text-slate-600">
              Supported cities: New Orleans, Baton Rouge, Houston
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
