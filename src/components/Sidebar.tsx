import { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Video,
  Download,
  User,
  MessageSquare,
  LogOut,
  Users,
  PieChart,
  ShieldAlert,
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import { User as UserType } from '../types.js';

interface SidebarProps {
  user: UserType;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ user, currentView, onNavigate, onLogout }: SidebarProps) {
  const isAdmin = user.role === 'admin';
  const [mobileOpen, setMobileOpen] = useState(false);

  const studentLinks = [
    { view: 'student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'resume-analyzer', label: 'Resume Analyzer', icon: FileText },
    { view: 'interview-prep', label: 'Mock Interviews', icon: Video },
    { view: 'templates', label: 'ATS Templates', icon: Download },
    { view: 'profile', label: 'My Profile', icon: User },
    { view: 'feedback', label: 'Share Feedback', icon: MessageSquare }
  ];

  const adminLinks = [
    { view: 'admin-dashboard', label: 'Analytics Panel', icon: PieChart },
    { view: 'admin-students', label: 'Registered Students', icon: Users },
    { view: 'admin-feedbacks', label: 'Student Feedback', icon: MessageSquare }
  ];

  const activeLinks = isAdmin ? adminLinks : studentLinks;

  const handleNavigate = (view: string) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Sidebar Top Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-900 space-x-3 bg-slate-950/60">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-sm tracking-tight text-white block">
            Interview<span className="text-indigo-400">AI</span>
          </span>
          <span className="text-[9px] text-indigo-300 uppercase tracking-widest font-semibold font-mono block">
            {isAdmin ? 'Admin Portal' : 'Placement Co-Pilot'}
          </span>
        </div>
      </div>

      {/* User Information Profile Box */}
      <div className="p-4 border-b border-slate-900 bg-slate-900/10">
        <div className="flex items-center space-x-3">
          <img
            src={user.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
            alt={user.name}
            className="w-10 h-10 rounded-full border border-indigo-500/30 object-cover"
          />
          <div className="overflow-hidden">
            <span className="block font-bold text-xs text-white truncate">{user.name}</span>
            <span className="block text-[10px] text-slate-400 truncate mt-0.5">{user.email}</span>
            <span className="inline-flex items-center space-x-1 mt-1 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-400/20 text-violet-400 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">
              {isAdmin ? 'ADMINISTRATOR' : (user.branch ? user.branch : 'SETUP PROFILE')}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 font-mono">
          Core Navigation
        </span>

        {activeLinks.map((link) => {
          const Icon = link.icon;
          const isActive = currentView === link.view;

          return (
            <button
              key={link.view}
              onClick={() => handleNavigate(link.view)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20'
                  : 'hover:bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{link.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer / Action */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/60 space-y-3">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-slate-400 hover:text-red-400 rounded-xl text-xs font-semibold transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
        <div className="text-center pt-2 border-t border-slate-900">
          <p className="text-[9px] text-slate-600 font-medium">Built by Lohith & Trupti</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-white flex items-center justify-center shadow-lg"
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar - always visible on lg+ */}
      <aside className="hidden lg:flex w-64 bg-slate-950/80 backdrop-blur-lg border-r border-slate-900 text-slate-300 flex-col h-screen fixed top-0 left-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar - slide in/out */}
      <aside
        className={`lg:hidden fixed top-0 left-0 w-64 bg-slate-950/95 backdrop-blur-lg border-r border-slate-900 text-slate-300 flex flex-col h-screen z-40 transform transition-transform duration-300 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
