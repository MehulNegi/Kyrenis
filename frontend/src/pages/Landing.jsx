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
    <div className="relative min-h-screen bg-white text-slate-600" data-testid="landing-page">
      <LandingBackground />
      {/* Header */}
      <header className="relative z-10 bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 md:px-10 py-5 ">
          <Link to="/" className="flex items-center gap-3 text-slate-900" data-testid="landing-home-link">
            <KyrenisLogo size={40} />
            <div className="flex flex-col">
              <span
                className="font-disp  lay font-bold text-[20px] leading-none"
                style={{ letterSpacing: "0.32em" }}
              >
                KYRENIS
              </span>
              <span className="text-[10px] text-slate-600 mt-1 tracking-[0.14em]">
                Regulatory Intelligence Platform
              </span>
            </div>
          </Link>
          <nav className="items-center hidden gap-8 text-sm md:flex text-slate-600">
            <Link to="/about" className="transition-colors hover:text-slate-900" data-testid="landing-nav-about">
              About
            </Link>
            <Link to="/patient" className="transition-colors hover:text-slate-900">
              Features
            </Link>
            <Link to="/contact" className="transition-colors hover:text-slate-900">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 gap-12 pt-16 pb-20 lg:grid-cols-2">
          <section>
            <span className="inline-block text-[11px] tracking-[0.2em] uppercase text-emerald-700 mb-5" data-testid="landing-eyebrow">
              CDSCO-Powered Regulatory Intelligence
            </span>
            <h1
              className="font-display font-bold text-slate-900 text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight max-w-2xl"
              data-testid="landing-headline"
            >
              India's regulatory intelligence platform for <span className="text-emerald-500"> medicine batch verification. </span>
            </h1>
            <p className="max-w-xl mt-6 text-base leading-relaxed text-slate-600 md:text-lg">
              Kyrenis aggregates the Central Drugs Standard Control Organisation's NSQ, Recall and
              Spurious Drug advisories into a single searchable repository, producing a transparent
              risk assessment for every medicine batch — for pharmacies, distributors and consumers.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-8">
              <Link to="/patient" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white transition-colors bg-emerald-700 hover:bg-emerald-800" data-testid="hero-verify-btn">
                <BadgeCheck size={16} /> Verify a Batch
              </Link>
              <Link to="/pharmacy/auth" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border border-emerald-700 text-emerald-700 hover:bg-emerald-50" data-testid="hero-pharmacy-btn">
                <Building2 size={16} /> For Pharmacies
              </Link>
            </div>
            <div className="flex items-center gap-2 mt-6 text-sm text-slate-500">
              <CheckCircle2 size={16} className="text-emerald-700" />
              <span className="text-xs tracking-wide">Trusted. Transparent. Always Updated.</span>
            </div>
          </section>
          <section className="relative items-center justify-center hidden lg:flex">
            <div className="relative w-full max-w-md">
              <div className="p-6 bg-white border shadow-sm border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-emerald-700" />
                  <span className="font-mono text-xs text-slate-500">Batch Verification</span>
                </div>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-slate-50">
                    <p className="mb-1 text-xs text-slate-500">Batch Number</p>
                    <p className="font-mono text-slate-900">CRO241001</p>
                  </div>
                  <div className="flex items-center gap-3 p-4 border rounded-lg bg-emerald-50 border-emerald-200">
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
        <section className="py-16 border-t border-slate-200">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <p className="text-4xl tracking-[0.2em] uppercase text-slate-900 font-medium">The Problem We Couldn't Ignore</p>
            </div>
            <div>
              <p className="text-base leading-relaxed text-slate-600">
                Consumer health trust in India's pharmaceutical supply chain faces a growing verification gap. Without accessible, real-time batch-level verification, patients and pharmacies cannot confidently confirm whether a medicine batch is safe, recalled, or spurious — leaving a dangerous gap between trust and safety.
              </p>
              <p className="mt-4 font-medium text-emerald-700">A lack of accessible verification creates a dangerous gap between trust and safety.</p>
            </div>
          </div>
        </section>

        {/* How Kyrenis Works */}
        <section className="py-16">
          <div className="mb-12 text-center">
            <p className="text-[11px] tracking-[0.2em] uppercase text-slate-900 font-medium mb-3">How It Works</p>
            <h2 className="text-3xl font-bold tracking-tight font-display text-slate-900 md:text-4xl">HOW KYRENIS WORKS</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="inline-flex items-center justify-center mb-4 border rounded-full w-14 h-14 border-slate-200 text-slate-900">
                <ScanLine size={24} />
              </div>
              <p className="text-xs tracking-[0.2em] uppercase text-slate-900 font-medium mb-2">1. Scan</p>
              <p className="text-sm text-slate-600">Capture the batch number from the medicine package or strip.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center mb-4 border rounded-full w-14 h-14 border-slate-200 text-slate-900">
                <ShieldCheck size={24} />
              </div>
              <p className="text-xs tracking-[0.2em] uppercase text-slate-900 font-medium mb-2">2. Verify</p>
              <p className="text-sm text-slate-600">Kyrenis verifies the batch against CDSCO databases, recall lists and safety alerts.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center mb-4 border rounded-full w-14 h-14 border-slate-200 text-slate-900">
                <BadgeCheck size={24} />
              </div>
              <p className="text-xs tracking-[0.2em] uppercase text-slate-900 font-medium mb-2">3. Trust</p>
              <p className="text-sm text-slate-600">Get instant authenticity status and risk assessment with regulatory insights.</p>
            </div>
          </div>
        </section>

        {/* Dual Portal Cards */}
        <section className="pb-20">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Link to="/pharmacy/auth" className="relative z-10 block p-8 transition-colors border border-emerald-200 bg-emerald-50 hover:border-emerald-300" data-testid="portal-pharmacy">
              <div className="flex items-start justify-between mb-6">
                <span className="text-[11px] tracking-[0.14em] text-emerald-700">FOR PHARMACIES</span>
                <Store size={22} className="text-emerald-700" />
              </div>
              <h3 className="mb-3 text-2xl font-bold font-display text-slate-900">Pharmacy Console</h3>
              <p className="mb-6 text-sm text-slate-600">Sign in to manage inventory, intake, POS billing with GST, replenishment governance, sales history and regulatory alerts.</p>
              <ul className="mb-6 space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 size={14} className="text-emerald-700" /> Inventory & Intake Management</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 size={14} className="text-emerald-700" /> POS Billing with GST</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 size={14} className="text-emerald-700" /> Regulatory Alerts & Compliance</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 size={14} className="text-emerald-700" /> Sales & Replenishment Insights</li>
              </ul>
              <button className="w-full py-3 text-sm font-medium text-white transition-colors bg-emerald-700 hover:bg-emerald-800" data-testid="portal-pharmacy-btn">Open Pharmacy Console →</button>
            </Link>
            <Link to="/patient" className="relative z-10 block p-8 transition-colors bg-white border border-slate-200 hover:border-slate-300" data-testid="portal-patient">
              <div className="flex items-start justify-between mb-6">
                <span className="text-[11px] tracking-[0.14em] text-slate-600">FOR CONSUMERS</span>
                <Globe size={22} className="text-slate-600" />
              </div>
              <h3 className="mb-3 text-2xl font-bold font-display text-slate-900">Batch Verification Portal</h3>
              <p className="mb-6 text-sm text-slate-600">No account required. Enter a batch number or scan your medicine strip to check whether the batch appears in CDSCO's regulatory record.</p>
              <ul className="mb-6 space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 size={14} className="text-slate-600" /> Instant Batch Verification</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 size={14} className="text-slate-600" /> Recall & Safety Alerts</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 size={14} className="text-slate-600" /> Genuine or Risk Indicator</li>
                <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 size={14} className="text-slate-600" /> Trusted Regulatory Source</li>
              </ul>
              <button className="w-full py-3 text-sm font-medium text-white transition-colors bg-slate-900 hover:bg-slate-800" data-testid="portal-patient-btn">Verify a Medicine →</button>
            </Link>
          </div>
        </section>

        {/* Metrics */}
        <section className="py-16 border-t border-slate-200">
          <div className="mb-10 text-center">
            <p className="text-[11px] tracking-[0.2em] uppercase text-slate-900 font-medium">Trusted Regulatory Intelligence</p>
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="text-center">
              <Database size={24} className="mx-auto mb-3 text-emerald-700" />
              <p className="text-xl font-bold font-display text-slate-900">50K+</p>
              <p className="mt-1 text-xs text-slate-500">Batches Verified Every Day</p>
            </div>
            <div className="text-center">
              <Bell size={24} className="mx-auto mb-3 text-emerald-700" />
              <p className="text-xl font-bold font-display text-slate-900">10K+</p>
              <p className="mt-1 text-xs text-slate-500">Regulatory Alerts Monitored</p>
            </div>
            <div className="text-center">
              <ShieldCheck size={24} className="mx-auto mb-3 text-emerald-700" />
              <p className="text-xl font-bold font-display text-slate-900">100%</p>
              <p className="mt-1 text-xs text-slate-500">CDSCO Data Driven</p>
            </div>
            <div className="text-center">
              <Users size={24} className="mx-auto mb-3 text-emerald-700" />
              <p className="text-xl font-bold font-display text-slate-900">Trusted</p>
              <p className="mt-1 text-xs text-slate-500">By Pharmacies & Consumers</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-slate-400 text-xs">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 flew-row">
              <KyrenisLogo size='40'/>
              <div className="text-3xl">Kyrenis</div>
            </div>
            <div>
              © {new Date().getFullYear()} Cypher
            </div>
            <div>
              CDSCO-Powered Regulatory Intelligence for Medicine Batch Verification
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <Link to="/about" className="transition-colors hover:text-black">
              About
            </Link>
            <Link to="/contact" className="transition-colors hover:text-black">
              Contact Us
            </Link>
            <Link to="/patient" className="transition-colors hover:text-black">
              Verify a Batch
            </Link>
            <a href="https://www.instagram.com/kyrenis.health/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-black">
              Instagram
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

