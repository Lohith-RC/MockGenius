import { Sparkles, Database } from 'lucide-react';
import { User } from '../types.js';

interface NavbarProps {
  user: User;
  title: string;
}

export default function Navbar({ user, title }: NavbarProps) {
  return (
    <header className="h-16 border-b border-slate-800/40 bg-slate-950/40 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-2 pl-12 lg:pl-0">
        <h2 className="font-extrabold text-base sm:text-lg text-white tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center space-x-4 sm:space-x-6">
        {/* System Status */}
        <div className="hidden md:flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5 bg-slate-900/60 px-2.5 py-1 rounded-full text-slate-300 border border-slate-800/80">
            <Database className="w-3.5 h-3.5 text-violet-400" />
            <span>Persistent Store</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 px-2.5 py-1 rounded-full text-violet-300 border border-violet-500/20">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
            <span>AI: Gemini</span>
          </div>
        </div>

        {/* User profile badge */}
        <div className="flex items-center space-x-2.5 border-l border-slate-800/80 pl-4">
          <img
            src={user.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
            alt={user.name}
            className="w-8 h-8 rounded-full border border-slate-800 object-cover"
          />
          <div className="hidden sm:block">
            <span className="block text-xs font-bold text-white">{user.name}</span>
            <span className="block text-[9px] text-slate-400 font-medium capitalize">{user.role} Account</span>
          </div>
        </div>
      </div>
    </header>
  );
}
