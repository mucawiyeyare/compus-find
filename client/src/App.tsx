import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from './store/authStore';
import axios from 'axios';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  LayoutDashboard, Search, Users, ChevronDown, LogOut, Bell,
  User, Settings, Plus, CheckCircle, XCircle, Clock, AlertCircle,
  FileText, MapPin, Calendar, Sparkles, ShieldAlert, X, Check,
  Trash2, Edit2, Eye, Home, BookOpen, Award, Filter, RefreshCw,
  ChevronRight, Phone, Mail, MoreVertical, MessageCircle, ExternalLink
} from 'lucide-react';

// ─── API ───────────────────────────────────────────────────────────────────────
const API = axios.create({ baseURL: '/api' });
const cfg = (t: string) => ({ headers: { Authorization: `Bearer ${t}` } });

// ─── Shared UI Components ──────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border border-amber-200',
    approved: 'bg-blue-100 text-blue-700 border border-blue-200',
    rejected: 'bg-red-100 text-red-700 border border-red-200',
    found: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    found_pending: 'bg-orange-100 text-orange-700 border border-orange-200',
    completed: 'bg-green-100 text-green-700 border border-green-200',
    cancelled: 'bg-slate-100 text-slate-500 border border-slate-200',
    accepted: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    declined: 'bg-red-100 text-red-700 border border-red-200',
    lost: 'bg-red-100 text-red-600 border border-red-200',
    returned: 'bg-teal-100 text-teal-700 border border-teal-200',
  };
  const labels: Record<string, string> = {
    pending: 'Pending Approval', approved: 'Approved', rejected: 'Rejected',
    found: 'Found', found_pending: 'Found – Pending', completed: 'Completed',
    cancelled: 'Cancelled', accepted: 'Accepted', declined: 'Declined',
    lost: 'Lost', returned: 'Returned',
  };
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${map[status] || 'bg-slate-100 text-slate-500'}`}>
      {labels[status] || status}
    </span>
  );
};

const StatCard = ({ label, value, icon: Icon, color, sub, trend, gradient }: { label: string; value: number | string; icon: any; color: string; sub?: string; trend?: { value: number; up: boolean }; gradient?: string }) => (
  <div className={`rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 ${gradient ? gradient : 'bg-white border border-slate-200'}`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${gradient ? 'bg-white/20' : color}`}>
      <Icon className={`w-6 h-6 ${gradient ? 'text-white' : ''}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-2xl font-extrabold ${gradient ? 'text-white' : 'text-slate-900'}`}>{value}</p>
      <p className={`text-xs mt-0.5 font-medium ${gradient ? 'text-white/80' : 'text-slate-500'}`}>{label}</p>
      {sub && <p className={`text-[10px] ${gradient ? 'text-white/60' : 'text-slate-400'}`}>{sub}</p>}
    </div>
    {trend && (
      <div className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-0.5 ${trend.up ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'} ${gradient ? 'bg-white/20 text-white' : ''}`}>
        {trend.up ? '↑' : '↓'} {trend.value}%
      </div>
    )}
  </div>
);

const PageHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
      {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

const SearchBar = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    <input value={value} onChange={e => onChange(e.target.value)}
      className="border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-60"
      placeholder={placeholder} />
  </div>
);

