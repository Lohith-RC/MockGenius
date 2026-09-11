import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, CheckCircle } from 'lucide-react';
import { User } from '../types.js';
import { api } from '../lib/api.js';

interface ProfileProps {
  user: User;
  onProfileUpdate: (updatedUser: User) => void;
}

export default function ProfileManagement({ user, onProfileUpdate }: ProfileProps) {
  const [branch, setBranch] = useState(user.branch || 'Computer Science');
  const [skills, setSkills] = useState(user.skills ? user.skills.join(', ') : '');
  const [projects, setProjects] = useState(user.projects ? user.projects.join(', ') : '');
  const [targetRole, setTargetRole] = useState(user.targetRole || 'Full Stack Engineer');
  const [experienceLevel, setExperienceLevel] = useState(user.experienceLevel || 'Entry Level');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await api.put('/api/profile', {
        branch,
        skills,
        projects,
        targetRole,
        experienceLevel
      });

      if (!response.ok) {
        throw new Error('Failed to update student profile.');
      }

      const data = await response.json();
      if (data.success && data.user) {
        onProfileUpdate(data.user);
        setMessage('Your Placement Profile has been successfully updated!');
      }
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || 'An error occurred during save.');
    } finally {
      setLoading(false);
    }
  };

  const BRANCHES = [
    'Computer Science',
    'Information Technology',
    'Electronics & Communication',
    'Electrical & Electronics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering'
  ];

  const EXPERIENCE_LEVELS = [
    'Internship',
    'Entry Level',
    'Associate (1-2 Years Experience)'
  ];

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 text-slate-100">
      {/* Intro header */}
      <div className="glass-panel p-6 rounded-2xl space-y-1">
        <h3 className="font-bold text-white text-sm font-display">Placement Interview Settings</h3>
        <p className="text-xs text-slate-400">Configure your target roles and technical skills. AI questions are dynamically custom-generated based on these values.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
        <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider font-mono">Student Profile Settings</h4>

        {message && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center space-x-1.5 font-semibold">
            <CheckCircle className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Branch Selection */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Engineering Branch</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full p-3 border border-slate-800 rounded-xl text-xs bg-slate-950/60 text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              {BRANCHES.map((b) => (
                <option key={b} value={b} className="bg-slate-900 text-slate-100">{b}</option>
              ))}
            </select>
          </div>

          {/* Target Job Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Target Career Role</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Full Stack Engineer, Systems Associate"
              className="w-full p-3 border border-slate-800 rounded-xl text-xs bg-slate-950/60 text-slate-100 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>
        </div>

        {/* Experience Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Experience Profile Segment</label>
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="w-full p-3 border border-slate-800 rounded-xl text-xs bg-slate-950/60 text-slate-100 focus:outline-none focus:border-indigo-500"
          >
            {EXPERIENCE_LEVELS.map((level) => (
              <option key={level} value={level} className="bg-slate-900 text-slate-100">{level}</option>
            ))}
          </select>
        </div>

        {/* Skills input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Core Technical Competencies (Comma-separated)</label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="React, TypeScript, SQL, Node.js, Spring Boot"
            className="w-full p-3 border border-slate-800 rounded-xl text-xs bg-slate-950/60 text-slate-100 focus:outline-none focus:border-indigo-500"
            required
          />
          <span className="block text-[10px] text-slate-500">Provide direct technologies to receive accurate coding and design challenges.</span>
        </div>

        {/* Projects list */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Key Projects Undertaken (Comma-separated)</label>
          <input
            type="text"
            value={projects}
            onChange={(e) => setProjects(e.target.value)}
            placeholder="AI Platform, Weather Widget, Academic Management System"
            className="w-full p-3 border border-slate-800 rounded-xl text-xs bg-slate-950/60 text-slate-100 focus:outline-none focus:border-indigo-500"
            required
          />
          <span className="block text-[10px] text-slate-500">AI-interview engines will generate specific questions targeting these project structures.</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs py-3.5 rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-violet-600/20"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Saving and restructuring prompts...</span>
            </>
          ) : (
            <span>Save Settings & Unlock Interviews</span>
          )}
        </button>
      </form>
    </div>
  );
}

// Simple local Refresh icon
function RefreshCw(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
