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
  Menu,
  X,
  Code2
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
    { view: 'code-sandbox', label: 'Code Lab', icon: Code2 },
    { view: 'templates', label: 'ATS Templates', icon: Download },
    { view: 'profile', label: 'Profile', icon: User },
    { view: 'feedback', label: 'Feedback', icon: MessageSquare }
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
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-800/80 space-x-3 bg-[#09090b]">
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <div>
          <span className="font-heading font-bold text-sm text-zinc-100 tracking-tight block">
            MockGenius
          </span>
          <span className="text-[10px] text-zinc-500 font-mono block">
            {isAdmin ? 'Admin Portal' : 'Interview Workspace'}
          </span>
        </div>
      </div>

      {/* User Information Profile Box */}
      <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/40">
        <div className="flex items-center space-x-3">
          <img
            src={user.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
            alt={user.name}
            className="w-9 h-9 rounded-full border border-zinc-800 object-cover"
          />
          <div className="overflow-hidden flex-1">
            <span className="block font-medium text-xs text-zinc-200 truncate">{user.name}</span>
            <span className="block text-[10px] text-zinc-500 truncate font-mono">{user.email}</span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav aria-label="Main Navigation" className="flex-1 p-3 space-y-1 overflow-y-auto">
        <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-600 px-3 mb-2">
          Navigation
        </span>

        {activeLinks.map((link) => {
          const Icon = link.icon;
          const isActive = currentView === link.view;

          return (
            <button
              key={link.view}
              onClick={() => handleNavigate(link.view)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full group flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition ${
                isActive
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-100' : 'text-zinc-500 group-hover:text-zinc-300'}`} aria-hidden="true" />
              <span>{link.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-zinc-800/80 bg-[#09090b]">
        <button
          onClick={onLogout}
          aria-label="Log Out of InterviewAI"
          className="w-full flex items-center space-x-3 px-3 py-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60 rounded-md text-xs font-medium transition"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span>Log out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-3 left-4 z-50 w-9 h-9 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 flex items-center justify-center shadow-sm"
        aria-label={mobileOpen ? 'Close navigation sidebar' : 'Open navigation sidebar'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X className="w-4 h-4" aria-hidden="true" /> : <Menu className="w-4 h-4" aria-hidden="true" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 bg-[#09090b] border-r border-zinc-800/80 text-zinc-300 flex-col h-screen fixed top-0 left-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 w-60 bg-[#09090b] border-r border-zinc-800/80 text-zinc-300 flex flex-col h-screen z-40 transform transition-transform duration-200 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
