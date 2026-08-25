import { useState, useEffect } from 'react';
import {
  Video,
  Play,
  Calendar,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
  AwardIcon,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { User, MockInterview } from '../types.js';

interface InterviewPrepProps {
  user: User;
  onNavigate: (view: string, targetId?: string) => void;
}

export default function InterviewPrep({ user, onNavigate }: InterviewPrepProps) {
  const [history, setHistory] = useState<MockInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/interview/history')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.history) {
          setHistory(data.history);
        }
      })
      .catch((err) => console.error('Failed to load interview history:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleStartInterview = async () => {
    if (!user.branch) {
      setError('Please complete your placement profile (branch, skills, projects) before launching a mock interview.');
      return;
    }

    setStarting(true);
    setError(null);

    try {
      const response = await fetch('/api/interview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Could not compile interview questions. Please try again.');
      }

      const data = await response.json();
      if (data.success && data.interview) {
        // Navigate directly to mock interview page with ID
        onNavigate('mock-interview', data.interview.id);
      } else {
        throw new Error('Interview initialization payload error.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating interview modules.');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-[#020617]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-xs font-semibold">Retrieving mock records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-slate-100">
      {/* Configuration Header */}
      <div className="grid md:grid-cols-12 gap-8 items-center glass-panel p-8 rounded-3xl">
        <div className="md:col-span-8 space-y-4">
          <div className="inline-flex items-center space-x-1 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase font-mono">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-violet-400" />
            <span>Placement Readiness Assessment</span>
          </div>
          <h3 className="text-2xl font-extrabold text-white tracking-tight font-display">AI Mock Interview Board</h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
            Launch a tailored technical, behavioral, and resume-based questionnaire based on your listed skills 
            (<span className="font-semibold text-indigo-300">{user.skills?.join(', ') || 'General'}</span>) 
            and branch. Complete answers via text to receive dynamic scoring.
          </p>

          {error && (
            <p className="text-xs font-semibold text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 max-w-xl">
              {error}
            </p>
          )}

          <div className="pt-2">
            <button
              onClick={handleStartInterview}
              disabled={starting}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs px-6 py-3.5 rounded-xl transition flex items-center space-x-2 shadow-lg shadow-violet-600/20"
            >
              {starting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Configuring custom questions...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-white fill-white" />
                  <span>Begin AI Mock Session</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="hidden md:block md:col-span-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-3 text-xs">
          <span className="font-bold text-slate-300 block mb-1">Interview Composition:</span>
          <div className="flex items-center justify-between text-slate-400">
            <span>1. Core HR Warm-up</span>
            <span className="font-mono text-[10px] font-semibold text-slate-500">1 Question</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>2. Technical Coding / Theory</span>
            <span className="font-mono text-[10px] font-semibold text-slate-500">1 Question</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>3. Resume & Project-Based</span>
            <span className="font-mono text-[10px] font-semibold text-slate-500">1 Question</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>4. Behavioral / Scenario</span>
            <span className="font-mono text-[10px] font-semibold text-slate-500">1 Question</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>5. Analytical Aptitude Check</span>
            <span className="font-mono text-[10px] font-semibold text-slate-500">1 Question</span>
          </div>
        </div>
      </div>

      {/* History log block */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h4 className="font-bold text-white text-sm font-display">Past Performance Logs</h4>
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">My Records ({history.length})</span>
        </div>

        {history.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((interview) => (
              <div key={interview.id} className="glass-card rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:border-indigo-500/40 transition">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-white text-sm leading-tight font-display">{interview.jobRole}</h5>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Level: {interview.experienceLevel}
                      </span>
                    </div>
                    {interview.overallScore ? (
                      <span className="text-xs font-bold font-mono px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                        {interview.overallScore}%
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full">
                        In Progress
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                    {interview.feedbackText || 'No overall feedback compiled yet. Answer all generated questions to generate report.'}
                  </p>
                </div>

                <div className="border-t border-slate-800/40 pt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(interview.createdAt).toLocaleDateString()}</span>
                  </span>

                  <button
                    onClick={() => onNavigate('mock-interview', interview.id)}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-0.5"
                  >
                    <span>{interview.status === 'completed' ? 'Review Report' : 'Resume Mock'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-12 text-center space-y-4">
            <div className="w-12 h-12 bg-slate-900/60 text-slate-500 flex items-center justify-center rounded-full mx-auto border border-slate-800/80">
              <Video className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h5 className="font-bold text-xs text-slate-300">No Assessment History</h5>
              <p className="text-[10px] text-slate-500 max-w-md mx-auto">You have not completed any AI Mock Interviews yet. Launch an active session above to unlock scores and placement summaries.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple local Refresh Icon to avoid imports
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
