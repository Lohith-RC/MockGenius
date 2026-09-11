import { useState, useEffect } from 'react';
import {
  FileText,
  Video,
  AlertCircle,
  ArrowRight,
  Award,
  Sparkles,
  Calendar
} from 'lucide-react';
import { ResumeAnalysis, MockInterview, User } from '../types.js';
import { api } from '../lib/api.js';

interface StudentDashboardProps {
  user: User;
  onNavigate: (view: string, interviewId?: string) => void;
}

function AnimatedCounter({ value, duration = 900 }: { value: number | null; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === null || value === undefined) return;
    let startTimestamp: number | null = null;
    const startValue = 0;
    const endValue = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + (endValue - startValue) * eased));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [value, duration]);

  if (value === null || value === undefined) return <span>--</span>;
  return <span>{displayValue}</span>;
}

export default function StudentDashboard({ user, onNavigate }: StudentDashboardProps) {
  const [resume, setResume] = useState<ResumeAnalysis | null>(null);
  const [interviews, setInterviews] = useState<MockInterview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user resume analysis and interview history
    Promise.all([
      api.get('/api/resume/my-analysis').then((res) => res.json()),
      api.get('/api/interview/history').then((res) => res.json())
    ])
      .then(([resumeData, interviewData]) => {
        if (resumeData.success && resumeData.analysis) {
          setResume(resumeData.analysis);
        }
        if (interviewData.success && interviewData.history) {
          setInterviews(interviewData.history);
        }
      })
      .catch((err) => console.error('Failed to load dashboard data:', err))
      .finally(() => setLoading(false));
  }, []);

  const latestInterview = interviews[0] || null;
  const atsScore = resume ? resume.atsScore : 0;
  const interviewScore = latestInterview && latestInterview.overallScore ? latestInterview.overallScore : 0;

  // Calculate composite Placement Readiness Score
  // If only resume is uploaded: atsScore * 0.8
  // If only interview completed: interviewScore * 0.8
  // If both: (atsScore * 0.45) + (interviewScore * 0.55)
  let readinessScore = 0;
  if (resume && latestInterview) {
    readinessScore = Math.round(atsScore * 0.4 + interviewScore * 0.6);
  } else if (resume) {
    readinessScore = Math.round(atsScore * 0.8);
  } else if (latestInterview) {
    readinessScore = Math.round(interviewScore * 0.8);
  }

  // Get status class/text
  const getReadinessLevel = (score: number) => {
    if (score >= 85) return { text: 'Placement Ready (Excellent)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (score >= 70) return { text: 'Good (Needs Refinement)', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
    if (score >= 50) return { text: 'Needs Significant Improvement', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    return { text: 'Not Evaluated', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
  };

  const statusObj = getReadinessLevel(readinessScore);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-[#09090b]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-200 rounded-full animate-spin" />
          <p className="text-zinc-500 text-xs font-mono">loading_dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto text-slate-100">
      {/* Banner / Profile Incomplete Warning */}
      {!user.branch && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-xs text-amber-300">Complete your Interview Profile</h4>
              <p className="text-[10px] text-amber-400/80 mt-0.5">Please update your core engineering branch, skills, and target job roles to receive optimal mock interviews.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
          >
            <span>Update Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Stats Rows */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Readiness Index */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl -mr-12 -mt-12 -z-10" />
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Readiness Index</span>
              <Award className="w-5 h-5 text-violet-400" />
            </div>
            <div className="flex items-baseline space-x-2 mt-4">
              <span className="text-5xl font-extrabold text-white tracking-tight">
                <AnimatedCounter value={readinessScore} />
              </span>
              <span className="text-slate-500 text-xs font-semibold">/ 100</span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/40">
            <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusObj.color}`}>
              {statusObj.text}
            </span>
          </div>
        </div>

        {/* Resume ATS Status */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ATS Score Prediction</span>
              <FileText className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex items-baseline space-x-2 mt-4">
              <span className="text-5xl font-extrabold text-white tracking-tight">
                <AnimatedCounter value={atsScore} />
              </span>
              <span className="text-slate-500 text-xs font-semibold">/ 100</span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/40 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              {resume ? `${resume.skills.length} skills parsed` : 'No resume uploaded yet'}
            </span>
            <button
              onClick={() => onNavigate('resume-analyzer')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-0.5"
            >
              <span>{resume ? 'Recalculate' : 'Upload Now'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mock Interview Stats */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Latest Interview Score</span>
              <Video className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex items-baseline space-x-2 mt-4">
              <span className="text-5xl font-extrabold text-white tracking-tight">
                <AnimatedCounter value={interviewScore} />
              </span>
              <span className="text-slate-500 text-xs font-semibold">/ 100</span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/40 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              {interviews.length} {interviews.length === 1 ? 'interview' : 'interviews'} completed
            </span>
            <button
              onClick={() => onNavigate('interview-prep')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-0.5"
            >
              <span>{latestInterview ? 'History' : 'Start Prep'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Launch Panel */}
      <div className="border border-zinc-800 bg-[#111114] text-zinc-100 rounded-xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="relative max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-1.5 border border-zinc-800 bg-zinc-900 px-2.5 py-1 rounded-md text-[10px] font-mono text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>AI Interview Practice</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 font-heading">
            Ready to practice technical interview questions?
          </h3>
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
            Practice customized questions based on your resume, target role, and tech stack. Get instant feedback on your pacing, verbal fillers, and technical accuracy.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('interview-prep')}
              className="bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold px-5 py-2.5 rounded-md transition shadow-sm font-heading"
            >
              Start Practice Session
            </button>
            <button
              onClick={() => onNavigate('resume-analyzer')}
              className="border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-300 text-xs font-medium px-5 py-2.5 rounded-md transition font-heading"
            >
              Scan Resume
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Resume Insights & Interview Logs */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left: Resume Highlights */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800/40 pb-3">
            <h4 className="font-bold text-white text-sm font-display">Resume ATS Checklist</h4>
            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">My ATS Data</span>
          </div>

          {resume ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Active Resume:</span>
                <span className="text-xs font-bold text-white truncate max-w-[200px]" title={resume.fileName}>
                  {resume.fileName}
                </span>
              </div>

              {/* Skills matched list */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Identified Competencies</span>
                <div className="flex flex-wrap gap-1.5">
                  {resume.skills.slice(0, 8).map((skill, i) => (
                    <span key={i} className="bg-slate-800/80 text-slate-200 text-[10px] px-2 py-1 rounded-md font-medium border border-slate-700/50">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actionable items */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Critical Additions</span>
                <div className="space-y-2">
                  {resume.suggestions.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                      <p className="leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onNavigate('resume-analyzer')}
                className="w-full text-center bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold py-2.5 rounded-xl transition"
              >
                View Full ATS Breakdown
              </button>
            </div>
          ) : (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 bg-slate-900/60 text-slate-500 flex items-center justify-center rounded-full mx-auto border border-slate-800/80">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h5 className="font-bold text-xs text-slate-300">No Resume Uploaded</h5>
                <p className="text-[10px] text-slate-500 max-w-xs mx-auto">Scan your resume to match engineering keywords and predict screening scores.</p>
              </div>
              <button
                onClick={() => onNavigate('resume-analyzer')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                Upload Resume
              </button>
            </div>
          )}
        </div>

        {/* Right: Interview Logs */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800/40 pb-3">
            <h4 className="font-bold text-white text-sm font-display">Recent Mock Interviews</h4>
            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">My Progress</span>
          </div>

          {interviews.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Job Role</th>
                      <th className="pb-3 font-semibold">Date Completed</th>
                      <th className="pb-3 font-semibold">Questions</th>
                      <th className="pb-3 font-semibold text-right">Placement Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-xs text-slate-300">
                    {interviews.map((interview) => (
                      <tr key={interview.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 font-bold text-white">{interview.jobRole}</td>
                        <td className="py-3">
                          <span className="flex items-center space-x-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{new Date(interview.createdAt).toLocaleDateString()}</span>
                          </span>
                        </td>
                        <td className="py-3 font-mono text-[10px] text-slate-500">
                          {interview.answers.length} / {interview.questions.length} answered
                        </td>
                        <td className="py-3 text-right">
                          <span className={`font-bold font-mono text-xs ${
                            (interview.overallScore || 0) >= 80 ? 'text-emerald-400' : 'text-slate-300'
                          }`}>
                            {interview.overallScore ? `${interview.overallScore}%` : 'In Progress'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={() => onNavigate('interview-prep')}
                className="w-full text-center bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold py-2.5 rounded-xl transition"
              >
                Access Full Interview History
              </button>
            </div>
          ) : (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 bg-slate-900/60 text-slate-500 flex items-center justify-center rounded-full mx-auto border border-slate-800/80">
                <Video className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h5 className="font-bold text-xs text-slate-300">No Interviews Completed</h5>
                <p className="text-[10px] text-slate-500">Attend personalized mock technical questions to unlock scores.</p>
              </div>
              <button
                onClick={() => onNavigate('interview-prep')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                Start Interview
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
