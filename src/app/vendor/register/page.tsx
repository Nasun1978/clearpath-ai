"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { VendorType, VendorCertification } from "@/types";
import { VENDOR_TYPES, VENDOR_CERTIFICATIONS } from "@/types";

const STEPS = ["Company Info", "Certifications & Areas", "Bio & Portfolio"];

export default function VendorRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    website: "",
    vendor_type: "" as VendorType | "",
    license_number: "",
    certifications: [] as VendorCertification[],
    service_areas: [] as string[],
    serviceAreaInput: "",
    bio: "",
    portfolio_url: "",
    years_experience: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCert(cert: VendorCertification) {
    setForm((f) => ({
      ...f,
      certifications: f.certifications.includes(cert)
        ? f.certifications.filter((c) => c !== cert)
        : [...f.certifications, cert],
    }));
  }

  function addServiceArea() {
    const area = form.serviceAreaInput.trim();
    if (area && !form.service_areas.includes(area)) {
      setForm((f) => ({ ...f, service_areas: [...f.service_areas, area], serviceAreaInput: "" }));
    }
  }

  function removeServiceArea(area: string) {
    setForm((f) => ({ ...f, service_areas: f.service_areas.filter((a) => a !== area) }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/vendor/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.company_name.trim(),
          contact_name: form.contact_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          website: form.website.trim() || undefined,
          vendor_type: form.vendor_type,
          license_number: form.license_number.trim() || undefined,
          certifications: form.certifications,
          service_areas: form.service_areas,
          bio: form.bio.trim() || undefined,
          portfolio_url: form.portfolio_url.trim() || undefined,
          years_experience: form.years_experience ? parseInt(form.years_experience) : undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json() as { error: string }).error);
      router.push("/vendor/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  const canAdvance0 = form.company_name.trim() && form.contact_name.trim() && form.email.trim() && form.vendor_type;
  const canAdvance1 = true; // certifications and areas optional
  const canSubmit = canAdvance0 && form.bio.trim();

  return (
    <div className="min-h-screen bg-[#080E1A] text-white flex flex-col">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/marketplace" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← Back to Marketplace
          </Link>
          <span className="text-xs text-slate-500">{step + 1} of {STEPS.length}</span>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-2xl">
          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < step ? "bg-amber-600 text-white" :
                  i === step ? "bg-amber-900/60 text-amber-300 border border-amber-600" :
                  "bg-slate-800 text-slate-600"
                }`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={`text-xs ${i === step ? "text-amber-300 font-semibold" : "text-slate-600"}`}>{s}</span>
                {i < STEPS.length - 1 && <div className="w-8 h-px bg-slate-800 mx-1" />}
              </div>
            ))}
          </div>

          <div className="bg-[#0F1729] border border-slate-800 rounded-2xl p-8">
            {/* Step 0: Company Info */}
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white mb-6">Company Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Company Name *</label>
                    <input
                      type="text" value={form.company_name}
                      onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                      placeholder="e.g. Riverside Architecture Group"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Contact Name *</label>
                    <input
                      type="text" value={form.contact_name}
                      onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                      placeholder="Jane Smith"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Business Email *</label>
                    <input
                      type="email" value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="jane@company.com"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Phone</label>
                    <input
                      type="tel" value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="(713) 555-0100"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Website</label>
                    <input
                      type="url" value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      placeholder="https://yourcompany.com"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Vendor Type *</label>
                    <select
                      value={form.vendor_type}
                      onChange={(e) => setForm({ ...form, vendor_type: e.target.value as VendorType })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-600"
                    >
                      <option value="">Select your primary service…</option>
                      {VENDOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">License Number</label>
                    <input
                      type="text" value={form.license_number}
                      onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                      placeholder="State license # if applicable"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Years in Business</label>
                    <input
                      type="number" min="0" max="100" value={form.years_experience}
                      onChange={(e) => setForm({ ...form, years_experience: e.target.value })}
                      placeholder="e.g. 15"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setStep(1)}
                    disabled={!canAdvance0}
                    className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Certifications & Areas */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-white">Certifications &amp; Service Areas</h2>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Certifications <span className="text-slate-600 font-normal">(select all that apply)</span>
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    DBE, MBE, WBE, and Section 3 certifications are prominently displayed and highly valued on government-funded projects.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {VENDOR_CERTIFICATIONS.map((cert) => {
                      const selected = form.certifications.includes(cert);
                      return (
                        <button
                          key={cert}
                          type="button"
                          onClick={() => toggleCert(cert)}
                          className={`px-3 py-2 rounded-lg border text-sm font-bold transition-colors ${
                            selected
                              ? "bg-amber-900/40 border-amber-600/60 text-amber-200"
                              : "bg-slate-900 border-slate-700 text-slate-400 hover:border-amber-700/50"
                          }`}
                        >
                          {cert}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">Service Areas</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={form.serviceAreaInput}
                      onChange={(e) => setForm({ ...form, serviceAreaInput: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addServiceArea(); } }}
                      placeholder="e.g. Houston, TX"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600"
                    />
                    <button
                      type="button"
                      onClick={addServiceArea}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold border border-slate-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {form.service_areas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {form.service_areas.map((area) => (
                        <span key={area} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs">
                          {area}
                          <button
                            type="button"
                            onClick={() => removeServiceArea(area)}
                            className="text-slate-500 hover:text-red-400 transition-colors ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(0)}
                    className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Bio & Portfolio */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white">About Your Company</h2>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Company Bio *</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    rows={5}
                    placeholder="Describe your company's expertise, experience with affordable housing, notable projects, and why developers should work with you…"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Portfolio URL</label>
                  <input
                    type="url" value={form.portfolio_url}
                    onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
                    placeholder="https://yourcompany.com/portfolio"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">{error}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !canSubmit}
                    className="flex-1 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
                  >
                    {submitting ? "Creating profile…" : "Complete Registration"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