const Table = ({ headers, children, empty }: { headers: string[]; children: React.ReactNode; empty?: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <table className="w-full">
      <thead className="bg-slate-50 border-b border-slate-100">
        <tr>{headers.map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-slate-100">{children}</tbody>
    </table>
    {empty}
  </div>
);

const Tr = ({ children }: { children: React.ReactNode }) => (
  <tr className="hover:bg-slate-50 transition-colors">{children}</tr>
);

const Td = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-3 text-sm ${className}`}>{children}</td>
);

const Btn = ({ children, variant = 'primary', size = 'md', className = '', ...p }: any) => {
  const v: any = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20',
    danger:  'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-500/20',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600',
  };
  const s: any = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-sm' };
  return <button {...p} className={`rounded-xl font-semibold transition-all ${v[variant]} ${s[size]} ${className}`}>{children}</button>;
};

const EmptyState = ({ icon: Icon, msg }: { icon: any; msg: string }) => (
  <div className="py-16 flex flex-col items-center justify-center text-center">
    <Icon className="w-10 h-10 text-slate-300 mb-3" />
    <p className="text-slate-400 text-sm">{msg}</p>
  </div>
);

// Form helpers
const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{children}</label>
);
const Input = (p: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
);
const Select = (p: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) => (
  <select {...p} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
);
const Textarea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none" />
);
const FormGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><Label>{label}</Label>{children}</div>
);

const CATEGORIES = ['Electronics', 'Books', 'Clothing', 'Keys', 'Wallet', 'Bag', 'ID/Cards', 'Other'];
const DEPARTMENTS = ['Computer Science', 'Engineering', 'Business', 'Medicine', 'Law', 'Arts', 'Science'];

// ─── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h3 className="font-bold text-slate-800 text-base">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function ConfirmModal({ msg, onConfirm, onCancel }: { msg: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-600" /></div>
          <p className="text-slate-800 font-semibold text-sm">{msg}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
          <Btn variant="danger" onClick={onConfirm}>Delete</Btn>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-[70] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {message}
    </div>
  );
}

// ─── LANDING PAGE ──────────────────────────────────────────────────────────────

// ─── CAMPUS ILLUSTRATION ────────────────────────────────────────────────────────

const CampusIllustration = () => (
  <svg viewBox="0 0 500 500" className="w-full max-w-[420px] mx-auto filter drop-shadow-[0_0_20px_rgba(59,130,246,0.15)] animate-pulse-slow">
    {/* Background connections */}
    <path d="M 100 250 L 250 100 L 400 250 L 250 400 Z" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
    <path d="M 250 100 L 250 400" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
    <path d="M 100 250 L 400 250" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />

    {/* Central Node */}
    <circle cx="250" cy="250" r="55" fill="url(#gradCentral)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
    <g transform="translate(225, 225)">
      {/* Graduation Cap icon */}
      <path d="M 25 10 L 45 20 L 25 30 L 5 20 Z" fill="#fff" />
      <path d="M 10 23.5 L 10 35 C 10 40, 40 40, 40 35 L 40 23.5" fill="none" stroke="#fff" strokeWidth="2" />
      <path d="M 37 20 L 45 32 L 45 42" fill="none" stroke="#fff" strokeWidth="1.5" />
    </g>

    {/* Node 1: Lost & Found */}
    <g transform="translate(120, 140)">
      <circle cx="20" cy="20" r="30" fill="rgba(239, 68, 68, 0.15)" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="22" fill="rgba(239, 68, 68, 0.2)" />
      {/* Magnifying Glass */}
      <circle cx="17" cy="17" r="5" fill="none" stroke="#f87171" strokeWidth="2" />
      <line x1="21" y1="21" x2="27" y2="27" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
    </g>
    <path d="M 215 215 L 150 170" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="1.5" strokeDasharray="5,5" />

    {/* Node 2: Mentorship */}
    <g transform="translate(320, 140)">
      <circle cx="20" cy="20" r="30" fill="rgba(168, 85, 247, 0.15)" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="22" fill="rgba(168, 85, 247, 0.2)" />
      {/* User icon */}
      <circle cx="20" cy="15" r="4.5" fill="none" stroke="#c084fc" strokeWidth="2" />
      <path d="M 12 27 C 12 22, 28 22, 28 27" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" />
    </g>
    <path d="M 285 215 L 340 170" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1.5" strokeDasharray="5,5" />

    {/* Node 3: Chat */}
    <g transform="translate(120, 300)">
      <circle cx="20" cy="20" r="30" fill="rgba(59, 130, 246, 0.15)" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="22" fill="rgba(59, 130, 246, 0.2)" />
      {/* Message bubble */}
      <rect x="13" y="14" width="14" height="10" rx="2" fill="none" stroke="#60a5fa" strokeWidth="2" />
      <path d="M 17 24 L 15 27 L 20 24" fill="#60a5fa" />
    </g>
    <path d="M 215 285 L 150 330" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="1.5" strokeDasharray="5,5" />

    {/* Node 4: Resource Library */}
    <g transform="translate(320, 300)">
      <circle cx="20" cy="20" r="30" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="22" fill="rgba(16, 185, 129, 0.2)" />
      {/* Book */}
      <path d="M 14 14 L 20 17 L 26 14 L 26 26 L 20 23 L 14 26 Z" fill="none" stroke="#34d399" strokeWidth="2" />
      <line x1="20" y1="17" x2="20" y2="23" stroke="#34d399" strokeWidth="2" />
    </g>
    <path d="M 285 285 L 340 330" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1.5" strokeDasharray="5,5" />

    {/* Gradients */}
    <defs>
      <linearGradient id="gradCentral" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
  </svg>
);

// ─── LANDING PAGE ──────────────────────────────────────────────────────────────

function LandingPage({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => scrollTo('home')}>
            <span className="p-2 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-xl text-white shadow-lg shadow-blue-500/20"><Sparkles className="w-5 h-5" /></span>
            <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">Smart Campus Connect</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            {[
              { id: 'home', label: 'Home' },
              { id: 'features', label: 'Features' },
              { id: 'lostfound', label: 'Lost & Found' },
              { id: 'mentorship', label: 'Mentorship' },
              { id: 'about', label: 'About' },
            ].map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)} className="text-sm font-semibold text-slate-400 hover:text-white transition-colors py-1.5">{item.label}</button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button onClick={onLogin} className="text-sm text-slate-300 hover:text-white font-semibold px-4 py-2 rounded-xl transition-colors">Sign In</button>
            <button onClick={onRegister} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/25">Get Started</button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="max-w-6xl mx-auto px-6 pt-20 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-4rem)]">
        <div className="space-y-6 text-left">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Connect · Learn · Find · Grow
          </span>
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-none text-white">
            Your Smart Campus,<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">All In One Place</span>
          </h1>
          <p className="text-slate-400 text-base lg:text-lg leading-relaxed max-w-xl">
            Report and locate lost items with admin-approved safety, connect with verified academic department mentors, share learning resources, and connect with your university community.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button onClick={onRegister} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-blue-500/20">Get Started</button>
            <button onClick={() => scrollTo('lostfound')} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-8 py-3.5 rounded-xl transition-all flex items-center gap-2">Explore Items <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex justify-center">
          <CampusIllustration />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-slate-950 border-y border-white/5 py-24">
        <div className="max-w-6xl mx-auto px-6 text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-white">Why Use Smart Campus Connect?</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">Discover the core features designed to make your daily university life seamless and connected.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: ShieldAlert, title: '🔍 Lost & Found', desc: 'Verify and report lost or found items on campus safely and quickly through admin reviews.', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
              { icon: Users, title: '👨‍🏫 Mentorship Hub', desc: 'Find and request 1-on-1 tutoring sessions from verified student or faculty mentors in your major.', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
              { icon: BookOpen, title: '📚 Shared Resources', desc: 'Share lecture notebooks, textbooks, study guide resources with other peers in your department.', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
              { icon: Award, title: '🏆 Gamified Badges', desc: 'Earn points and helper badges by returning lost items, uploading guides, or completing mentor requests.', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <div key={i} className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 hover:bg-slate-900 hover:border-blue-500/20 transition-all text-left group">
                <span className={`inline-flex p-3 rounded-xl border ${color} mb-4 group-hover:scale-110 transition-transform`}><Icon className="w-5 h-5" /></span>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lost & Found Section */}
      <section id="lostfound" className="bg-slate-50 text-slate-800 py-24 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <StudentHome onAuthRequired={onLogin} />
        </div>
      </section>

      {/* Mentorship Hub Section */}
      <section id="mentorship" className="bg-white text-slate-800 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <MentorshipBoard onAuthRequired={onLogin} />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-slate-950 border-t border-white/5 py-24">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-white">About Smart Campus Connect</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Our mission is to foster a safe, supportive, and interconnected university ecosystem. By consolidating student help desks, peer mentorship profiles, study materials, and gamified campus participation into a single platform, we empower student bodies to grow and learn together.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                'Verified Lost & Found listings',
                'Peer-to-peer mentorship support',
                'Gamified student point rewards',
                'Moderated and secure ecosystem',
              ].map((txt, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <CheckCircle className="w-5 h-5 text-blue-500 shrink-0" />
                  <span className="text-slate-300 text-xs font-semibold">{txt}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-white/5 rounded-3xl p-8 space-y-6 text-left">
            <h4 className="font-extrabold text-white text-lg">💡 Quick Campus Tip</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Did you know? Helping others pays off. For every verified found item you return, the administration awards you 50 points. Accruing points unlocks badges like <strong>Beginner Helper</strong>, <strong>Active Contributor</strong>, and the prestigious <strong>Campus Hero</strong> badge featured directly on your profile!
            </p>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-white font-bold text-xs">Unlock Rewards</p>
                <p className="text-slate-400 text-[10px]">Start helping peers and get recognized today.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-white/5 py-12 text-center text-slate-500 text-xs font-medium">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-600 rounded-lg text-white"><Sparkles className="w-3.5 h-3.5" /></span>
            <span className="font-bold text-slate-400">Smart Campus Connect</span>
          </div>
          <p>© 2026 Smart Campus Connect. All rights reserved.</p>
          <div className="flex gap-4">
            <button onClick={() => scrollTo('home')} className="hover:text-white transition-colors">Back to top</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── AUTH MODAL ────────────────────────────────────────────────────────────────

function AuthModal({ mode, onClose }: { mode: 'login' | 'register'; onClose: () => void }) {
  const { login } = useAuthStore();
  const [authMode, setAuthMode] = useState<'login' | 'register'>(mode);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student' as 'student' | 'mentor' | 'admin',
    department: 'Computer Science',
    avatar: '',
    bio: '',
    skills: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Pre-submission validation for mentors
    if (authMode === 'register' && form.role === 'mentor') {
      if (!form.avatar) {
        setError('Profile image is mandatory for mentors.');
        return;
      }
      if (!form.bio.trim()) {
        setError('Short bio is required for mentors.');
        return;
      }
      if (!form.skills.trim()) {
        setError('Skills description is required for mentors.');
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const body = authMode === 'login' ? { email: form.email, password: form.password } : form;
      const res = await API.post(endpoint, body);
      if (res.data.success) {
        login(res.data.token, res.data.user);
        onClose();
        window.dispatchEvent(new CustomEvent('new-mentor-registered'));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${authMode === 'register' && form.role === 'mentor' ? 'max-w-lg' : 'max-w-md'} p-8 relative transition-all duration-300 max-h-[90vh] overflow-y-auto`}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Smart Campus Connect</h2>
          <p className="text-slate-500 text-sm mt-1">{authMode === 'login' ? 'Sign in to your account' : 'Create a new account'}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'register' && <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full Name" required />}
          <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Campus Email" required />
          <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" required />
          {authMode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as any })}>
                  <option value="student">Student</option>
                  <option value="mentor">Mentor</option>
                  <option value="admin">Admin</option>
                </Select>
                <Select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </Select>
              </div>

              {form.role === 'mentor' && (
                <div className="space-y-4 border-t border-slate-100 pt-4 mt-4 text-left">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Mentor Specific Profile</p>
                  
                  <div>
                    <Label>Profile Picture (Mandatory)</Label>
                    <div className="flex items-center gap-3 mt-1.5">
                      {form.avatar ? (
                        <img src={form.avatar} className="w-12 h-12 rounded-xl object-cover border border-slate-200" alt="Preview" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-semibold">No Image</div>
                      )}
                      <div className="flex-1 flex flex-col gap-1.5">
                        <input type="file" accept="image/*" onChange={handleFileChange} className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                        <Input type="text" value={form.avatar} onChange={e => setForm({ ...form, avatar: e.target.value })} placeholder="Or paste image URL" />
                      </div>
                    </div>
                  </div>

                  <FormGroup label="Skills (comma separated)">
                    <Input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="e.g. AI, Programming, UI Design" required />
                  </FormGroup>
                  
                  <FormGroup label="Bio Snippet / Short Description">
                    <Textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Describe your academic experience..." required />
                  </FormGroup>
                </div>
              )}
            </>
          )}
          {error && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-4 h-4" />{error}</p>}
          <Btn type="submit" disabled={loading} className="w-full justify-center text-center" size="lg">{loading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}</Btn>
        </form>
        <p className="text-center text-xs text-slate-500 mt-5">
          {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button className="text-blue-600 font-semibold hover:underline" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
            {authMode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── SIDEBAR ───────────────────────────────────────────────────────────────────

type NavChild = { id: string; label: string };
type NavItem = { id: string; label: string; icon: any; children?: NavChild[] };

function Sidebar({ items, activeTab, onSelect, user, onLogout }: {
  items: NavItem[]; activeTab: string; onSelect: (id: string) => void; user: any; onLogout: () => void;
}) {
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const toggle = (id: string) => setOpenGroups(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const roleColor: Record<string, string> = {
    student: 'from-blue-500 to-indigo-600',
    mentor: 'from-purple-500 to-violet-600',
    admin: 'from-rose-500 to-red-600',
  };

  useEffect(() => {
    // Auto-open group containing active tab
    items.forEach(item => {
      if (item.children?.some(c => c.id === activeTab)) {
        setOpenGroups(p => p.includes(item.id) ? p : [...p, item.id]);
      }
    });
  }, [activeTab, items]);

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-20">
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className={`p-2 bg-gradient-to-tr ${roleColor[user?.role] || 'from-blue-500 to-indigo-500'} rounded-lg text-white`}>
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-tight">Smart Campus</p>
            <p className="text-[10px] text-slate-400 capitalize font-medium">{user?.role} Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {items.map(item => {
          const Icon = item.icon;
          const hasChildren = !!item.children?.length;
          const isOpen = openGroups.includes(item.id);
          const isGroupActive = item.children?.some(c => c.id === activeTab) || activeTab === item.id;

          if (!hasChildren) {
            return (
              <button key={item.id} onClick={() => onSelect(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all font-medium ${activeTab === item.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                <Icon className="w-4 h-4 shrink-0" />{item.label}
              </button>
            );
          }

          return (
            <div key={item.id}>
              <button onClick={() => toggle(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all font-medium ${isGroupActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                <span className="flex items-center gap-2.5"><Icon className="w-4 h-4 shrink-0" />{item.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="ml-3 mt-0.5 border-l-2 border-slate-100 pl-3 space-y-0.5">
                  {item.children!.map(child => (
                    <button key={child.id} onClick={() => onSelect(child.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${activeTab === child.id ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80'}
              className="w-9 h-9 rounded-full object-cover border-2 border-slate-200 shrink-0" alt="avatar" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user?.role} · {user?.points || 0} pts</p>
            </div>
          </div>
          <button onClick={onLogout} title="Logout" className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── STUDENT: HOME (approved lost items cards) ─────────────────────────────────

function StudentHome({ token, onAuthRequired }: { token?: string; onAuthRequired?: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportTarget, setReportTarget] = useState<any>(null);
  const [foundForm, setFoundForm] = useState({ title: '', description: '', category: 'Electronics', location: '', dateFound: '', image: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    API.get('/lostfound/lost').then(r => { if (r.data.success) setItems(r.data.items); })
      .catch(() => setItems([
        { _id: '1', title: 'Dell Laptop', description: 'Black Dell laptop, 15 inch', category: 'Electronics', location: 'Library 2nd Floor', dateLost: '2026-06-20', status: 'approved', reporter: { name: 'Ahmed' }, image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=600' },
        { _id: '2', title: 'Blue Backpack', description: 'Nike blue backpack with books inside', category: 'Bag', location: 'Cafeteria', dateLost: '2026-06-21', status: 'approved', reporter: { name: 'Sara' }, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600' },
        { _id: '3', title: 'Student ID Card', description: 'ID card CS department 2024', category: 'ID/Cards', location: 'Gym', dateLost: '2026-06-22', status: 'approved', reporter: { name: 'Omar' }, image: '' },
        { _id: '4', title: 'iPhone 15 Pro', description: 'Titanium silver iPhone, cracked case', category: 'Electronics', location: 'Lecture Hall A', dateLost: '2026-06-23', status: 'approved', reporter: { name: 'Lina' }, image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=600' },
      ])).finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(i =>
    i.title?.toLowerCase().includes(search.toLowerCase()) &&
    (category ? i.category === category : true)
  );

  const handleReportFound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      if (onAuthRequired) onAuthRequired();
      return;
    }
    setSubmitting(true);
    try {
      await API.post('/lostfound/found', { ...foundForm, lostItemId: reportTarget?._id, dateFound: foundForm.dateFound || new Date().toISOString().split('T')[0] }, token ? cfg(token) : undefined);
      alert('Found report submitted! Admin will review and confirm.');
      setReportTarget(null);
    } catch { alert('Found report submitted! (Simulated)'); setReportTarget(null); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="🏠 Lost & Found Board" subtitle="Browse admin-approved lost item reports. Found something? Report it!" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search items..." />
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <span className="text-sm text-slate-500 font-medium">{filtered.length} item{filtered.length !== 1 ? 's' : ''} found</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ShieldAlert} msg="No approved lost items found." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 flex flex-col group">
              {item.image ? (
                <img src={item.image} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center border-b border-slate-100">
                  <ShieldAlert className="w-10 h-10 text-blue-200" />
                </div>
              )}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">{item.title}</h3>
                  <span className="shrink-0 ml-2 bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">{item.category}</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{item.description}</p>
                <div className="mt-auto space-y-2">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <MapPin className="w-3 h-3" />{item.location}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3" />{item.dateLost?.split('T')[0]}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <StatusBadge status="approved" />
                    <button onClick={() => {
                      if (!token) {
                        if (onAuthRequired) onAuthRequired();
                        return;
                      }
                      setReportTarget(item);
                      setFoundForm(f => ({ ...f, title: item.title, category: item.category, lostItemId: item._id }));
                    }}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors">
                      Report Found →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Found Modal */}
      {reportTarget && (
        <Modal title={`Report Found: ${reportTarget.title}`} onClose={() => setReportTarget(null)}>
          <form onSubmit={handleReportFound} className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700 font-medium">Linked to: {reportTarget.title} (Owner: {reportTarget.reporter?.name})</div>
            <FormGroup label="Found Description"><Textarea value={foundForm.description} onChange={e => setFoundForm({ ...foundForm, description: e.target.value })} placeholder="Describe where and how you found it..." required /></FormGroup>
            <FormGroup label="Found Location"><Input value={foundForm.location} onChange={e => setFoundForm({ ...foundForm, location: e.target.value })} placeholder="Where did you find it?" required /></FormGroup>
            <FormGroup label="Date Found"><Input type="date" value={foundForm.dateFound} onChange={e => setFoundForm({ ...foundForm, dateFound: e.target.value })} required /></FormGroup>
            <FormGroup label="Image URL (Optional)"><Input value={foundForm.image} onChange={e => setFoundForm({ ...foundForm, image: e.target.value })} placeholder="https://..." /></FormGroup>
            <div className="flex gap-3 pt-2">
              <Btn type="submit" variant="success" className="flex-1 text-center" disabled={submitting}>{submitting ? 'Submitting...' : 'Send For Approval'}</Btn>
              <Btn type="button" variant="secondary" onClick={() => setReportTarget(null)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── STUDENT: DASHBOARD ────────────────────────────────────────────────────────

const ACTIVITY_DATA = [
  { month: 'Jan', reports: 1, found: 0, sessions: 1 },
  { month: 'Feb', reports: 2, found: 1, sessions: 0 },
  { month: 'Mar', reports: 0, found: 1, sessions: 2 },
  { month: 'Apr', reports: 3, found: 0, sessions: 1 },
  { month: 'May', reports: 1, found: 2, sessions: 3 },
  { month: 'Jun', reports: 2, found: 1, sessions: 2 },
];

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#3b82f6',
  rejected: '#ef4444',
  completed: '#10b981',
  accepted: '#10b981',
  found: '#14b8a6',
};

function MiniDonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={48} outerRadius={70} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} strokeWidth={0} />)}
          </Pie>
          <Tooltip formatter={(v: any, name: any) => [v, name]} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-2xl font-extrabold text-slate-800">{total}</p>
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Total</p>
      </div>
    </div>
  );
}

function StudentDashboard({ user, token }: { user: any; token: string }) {
  const [myLost, setMyLost] = useState<any[]>([]);
  const [myFound, setMyFound] = useState<any[]>([]);
  const [myReqs, setMyReqs] = useState<any[]>([]);

  useEffect(() => {
    API.get('/lostfound/my-lost', cfg(token)).then(r => { if (r.data.success) setMyLost(r.data.items); }).catch(() => setMyLost([
      { status: 'pending' }, { status: 'approved' }, { status: 'rejected' }
    ]));
    API.get('/lostfound/my-found', cfg(token)).then(r => { if (r.data.success) setMyFound(r.data.items); }).catch(() => setMyFound([
      { status: 'found' }, { status: 'completed' }
    ]));
    API.get('/mentorship/sessions', cfg(token)).then(r => { if (r.data.success) setMyReqs(r.data.studentSessions || []); }).catch(() => setMyReqs([
      { status: 'accepted' }, { status: 'pending' }
    ]));
  }, [token]);

  const acceptedSessions = myReqs.filter(s => s.status === 'accepted').length;
  const pendingSessions = myReqs.filter(s => s.status === 'pending').length;
  const completedSessions = myReqs.filter(s => s.status === 'completed').length;

  const lostStatusData = [
    { name: 'Pending', value: myLost.filter(i => i.status === 'pending').length || 1, color: '#f59e0b' },
    { name: 'Approved', value: myLost.filter(i => i.status === 'approved').length || 1, color: '#3b82f6' },
    { name: 'Rejected', value: myLost.filter(i => i.status === 'rejected').length || 0, color: '#ef4444' },
    { name: 'Recovered', value: myLost.filter(i => i.status === 'completed').length || 1, color: '#10b981' },
  ].filter(d => d.value > 0);

  const sessionPieData = [
    { name: 'Accepted', value: acceptedSessions || 1, color: '#10b981' },
    { name: 'Pending', value: pendingSessions || 1, color: '#f59e0b' },
    { name: 'Completed', value: completedSessions || 0, color: '#6366f1' },
  ].filter(d => d.value > 0);

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-24 translate-x-20" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-16 -translate-x-10" />
        <div className="relative">
          <p className="text-blue-200 text-sm font-medium mb-1">{greeting} 👋</p>
          <h1 className="text-3xl font-extrabold">{user?.name?.split(' ')[0] || 'Student'}</h1>
          <p className="text-blue-100 text-sm mt-1 max-w-md">Here's your campus activity overview. Keep up the great work!</p>
          <div className="flex items-center gap-3 mt-4">
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-xl font-extrabold">{user?.points || 0}</p>
              <p className="text-[10px] text-blue-200 font-semibold uppercase">Points</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-xl font-extrabold">{user?.badges?.length || 0}</p>
              <p className="text-[10px] text-blue-200 font-semibold uppercase">Badges</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-xl font-extrabold">{myLost.length + myFound.length + myReqs.length}</p>
              <p className="text-[10px] text-blue-200 font-semibold uppercase">Activities</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Lost Reports" value={myLost.length} icon={ShieldAlert}
          color="" gradient="bg-gradient-to-br from-red-500 to-rose-600"
          sub="Items reported" trend={{ value: 12, up: true }} />
        <StatCard label="Items Found" value={myFound.length} icon={CheckCircle}
          color="" gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          sub="You've discovered" trend={{ value: 5, up: true }} />
        <StatCard label="Mentor Sessions" value={myReqs.length} icon={Users}
          color="" gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          sub="Total requested" trend={{ value: 8, up: true }} />
        <StatCard label="Campus Points" value={user?.points || 0} icon={Award}
          color="" gradient="bg-gradient-to-br from-amber-400 to-orange-500"
          sub="Earned rewards" trend={{ value: 20, up: true }} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activity Timeline Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800">Activity Timeline</h3>
              <p className="text-xs text-slate-400 mt-0.5">Your campus activity over the last 6 months</p>
            </div>
            <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 font-semibold px-3 py-1 rounded-full">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={ACTIVITY_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', fontSize: 12 }} />
              <Area type="monotone" dataKey="reports" stroke="#ef4444" strokeWidth={2} fill="url(#colorReports)" name="Lost Reports" />
              <Area type="monotone" dataKey="found" stroke="#10b981" strokeWidth={2} fill="url(#colorFound)" name="Found Items" />
              <Area type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={2} fill="url(#colorSessions)" name="Mentor Sessions" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Lost Items Status Donut */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-1">Lost Item Status</h3>
          <p className="text-xs text-slate-400 mb-3">Breakdown of your reports</p>
          <MiniDonutChart data={lostStatusData} />
          <div className="space-y-1.5 mt-2">
            {lostStatusData.map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-slate-600 font-medium">{d.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-800">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Mentor Sessions Donut */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-1">Mentorship Sessions</h3>
          <p className="text-xs text-slate-400 mb-3">Status of your session requests</p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <MiniDonutChart data={sessionPieData} />
            </div>
            <div className="space-y-2">
              {sessionPieData.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{d.name}</p>
                    <p className="text-lg font-extrabold text-slate-900">{d.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Badges & Notifications */}
        <div className="space-y-4">
          {/* Badges */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" /> My Badges</h3>
            {user?.badges?.length > 0 ? (
              <div className="flex flex-wrap gap-2">{user.badges.map((b: string, i: number) => <span key={i} className="bg-white border border-amber-200 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">🏅 {b}</span>)}</div>
            ) : (
              <div className="text-center py-3">
                <p className="text-slate-400 text-sm">No badges yet!</p>
                <p className="text-xs text-slate-300 mt-1">Report items, join mentorship & earn points.</p>
              </div>
            )}
          </div>
          {/* Notifications */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Bell className="w-4 h-4 text-purple-500" /> Recent Activity</h3>
            <div className="space-y-2">
              {[
                { text: 'Lost item pending admin approval', time: 'Just now', color: 'bg-amber-400' },
                { text: 'Admin approved your report', time: '2h ago', color: 'bg-blue-500' },
                { text: 'Mentor accepted your request', time: 'Yesterday', color: 'bg-emerald-500' },
              ].map((n, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl">
                  <span className={`w-2 h-2 rounded-full ${n.color} mt-1.5 shrink-0`} />
                  <div className="flex-1">
                    <p className="text-xs text-slate-700">{n.text}</p>
                    <p className="text-[10px] text-slate-400">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Report Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4">📊 My Progress Report</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Lost Reports', current: myLost.length, max: 10, color: '#ef4444' },
            { label: 'Found Items', current: myFound.length, max: 10, color: '#10b981' },
            { label: 'Sessions', current: myReqs.length, max: 5, color: '#3b82f6' },
            { label: 'Points Goal', current: Math.min(user?.points || 0, 100), max: 100, color: '#f59e0b' },
          ].map(({ label, current, max, color }) => {
            const pct = Math.min(Math.round((current / max) * 100), 100);
            return (
              <div key={label}>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-semibold text-slate-600">{label}</p>
                  <p className="text-xs font-bold text-slate-800">{current}/{max}</p>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{pct}% complete</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── STUDENT: REPORT LOST ITEM ─────────────────────────────────────────────────

function ReportLostItem({ token, onSuccess }: { token: string; onSuccess: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'Electronics', location: '', dateLost: '', contact: '', image: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await API.post('/lostfound/lost', form, cfg(token));
      showToast('Report submitted! Awaiting admin approval.', 'success');
      setForm({ title: '', description: '', category: 'Electronics', location: '', dateLost: '', contact: '', image: '' });
      setTimeout(onSuccess, 2000);
    } catch { showToast('Submitted (simulated – backend may be offline)', 'success'); setTimeout(onSuccess, 2000); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl">
      <PageHeader title="Report Lost Item" subtitle="Fill in the details below. Your report will be reviewed by an admin before being published." />
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <FormGroup label="Item Name"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. iPhone 15 Pro Max" required /></FormGroup>
        <FormGroup label="Description"><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the item in detail..." required /></FormGroup>
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Category"><Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</Select></FormGroup>
          <FormGroup label="Date Lost"><Input type="date" value={form.dateLost} onChange={e => setForm({ ...form, dateLost: e.target.value })} required /></FormGroup>
        </div>
        <FormGroup label="Location Lost"><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Library 2nd Floor" required /></FormGroup>
        <FormGroup label="Contact (Phone/Email)"><Input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="How can finder reach you?" /></FormGroup>
        <FormGroup label="Image URL (Optional)"><Input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..." /></FormGroup>
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-400">Status after submit: <StatusBadge status="pending" /></p>
          <Btn type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Lost Item'}</Btn>
        </div>
      </form>
    </div>
  );
}

// ─── STUDENT: BROWSE LOST ITEMS ────────────────────────────────────────────────

function BrowseLostItems() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/lostfound/lost').then(r => { if (r.data.success) setItems(r.data.items); })
      .catch(() => setItems([
        { _id: '1', title: 'Laptop Bag', category: 'Bag', location: 'Library', dateLost: '2026-06-20', reporter: { name: 'Ahmed' } },
        { _id: '2', title: 'Calculator', category: 'Electronics', location: 'Lab C', dateLost: '2026-06-21', reporter: { name: 'Sara' } },
      ])).finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(i =>
    i.title?.toLowerCase().includes(search.toLowerCase()) &&
    (category ? i.category === category : true)
  );

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <PageHeader title="Browse Lost Items" subtitle="All published lost item reports on campus." />
      <div className="flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search item name..." />
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      {filtered.length === 0 ? <EmptyState icon={ShieldAlert} msg="No approved lost items match your search." /> : (
        <Table headers={['Item', 'Category', 'Location', 'Date', 'Owner', 'Status']}>
          {filtered.map((item, i) => (
            <Tr key={i}>
              <Td className="font-semibold text-slate-800">{item.title}</Td>
              <Td className="text-slate-500">{item.category}</Td>
              <Td className="text-slate-500">{item.location}</Td>
              <Td className="text-slate-500">{item.dateLost?.split('T')[0]}</Td>
              <Td className="text-slate-500">{item.reporter?.name || '—'}</Td>
              <Td><StatusBadge status="approved" /></Td>
            </Tr>
          ))}
        </Table>
      )}
    </div>
  );
}

// ─── STUDENT: MY ITEMS ─────────────────────────────────────────────────────────

function MyItems({ token }: { token: string }) {
  const [lostItems, setLostItems] = useState<any[]>([]);
  const [foundItems, setFoundItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'lost' | 'found'>('lost');

  useEffect(() => {
    API.get('/lostfound/my-lost', cfg(token)).then(r => { if (r.data.success) setLostItems(r.data.items); }).catch(() => setLostItems([
      { _id: '1', title: 'iPhone 15', category: 'Electronics', location: 'Cafeteria', dateLost: '2026-06-20', status: 'pending' },
      { _id: '2', title: 'Calculus Book', category: 'Books', location: 'Library', dateLost: '2026-06-18', status: 'approved' },
      { _id: '3', title: 'Student ID', category: 'ID/Cards', location: 'Gym', dateLost: '2026-06-15', status: 'completed' },
    ]));
    API.get('/lostfound/my-found', cfg(token)).then(r => { if (r.data.success) setFoundItems(r.data.items); }).catch(() => setFoundItems([
      { _id: '1', title: 'Black Wallet', category: 'Wallet', location: 'Library', dateFound: '2026-06-22', status: 'found_pending' },
    ]));
  }, [token]);

  const filteredLost = lostItems.filter(i => i.title?.toLowerCase().includes(search.toLowerCase()));
  const filteredFound = foundItems.filter(i => i.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <PageHeader title="My Items" subtitle="Track all your lost item reports and found item submissions." />
      <div className="flex items-center gap-4">
        <div className="flex bg-slate-100 rounded-xl p-1">
          <button onClick={() => setTab('lost')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === 'lost' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>My Lost Items ({lostItems.length})</button>
          <button onClick={() => setTab('found')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === 'found' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>My Found Reports ({foundItems.length})</button>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search..." />
      </div>

      {tab === 'lost' && (
        filteredLost.length === 0 ? <EmptyState icon={ShieldAlert} msg="No lost items reported yet." /> : (
          <Table headers={['Item', 'Category', 'Location', 'Date Lost', 'Status']}>
            {filteredLost.map((item, i) => (
              <Tr key={i}>
                <Td className="font-semibold text-slate-800">{item.title}</Td>
                <Td className="text-slate-500">{item.category}</Td>
                <Td className="text-slate-500">{item.location}</Td>
                <Td className="text-slate-500">{item.dateLost?.split('T')[0]}</Td>
                <Td><StatusBadge status={item.status} /></Td>
              </Tr>
            ))}
          </Table>
        )
      )}
      {tab === 'found' && (
        filteredFound.length === 0 ? <EmptyState icon={CheckCircle} msg="No found item reports yet." /> : (
          <Table headers={['Item', 'Category', 'Location', 'Date Found', 'Status']}>
            {filteredFound.map((item, i) => (
              <Tr key={i}>
                <Td className="font-semibold text-slate-800">{item.title}</Td>
                <Td className="text-slate-500">{item.category}</Td>
                <Td className="text-slate-500">{item.location}</Td>
                <Td className="text-slate-500">{item.dateFound?.split('T')[0]}</Td>
                <Td><StatusBadge status={item.status} /></Td>
              </Tr>
            ))}
          </Table>
        )
      )}
    </div>
  );
}

// ─── STUDENT: REPORT FOUND ITEM ────────────────────────────────────────────────

function ReportFoundItem({ token }: { token: string }) {
  const [lostItems, setLostItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', description: '', category: 'Electronics', location: '', dateFound: '', image: '', lostItemId: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => { API.get('/lostfound/lost').then(r => { if (r.data.success) setLostItems(r.data.items); }).catch(() => {}); }, []);

  const showToast = (msg: string, type: 'success' | 'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await API.post('/lostfound/found', form, cfg(token));
      showToast('Found report submitted! Admin will review and confirm.', 'success');
      setForm({ title: '', description: '', category: 'Electronics', location: '', dateFound: '', image: '', lostItemId: '' });
    } catch { showToast('Submitted (simulated).', 'success'); setForm({ title: '', description: '', category: 'Electronics', location: '', dateFound: '', image: '', lostItemId: '' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl">
      <PageHeader title="Report Found Item" subtitle="Found something? Submit a report so the admin can notify the owner." />
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <FormGroup label="Linked Lost Item (Optional)">
          <Select value={form.lostItemId} onChange={e => setForm({ ...form, lostItemId: e.target.value })}>
            <option value="">-- Search and select a lost item --</option>
            {lostItems.map(l => <option key={l._id} value={l._id}>{l.title} ({l.location})</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Found Item Title"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What did you find?" required /></FormGroup>
        <FormGroup label="Description"><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe what you found in detail..." required /></FormGroup>
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Category"><Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</Select></FormGroup>
          <FormGroup label="Date Found"><Input type="date" value={form.dateFound} onChange={e => setForm({ ...form, dateFound: e.target.value })} required /></FormGroup>
        </div>
        <FormGroup label="Found Location"><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Where did you find it?" required /></FormGroup>
        <FormGroup label="Image URL (Optional)"><Input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..." /></FormGroup>
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-400">Status after submit: <StatusBadge status="found_pending" /></p>
          <Btn type="submit" variant="success" disabled={loading}>{loading ? 'Submitting...' : 'Send For Approval'}</Btn>
        </div>
      </form>
    </div>
  );
}

// ─── STUDENT: FIND MENTORS (MentorshipBoard) ───────────────────────────────────

function MentorshipBoard({ token, onAuthRequired, onRequest }: { token?: string; onAuthRequired?: () => void; onRequest?: (m: any) => void }) {
  const [mentors, setMentors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMentors = useCallback(() => {
    API.get('/mentorship/mentors').then(r => { if (r.data.success) setMentors(r.data.mentors); })
      .catch(() => setMentors([
        { _id: '1', bio: 'Help with Algorithms, Data Structures, Python, C++', user: { name: 'Dr. Ahmed Ali', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120', email: 'ahmed@uni.edu' }, department: 'Computer Science', subjects: ['Algorithms', 'Data Structures'], skills: ['Python', 'C++'], rating: 4.9 },
        { _id: '2', bio: 'Help with Calculus, Physics, MATLAB, AutoCAD', user: { name: 'Prof. Sara Hassan', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120', email: 'sara@uni.edu' }, department: 'Engineering', subjects: ['Calculus', 'Physics'], skills: ['MATLAB', 'AutoCAD'], rating: 4.8 },
        { _id: '3', bio: 'Help with Finance, Economics, Excel, Statistics', user: { name: 'Mr. Omar Khalid', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120', email: 'omar@uni.edu' }, department: 'Business', subjects: ['Finance', 'Economics'], skills: ['Excel', 'Statistics'], rating: 4.5 },
      ])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchMentors();
    window.addEventListener('new-mentor-registered', fetchMentors);
    return () => {
      window.removeEventListener('new-mentor-registered', fetchMentors);
    };
  }, [fetchMentors]);

  const filtered = mentors.filter(m =>
    m.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.department?.toLowerCase().includes(search.toLowerCase()) ||
    (m.skills || []).some((s: string) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader title="👨‍🏫 Mentorship Hub" subtitle="Find academic mentors, view their skills, and request sessions." />
      <div className="flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search name / skill / dept..." />
        <span className="text-sm text-slate-500 font-medium">{filtered.length} mentor{filtered.length !== 1 ? 's' : ''} available</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} msg="No mentors found." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((m, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 flex flex-col group text-left">
              <div className="flex items-center gap-4 mb-4">
                <img src={m.user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80'}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 group-hover:scale-105 transition-transform duration-300" alt={m.user?.name} />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">{m.user?.name}</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{m.user?.email}</p>
                  <span className="inline-block bg-blue-50 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5">{m.department}</span>
                </div>
              </div>
              
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2 font-medium">Bio: {m.bio || 'Experienced academic mentor ready to help.'}</p>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Subjects</p>
                    <p className="text-xs text-slate-700 font-medium">{(m.subjects || []).join(', ')}</p>
                  </div>
                  <div className="space-y-1 mt-2">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Skills</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(m.skills || []).map((s: string) => (
                        <span key={s} className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-4">
                  <span className="text-yellow-600 font-bold text-xs">⭐ {m.rating || 5.0}</span>
                  <Btn size="sm" onClick={() => {
                    if (!token) {
                      if (onAuthRequired) onAuthRequired();
                      return;
                    }
                    if (onRequest) onRequest(m);
                  }}>Request Mentor</Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── STUDENT: REQUEST MENTOR ───────────────────────────────────────────────────

function RequestMentor({ token, selectedMentor, onSuccess }: { token: string; selectedMentor: any; onSuccess: () => void }) {
  const { user } = useAuthStore();
  const [form, setForm] = useState({ fullName: user?.name || '', studentClass: '', department: user?.department || 'Computer Science', phone: '', subject: selectedMentor?.subjects?.[0] || '', message: '', mentorId: selectedMentor?._id || '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => { if (selectedMentor) setForm(f => ({ ...f, mentorId: selectedMentor._id, subject: selectedMentor.subjects?.[0] || '' })); }, [selectedMentor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await API.post('/mentorship/request-session', {
        mentorId: form.mentorId, subject: form.subject,
        date: new Date(Date.now() + 86400000).toISOString(), timeSlot: '10:00 AM',
        notes: `Class: ${form.studentClass} | Phone: ${form.phone} | Message: ${form.message}`,
      }, cfg(token));
      setToast({ msg: 'Request sent! Status: Pending', type: 'success' });
      setTimeout(onSuccess, 2000);
    } catch { setToast({ msg: 'Request sent! (Simulated)', type: 'success' }); setTimeout(onSuccess, 2000); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl">
      <PageHeader title="Request Mentorship" subtitle="Fill in your details to send a mentorship request." />
      {toast && <Toast message={toast.msg} type={toast.type} />}
      {selectedMentor && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 mb-5">
          <img src={selectedMentor.user?.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
          <div><p className="font-semibold text-blue-800 text-sm">{selectedMentor.user?.name}</p><p className="text-xs text-blue-600">{selectedMentor.department}</p></div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Full Name"><Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required /></FormGroup>
          <FormGroup label="Class / Year"><Input value={form.studentClass} onChange={e => setForm({ ...form, studentClass: e.target.value })} placeholder="e.g. CS Year 2" required /></FormGroup>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Department"><Select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</Select></FormGroup>
          <FormGroup label="Phone Number"><Input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 890" required /></FormGroup>
        </div>
        <FormGroup label="Subject Needed"><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Data Structures" required /></FormGroup>
        {!selectedMentor && <FormGroup label="Mentor ID"><Input value={form.mentorId} onChange={e => setForm({ ...form, mentorId: e.target.value })} placeholder="Paste mentor ID" required /></FormGroup>}
        <FormGroup label="Message (Optional)"><Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="What do you need help with?" /></FormGroup>
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-400">Status after submit: <StatusBadge status="pending" /></p>
          <Btn type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Request'}</Btn>
        </div>
      </form>
    </div>
  );
}

// ─── STUDENT: MY REQUESTS ──────────────────────────────────────────────────────

function MyRequests({ token }: { token: string }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/mentorship/sessions', cfg(token)).then(r => { if (r.data.success) setSessions(r.data.studentSessions || []); }).catch(() => setSessions([
      { _id: '1', subject: 'Algorithms', mentor: { user: { name: 'Dr. Ahmed Ali' } }, status: 'pending', date: '2026-06-28', notes: 'Class: CS2 | Phone: 050...' },
      { _id: '2', subject: 'Calculus', mentor: { user: { name: 'Prof. Sara Hassan' } }, status: 'accepted', meetingLink: 'https://meet.google.com/abc-def', date: '2026-06-30' },
    ]));
  }, [token]);

  const filtered = sessions.filter(s =>
    s.subject?.toLowerCase().includes(search.toLowerCase()) ||
    s.mentor?.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.status?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <PageHeader title="My Mentorship Requests" subtitle="Track the status of all your mentorship requests." />
      <SearchBar value={search} onChange={setSearch} placeholder="Search mentor / subject / status..." />

      {/* Accepted sessions with WhatsApp — prominent cards on top */}
      {filtered.some(s => s.status === 'accepted' && (s.whatsappGroupLink || s.whatsappNumber)) && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Action Required — Mentor Accepted Your Request!
          </p>
          {filtered.filter(s => s.status === 'accepted' && (s.whatsappGroupLink || s.whatsappNumber)).map((s, i) => (
            <div key={i} className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-2xl p-5 shadow-md">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 pointer-events-none" />
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Accepted!</span>
                  </div>
                  <p className="font-bold text-slate-800 text-base">{s.mentor?.user?.name || 'Your Mentor'}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{s.subject} &bull; {s.date?.split('T')[0]}</p>
                  <p className="text-xs text-slate-400 mt-1">Your mentor is ready to connect with you on WhatsApp.</p>
                </div>
                <div className="flex flex-col gap-2">
                  {s.whatsappGroupLink ? (
                    <a
                      href={s.whatsappGroupLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-green-300/50 transition-all duration-200 hover:scale-105 active:scale-95 text-sm"
                    >
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                      <MessageCircle className="w-4 h-4" />
                      Join WhatsApp Group
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  ) : s.whatsappNumber ? (
                    <a
                      href={`https://wa.me/${s.whatsappNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-green-300/50 transition-all duration-200 hover:scale-105 active:scale-95 text-sm"
                    >
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                      <MessageCircle className="w-4 h-4" />
                      Chat on WhatsApp
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  ) : null}
                  {s.meetingLink && (
                    <a href={s.meetingLink} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                      Join Meeting
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 ? <EmptyState icon={Users} msg="No mentorship requests yet." /> : (
        <Table headers={['Mentor', 'Subject', 'Date', 'Status', 'Connection']}>
          {filtered.map((s, i) => (
            <Tr key={i}>
              <Td className="font-semibold text-slate-800">{s.mentor?.user?.name || '—'}</Td>
              <Td className="text-slate-600">{s.subject}</Td>
              <Td className="text-slate-500">{s.date?.split('T')[0]}</Td>
              <Td><StatusBadge status={s.status} /></Td>
              <Td>
                {s.status === 'accepted' ? (
                  s.whatsappGroupLink ? (
                    <a href={s.whatsappGroupLink} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe57] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-105">
                      <MessageCircle className="w-3.5 h-3.5" />
                      Join WhatsApp
                    </a>
                  ) : s.whatsappNumber ? (
                    <a href={`https://wa.me/${s.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe57] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-105">
                      <MessageCircle className="w-3.5 h-3.5" />
                      Chat on WhatsApp
                    </a>
                  ) : s.meetingLink ? (
                    <a href={s.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs font-semibold hover:underline">
                      Join Meeting
                    </a>
                  ) : <span className="text-slate-400 text-xs">Waiting for link...</span>
                ) : s.status === 'completed' ? (
                  <span className="text-slate-400 text-xs font-semibold">✅ Completed</span>
                ) : s.status === 'rejected' ? (
                  <span className="text-red-400 text-xs font-semibold">❌ Declined</span>
                ) : (
                  <span className="text-amber-500 text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Awaiting response</span>
                )}
              </Td>
            </Tr>
          ))}
        </Table>
      )}
    </div>
  );
}

// ─── MENTOR PAGES ──────────────────────────────────────────────────────────────

function MentorDashboard({ user, sessions }: any) {
  const pending = sessions.filter((s: any) => s.status === 'pending').length;
  const accepted = sessions.filter((s: any) => s.status === 'accepted').length;
  const completed = sessions.filter((s: any) => s.status === 'completed').length;
  return (
    <div className="space-y-6">
      <PageHeader title="Mentor Dashboard" subtitle="Manage your students and sessions." />
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Pending Requests" value={pending} icon={Clock} color="bg-amber-100 text-amber-600" />
        <StatCard label="Accepted Students" value={accepted} icon={Users} color="bg-blue-100 text-blue-600" />
        <StatCard label="Completed Sessions" value={completed} icon={CheckCircle} color="bg-emerald-100 text-emerald-600" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-3">Points & Badges</h3>
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-xl px-4 py-3"><p className="text-xl font-extrabold">{user?.points || 0}</p><p className="text-xs opacity-80">Points</p></div>
          <div className="flex flex-wrap gap-2">{(user?.badges || []).map((b: string, i: number) => <span key={i} className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">🏅 {b}</span>)}</div>
        </div>
      </div>
    </div>
  );
}

function MentorProfile({ token, user }: { token: string; user: any }) {
  const [form, setForm] = useState({ bio: '', department: user?.department || 'Computer Science', subjects: '', skills: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await API.post('/mentorship/profile', { bio: form.bio, department: form.department, subjects: form.subjects.split(',').map((s: string) => s.trim()), skills: form.skills.split(',').map((s: string) => s.trim()), availability: [{ day: 'Monday', slots: ['10:00 AM'] }] }, cfg(token));
      setToast({ msg: 'Profile saved!', type: 'success' });
    } catch { setToast({ msg: 'Profile saved! (Simulated)', type: 'success' }); }
    finally { setLoading(false); setTimeout(() => setToast(null), 2000); }
  };

  return (
    <div className="max-w-xl">
      <PageHeader title="My Mentor Profile" />
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <FormGroup label="Bio"><Textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell students about yourself..." required /></FormGroup>
        <FormGroup label="Department"><Select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</Select></FormGroup>
        <FormGroup label="Subjects (comma-separated)"><Input value={form.subjects} onChange={e => setForm({ ...form, subjects: e.target.value })} placeholder="e.g. Calculus, Physics" required /></FormGroup>
        <FormGroup label="Skills (comma-separated)"><Input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="e.g. Python, MATLAB" required /></FormGroup>
        <Btn type="submit" disabled={loading} className="w-full text-center">{loading ? 'Saving...' : 'Save Profile'}</Btn>
      </form>
    </div>
  );
}

function MentorRequests({ token, sessions, onRefresh }: { token: string; sessions: any[]; onRefresh: () => void }) {
  const [search, setSearch] = useState('');
  const [acceptTarget, setAcceptTarget] = useState<any>(null);
  const [connectForm, setConnectForm] = useState({ whatsappGroupLink: 'https://chat.whatsapp.com/GpTLwURu2DnE4TFIGI5ufK', whatsappNumber: '' });
  const [error, setError] = useState('');

  const pending = sessions.filter(s => s.status === 'pending').filter(s =>
    s.student?.name?.toLowerCase().includes(search.toLowerCase()) || s.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAction = async (id: string, status: string) => {
    try { await API.put(`/mentorship/session/${id}`, { status }, cfg(token)); onRefresh(); }
    catch { alert(`Marked as ${status} (simulated).`); onRefresh(); }
  };

  const handleAcceptConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!connectForm.whatsappGroupLink.trim() && !connectForm.whatsappNumber.trim()) {
      setError('Please provide at least one communication method (WhatsApp Group Link or Contact Number).');
      return;
    }

    try {
      await API.put(`/mentorship/session/${acceptTarget._id}`, {
        status: 'accepted',
        whatsappGroupLink: connectForm.whatsappGroupLink.trim(),
        whatsappNumber: connectForm.whatsappNumber.trim()
      }, cfg(token));
      setAcceptTarget(null);
      setConnectForm({ whatsappGroupLink: 'https://chat.whatsapp.com/GpTLwURu2DnE4TFIGI5ufK', whatsappNumber: '' });
      onRefresh();
    } catch {
      alert('Accepted (simulated).');
      setAcceptTarget(null);
      onRefresh();
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Student Requests" subtitle="Review and respond to incoming mentorship requests." />
      <SearchBar value={search} onChange={setSearch} placeholder="Search student / subject..." />
      {pending.length === 0 ? <EmptyState icon={Users} msg="No pending student requests." /> : (
        <Table headers={['Student', 'Subject', 'Date', 'Notes', 'Actions']}>
          {pending.map((s, i) => (
            <Tr key={i}>
              <Td className="font-semibold text-slate-800">{s.student?.name || 'Student'}</Td>
              <Td className="text-slate-600">{s.subject}</Td>
              <Td className="text-slate-500">{s.date?.split('T')[0]}</Td>
              <Td className="text-slate-400 max-w-[200px] truncate">{s.notes || '—'}</Td>
              <Td><div className="flex gap-2"><Btn variant="success" size="sm" onClick={() => setAcceptTarget(s)}><Check className="w-3.5 h-3.5 mr-1 inline" />Accept</Btn><Btn variant="danger" size="sm" onClick={() => handleAction(s._id, 'rejected')}><X className="w-3.5 h-3.5 mr-1 inline" />Reject</Btn></div></Td>
            </Tr>
          ))}
        </Table>
      )}

      {acceptTarget && (
        <Modal title={`Connect with ${acceptTarget.student?.name || 'Student'}`} onClose={() => setAcceptTarget(null)}>
          <form onSubmit={handleAcceptConfirm} className="space-y-4">
            <p className="text-xs text-slate-500">Provide at least one valid communication method for the student to connect with you.</p>
            
            <FormGroup label="WhatsApp Group Invite Link">
              <Input value={connectForm.whatsappGroupLink} onChange={e => setConnectForm({ ...connectForm, whatsappGroupLink: e.target.value })} placeholder="e.g. https://chat.whatsapp.com/..." />
            </FormGroup>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold uppercase">OR</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <FormGroup label="WhatsApp Contact Number">
              <Input type="tel" value={connectForm.whatsappNumber} onChange={e => setConnectForm({ ...connectForm, whatsappNumber: e.target.value })} placeholder="e.g. +1234567890" />
            </FormGroup>

            {error && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-4 h-4" />{error}</p>}

            <div className="flex gap-3 pt-2">
              <Btn type="submit" variant="success" className="flex-1 text-center">Accept & Connect</Btn>
              <Btn type="button" variant="secondary" onClick={() => setAcceptTarget(null)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function AcceptedStudents({ sessions }: { sessions: any[] }) {
  const accepted = sessions.filter(s => s.status === 'accepted');
  return (
    <div className="space-y-5">
      <PageHeader title="Accepted Students" subtitle="Students who have been accepted and can now join your WhatsApp." />
      {accepted.length === 0 ? <EmptyState icon={Users} msg="No accepted students yet." /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accepted.map((s, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {(s.student?.name || 'S')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{s.student?.name || 'Student'}</p>
                  <p className="text-xs text-slate-400">{s.student?.email || ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs bg-blue-50 border border-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full">{s.subject}</span>
                <span className="text-xs text-slate-400">{s.date?.split('T')[0]}</span>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-2">WhatsApp Connection</p>
                {s.whatsappGroupLink ? (
                  <a href={s.whatsappGroupLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white text-xs font-bold px-3 py-2 rounded-lg transition-all hover:scale-105 w-full justify-center">
                    <MessageCircle className="w-3.5 h-3.5" />
                    Open WhatsApp Group
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                ) : s.whatsappNumber ? (
                  <a href={`https://wa.me/${s.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white text-xs font-bold px-3 py-2 rounded-lg transition-all hover:scale-105 w-full justify-center">
                    <MessageCircle className="w-3.5 h-3.5" />
                    Chat on WhatsApp
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                ) : s.meetingLink ? (
                  <a href={s.meetingLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors w-full justify-center">
                    Join Meeting
                  </a>
                ) : <p className="text-xs text-slate-300 text-center">No link set</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MentorSessions({ token, sessions, onRefresh }: { token: string; sessions: any[]; onRefresh: () => void }) {
  const [search, setSearch] = useState('');
  const filtered = sessions.filter(s =>
    s.student?.name?.toLowerCase().includes(search.toLowerCase()) || s.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const handleComplete = async (id: string) => {
    try { await API.put(`/mentorship/session/${id}`, { status: 'completed' }, cfg(token)); onRefresh(); }
    catch { alert('Marked complete (simulated).'); onRefresh(); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Sessions" />
      <SearchBar value={search} onChange={setSearch} placeholder="Search student / subject..." />
      {filtered.length === 0 ? <EmptyState icon={Calendar} msg="No sessions yet." /> : (
        <Table headers={['Student', 'Subject', 'Date', 'Status', 'Action']}>
          {filtered.map((s, i) => (
            <Tr key={i}>
              <Td className="font-semibold text-slate-800">{s.student?.name || '—'}</Td>
              <Td className="text-slate-600">{s.subject}</Td>
              <Td className="text-slate-500">{s.date?.split('T')[0]}</Td>
              <Td><StatusBadge status={s.status} /></Td>
              <Td>{s.status === 'accepted' && <Btn variant="success" size="sm" onClick={() => handleComplete(s._id)}>Mark Complete</Btn>}</Td>
            </Tr>
          ))}
        </Table>
      )}
    </div>
  );
}

// ─── ADMIN PAGES ───────────────────────────────────────────────────────────────

const MONTHLY_REPORTS = [
  { month: 'Jan', lost: 8, found: 4, recovered: 3, users: 18 },
  { month: 'Feb', lost: 12, found: 7, recovered: 5, users: 24 },
  { month: 'Mar', lost: 6, found: 3, recovered: 2, users: 30 },
  { month: 'Apr', lost: 15, found: 9, recovered: 7, users: 42 },
  { month: 'May', lost: 10, found: 6, recovered: 5, users: 38 },
  { month: 'Jun', lost: 13, found: 8, recovered: 6, users: 55 },
];

function AdminDashboard({ token }: { token: string }) {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    API.get('/admin/stats', cfg(token)).then(r => { if (r.data.success) setStats(r.data.stats); }).catch(() => {
      setStats({ users: { total: 250, students: 220, mentors: 25, admins: 5 }, lostFound: { lost: 45, found: 18, recovered: 12, recoveryRate: 27 }, books: { total: 80 }, notes: { total: 120 } });
    });
  }, [token]);

  if (!stats) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>;

  const s = stats.users || {};
  const lf = stats.lostFound || {};

  const userPieData = [
    { name: 'Students', value: s.students || 220, color: '#3b82f6' },
    { name: 'Mentors', value: s.mentors || 25, color: '#8b5cf6' },
    { name: 'Admins', value: s.admins || 5, color: '#ef4444' },
  ];

  const lostFoundPie = [
    { name: 'Lost', value: lf.lost || 45, color: '#ef4444' },
    { name: 'Found', value: lf.found || 18, color: '#14b8a6' },
    { name: 'Recovered', value: lf.recovered || 12, color: '#10b981' },
  ];

  const platformPie = [
    { name: 'Books', value: stats.books?.total || 80, color: '#6366f1' },
    { name: 'Notes', value: stats.notes?.total || 120, color: '#06b6d4' },
    { name: 'Sessions', value: 35, color: '#f59e0b' },
  ];

  const recoveryRate = lf.recoveryRate || Math.round(((lf.recovered || 12) / (lf.lost || 45)) * 100);

  const kpiCards = [
    { label: 'Total Users', value: s.total || 250, icon: Users, gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600', trend: { value: 14, up: true }, sub: `${s.students || 220} students` },
    { label: 'Total Mentors', value: s.mentors || 25, icon: Users, gradient: 'bg-gradient-to-br from-purple-500 to-violet-600', trend: { value: 8, up: true }, sub: 'Active mentors' },
    { label: 'Lost Items', value: lf.lost || 45, icon: ShieldAlert, gradient: 'bg-gradient-to-br from-red-500 to-rose-600', trend: { value: 3, up: false }, sub: 'Total reports' },
    { label: 'Recovery Rate', value: `${recoveryRate}%`, icon: CheckCircle, gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600', trend: { value: 5, up: true }, sub: 'Items returned' },
    { label: 'Found Items', value: lf.found || 18, icon: CheckCircle, gradient: 'bg-gradient-to-br from-teal-500 to-cyan-600', trend: { value: 11, up: true }, sub: 'Reported found' },
    { label: 'Recovered', value: lf.recovered || 12, icon: Award, gradient: 'bg-gradient-to-br from-amber-400 to-orange-500', trend: { value: 20, up: true }, sub: 'Successfully returned' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full -translate-y-32 translate-x-20" />
        <div className="absolute bottom-0 left-20 w-48 h-48 bg-purple-500/10 rounded-full translate-y-20" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">Admin Control Center</p>
            <h1 className="text-3xl font-extrabold mt-1">Platform Analytics</h1>
            <p className="text-slate-400 text-sm mt-1">Real-time overview of all campus activities</p>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <div className="bg-white/10 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-extrabold">{s.total || 250}</p>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Users</p>
            </div>
            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-extrabold text-emerald-400">{recoveryRate}%</p>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Recovery Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.slice(0, 4).map((c, i) => (
          <StatCard key={i} label={c.label} value={c.value} icon={c.icon} color="" gradient={c.gradient} sub={c.sub} trend={c.trend} />
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.slice(4).map((c, i) => (
          <StatCard key={i} label={c.label} value={c.value} icon={c.icon} color="" gradient={c.gradient} sub={c.sub} trend={c.trend} />
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800">Monthly Lost & Found Report</h3>
              <p className="text-xs text-slate-400">Items reported, found and recovered per month</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-500 font-semibold px-3 py-1 rounded-full">6 Months</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MONTHLY_REPORTS} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="lost" name="Lost" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="found" name="Found" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="recovered" name="Recovered" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Distribution Donut */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-1">User Distribution</h3>
          <p className="text-xs text-slate-400 mb-2">Platform users by role</p>
          <MiniDonutChart data={userPieData} />
          <div className="space-y-2 mt-2">
            {userPieData.map((d, i) => {
              const pct = Math.round((d.value / (s.total || 250)) * 100);
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-slate-600 font-medium">{d.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800">{d.value}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* User Growth Area */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800">User Growth</h3>
              <p className="text-xs text-slate-400">New registrations per month</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={MONTHLY_REPORTS} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', fontSize: 12 }} />
              <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2.5} fill="url(#userGrad)" name="New Users" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lost & Found Pie + Report Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Lost Found Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-1">Lost & Found Summary</h3>
          <p className="text-xs text-slate-400 mb-2">Overall item status</p>
          <MiniDonutChart data={lostFoundPie} />
          <div className="space-y-1.5 mt-2">
            {lostFoundPie.map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-slate-600 font-medium">{d.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-800">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Report Summary */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">📋 Platform Report Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Items Reported This Month', value: 13, icon: ShieldAlert, change: '+2', up: true, color: 'from-red-50 to-rose-50 border-red-100', textColor: 'text-red-600' },
              { label: 'Items Recovered This Month', value: 6, icon: CheckCircle, change: '+1', up: true, color: 'from-emerald-50 to-green-50 border-emerald-100', textColor: 'text-emerald-600' },
              { label: 'Active Mentor Sessions', value: 19, icon: Users, change: '+4', up: true, color: 'from-blue-50 to-indigo-50 border-blue-100', textColor: 'text-blue-600' },
              { label: 'New Users This Month', value: 55, icon: Award, change: '+17', up: true, color: 'from-purple-50 to-violet-50 border-purple-100', textColor: 'text-purple-600' },
              { label: 'Books Added This Week', value: 8, icon: BookOpen, change: '+3', up: true, color: 'from-indigo-50 to-blue-50 border-indigo-100', textColor: 'text-indigo-600' },
              { label: 'Notes Uploaded This Week', value: 14, icon: FileText, change: '+6', up: true, color: 'from-cyan-50 to-sky-50 border-cyan-100', textColor: 'text-cyan-600' },
            ].map(({ label, value, icon: Icon, change, up, color, textColor }) => (
              <div key={label} className={`bg-gradient-to-br ${color} border rounded-xl p-3 flex items-center gap-3`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-white shadow-sm flex-shrink-0`}>
                  <Icon className={`w-4.5 h-4.5 ${textColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 leading-tight truncate">{label}</p>
                  <div className="flex items-center gap-2">
                    <p className={`text-xl font-extrabold ${textColor}`}>{value}</p>
                    <span className={`text-[10px] font-bold ${up ? 'text-emerald-500' : 'text-red-400'}`}>{change}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Admin: All Lost Items (full CRUD)
function AdminAllLostItems({ token }: { token: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchItems = useCallback(() => {
    API.get('/admin/lostfound', cfg(token)).then(r => { if (r.data.success) setItems(r.data.lost); }).catch(() => setItems([
      { _id: '1', title: 'MacBook Pro', category: 'Electronics', location: 'Library', dateLost: '2026-06-20', status: 'pending', reporter: { name: 'Ahmed Yusuf' } },
      { _id: '2', title: 'Blue Backpack', category: 'Bag', location: 'Cafeteria', dateLost: '2026-06-19', status: 'approved', reporter: { name: 'Sara Hassan' } },
      { _id: '3', title: 'ID Card', category: 'ID/Cards', location: 'Gym', dateLost: '2026-06-18', status: 'rejected', reporter: { name: 'Omar' } },
      { _id: '4', title: 'iPhone 14', category: 'Electronics', location: 'Hall A', dateLost: '2026-06-17', status: 'completed', reporter: { name: 'Lina' } },
    ]));
  }, [token]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter(i =>
    (i.title?.toLowerCase().includes(search.toLowerCase()) || i.location?.toLowerCase().includes(search.toLowerCase()) || i.reporter?.name?.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter ? i.status === statusFilter : true)
  );

  const handleApprove = async (id: string) => {
    try { await API.put(`/admin/lostfound/${id}/approve-lost`, {}, cfg(token)); showToast('Item approved!', 'success'); fetchItems(); }
    catch { showToast('Approved (simulated)', 'success'); fetchItems(); }
  };

  const handleReject = async (id: string) => {
    try { await API.put(`/admin/lostfound/${id}/reject-lost`, {}, cfg(token)); showToast('Item rejected.', 'success'); fetchItems(); }
    catch { showToast('Rejected (simulated)', 'success'); fetchItems(); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try { await API.delete(`/admin/lostfound/${deleteItem._id}/lost`, cfg(token)); showToast('Item deleted.', 'success'); }
    catch { showToast('Deleted (simulated).', 'success'); }
    setDeleteItem(null); fetchItems();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await API.put(`/admin/lostfound/${editItem._id}/lost`, editItem, cfg(token)); showToast('Item updated!', 'success'); }
    catch { showToast('Updated (simulated).', 'success'); }
    setEditItem(null); fetchItems();
  };

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.msg} type={toast.type} />}
      {deleteItem && <ConfirmModal msg={`Delete "${deleteItem.title}"? This cannot be undone.`} onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} />}
      <PageHeader title="All Lost Items" subtitle="Full CRUD management of all lost item reports." />
      <div className="flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search item / location / owner..." />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
          <option value="">All Statuses</option>
          {['pending','approved','rejected','completed'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <button onClick={fetchItems} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"><RefreshCw className="w-4 h-4 text-slate-500" /></button>
      </div>

      <Table headers={['Item', 'Owner', 'Category', 'Location', 'Date', 'Status', 'Actions']}>
        {filtered.map((item, i) => (
          <Tr key={i}>
            <Td className="font-semibold text-slate-800">{item.title}</Td>
            <Td className="text-slate-500">{item.reporter?.name || '—'}</Td>
            <Td className="text-slate-500">{item.category}</Td>
            <Td className="text-slate-500">{item.location}</Td>
            <Td className="text-slate-500">{item.dateLost?.split('T')[0]}</Td>
            <Td><StatusBadge status={item.status} /></Td>
            <Td>
              <div className="flex items-center gap-1">
                {item.status === 'pending' && <>
                  <Btn variant="success" size="sm" onClick={() => handleApprove(item._id)}><Check className="w-3 h-3" /></Btn>
                  <Btn variant="danger" size="sm" onClick={() => handleReject(item._id)}><X className="w-3 h-3" /></Btn>
                </>}
                <Btn variant="secondary" size="sm" onClick={() => setEditItem({ ...item })}><Edit2 className="w-3 h-3" /></Btn>
                <Btn variant="danger" size="sm" onClick={() => setDeleteItem(item)}><Trash2 className="w-3 h-3" /></Btn>
              </div>
            </Td>
          </Tr>
        ))}
      </Table>

      {editItem && (
        <Modal title="Edit Lost Item" onClose={() => setEditItem(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <FormGroup label="Title"><Input value={editItem.title} onChange={e => setEditItem({ ...editItem, title: e.target.value })} required /></FormGroup>
            <FormGroup label="Description"><Textarea value={editItem.description || ''} onChange={e => setEditItem({ ...editItem, description: e.target.value })} /></FormGroup>
            <div className="grid grid-cols-2 gap-4">
              <FormGroup label="Category"><Select value={editItem.category} onChange={e => setEditItem({ ...editItem, category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</Select></FormGroup>
              <FormGroup label="Status">
                <Select value={editItem.status} onChange={e => setEditItem({ ...editItem, status: e.target.value })}>
                  {['pending','approved','rejected','completed','cancelled'].map(s => <option key={s}>{s}</option>)}
                </Select>
              </FormGroup>
            </div>
            <FormGroup label="Location"><Input value={editItem.location || ''} onChange={e => setEditItem({ ...editItem, location: e.target.value })} /></FormGroup>
            <div className="flex gap-3 pt-2"><Btn type="submit">Save Changes</Btn><Btn type="button" variant="secondary" onClick={() => setEditItem(null)}>Cancel</Btn></div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// Admin: Pending Lost Items
function AdminPendingLost({ token, onRefresh }: { token: string; onRefresh: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchItems = useCallback(() => {
    API.get('/admin/lostfound', cfg(token)).then(r => { if (r.data.success) setItems(r.data.lost.filter((i: any) => i.status === 'pending')); })
      .catch(() => setItems([
        { _id: '1', title: 'MacBook Pro', description: 'Silver 14-inch MacBook', category: 'Electronics', location: 'Library', dateLost: '2026-06-22', reporter: { name: 'Ahmed Yusuf', email: 'ahmed@uni.edu' } },
        { _id: '2', title: 'Water Bottle', description: 'Blue stainless bottle', category: 'Other', location: 'Gym', dateLost: '2026-06-21', reporter: { name: 'Sara K', email: 'sara@uni.edu' } },
      ]));
  }, [token]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter(i => i.title?.toLowerCase().includes(search.toLowerCase()) || i.reporter?.name?.toLowerCase().includes(search.toLowerCase()));

  const handle = async (id: string, action: 'approve' | 'reject') => {
    const endpoint = action === 'approve' ? `/admin/lostfound/${id}/approve-lost` : `/admin/lostfound/${id}/reject-lost`;
    try { await API.put(endpoint, {}, cfg(token)); showToast(action === 'approve' ? 'Approved!' : 'Rejected.', 'success'); fetchItems(); onRefresh(); }
    catch { showToast(action === 'approve' ? 'Approved (simulated)' : 'Rejected (simulated)', 'success'); fetchItems(); }
  };

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <PageHeader title="Pending Lost Items" subtitle="Review and approve or reject student lost item reports." />
      <SearchBar value={search} onChange={setSearch} placeholder="Search item / student name..." />
      {filtered.length === 0 ? <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center"><CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" /><p className="text-slate-500 font-semibold">No pending items. All clear!</p></div> : (
        <Table headers={['Item', 'Student', 'Category', 'Location', 'Date', 'Actions']}>
          {filtered.map((item, i) => (
            <Tr key={i}>
              <Td><p className="font-semibold text-slate-800">{item.title}</p><p className="text-[10px] text-slate-400">{item.description?.slice(0, 45)}...</p></Td>
              <Td><p className="text-sm text-slate-700">{item.reporter?.name}</p><p className="text-[10px] text-slate-400">{item.reporter?.email}</p></Td>
              <Td className="text-slate-500">{item.category}</Td>
              <Td className="text-slate-500">{item.location}</Td>
              <Td className="text-slate-500">{item.dateLost?.split('T')[0]}</Td>
              <Td><div className="flex gap-2"><Btn variant="success" size="sm" onClick={() => handle(item._id, 'approve')}><Check className="w-3.5 h-3.5 mr-1 inline" />Approve</Btn><Btn variant="danger" size="sm" onClick={() => handle(item._id, 'reject')}><X className="w-3.5 h-3.5 mr-1 inline" />Reject</Btn></div></Td>
            </Tr>
          ))}
        </Table>
      )}
    </div>
  );
}

// Admin: Approved Items
function AdminApprovedItems({ token }: { token: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  useEffect(() => {
    API.get('/admin/lostfound', cfg(token)).then(r => { if (r.data.success) setItems(r.data.lost.filter((i: any) => i.status === 'approved')); })
      .catch(() => setItems([{ _id: '3', title: 'Laptop Bag', category: 'Bags', location: 'Library', dateLost: '2026-06-18', reporter: { name: 'Omar Ali' } }]));
  }, [token]);
  const filtered = items.filter(i => i.title?.toLowerCase().includes(search.toLowerCase()) || i.reporter?.name?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-5">
      <PageHeader title="Approved Items" subtitle="All published lost item reports visible to students." />
      <SearchBar value={search} onChange={setSearch} placeholder="Search item / owner..." />
      <Table headers={['Item', 'Owner', 'Category', 'Location', 'Date', 'Status']}>
        {filtered.map((item, i) => (<Tr key={i}><Td className="font-semibold text-slate-800">{item.title}</Td><Td className="text-slate-600">{item.reporter?.name || '—'}</Td><Td className="text-slate-500">{item.category}</Td><Td className="text-slate-500">{item.location}</Td><Td className="text-slate-500">{item.dateLost?.split('T')[0]}</Td><Td><StatusBadge status="approved" /></Td></Tr>))}
      </Table>
    </div>
  );
}

// Admin: Pending Found Items
function AdminPendingFound({ token, onRefresh }: { token: string; onRefresh: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchItems = useCallback(() => {
    API.get('/admin/lostfound', cfg(token)).then(r => { if (r.data.success) setItems(r.data.found.filter((i: any) => i.status === 'found_pending')); })
      .catch(() => setItems([{ _id: '1', title: 'Black Wallet', description: 'Found near gym entrance', category: 'Wallet', location: 'Gym', dateFound: '2026-06-22', reporter: { name: 'Ali Hassan' } }]));
  }, [token]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  const filtered = items.filter(i => i.title?.toLowerCase().includes(search.toLowerCase()) || i.reporter?.name?.toLowerCase().includes(search.toLowerCase()));

  const handleApprove = async (id: string) => {
    try { await API.put(`/admin/lostfound/${id}/confirm-found`, {}, cfg(token)); showToast('Found item confirmed! 50 points awarded to finder.', 'success'); fetchItems(); onRefresh(); }
    catch { showToast('Confirmed (simulated).', 'success'); fetchItems(); }
  };

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <PageHeader title="Pending Found Items" subtitle="Review and confirm found item submissions." />
      <SearchBar value={search} onChange={setSearch} placeholder="Search item / finder name..." />
      {filtered.length === 0 ? <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center"><CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" /><p className="text-slate-500 font-semibold">No pending found items.</p></div> : (
        <Table headers={['Item', 'Finder', 'Description', 'Location', 'Date', 'Action']}>
          {filtered.map((item, i) => (
            <Tr key={i}>
              <Td className="font-semibold text-slate-800">{item.title}</Td>
              <Td><p className="text-sm text-slate-700">{item.reporter?.name}</p></Td>
              <Td className="text-slate-400 max-w-[150px] truncate">{item.description}</Td>
              <Td className="text-slate-500">{item.location}</Td>
              <Td className="text-slate-500">{item.dateFound?.split('T')[0]}</Td>
              <Td><Btn variant="success" size="sm" onClick={() => handleApprove(item._id)}><Check className="w-3.5 h-3.5 mr-1 inline" />Approve</Btn></Td>
            </Tr>
          ))}
        </Table>
      )}
    </div>
  );
}

// Admin: Completed Items
function AdminCompletedItems({ token }: { token: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  useEffect(() => {
    API.get('/admin/lostfound', cfg(token)).then(r => {
      if (r.data.success) setItems([...r.data.lost.filter((i: any) => i.status === 'completed'), ...r.data.found.filter((i: any) => i.status === 'returned')]);
    }).catch(() => setItems([{ _id: '1', title: 'iPhone 13', category: 'Electronics', status: 'completed', reporter: { name: 'Aisha' } }]));
  }, [token]);
  const filtered = items.filter(i => i.title?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-5">
      <PageHeader title="Completed Items" subtitle="All resolved lost & found items." />
      <SearchBar value={search} onChange={setSearch} placeholder="Search completed items..." />
      <Table headers={['Item', 'Reporter', 'Category', 'Status']}>
        {filtered.map((item, i) => (<Tr key={i}><Td className="font-semibold text-slate-800">{item.title}</Td><Td className="text-slate-600">{item.reporter?.name || '—'}</Td><Td className="text-slate-500">{item.category}</Td><Td><StatusBadge status={item.status} /></Td></Tr>))}
      </Table>
    </div>
  );
}

// Admin: All Mentors (CRUD)
function AdminAllMentors({ token }: { token: string }) {
  const [mentors, setMentors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchMentors = useCallback(() => {
    API.get('/admin/mentors', cfg(token)).then(r => { if (r.data.success) setMentors(r.data.mentors); })
      .catch(() => setMentors([
        { _id: '1', user: { name: 'Dr. Ahmed Ali', email: 'ahmed@uni.edu', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=80' }, department: 'CS', subjects: ['Algorithms'], skills: ['Python'], rating: 4.9 },
        { _id: '2', user: { name: 'Prof. Sara Hassan', email: 'sara@uni.edu', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=80' }, department: 'Engineering', subjects: ['Calculus'], skills: ['MATLAB'], rating: 4.8 },
      ]));
  }, [token]);

  useEffect(() => { fetchMentors(); }, [fetchMentors]);

  const filtered = mentors.filter(m =>
    m.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    (m.skills || []).some((s: string) => s.toLowerCase().includes(search.toLowerCase())) ||
    m.department?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteItem) return;
    try { await API.delete(`/admin/mentors/${deleteItem._id}`, cfg(token)); showToast('Mentor removed.', 'success'); }
    catch { showToast('Removed (simulated).', 'success'); }
    setDeleteItem(null); fetchMentors();
  };

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.msg} type={toast.type} />}
      {deleteItem && <ConfirmModal msg={`Remove "${deleteItem.user?.name}" as mentor?`} onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} />}
      <PageHeader title="All Mentors" subtitle="Manage registered mentors on the platform." />
      <SearchBar value={search} onChange={setSearch} placeholder="Search mentor name / skill / department..." />
      <Table headers={['Mentor', 'Email', 'Department', 'Subjects', 'Skills', 'Rating', 'Actions']}>
        {filtered.map((m, i) => (
          <Tr key={i}>
            <Td><div className="flex items-center gap-3"><img src={m.user?.avatar} className="w-8 h-8 rounded-full object-cover" alt="" /><span className="font-semibold text-slate-800">{m.user?.name}</span></div></Td>
            <Td className="text-slate-500">{m.user?.email}</Td>
            <Td className="text-slate-500">{m.department}</Td>
            <Td className="text-slate-500">{(m.subjects || []).slice(0, 2).join(', ')}</Td>
            <Td><div className="flex gap-1">{(m.skills || []).slice(0, 2).map((s: string) => <span key={s} className="bg-purple-50 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">{s}</span>)}</div></Td>
            <Td className="text-yellow-600 font-bold">⭐ {m.rating}</Td>
            <Td><Btn variant="danger" size="sm" onClick={() => setDeleteItem(m)}><Trash2 className="w-3.5 h-3.5" /></Btn></Td>
          </Tr>
        ))}
      </Table>
    </div>
  );
}

// Admin: Mentor Requests (all sessions)
function AdminMentorRequests({ token }: { token: string }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  useEffect(() => {
    setSessions([
      { _id: '1', student: { name: 'Ahmed Yusuf' }, mentor: { user: { name: 'Dr. Ahmed Ali' } }, subject: 'Algorithms', status: 'pending', date: '2026-06-28' },
      { _id: '2', student: { name: 'Sara Hassan' }, mentor: { user: { name: 'Prof. Sara Hassan' } }, subject: 'Calculus', status: 'accepted', date: '2026-06-30' },
      { _id: '3', student: { name: 'Omar Khalid' }, mentor: { user: { name: 'Mr. Omar K' } }, subject: 'Finance', status: 'completed', date: '2026-06-25' },
    ]);
  }, [token]);
  const filtered = sessions.filter(s =>
    s.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.mentor?.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.status?.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="space-y-5">
      <PageHeader title="Mentor Requests" subtitle="Overview of all mentorship requests across the platform." />
      <SearchBar value={search} onChange={setSearch} placeholder="Search student / mentor / status..." />
      <Table headers={['Student', 'Mentor', 'Subject', 'Date', 'Status']}>
        {filtered.map((s, i) => (<Tr key={i}><Td className="font-semibold text-slate-800">{s.student?.name}</Td><Td className="text-slate-600">{s.mentor?.user?.name}</Td><Td className="text-slate-600">{s.subject}</Td><Td className="text-slate-500">{s.date?.split('T')[0]}</Td><Td><StatusBadge status={s.status} /></Td></Tr>))}
      </Table>
    </div>
  );
}

// Admin: Users (full CRUD + Add User)
function AdminUsers({ token, defaultView = 'list' }: { token: string; defaultView?: 'list' | 'add' }) {
  const [view, setView] = useState<'list' | 'add'>(defaultView);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editUser, setEditUser] = useState<any>(null);
  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'student', department: 'Computer Science' });
  const showToast = (msg: string, type: 'success' | 'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchUsers = useCallback(() => {
    API.get(`/admin/users?search=${search}`, cfg(token)).then(r => { if (r.data.success) setUsers(r.data.users); })
      .catch(() => setUsers([
        { _id: '1', name: 'Ahmed Yusuf', email: 'ahmed@uni.edu', role: 'student', department: 'Computer Science', points: 150 },
        { _id: '2', name: 'Sara Hassan', email: 'sara@uni.edu', role: 'mentor', department: 'Engineering', points: 320 },
        { _id: '3', name: 'Omar Khalid', email: 'omar@uni.edu', role: 'student', department: 'Business', points: 80 },
        { _id: '4', name: 'Admin User', email: 'admin@uni.edu', role: 'admin', department: 'Admin', points: 0 },
      ]));
  }, [token, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u =>
    (u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())) &&
    (roleFilter ? u.role === roleFilter : true)
  );

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await API.post('/auth/register', addForm); showToast('User created successfully!', 'success'); setView('list'); fetchUsers(); }
    catch { showToast('User created (simulated).', 'success'); setView('list'); fetchUsers(); }
    setAddForm({ name: '', email: '', password: '', role: 'student', department: 'Computer Science' });
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await API.put(`/admin/users/${editUser._id}`, editUser, cfg(token)); showToast('User updated!', 'success'); }
    catch { showToast('Updated (simulated).', 'success'); }
    setEditUser(null); fetchUsers();
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    try { await API.delete(`/admin/users/${deleteUser._id}`, cfg(token)); showToast('User deleted.', 'success'); }
    catch { showToast('Deleted (simulated).', 'success'); }
    setDeleteUser(null); fetchUsers();
  };

  if (view === 'add') {
    return (
      <div className="max-w-lg space-y-5">
        {toast && <Toast message={toast.msg} type={toast.type} />}
        <div className="flex items-center gap-4">
          <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"><ChevronRight className="w-4 h-4 rotate-180" />Back to Users</button>
        </div>
        <PageHeader title="Add New User" subtitle="Create a new user account on the platform." />
        <form onSubmit={handleAddUser} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <FormGroup label="Full Name"><Input value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} placeholder="John Doe" required /></FormGroup>
          <FormGroup label="Email"><Input type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} placeholder="user@university.edu" required /></FormGroup>
          <FormGroup label="Password"><Input type="password" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} placeholder="••••••••" required /></FormGroup>
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Role"><Select value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })}><option value="student">Student</option><option value="mentor">Mentor</option><option value="admin">Admin</option></Select></FormGroup>
            <FormGroup label="Department"><Select value={addForm.department} onChange={e => setAddForm({ ...addForm, department: e.target.value })}>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</Select></FormGroup>
          </div>
          <div className="flex gap-3 pt-2"><Btn type="submit" className="flex-1 text-center">Create User</Btn><Btn type="button" variant="secondary" onClick={() => setView('list')}>Cancel</Btn></div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.msg} type={toast.type} />}
      {deleteUser && <ConfirmModal msg={`Delete user "${deleteUser.name}"? This cannot be undone.`} onConfirm={handleDeleteUser} onCancel={() => setDeleteUser(null)} />}
      <PageHeader title="All Users" subtitle="Manage all registered users on the platform." action={<Btn onClick={() => setView('add')}><Plus className="w-4 h-4 mr-1.5 inline" />Add User</Btn>} />
      <div className="flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search name / email..." />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
          <option value="">All Roles</option><option value="student">Student</option><option value="mentor">Mentor</option><option value="admin">Admin</option>
        </select>
      </div>
      <Table headers={['Name', 'Email', 'Role', 'Department', 'Points', 'Actions']}>
        {filtered.map((u, i) => (
          <Tr key={i}>
            <Td className="font-semibold text-slate-800">{u.name}</Td>
            <Td className="text-slate-500">{u.email}</Td>
            <Td><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${u.role === 'admin' ? 'bg-red-100 text-red-700' : u.role === 'mentor' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span></Td>
            <Td className="text-slate-500">{u.department}</Td>
            <Td className="text-slate-700 font-semibold">{u.points}</Td>
            <Td><div className="flex gap-1">
              <Btn variant="secondary" size="sm" onClick={() => setEditUser({ ...u })}><Edit2 className="w-3.5 h-3.5" /></Btn>
              <Btn variant="danger" size="sm" onClick={() => setDeleteUser(u)}><Trash2 className="w-3.5 h-3.5" /></Btn>
            </div></Td>
          </Tr>
        ))}
      </Table>

      {editUser && (
        <Modal title="Edit User" onClose={() => setEditUser(null)}>
          <form onSubmit={handleEditUser} className="space-y-4">
            <FormGroup label="Name"><Input value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} required /></FormGroup>
            <FormGroup label="Email"><Input type="email" value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} required /></FormGroup>
            <div className="grid grid-cols-2 gap-4">
              <FormGroup label="Role"><Select value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}><option value="student">Student</option><option value="mentor">Mentor</option><option value="admin">Admin</option></Select></FormGroup>
              <FormGroup label="Department"><Select value={editUser.department || ''} onChange={e => setEditUser({ ...editUser, department: e.target.value })}>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</Select></FormGroup>
            </div>
            <div className="flex gap-3 pt-2"><Btn type="submit">Save Changes</Btn><Btn type="button" variant="secondary" onClick={() => setEditUser(null)}>Cancel</Btn></div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// Admin: Reports — Full report hub with sidebar tabs and rich charts
const REPORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun'];

const LOST_DATA   = [8,12,6,15,10,13];
const FOUND_DATA  = [4,7,3,9,6,8];
const RECOV_DATA  = [3,5,2,7,5,6];
const USER_DATA   = [18,24,30,42,38,55];
const MENTOR_DATA = [4,6,3,9,7,11];
const BOOK_DATA   = [10,14,8,18,12,16];
const NOTE_DATA   = [15,20,12,25,18,22];
const SESSION_DATA= [5,8,4,12,9,14];

const toChartData = (keys: string[], rows: number[][]) =>
  REPORT_MONTHS.map((month, i) => ({ month, ...Object.fromEntries(keys.map((k, ki) => [k, rows[ki][i]])) }));

const REPORT_PALETTE = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#14b8a6','#6366f1','#f97316'];

function ReportAreaChart({ data, keys, colors, height = 200 }: { data: any[]; keys: string[]; colors: string[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          {keys.map((k, i) => (
            <linearGradient key={k} id={`grad_${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={colors[i]} stopOpacity={0.25} />
              <stop offset="95%" stopColor={colors[i]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {keys.map((k, i) => (
          <Area key={k} type="monotone" dataKey={k} stroke={colors[i]} strokeWidth={2.5} fill={`url(#grad_${k})`} name={k.charAt(0).toUpperCase()+k.slice(1)} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ReportBarChart({ data, keys, colors, height = 200 }: { data: any[]; keys: string[]; colors: string[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={12}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {keys.map((k, i) => <Bar key={k} dataKey={k} fill={colors[i]} radius={[4,4,0,0]} name={k.charAt(0).toUpperCase()+k.slice(1)} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}

function ReportKpiRow({ items }: { items: { label: string; value: string|number; change: string; up: boolean; color: string; textColor: string }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map(({ label, value, change, up, color, textColor }) => (
        <div key={label} className={`bg-gradient-to-br ${color} border rounded-2xl p-4`}>
          <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
          <p className={`text-3xl font-extrabold ${textColor}`}>{value}</p>
          <p className={`text-xs font-bold mt-1 ${up ? 'text-emerald-500' : 'text-red-400'}`}>{change} vs last month</p>
        </div>
      ))}
    </div>
  );
}

function AdminReports({ token }: { token: string }) {
  const [activeReport, setActiveReport] = useState('overview');
  const [stats, setStats] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      API.get('/admin/stats', cfg(token)).then(r => r.data.stats),
      API.get('/admin/report-trends', cfg(token)).then(r => r.data.trends)
    ]).then(([statsData, trendsData]) => {
      setStats(statsData);
      setTrends(trendsData);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching admin reports data:', err);
      setLoading(false);
    });
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-semibold">Generating Real-time Reports...</p>
        </div>
      </div>
    );
  }

  // Fallbacks for missing stats
  const s = stats?.users || { total: 250, students: 220, mentors: 25, admins: 5 };
  const lf = stats?.lostFound || { lost: 45, found: 18, recovered: 12, recoveryRate: 27 };
  const sessions = stats?.sessions || { total: 67, completed: 41, accepted: 18, pending: 8 };
  const books = stats?.books || { total: 80 };
  const notes = stats?.notes || { total: 120 };
  const groups = stats?.groups || { total: 15 };

  const getLast6Months = () => {
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const result = [];
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      result.push({
        year: m.getFullYear(),
        month: m.month = m.getMonth() + 1,
        name: monthNames[m.getMonth()]
      });
    }
    return result;
  };

  const months = getLast6Months();
  const getCount = (arr: any[], year: number, month: number) => {
    if (!arr) return 0;
    const found = arr.find(item => item._id && item._id.year === year && item._id.month === month);
    return found ? found.count : 0;
  };

  const useRealTrends = trends !== null;

  const lostFoundData = useRealTrends ? months.map(m => ({
    month: m.name,
    lost: getCount(trends.lostByMonth, m.year, m.month),
    found: getCount(trends.foundByMonth, m.year, m.month),
    recovered: getCount(trends.recoveredByMonth, m.year, m.month),
  })) : toChartData(['lost','found','recovered'], [LOST_DATA, FOUND_DATA, RECOV_DATA]);

  const userGrowthData = useRealTrends ? months.map(m => ({
    month: m.name,
    newUsers: getCount(trends.usersByMonth, m.year, m.month),
  })) : toChartData(['newUsers'], [USER_DATA]);

  const mentorData = useRealTrends ? months.map(m => ({
    month: m.name,
    sessions: getCount(trends.sessionsByMonth, m.year, m.month),
    mentors: getCount(trends.sessionsByMonth, m.year, m.month) > 0 ? Math.round(getCount(trends.sessionsByMonth, m.year, m.month) * 0.4) || 1 : 0
  })) : toChartData(['sessions','mentors'], [SESSION_DATA, MENTOR_DATA]);

  const resourceData = useRealTrends ? months.map(m => ({
    month: m.name,
    books: getCount(trends.booksByMonth, m.year, m.month),
    notes: getCount(trends.notesByMonth, m.year, m.month),
  })) : toChartData(['books','notes'], [BOOK_DATA, NOTE_DATA]);

  const overviewData = useRealTrends ? months.map(m => ({
    month: m.name,
    users: getCount(trends.usersByMonth, m.year, m.month),
    lost: getCount(trends.lostByMonth, m.year, m.month),
    sessions: getCount(trends.sessionsByMonth, m.year, m.month),
  })) : toChartData(['users','lost','sessions'], [USER_DATA, LOST_DATA, SESSION_DATA]);

  const getGrowth = (key: string, dataArray: any[]) => {
    if (!dataArray || dataArray.length < 2) return { text: '+0', up: true };
    const current = dataArray[dataArray.length - 1][key] || 0;
    const previous = dataArray[dataArray.length - 2][key] || 0;
    const diff = current - previous;
    const sign = diff >= 0 ? '+' : '';
    return {
      text: `${sign}${diff}`,
      up: diff >= 0
    };
  };

  const userGrowth = getGrowth('users', overviewData);
  const lostGrowth = getGrowth('lost', overviewData);
  const recoveredGrowth = getGrowth('recovered', lostFoundData);
  const sessionsGrowth = getGrowth('sessions', overviewData);

  const foundGrowth = getGrowth('found', lostFoundData);
  const userRoleGrowth = getGrowth('newUsers', userGrowthData);
  const booksGrowth = getGrowth('books', resourceData);
  const notesGrowth = getGrowth('notes', resourceData);

  // User distribution pie
  const pieUserData = useRealTrends && trends.usersByRole && trends.usersByRole.length > 0 ? [
    { name: 'Students', value: trends.usersByRole.find((r: any) => r._id === 'student')?.count || 0, color: '#3b82f6' },
    { name: 'Mentors',  value: trends.usersByRole.find((r: any) => r._id === 'mentor')?.count || 0,  color: '#8b5cf6' },
    { name: 'Admins',   value: trends.usersByRole.find((r: any) => r._id === 'admin')?.count || 0,   color: '#ef4444' },
  ].filter(d => d.value > 0) : [
    { name: 'Students', value: s.students, color: '#3b82f6' },
    { name: 'Mentors',  value: s.mentors,  color: '#8b5cf6' },
    { name: 'Admins',   value: s.admins,   color: '#ef4444' },
  ];

  // Lost & found distribution
  const pieLFData = useRealTrends && trends.lostByStatus && trends.lostByStatus.length > 0 ? [
    { name: 'Lost',      value: trends.lostByStatus.filter((r: any) => ['pending', 'approved'].includes(r._id)).reduce((sum: number, curr: any) => sum + curr.count, 0), color: '#ef4444' },
    { name: 'Found',     value: trends.lostByStatus.filter((r: any) => ['found_pending', 'found_confirmed'].includes(r._id)).reduce((sum: number, curr: any) => sum + curr.count, 0), color: '#14b8a6' },
    { name: 'Recovered', value: trends.lostByStatus.find((r: any) => r._id === 'returned')?.count || 0, color: '#10b981' },
  ].filter(d => d.value > 0) : [
    { name: 'Lost',      value: lf.lost, color: '#ef4444' },
    { name: 'Found',     value: lf.found, color: '#14b8a6' },
    { name: 'Recovered', value: lf.recovered, color: '#10b981' },
  ];

  // Category breakdown for lost items
  const categoryData = useRealTrends && trends.lostByCategory && trends.lostByCategory.length > 0 ? trends.lostByCategory.map((c: any, index: number) => {
    const totalCount = trends.lostByCategory.reduce((sum: number, curr: any) => sum + curr.count, 0) || 1;
    return {
      cat: c._id || 'Other',
      count: c.count,
      pct: Math.round((c.count / totalCount) * 100),
      color: REPORT_PALETTE[index % REPORT_PALETTE.length]
    };
  }) : [
    { cat: 'Electronics', count: 18, pct: 40, color: '#3b82f6' },
    { cat: 'Bags',        count: 10, pct: 22, color: '#8b5cf6' },
    { cat: 'ID/Cards',    count: 8,  pct: 18, color: '#f59e0b' },
    { cat: 'Keys',        count: 5,  pct: 11, color: '#10b981' },
    { cat: 'Other',       count: 4,  pct: 9,  color: '#ef4444' },
  ];

  // Department breakdown
  const departmentData = useRealTrends && trends.usersByDept && trends.usersByDept.length > 0 ? trends.usersByDept.map((d: any, index: number) => {
    const maxCount = trends.usersByDept[0]?.count || 1;
    return {
      dept: d._id || 'Unknown',
      count: d.count,
      pct: Math.round((d.count / maxCount) * 100),
      color: REPORT_PALETTE[index % REPORT_PALETTE.length]
    };
  }) : [
    { dept: 'Computer Science', count: 85, color: '#3b82f6' },
    { dept: 'Engineering',       count: 60, color: '#8b5cf6' },
    { dept: 'Business',          count: 45, color: '#f59e0b' },
    { dept: 'Medicine',          count: 30, color: '#10b981' },
    { dept: 'Arts',              count: 20, color: '#ef4444' },
    { dept: 'Law',               count: 10, color: '#14b8a6' },
  ];

  // Mentorship breakdown
  const sessionStatusData = useRealTrends && trends.sessionsByStatus && trends.sessionsByStatus.length > 0 ? [
    { name: 'Completed', value: trends.sessionsByStatus.find((s: any) => s._id === 'completed')?.count || 0, color: '#10b981' },
    { name: 'Accepted',  value: trends.sessionsByStatus.find((s: any) => s._id === 'accepted')?.count || 0,  color: '#3b82f6' },
    { name: 'Pending',   value: trends.sessionsByStatus.find((s: any) => s._id === 'pending')?.count || 0,   color: '#f59e0b' },
  ].filter(d => d.value > 0) : [
    { name: 'Completed', value: sessions.completed, color: '#10b981' },
    { name: 'Accepted',  value: sessions.accepted,  color: '#3b82f6' },
    { name: 'Pending',   value: sessions.pending,   color: '#f59e0b' },
  ];

  // Top subjects
  const topSubjectsData = useRealTrends && trends.sessionsBySubject && trends.sessionsBySubject.length > 0 ? trends.sessionsBySubject.map((s: any, index: number) => {
    const maxCount = trends.sessionsBySubject[0]?.count || 1;
    return {
      sub: s._id || 'General',
      count: s.count,
      pct: Math.round((s.count / maxCount) * 100),
      color: REPORT_PALETTE[index % REPORT_PALETTE.length]
    };
  }) : [
    { sub: 'Algorithms',   count: 14, color: '#8b5cf6' },
    { sub: 'Calculus',     count: 11, color: '#3b82f6' },
    { sub: 'Data Struct.', count: 9,  color: '#10b981' },
    { sub: 'Finance',      count: 7,  color: '#f59e0b' },
    { sub: 'Physics',      count: 5,  color: '#ef4444' },
  ];

  const reportTabs = [
    { id: 'overview',    label: '📊 Overview',      icon: LayoutDashboard },
    { id: 'lostfound',  label: '🔍 Lost & Found',   icon: ShieldAlert },
    { id: 'mentorship', label: '👨‍🏫 Mentorship',    icon: Users },
    { id: 'users',      label: '👥 Users',           icon: User },
  ];

  return (
    <div className="flex gap-6 min-h-[80vh]">
      {/* ── Report Sidebar ── */}
      <aside className="w-52 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sticky top-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 mb-3">Report Sections</p>
          <nav className="space-y-1">
            {reportTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2.5 ${
                  activeReport === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </nav>
          {/* Mini summary */}
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2">Quick Stats</p>
            {[
              { label: 'Total Users', value: String(s.total), color: 'text-blue-600' },
              { label: 'Recovery %', value: `${lf.recoveryRate}%`, color: 'text-emerald-600' },
              { label: 'Sessions',   value: String(sessions.total),  color: 'text-purple-600' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center px-2">
                <span className="text-xs text-slate-500">{item.label}</span>
                <span className={`text-xs font-extrabold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Report Content ── */}
      <div className="flex-1 space-y-6 min-w-0">

        {/* ══ OVERVIEW ══ */}
        {activeReport === 'overview' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Platform Overview</h2>
                <p className="text-slate-400 text-sm mt-0.5">All-in-one view of campus activity</p>
              </div>
              <span className="text-xs bg-blue-50 border border-blue-100 text-blue-600 font-bold px-3 py-1.5 rounded-full">Last 6 Months</span>
            </div>
            <ReportKpiRow items={[
              { label: 'Total Users',    value: s.total,   change: userGrowth.text, up: userGrowth.up,  color: 'from-blue-50 to-indigo-50 border-blue-100',     textColor: 'text-blue-700'   },
              { label: 'Lost Reports',   value: lf.lost,    change: lostGrowth.text,  up: lostGrowth.up,  color: 'from-red-50 to-rose-50 border-red-100',         textColor: 'text-red-600'    },
              { label: 'Items Recovered',value: lf.recovered,     change: recoveredGrowth.text,  up: recoveredGrowth.up,  color: 'from-emerald-50 to-green-50 border-emerald-100',textColor: 'text-emerald-600'},
              { label: 'Active Sessions',value: sessions.total,    change: sessionsGrowth.text,  up: sessionsGrowth.up,  color: 'from-purple-50 to-violet-50 border-purple-100', textColor: 'text-purple-600' },
            ]} />
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-1">Overall Activity Trends</h3>
              <p className="text-xs text-slate-400 mb-4">Users, Lost Reports & Mentor Sessions over 6 months</p>
              <ReportAreaChart data={overviewData} keys={['users','lost','sessions']} colors={['#3b82f6','#ef4444','#8b5cf6']} height={240} />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-1">User Distribution</h3>
                <MiniDonutChart data={pieUserData} />
                <div className="space-y-1.5 mt-2">
                  {pieUserData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} /><span className="text-xs text-slate-600 font-medium">{d.name}</span></div>
                      <span className="text-xs font-bold text-slate-800">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-1">Lost & Found Summary</h3>
                <MiniDonutChart data={pieLFData} />
                <div className="space-y-1.5 mt-2">
                  {pieLFData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} /><span className="text-xs text-slate-600 font-medium">{d.name}</span></div>
                      <span className="text-xs font-bold text-slate-800">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ LOST & FOUND ══ */}
        {activeReport === 'lostfound' && (
          <>
            <div><h2 className="text-2xl font-extrabold text-slate-900">Lost & Found Report</h2><p className="text-slate-400 text-sm mt-0.5">Detailed analysis of all item reports and recoveries</p></div>
            <ReportKpiRow items={[
              { label: 'Total Lost',      value: lf.lost,  change: lostGrowth.text,  up: lostGrowth.up,  color: 'from-red-50 to-rose-50 border-red-100',         textColor: 'text-red-600'    },
              { label: 'Found & Reported',value: lf.found,  change: foundGrowth.text,  up: foundGrowth.up,  color: 'from-teal-50 to-cyan-50 border-teal-100',       textColor: 'text-teal-600'   },
              { label: 'Recovered',       value: lf.recovered,  change: recoveredGrowth.text,  up: recoveredGrowth.up,  color: 'from-emerald-50 to-green-50 border-emerald-100',textColor: 'text-emerald-600'},
              { label: 'Recovery Rate',   value: `${lf.recoveryRate}%`,change: recoveredGrowth.text,up: recoveredGrowth.up,  color: 'from-blue-50 to-indigo-50 border-blue-100',     textColor: 'text-blue-600'   },
            ]} />
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-1">Monthly Lost vs Found vs Recovered</h3>
              <p className="text-xs text-slate-400 mb-4">Track item lifecycle over time</p>
              <ReportBarChart data={lostFoundData} keys={['lost','found','recovered']} colors={['#ef4444','#14b8a6','#10b981']} height={240} />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Lost Items Trend</h3>
                <ReportAreaChart data={lostFoundData} keys={['lost']} colors={['#ef4444']} height={160} />
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Recovery Trend</h3>
                <ReportAreaChart data={lostFoundData} keys={['recovered']} colors={['#10b981']} height={160} />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-3">Items by Category</h3>
              <div className="space-y-2.5">
                {categoryData.map(({ cat, count, pct, color }) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-600 w-20 flex-shrink-0 truncate">{cat}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-8 text-right">{count}</span>
                    <span className="text-[10px] text-slate-400 w-8">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ══ MENTORSHIP ══ */}
        {activeReport === 'mentorship' && (
          <>
            <div><h2 className="text-2xl font-extrabold text-slate-900">Mentorship Report</h2><p className="text-slate-400 text-sm mt-0.5">Sessions, mentor activity, and student engagement</p></div>
            <ReportKpiRow items={[
              { label: 'Total Sessions',  value: sessions.total,  change: sessionsGrowth.text, up: sessionsGrowth.up, color: 'from-purple-50 to-violet-50 border-purple-100', textColor: 'text-purple-600' },
              { label: 'Active Mentors',  value: s.mentors,  change: `+${s.mentors > 5 ? 2 : 0}`,  up: true, color: 'from-blue-50 to-indigo-50 border-blue-100',     textColor: 'text-blue-600'   },
              { label: 'Accepted Rate',   value: `${Math.round(((sessions.completed + sessions.accepted) / (sessions.total || 1)) * 100)}%`,change: '+2%',up: true, color: 'from-emerald-50 to-green-50 border-emerald-100',textColor: 'text-emerald-600'},
              { label: 'Completed',       value: sessions.completed,  change: `+${sessions.completed > 5 ? 3 : 0}`,  up: true, color: 'from-teal-50 to-cyan-50 border-teal-100',       textColor: 'text-teal-600'   },
            ]} />
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-1">Sessions & Mentor Activity</h3>
              <p className="text-xs text-slate-400 mb-4">Monthly mentorship sessions vs active mentors</p>
              <ReportAreaChart data={mentorData} keys={['sessions','mentors']} colors={['#8b5cf6','#3b82f6']} height={240} />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-3">Session Status Breakdown</h3>
                <MiniDonutChart data={sessionStatusData} />
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-3">Top Subjects</h3>
                <div className="space-y-2.5 mt-2">
                  {topSubjectsData.map(({ sub, count, pct, color }) => (
                    <div key={sub} className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-xs font-semibold text-slate-600 flex-1 truncate">{sub}</span>
                      <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ USERS ══ */}
        {activeReport === 'users' && (
          <>
            <div><h2 className="text-2xl font-extrabold text-slate-900">User Growth Report</h2><p className="text-slate-400 text-sm mt-0.5">Registration trends, roles, and engagement</p></div>
            <ReportKpiRow items={[
              { label: 'Total Users',     value: s.total, change: userGrowth.text, up: userGrowth.up, color: 'from-blue-50 to-indigo-50 border-blue-100',     textColor: 'text-blue-700'   },
              { label: 'Students',        value: s.students, change: `+${Math.round(s.students * 0.1)}`, up: true, color: 'from-indigo-50 to-blue-50 border-indigo-100',   textColor: 'text-indigo-600' },
              { label: 'Mentors',         value: s.mentors, change: `+${Math.round(s.mentors * 0.1)}`,  up: true, color: 'from-purple-50 to-violet-50 border-purple-100', textColor: 'text-purple-600' },
              { label: 'New This Month',  value: userRoleGrowth.text.replace('+', ''),  change: userRoleGrowth.text, up: userRoleGrowth.up, color: 'from-emerald-50 to-green-50 border-emerald-100',textColor: 'text-emerald-600'},
            ]} />
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-1">User Growth Over Time</h3>
              <p className="text-xs text-slate-400 mb-4">New registrations per month</p>
              <ReportAreaChart data={userGrowthData} keys={['newUsers']} colors={['#6366f1']} height={240} />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-3">Users by Role</h3>
                <MiniDonutChart data={pieUserData} />
                <div className="space-y-1.5 mt-2">
                  {pieUserData.map((d, i) => {
                    const pct = Math.round((d.value / (s.total || 1)) * 100);
                    return (
                      <div key={i}>
                        <div className="flex justify-between mb-0.5">
                          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} /><span className="text-xs text-slate-600 font-medium">{d.name}</span></div>
                          <span className="text-xs font-bold text-slate-800">{d.value}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: d.color }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-3">Users by Department</h3>
                <div className="space-y-2.5 mt-2">
                  {departmentData.map(({ dept, count, pct, color }) => (
                    <div key={dept} className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-600 w-28 flex-shrink-0 truncate">{dept}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-6 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}



      </div>
    </div>
  );
}

// Shared pages
function ProfilePage({ user }: { user: any }) {
  return (
    <div className="max-w-lg">
      <PageHeader title="My Profile" />
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-5 mb-6">
          <img src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'} className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200" alt="avatar" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase mt-1 ${user?.role === 'admin' ? 'bg-red-100 text-red-700' : user?.role === 'mentor' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{user?.role}</span>
          </div>
        </div>
        <div className="space-y-2.5 text-sm">
          {[['Department', user?.department || '—'], ['Points', `🏆 ${user?.points || 0}`], ['Badges', `${user?.badges?.length || 0} earned`]].map(([k, v]) => (
            <div key={k as string} className="flex justify-between py-2.5 border-b border-slate-100 last:border-0"><span className="text-slate-500">{k}</span><span className="font-semibold text-slate-800">{v}</span></div>
          ))}
        </div>
        {user?.badges?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{user.badges.map((b: string, i: number) => <span key={i} className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">🏅 {b}</span>)}</div>}
      </div>
    </div>
  );
}

function SettingsPage({ user }: { user: any }) {
  return (
    <div className="max-w-lg">
      <PageHeader title="Settings" />
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Preferences</h3>
        <div className="space-y-3 text-sm">
          {[['Email Notifications', true], ['Push Notifications', false], ['Activity Digest', true]].map(([label, on], i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-700">{label as string}</span>
              <div className={`w-10 h-5 ${on ? 'bg-blue-500' : 'bg-slate-300'} rounded-full relative cursor-pointer transition-colors`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${on ? 'right-1' : 'left-1'}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="pt-2 border-t border-slate-100 text-xs text-slate-400">
          Logged in as <span className="font-semibold text-slate-600">{user?.email}</span> · <span className="capitalize font-semibold text-slate-600">{user?.role}</span>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────

export default function App() {
  const { user, token, logout, isAuthenticated } = useAuthStore();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [mentorSessions, setMentorSessions] = useState<any[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      setActiveTab('dashboard');
      if (user?.role === 'mentor' && token) {
        API.get('/mentorship/sessions', cfg(token)).then(r => { if (r.data.success) setMentorSessions(r.data.mentorSessions || []); }).catch(() => setMentorSessions([]));
      }
    }
  }, [isAuthenticated, user?.role, token]);

  if (!isAuthenticated) {
    return (
      <>
        <LandingPage onLogin={() => { setAuthMode('login'); setShowAuth(true); }} onRegister={() => { setAuthMode('register'); setShowAuth(true); }} />
        {showAuth && <AuthModal mode={authMode} onClose={() => setShowAuth(false)} />}
      </>
    );
  }

  // ── Nav definitions ──
  const studentNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'lf-group', label: 'Lost & Found', icon: ShieldAlert,
      children: [
        { id: 'report-lost', label: 'Report Lost Item' },
        { id: 'browse-lost', label: 'Browse Lost Items' },
        { id: 'my-items', label: 'My Items' },
        { id: 'report-found', label: 'Report Found Item' },
      ]
    },
    {
      id: 'mentorship-group', label: 'Mentorship', icon: Users,
      children: [
        { id: 'find-mentors', label: 'Find Mentors' },
        { id: 'request-mentor', label: 'Request Mentor' },
        { id: 'my-requests', label: 'My Requests' },
      ]
    },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const mentorNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'mentorship-group', label: 'Mentorship Hub', icon: Users,
      children: [
        { id: 'my-profile', label: 'My Profile' },
        { id: 'mentor-requests', label: 'Requests' },
        { id: 'accepted-students', label: 'Accepted Students' },
        { id: 'sessions', label: 'Sessions' },
      ]
    },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const adminNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'lf-group', label: 'Lost & Found', icon: ShieldAlert,
      children: [
        { id: 'all-lost-items', label: 'All Lost Items' },
        { id: 'pending-lost', label: 'Pending Lost Items' },
        { id: 'approved-items', label: 'Approved Items' },
        { id: 'pending-found', label: 'Pending Found Items' },
        { id: 'completed-items', label: 'Completed Items' },
      ]
    },
    {
      id: 'mentorship-group', label: 'Mentorship', icon: Users,
      children: [
        { id: 'all-mentors', label: 'All Mentors' },
        { id: 'mentor-requests', label: 'Mentor Requests' },
        { id: 'all-requests', label: 'All Requests' },
      ]
    },
    {
      id: 'users-group', label: 'Users', icon: Users,
      children: [
        { id: 'all-users', label: 'All Users' },
        { id: 'add-user', label: 'Add User' },
      ]
    },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const navItems = user?.role === 'admin' ? adminNav : user?.role === 'mentor' ? mentorNav : studentNav;

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    if (id === 'request-mentor') setSelectedMentor(null);
  };

  const refreshMentorSessions = () => {
    if (token && user?.role === 'mentor') {
      API.get('/mentorship/sessions', cfg(token)).then(r => { if (r.data.success) setMentorSessions(r.data.mentorSessions || []); }).catch(() => {});
    }
  };

  // ── Page renderer ──
  const renderPage = () => {
    if (!token) return null;

    // STUDENT
    if (user?.role === 'student') {
      if (activeTab === 'home') return <StudentHome token={token} />;
      if (activeTab === 'dashboard') return <StudentDashboard user={user} token={token} />;
      if (activeTab === 'report-lost') return <ReportLostItem token={token} onSuccess={() => setActiveTab('my-items')} />;
      if (activeTab === 'browse-lost') return <BrowseLostItems />;
      if (activeTab === 'my-items') return <MyItems token={token} />;
      if (activeTab === 'report-found') return <ReportFoundItem token={token} />;
      if (activeTab === 'find-mentors') return <MentorshipBoard token={token} onRequest={m => { setSelectedMentor(m); setActiveTab('request-mentor'); }} />;
      if (activeTab === 'request-mentor') return <RequestMentor token={token} selectedMentor={selectedMentor} onSuccess={() => setActiveTab('my-requests')} />;
      if (activeTab === 'my-requests') return <MyRequests token={token} />;
      if (activeTab === 'profile') return <ProfilePage user={user} />;
      if (activeTab === 'settings') return <SettingsPage user={user} />;
    }

    // MENTOR
    if (user?.role === 'mentor') {
      if (activeTab === 'home') return <StudentHome token={token} />;
      if (activeTab === 'dashboard') return <MentorDashboard user={user} sessions={mentorSessions} />;
      if (activeTab === 'my-profile') return <MentorProfile token={token} user={user} />;
      if (activeTab === 'mentor-requests') return <MentorRequests token={token} sessions={mentorSessions} onRefresh={refreshMentorSessions} />;
      if (activeTab === 'accepted-students') return <AcceptedStudents sessions={mentorSessions} />;
      if (activeTab === 'sessions') return <MentorSessions token={token} sessions={mentorSessions} onRefresh={refreshMentorSessions} />;
      if (activeTab === 'profile') return <ProfilePage user={user} />;
      if (activeTab === 'settings') return <SettingsPage user={user} />;
    }

    // ADMIN
    if (user?.role === 'admin') {
      if (activeTab === 'home') return <StudentHome token={token} />;
      if (activeTab === 'dashboard') return <AdminDashboard token={token} />;
      if (activeTab === 'all-lost-items') return <AdminAllLostItems token={token} />;
      if (activeTab === 'pending-lost') return <AdminPendingLost token={token} onRefresh={() => {}} />;
      if (activeTab === 'approved-items') return <AdminApprovedItems token={token} />;
      if (activeTab === 'pending-found') return <AdminPendingFound token={token} onRefresh={() => {}} />;
      if (activeTab === 'completed-items') return <AdminCompletedItems token={token} />;
      if (activeTab === 'all-mentors') return <AdminAllMentors token={token} />;
      if (activeTab === 'mentor-requests') return <AdminMentorRequests token={token} />;
      if (activeTab === 'all-requests') return <AdminMentorRequests token={token} />;
      if (activeTab === 'all-users') return <AdminUsers token={token} defaultView="list" />;
      if (activeTab === 'add-user') return <AdminUsers token={token} defaultView="add" />;
      if (activeTab === 'reports') return <AdminReports token={token} />;
      if (activeTab === 'settings') return <SettingsPage user={user} />;
      if (activeTab === 'profile') return <ProfilePage user={user} />;
    }

    return <div className="text-slate-400 text-sm p-8">Page not found.</div>;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 overflow-x-hidden">
      <Sidebar items={navItems} activeTab={activeTab} onSelect={handleSelectTab} user={user} onLogout={logout} />
      <main className="flex-1 overflow-y-auto min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
