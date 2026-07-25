import React from "react";
import { Link } from "react-router-dom";
import KyrenisLogo from "@/components/KyrenisLogo";
import LandingBackground from "@/components/LandingBackground";
import {
  ScanLine,
  BadgeCheck,
  Building2,
  ShieldCheck,
  Globe,
  Database,
  Bell,
  Users,
  CheckCircle2,
  Store,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-600 relative" data-testid="landing-page">
      <LandingBackground />
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 md:px-10 py-5">
          <Link to="/" className="flex items-center gap-3 text-slate-900" data-testid="landing-home-link">
            <KyrenisLogo size={40} />
            <div className="flex flex-col">
              <span
                className="font-display font-bold text-[20px] leading-none"
                style={{ letterSpacing: "0.32em" }}
              >
                KYRENIS
              </span>
              <span className="text-[10px] text-slate-600 mt-1 tracking-[0.14em]">
                Regulatory Intelligence Platform
              </span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <Link to="/about" className="hover:text-slate-900 transition-colors" data-testid="landing-nav-about">
              About
            </Link>
            <Link to="/patient" className="hover:text-slate-900 transition-colors">
              Features
            </Link>
            <Link to="/patient" className="hover:text-slate-900 transition-colors">
              How It Works
            </Link>
            <Link to="/contact" className="hover:text-slate-900 transition-colors">
              Contact
            </Link>
          </nav>
          <Link to="/pharmacy/auth">
            <button className="bg-slate-900 text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors" data-testid="request-demo-btn">
              Request Demo
            </button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-16 pb-20">
          <section>
            <span className="inline-block text-[11px] tracking-[0.2em] uppercase text-emerald-700 mb-5" data-testid="landing-eyebrow">
              CDSCO-Powered Regulatory Intelligence
            </span>
            <h1
              className="font-display font-bold text-slate-900 text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight max-w-2xl"
              data-testid="landing-headline"
            >
              India's regulatory intelligence platform for medicine batch verification.
            </h1>
            <p className="mt-6 text-slate-600 text-base md:text-lg leading-relaxed max-w-xl">
              Kyrenis aggregates the Central Drugs Standard Control Organisation's NSQ, Recall and
              Spurious Drug advisories into a single searchable repository, producing a transparent
              risk assessment for every medicine batch — for pharmacies, distributors and consumers.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-8">
              <Link to="/patient" className="inline-flex items-center gap-2 bg-emerald-700 text-white px-6 py-3 text-sm font-medium hover:bg-emerald-800 transition-colors" data-testid="hero-verify-btn">
                <BadgeCheck size={16} /> Verify a Batch
              </Link>
              <Link to="/pharmacy/auth" className="inline-flex items-center gap-2 border border-emerald-700 text-emerald-700 px-6 py-3 text-sm font-medium hover:bg-emerald-50 transition-colors" data-testid="hero-pharmacy-btn">
                <Building2 size={16} /> For Pharmacies
              </Link>
            </div>
            <div className="flex items-center gap-2 mt-6 text-sm text-slate-500">
              <CheckCircle2 size={16} className="text-emerald-700" />
              <span className="text-xs tracking-wide">Trusted. Transparent. Always Updated.</span>
            </div>
          </section>
          <section className="hidden lg:flex items-center justify-center relative">
            <div className="relative w-full max-w-md">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-emerald-700" />
                  <span className="text-xs font-mono text-slate-500">Batch Verification</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">Batch Number</p>
                    <p className="font-mono text-slate-900">CRO241001</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
                    <ShieldCheck size={20} className="text-emerald-700" />
                    <div>
                      <p className="text-sm font-medium text-emerald-700">Low Risk</p>
                      <p className="text-xs text-emerald-700/80">No regulatory alert found</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Problem Statement */}
        <section className="border-t border-slate-200 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <p className="text-[11px] tracking-[0.2em] uppercase text-slate-900 font-medium">The Problem We Couldn't Ignore</p>
            </div>
            <div>
              <p className="text-slate-600 text-base leading-relaxed">
                Consumer health trust in India's pharmaceutical supply chain faces a growing verification gap. Without accessible, real-time batch-level verification, patients and pharmacies cannot confidently confirm whether a medicine batch is safe, recalled, or spurious — leaving a dangerous gap between trust and safety.
              </p>
              <p className="mt-4 text-emerald-700 font-medium">A lack of accessible verification creates a dangerous gap between trust and safety.</p>
            </div>
          </div>
        </section>

        {/* How Kyrenis Works */}
        <section className="py-16">
          <div className="text-center mb-12">
            <p className="text-[11px] tracking-[0.2em] uppercase text-slate-900 font-medium mb-3">How It Works</p>
            <h2 className="font-display font-bold text-slate-900 text-3xl md:text-4xl tracking-tight">HOW KYRENIS WORKS</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-slate-200 text-slate-900 mb-4">
                <ScanLine size={24} />
              </div>
              <p className="text-xs tracking-[0.2em] uppercase text-slate-900 font-medium mb-2">1. Scan</p>
              <p className="text-sm text-slate-600">Capture the batch number from the medicine package or strip.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-slate-200 text-slate-900 mb-4">
                <ShieldCheck size={24} />
              </div>
              <p className="text-xs tracking-[0.2em] uppercase text-slate-900 font-medium mb-2">2. Verify</p>
              <p className="text-sm text-slate-600">Kyrenis verifies the batch against CDSCO databases, recall lists and safety alerts.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-slate-200 text-slate-900 mb-4">
                <BadgeCheck size={24} />
              </div>
              <p className="text-xs tracking-[0.2em] uppercase text-slate-900 font-medium mb-2">3. Trust</p>
              <p className="text-sm text-slate-600">Get instant authenticity status and risk assessment with regulatory insights.</p>
            </div>
          </div>
        </section>

        {/* Dual Portal Cards */}
        <section className="pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/pharmacy/auth" className="block border border-emerald-200 bg-emerald-50/50 p-8 hover:border-emerald-300 transition-colors" data-testid="portal-pharmacy">
              <div className="flex items-start justify-between mb-6">
                <span className="text-[11px] tracking-[0.14em] text-emerald-700">FOR PHARMACIES</span>
                <Store size={22} className="text-emerald-700" />
              </div>
              <h3 className="font-display font-bold text-slate-900 text-2xl mb-3">Pharmacy Console</h3>
              <p className="text-sm text-slate-600 mb-6">Sign in to manage inventory, intake, POS billing with GST, replenishment governance, sales history and regulatory alerts.</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 size={14} className="text-emerald-700" /> Inventory & Intake Management</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 size={14} className="text-emerald-700" /> POS Billing with GST</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 size={14} className="text-emerald-700" /> Regulatory Alerts & Compliance</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 size={14} className="text-emerald-700" /> Sales & Replenishment Insights</li>
              </ul>
              <button className="w-full bg-emerald-700 text-white py-3 text-sm font-medium hover:bg-emerald-800 transition-colors" data-testid="portal-pharmacy-btn">Open Pharmacy Console →</button>
            </Link>
            <Link to="/patient" className="block border border-slate-200 bg-white p-8 hover:border-slate-300 transition-colors" data-testid="portal-patient">
              <div className="flex items-start justify-between mb-6">
                <span className="text-[11px] tracking-[0.14em] text-slate-600">FOR CONSUMERS</span>
                <Globe size={22} className="text-slate-600" />
              </div>
              <h3 className="font-display font-bold text-slate-900 text-2xl mb-3">Batch Verification Portal</h3>
              <p className="text-sm text-slate-600 mb-6">No account required. Enter a batch number or scan your medicine strip to check whether the batch appears in CDSCO's regulatory record.</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 size={14} className="text-slate-600" /> Instant Batch Verification</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 size={14} className="text-slate-600" /> Recall & Safety Alerts</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 size={14} className="text-slate-600" /> Genuine or Risk Indicator</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 size={14} className="text-slate-600" /> Trusted Regulatory Source</li>
              </ul>
              <button className="w-full bg-slate-900 text-white py-3 text-sm font-medium hover:bg-slate-800 transition-colors" data-testid="portal-patient-btn">Verify a Medicine →</button>
            </Link>
          </div>
        </section>

        {/* Metrics */}
        <section className="border-t border-slate-200 py-16">
          <div className="text-center mb-10">
            <p className="text-[11px] tracking-[0.2em] uppercase text-slate-900 font-medium">Trusted Regulatory Intelligence</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <Database size={24} className="text-emerald-700 mx-auto mb-3" />
              <p className="font-display font-bold text-slate-900 text-xl">50K+</p>
              <p className="text-xs text-slate-500 mt-1">Batches Verified Every Day</p>
            </div>
            <div className="text-center">
              <Bell size={24} className="text-emerald-700 mx-auto mb-3" />
              <p className="font-display font-bold text-slate-900 text-xl">10K+</p>
              <p className="text-xs text-slate-500 mt-1">Regulatory Alerts Monitored</p>
            </div>
            <div className="text-center">
              <ShieldCheck size={24} className="text-emerald-700 mx-auto mb-3" />
              <p className="font-display font-bold text-slate-900 text-xl">100%</p>
              <p className="text-xs text-slate-500 mt-1">CDSCO Data Driven</p>
            </div>
            <div className="text-center">
              <Users size={24} className="text-emerald-700 mx-auto mb-3" />
              <p className="font-display font-bold text-slate-900 text-xl">Trusted</p>
              <p className="text-xs text-slate-500 mt-1">By Pharmacies & Consumers</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-10 text-center text-slate-400 text-xs">
          <p>Building a safer, transparent and healthier India.</p>
        </div>
      </footer>
    </div>
  );
}

