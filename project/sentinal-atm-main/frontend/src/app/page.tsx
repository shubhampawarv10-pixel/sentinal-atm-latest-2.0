'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  LayoutDashboard, 
  AlertTriangle, 
  Radio, 
  Server, 
  Users, 
  FileText, 
  Bell, 
  Settings, 
  Search, 
  ChevronDown, 
  ExternalLink, 
  Send, 
  Lock, 
  MapPin, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreVertical,
  Activity,
  Play,
  Volume2,
  Building2
} from 'lucide-react';
import { InterceptForecastResponse } from '../lib/types';

export default function ProfessionalDashboard() {
  const [activeNav, setActiveNav] = useState<'dashboard' | 'threats' | 'scans' | 'assets' | 'reports'>('dashboard');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<boolean>(false);
  const [cfcfrmsFrozen, setCfcfrmsFrozen] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [selectedCase, setSelectedCase] = useState<string>('NCRP-DEL-8841');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const triggerAIVoiceBriefing = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const text = "National Cybercrime Intelligence Alert. High-velocity Digital Arrest fraud detected. Four lakh fifty thousand rupees routed to terminal Punjab National Bank account. Top predicted cashout location: State Bank of India e-Corner, Badarpur. Intercept window: eighteen minutes. Dispatch recommended.";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleDispatch = async () => {
    setIsDispatching(true);
    try {
      await fetch(`${API_BASE}/dispatch-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: 'NCRP-2026-DEL-8841',
          atm_id: 'ATM-SBI-BD01',
          police_station_name: 'PS Badarpur Cyber Cell',
          officer_callsign: 'PCR-COMMAND-09'
        })
      });
    } catch (e) {
      console.log('Dispatch triggered:', e);
    } finally {
      setIsDispatching(false);
      setDispatchSuccess(true);
    }
  };

  const handleFreeze = async () => {
    try {
      await fetch(`${API_BASE}/cfcfrms/freeze-terminal-mule/NCRP-2026-DEL-8841`, { method: 'POST' });
    } catch (e) {
      console.log('CFCFRMS freeze:', e);
    } finally {
      setCfcfrmsFrozen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex font-sans antialiased selection:bg-blue-600/30">
      
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col justify-between p-5 shrink-0 select-none">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-wide text-slate-100 flex items-center gap-1.5">
                Sentinel<span className="text-blue-500">ATM</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono">MHA // I4C National Platform</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button 
              onClick={() => setActiveNav('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === 'dashboard' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button 
              onClick={() => setActiveNav('threats')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === 'threats' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>1930 Active Threats</span>
              <span className="ml-auto px-1.5 py-0.5 text-[10px] rounded-full bg-red-500/20 text-red-400 font-mono font-bold">3</span>
            </button>

            <button 
              onClick={() => setActiveNav('scans')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === 'scans' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Geospatial Radar</span>
            </button>

            <button 
              onClick={() => setActiveNav('assets')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === 'assets' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>Mule Bank Nodes</span>
            </button>

            <button 
              onClick={() => setActiveNav('reports')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === 'reports' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Section 65B Reports</span>
            </button>

            <div className="pt-4 border-t border-slate-800/60 mt-4 space-y-1.5">
              <div className="text-[10px] font-mono text-slate-500 uppercase px-3.5 mb-2 font-bold tracking-wider">Administration</div>
              <button className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60">
                <Users className="w-4 h-4" />
                <span>Patrol Units (LEA)</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60">
                <Settings className="w-4 h-4" />
                <span>Switch Settings</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom Status Card */}
        <div className="bg-[#0e162b] border border-slate-800/90 rounded-2xl p-4 relative overflow-hidden">
          <div className="text-xs font-bold text-slate-200 mb-1">CFCFRMS Protection</div>
          <div className="text-[11px] text-emerald-400 font-mono font-semibold flex items-center gap-1 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Proactive Intercept Active
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto my-2">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="text-[10px] text-center text-slate-400 mt-2 font-mono">
            8,000+ Daily NCRP Incidents Analyzed
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header */}
        <header className="h-20 bg-[#0a0f1d]/80 backdrop-blur-xl border-b border-slate-800/80 px-8 flex items-center justify-between sticky top-0 z-40">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Welcome back, Cyber Crime Cell Officer 👋
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              NCRP & 1930 Incident Response Dashboard • Delhi NCR Central Jurisdiction
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search case ID, ATM, account..." 
                className="w-64 pl-10 pr-4 py-2 rounded-xl bg-[#0e162b] border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* AI Voice Briefing Button */}
            <button 
              onClick={triggerAIVoiceBriefing}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition-all ${
                isSpeaking 
                  ? 'bg-blue-600 border-blue-400 text-white animate-pulse' 
                  : 'bg-[#0e162b] border-slate-800 text-blue-400 hover:bg-slate-800'
              }`}
            >
              {isSpeaking ? <Volume2 className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="hidden sm:inline">{isSpeaking ? 'BRIEFING PLAYING...' : 'AI VOICE BRIEF'}</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button className="w-10 h-10 rounded-xl bg-[#0e162b] border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-colors">
                <Bell className="w-4 h-4" />
              </button>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[#0a0f1d] absolute top-2 right-2"></span>
            </div>

            {/* Officer Profile */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-sm text-white shadow-md">
                I4C
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-200">Investigator DT-09</div>
                <div className="text-[10px] text-slate-400 font-mono">Special Cyber Unit</div>
              </div>
            </div>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="p-8 space-y-7 max-w-[1600px] w-full mx-auto">

          {/* TOP 4 STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Card 1: Total Threats */}
            <div className="bg-[#0b1224] border border-slate-800/90 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <button className="text-slate-500 hover:text-slate-300">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider font-medium">Active High-Risk Complaints</div>
              <div className="text-3xl font-extrabold text-slate-100 font-mono mt-1">23</div>
              <div className="text-xs text-red-400 flex items-center gap-1 font-mono font-medium mt-2">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+12% from yesterday (1930 Surge)</span>
              </div>
            </div>

            {/* Card 2: Threats Blocked */}
            <div className="bg-[#0b1224] border border-slate-800/90 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <button className="text-slate-500 hover:text-slate-300">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider font-medium">Cashouts Intercepted</div>
              <div className="text-3xl font-extrabold text-slate-100 font-mono mt-1">142</div>
              <div className="text-xs text-emerald-400 flex items-center gap-1 font-mono font-medium mt-2">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+18% recovery rate via CFCFRMS</span>
              </div>
            </div>

            {/* Card 3: Systems Scanned */}
            <div className="bg-[#0b1224] border border-slate-800/90 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Activity className="w-5 h-5" />
                </div>
                <button className="text-slate-500 hover:text-slate-300">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider font-medium">Physical ATMs Scanned</div>
              <div className="text-3xl font-extrabold text-slate-100 font-mono mt-1">84</div>
              <div className="text-xs text-blue-400 flex items-center gap-1 font-mono font-medium mt-2">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+8% coverage across Delhi NCR</span>
              </div>
            </div>

            {/* Card 4: Active Alerts */}
            <div className="bg-[#0b1224] border border-slate-800/90 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Bell className="w-5 h-5" />
                </div>
                <button className="text-slate-500 hover:text-slate-300">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider font-medium">Avg. Intercept Countdown</div>
              <div className="text-3xl font-extrabold text-slate-100 font-mono mt-1">18m</div>
              <div className="text-xs text-emerald-400 flex items-center gap-1 font-mono font-medium mt-2">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>-15% response time with Telegram</span>
              </div>
            </div>

          </div>

          {/* MIDDLE ROW: THREAT ACTIVITY LINE CHART & THREAT DISTRIBUTION DONUT CHART */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Threat Activity Smooth Spline Line Chart */}
            <div className="lg:col-span-2 bg-[#0b1224] border border-slate-800/90 rounded-2xl p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Cybercrime Threat Activity</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Complaints received vs. Proactive interventions over last 7 days</p>
                </div>
                <div className="flex items-center gap-2 bg-[#080d1a] border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-300">
                  <span>Last 7 Days</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              {/* Pure SVG Spline Area Chart */}
              <div className="relative h-64 w-full flex items-end">
                <svg viewBox="0 0 700 240" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="0" y1="40" x2="700" y2="40" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="0.8" />
                  <line x1="0" y1="90" x2="700" y2="90" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="0.8" />
                  <line x1="0" y1="140" x2="700" y2="140" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="0.8" />
                  <line x1="0" y1="190" x2="700" y2="190" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="0.8" />

                  {/* Smooth Filled Gradient Area */}
                  <path 
                    d="M 20 140 Q 120 70, 220 170 T 420 80 T 580 120 T 680 70 L 680 220 L 20 220 Z" 
                    fill="url(#blueGradient)" 
                  />

                  {/* Smooth Blue Stroke Line */}
                  <path 
                    d="M 20 140 Q 120 70, 220 170 T 420 80 T 580 120 T 680 70" 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                  />

                  {/* Data Points */}
                  <circle cx="20" cy="140" r="4.5" fill="#3b82f6" stroke="#0b1224" strokeWidth="2.5" />
                  <circle cx="120" cy="90" r="4.5" fill="#3b82f6" stroke="#0b1224" strokeWidth="2.5" />
                  <circle cx="220" cy="170" r="4.5" fill="#3b82f6" stroke="#0b1224" strokeWidth="2.5" />
                  <circle cx="320" cy="65" r="5.5" fill="#60a5fa" stroke="#0b1224" strokeWidth="3" />
                  <circle cx="420" cy="130" r="4.5" fill="#3b82f6" stroke="#0b1224" strokeWidth="2.5" />
                  <circle cx="520" cy="85" r="4.5" fill="#3b82f6" stroke="#0b1224" strokeWidth="2.5" />
                  <circle cx="680" cy="70" r="5.5" fill="#60a5fa" stroke="#0b1224" strokeWidth="3" />
                </svg>
              </div>

              {/* X-Axis Labels */}
              <div className="flex justify-between text-[11px] font-mono text-slate-500 pt-3 border-t border-slate-800/80">
                <span>May 12</span>
                <span>May 13</span>
                <span>May 14</span>
                <span>May 15</span>
                <span>May 16</span>
                <span>May 17</span>
                <span>May 18</span>
              </div>
            </div>

            {/* Right 1 Col: Threat Distribution Donut Chart */}
            <div className="bg-[#0b1224] border border-slate-800/90 rounded-2xl p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-100">Fraud Category Share</h3>
                <span className="text-[10px] font-mono text-blue-400 font-bold">NCRP 1930</span>
              </div>

              {/* Donut Chart Representation */}
              <div className="relative flex items-center justify-center my-2">
                <svg width="180" height="180" viewBox="0 0 100 100" className="transform -rotate-90">
                  {/* Background Track */}
                  <circle cx="50" cy="50" r="38" stroke="#1e293b" strokeWidth="11" fill="none" />
                  {/* Slice 1: Digital Arrest (Red) 35% */}
                  <circle cx="50" cy="50" r="38" stroke="#ef4444" strokeWidth="11" fill="none" strokeDasharray="83.5 238.7" strokeDashoffset="0" />
                  {/* Slice 2: UPI Phishing (Orange) 25% */}
                  <circle cx="50" cy="50" r="38" stroke="#f97316" strokeWidth="11" fill="none" strokeDasharray="59.6 238.7" strokeDashoffset="-83.5" />
                  {/* Slice 3: Task Fraud (Blue) 20% */}
                  <circle cx="50" cy="50" r="38" stroke="#3b82f6" strokeWidth="11" fill="none" strokeDasharray="47.7 238.7" strokeDashoffset="-143.1" />
                  {/* Slice 4: Fake Trading (Purple) 10% */}
                  <circle cx="50" cy="50" r="38" stroke="#a855f7" strokeWidth="11" fill="none" strokeDasharray="23.8 238.7" strokeDashoffset="-190.8" />
                  {/* Slice 5: Others (Green) 10% */}
                  <circle cx="50" cy="50" r="38" stroke="#10b981" strokeWidth="11" fill="none" strokeDasharray="23.8 238.7" strokeDashoffset="-214.6" />
                </svg>

                {/* Center Counter */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-black font-mono text-slate-100">23</div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Total Active</div>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-1.5 pt-3 border-t border-slate-800/80 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Digital Arrest / CBI
                  </span>
                  <span className="font-mono font-bold text-slate-400">35%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> UPI QR Phishing
                  </span>
                  <span className="font-mono font-bold text-slate-400">25%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Telegram Task Fraud
                  </span>
                  <span className="font-mono font-bold text-slate-400">20%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Fake Trading Apps
                  </span>
                  <span className="font-mono font-bold text-slate-400">10%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Loan App Extortion
                  </span>
                  <span className="font-mono font-bold text-slate-400">10%</span>
                </div>
              </div>
            </div>

          </div>

          {/* BOTTOM ROW: RECENT THREATS TABLE & SYSTEM SECURITY STATUS CARD */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Recent Threats & Predicted Target ATMs Table */}
            <div className="lg:col-span-2 bg-[#0b1224] border border-slate-800/90 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Recent 1930 Cybercrime Complaints</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Real-time multi-hop mule trail & forecasted ATM targets</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleFreeze}
                    disabled={cfcfrmsFrozen}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                      cfcfrmsFrozen 
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300' 
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 inline mr-1" />
                    <span>{cfcfrmsFrozen ? 'CFCFRMS FROZEN' : 'BLOCK CFCFRMS'}</span>
                  </button>

                  <button 
                    onClick={handleDispatch}
                    disabled={isDispatching || dispatchSuccess}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold text-white shadow-md transition-all ${
                      dispatchSuccess 
                        ? 'bg-emerald-600' 
                        : 'bg-red-600 hover:bg-red-500 animate-pulse'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5 inline mr-1" />
                    <span>{dispatchSuccess ? 'DISPATCHED (TELEGRAM)' : 'DISPATCH PATROL (P1)'}</span>
                  </button>
                </div>
              </div>

              {/* Threats Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800 text-[11px] uppercase">
                      <th className="pb-3 font-semibold">Incident / Case</th>
                      <th className="pb-3 font-semibold">Fraud Type</th>
                      <th className="pb-3 font-semibold">Risk Level</th>
                      <th className="pb-3 font-semibold">Target ATM (Forecast)</th>
                      <th className="pb-3 font-semibold">Stolen (INR)</th>
                      <th className="pb-3 font-semibold">ETA Window</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    
                    {/* Row 1: High Priority Digital Arrest */}
                    <tr className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3.5 font-bold text-slate-200 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        NCRP-DEL-8841
                      </td>
                      <td className="py-3.5 text-slate-300">Digital Arrest</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold">
                          CRITICAL
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-200">
                        <div className="font-semibold">SBI 24x7 e-Corner</div>
                        <div className="text-[10px] text-slate-400">Mathura Rd, Badarpur (0.65 km)</div>
                      </td>
                      <td className="py-3.5 font-bold text-red-400">₹4,50,000</td>
                      <td className="py-3.5 text-slate-300">Next 18m</td>
                      <td className="py-3.5 text-right">
                        <a 
                          href="https://www.google.com/maps/dir/?api=1&destination=28.5034,77.3045" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                        >
                          <span>Route</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>

                    {/* Row 2: Phishing QR Code */}
                    <tr className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3.5 font-bold text-slate-200 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        NCRP-MUM-4190
                      </td>
                      <td className="py-3.5 text-slate-300">Telegram Task</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                          MEDIUM
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-200">
                        <div className="font-semibold">HDFC Recycler</div>
                        <div className="text-[10px] text-slate-400">Tughlakabad Ext (1.18 km)</div>
                      </td>
                      <td className="py-3.5 font-bold text-amber-400">₹1,85,000</td>
                      <td className="py-3.5 text-slate-300">Next 26m</td>
                      <td className="py-3.5 text-right">
                        <button className="text-slate-400 hover:text-slate-200">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>

                    {/* Row 3: Investment Fraud */}
                    <tr className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3.5 font-bold text-slate-200 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        NCRP-BLR-9022
                      </td>
                      <td className="py-3.5 text-slate-300">Fake Trading App</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                          HIGH
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-200">
                        <div className="font-semibold">BoB Micro-ATM</div>
                        <div className="text-[10px] text-slate-400">Badarpur Border (1.30 km)</div>
                      </td>
                      <td className="py-3.5 font-bold text-red-400">₹8,20,000</td>
                      <td className="py-3.5 text-slate-300">Next 35m</td>
                      <td className="py-3.5 text-right">
                        <button className="text-slate-400 hover:text-slate-200">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>

                    {/* Row 4: Courier Phishing */}
                    <tr className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3.5 font-bold text-slate-200 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        NCRP-SUR-2810
                      </td>
                      <td className="py-3.5 text-slate-300">FedEx Parcel Scam</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          BLOCKED
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-200">
                        <div className="font-semibold">PNB e-Lobby</div>
                        <div className="text-[10px] text-slate-400">Sarita Vihar Hub (1.85 km)</div>
                      </td>
                      <td className="py-3.5 font-bold text-slate-400 line-through">₹3,10,000</td>
                      <td className="py-3.5 text-emerald-400 font-bold">Intercepted</td>
                      <td className="py-3.5 text-right">
                        <button className="text-slate-400 hover:text-slate-200">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 1 Col: System Security Status / Infrastructure Health */}
            <div className="bg-[#0b1224] border border-slate-800/90 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 mb-1">Infrastructure Health</h3>
                <p className="text-xs text-slate-400 font-mono mb-5">LEA network and banking switch status</p>
                
                <div className="space-y-4">
                  
                  {/* Item 1: NCRP Central Ingestion */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="flex items-center gap-2 text-slate-300 font-semibold">
                        <Server className="w-3.5 h-3.5 text-blue-400" /> NCRP 1930 Portal
                      </span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> 99.8% Online
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[99.8%]"></div>
                    </div>
                  </div>

                  {/* Item 2: CFCFRMS Banking Switch */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="flex items-center gap-2 text-slate-300 font-semibold">
                        <Building2 className="w-3.5 h-3.5 text-cyan-400" /> CFCFRMS Bank Switch
                      </span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> 96.5% Connected
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[96.5%]"></div>
                    </div>
                  </div>

                  {/* Item 3: Police Beat Patrol Units */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="flex items-center gap-2 text-slate-300 font-semibold">
                        <Radio className="w-3.5 h-3.5 text-amber-400" /> Patrol Units (Telegram)
                      </span>
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> 4 Units Active
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 w-[78%]"></div>
                    </div>
                  </div>

                  {/* Item 4: OpenStreetMap Overpass GIS */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="flex items-center gap-2 text-slate-300 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" /> OpenStreetMap ATM Nodes
                      </span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> 100% Operational
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[100%]"></div>
                    </div>
                  </div>

                </div>
              </div>

              <div className="pt-5 border-t border-slate-800/80 mt-6">
                <button 
                  onClick={() => alert("All 14 banking switches and patrol units operational.")}
                  className="w-full py-2.5 rounded-xl bg-[#080d1a] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono font-semibold transition-colors"
                >
                  View Network Topology
                </button>
              </div>
            </div>

          </div>

        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 bg-[#0a0f1d] px-8 py-4 text-xs font-mono text-slate-500 flex items-center justify-between mt-auto">
          <div>MINISTRY OF HOME AFFAIRS (MHA) // INDIAN CYBER CRIME COORDINATION CENTRE (I4C)</div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>SIH26184 FRAMEWORK ONLINE</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
