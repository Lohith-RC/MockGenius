import { Sparkles, Database } from 'lucide-react';
import { User } from '../types.js';

interface NavbarProps {
  user: User;
  title: string;
}

export default function Navbar({ user, title }: NavbarProps) {
  return (
    <header className="h-16 border-b border-zinc-800/80 bg-[#09090b]/85 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3 pl-12 lg:pl-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <h2 className="font-heading text-base sm:text-lg text-zinc-100 font-bold tracking-[-0.02em]">
          {title}
        </h2>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-5">
        {/* Minimal System Badges */}
        <div className="hidden md:flex items-center space-x-2 text-xs font-mono">
          <div className="flex items-center space-x-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <Database className="w-3.5 h-3.5 text-zinc-400" />
            <span>SQLite</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span>Gemini AI</span>
          </div>
        </div>

        {/* User profile */}
        <div className="flex items-center space-x-3 border-l border-zinc-800 pl-3.5 sm:pl-5">
          <img
            src={user.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
            alt={user.name}
            className="w-8 h-8 rounded-full border border-zinc-700 object-cover"
          />
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-medium text-zinc-200 tracking-tight leading-snug">{user.name}</span>
            <span className="block text-[10px] text-zinc-500 font-mono uppercase">{user.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
