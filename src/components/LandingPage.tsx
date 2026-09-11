import { useState, useEffect } from 'react';
import {
  ArrowRight,
  Mic,
  Volume2,
  Play,
  Terminal,
  Code2,
  FileText,
  Activity
} from 'lucide-react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { User as UserType } from '../types.js';
import { api } from '../lib/api.js';

interface LandingPageProps {
  onLoginSuccess: (user: UserType) => void;
}

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [loading, setLoading] = useState<'google' | 'student' | 'admin' | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [oauthUrlInstructions, setOauthUrlInstructions] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dialogue' | 'feedback'>('dialogue');

  // Scroll-driven animation physics
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Scroll-linked transforms
  const heroScale = useTransform(smoothProgress, [0, 0.25], [1, 0.97]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.3], [1, 0.85]);
  const previewScale = useTransform(smoothProgress, [0.05, 0.35], [0.95, 1]);
  const previewY = useTransform(smoothProgress, [0.05, 0.35], [40, 0]);

  // Listen for login success event from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        api.get('/api/auth/me')
          .then((res) => res.json())
          .then((data) => {
            if (data.authenticated && data.user) {
              onLoginSuccess(data.user);
            }
          })
          .catch((err) => console.error('Failed to fetch user after OAuth:', err))
          .finally(() => setLoading(null));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLoginSuccess]);

  // Handle Google OAuth flow
  const handleGoogleLogin = async () => {
    setLoading('google');
    setOauthError(null);
    setOauthUrlInstructions(null);

    try {
      const response = await api.get('/api/auth/url');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.instructions || 'OAuth initial connection failed');
      }

      const { url } = await response.json();

      const authWindow = window.open(
        url,
        'google_oauth_popup',
        'width=550,height=650,left=150,top=100,resizable=yes,scrollbars=yes'
      );

      if (!authWindow) {
        setOauthError('Popup blocked! Please allow popups in your browser settings to proceed with Google Login.');
        setLoading(null);
      }
    } catch (err: any) {
      console.error('Google OAuth init error:', err);
      setOauthError(err.message);
      if (err.message.includes('Secrets')) {
        setOauthUrlInstructions(`To enable live Google OAuth:
1. Open Google Cloud Console -> APIs & Credentials.
2. Add Authorized Redirect URI: ${window.location.origin}/auth/callback
3. Add Client ID & Secret in AI Studio under Settings > Secrets.`);
      }
      setLoading(null);
    }
  };

  // Handle Demo login
  const handleDemoLogin = async (role: 'student' | 'admin') => {
    setLoading(role);
    try {
      const response = await api.post('/api/auth/demo', { role });
      if (!response.ok) {
        throw new Error('Demo login failed');
      }
      const data = await response.json();
      if (data.success && data.user) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      console.error(err);
      setOauthError('Demo login failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#09090b] text-[#f4f4f5] font-sans selection:bg-zinc-800 selection:text-white flex flex-col relative overflow-x-hidden">
      {/* Scroll-Driven Top Progress Line */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-zinc-200 origin-left z-50 pointer-events-none"
        style={{ scaleX: smoothProgress }}
      />

      {/* Minimal Sticky Nav */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#09090b]/85 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-heading font-bold text-lg text-zinc-100 tracking-tight">
              MockGenius
            </span>
            <span className="hidden sm:inline-block text-[11px] text-zinc-500 font-mono">
              / voice interview engine
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleDemoLogin('student')}
              disabled={loading !== null}
              className="text-xs font-medium text-zinc-400 hover:text-zinc-100 transition px-3 py-1.5 rounded-md hover:bg-zinc-900 font-mono"
            >
              [demo]
            </button>
            <button
              onClick={handleGoogleLogin}
              disabled={loading !== null}
              className="text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-900 px-4 py-2 rounded-md transition active:scale-[0.98] shadow-sm flex items-center gap-1.5"
            >
              {loading === 'google' ? 'Connecting...' : 'Sign in'}
              <ArrowRight className="w-3 h-3 text-zinc-900" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content with Scroll-Driven Scaling */}
      <main className="flex-1">
        {/* Hero Section */}
        <motion.section
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="pt-24 pb-16 md:pt-32 md:pb-20 px-6 max-w-4xl mx-auto text-center will-change-transform"
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400 text-xs font-mono mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>zero fluff • instant practice</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-heading text-4xl sm:text-6xl md:text-7xl font-bold tracking-[-0.04em] text-zinc-100 leading-[1.08]"
          >
            Talk through tech interviews <br className="hidden sm:inline" />
            <span className="text-zinc-500 font-medium">before the stakes are real.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed"
          >
            Real conversational questions with an AI that listens to your voice, asks follow-ups, and gives you instant feedback on your pacing, structure, and depth.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <button
              onClick={handleGoogleLogin}
              disabled={loading !== null}
              className="bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-sm px-6 py-3 rounded-lg transition active:scale-[0.98] shadow-sm flex items-center gap-2 font-heading"
            >
              <span>{loading === 'google' ? 'Connecting to Google...' : 'Start practicing with Google'}</span>
              <ArrowRight className="w-4 h-4 text-zinc-900" />
            </button>

            <button
              onClick={() => handleDemoLogin('student')}
              disabled={loading !== null}
              className="border border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 font-medium text-sm px-5 py-3 rounded-lg transition active:scale-[0.98] font-heading"
            >
              {loading === 'student' ? 'Launching...' : 'Try 2-minute demo'}
            </button>
          </motion.div>

          {/* OAuth Error Notification */}
          {oauthError && (
            <div className="mt-6 p-4 rounded-lg bg-red-950/30 border border-red-900/50 text-red-300 text-xs text-left max-w-md mx-auto">
              <p className="font-semibold">{oauthError}</p>
              {oauthUrlInstructions && (
                <pre className="mt-2 p-2 bg-black/60 rounded font-mono text-[10px] whitespace-pre-wrap text-zinc-400">
                  {oauthUrlInstructions}
                </pre>
              )}
            </div>
          )}
        </motion.section>

        {/* Scroll-Driven Interactive Product Window */}
        <motion.section
          style={{ scale: previewScale, y: previewY }}
          className="px-6 max-w-4xl mx-auto mb-24 will-change-transform"
        >
          <div className="text-left border border-zinc-800 bg-[#121215] rounded-xl overflow-hidden shadow-2xl">
            {/* macOS Chrome Header */}
            <div className="px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="ml-2 text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                  round_01 // system_design_redis_cache
                </span>
              </div>

              {/* View Switcher */}
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-md border border-zinc-800 text-[11px] font-mono">
                <button
                  onClick={() => setActiveTab('dialogue')}
                  className={`px-2.5 py-1 rounded transition ${
                    activeTab === 'dialogue' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  live_dialogue
                </button>
                <button
                  onClick={() => setActiveTab('feedback')}
                  className={`px-2.5 py-1 rounded transition ${
                    activeTab === 'feedback' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  feedback_report
                </button>
              </div>
            </div>

            {/* Tabbed Content Area */}
            <div className="p-6 sm:p-8">
              {activeTab === 'dialogue' ? (
                <div className="space-y-6">
                  {/* Spoken Question */}
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-zinc-300">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-mono text-zinc-500">AI Interviewer</span>
                      <p className="text-sm sm:text-base text-zinc-100 font-medium leading-relaxed font-heading">
                        "How would you handle cache invalidation across distributed edge nodes when high-frequency writes occur?"
                      </p>
                    </div>
                  </div>

                  {/* Candidate Spoken Answer */}
                  <div className="flex gap-4 pl-4 sm:pl-8 border-l border-zinc-800">
                    <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-emerald-400">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-zinc-400">Your Voice Stream</span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                          138 wpm • steady
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-300 font-mono leading-relaxed">
                        "I'd implement a Cache-Aside pattern paired with an event-driven pub/sub bus like Kafka. When a write hits the primary database, a CDC event fires to invalidate the distributed edge caches asynchronously..."
                      </p>
                    </div>
                  </div>

                  {/* Status Strip */}
                  <div className="pt-2 flex items-center justify-between text-xs text-zinc-500 font-mono border-t border-zinc-800/80">
                    <span>Fillers: 0 detected</span>
                    <span>Elapsed: 01:18</span>
                    <span className="text-emerald-400">Audio Ingestion: 48kHz</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-zinc-100 font-heading">Strong Technical Delivery</h4>
                      <p className="text-xs text-zinc-400 mt-0.5 font-mono">Evaluation completed in 240ms</p>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-2xl font-bold text-emerald-400">94</span>
                      <span className="text-xs text-zinc-500">/100</span>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/50">
                      <span className="text-[11px] font-mono text-zinc-400 block mb-1">Concept Mastery</span>
                      <p className="text-xs text-zinc-300 leading-snug">
                        Correctly identified Change Data Capture (CDC) rather than synchronous blocking writes.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/50">
                      <span className="text-[11px] font-mono text-zinc-400 block mb-1">Cadence</span>
                      <p className="text-xs text-zinc-300 leading-snug">
                        138 words per minute. Confident pauses between system components.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/50">
                      <span className="text-[11px] font-mono text-zinc-400 block mb-1">Pro Tip</span>
                      <p className="text-xs text-zinc-300 leading-snug">
                        Mention eventual consistency trade-offs when edge network lag spikes.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* PUNCHY 3-PART CAPABILITY MATRIX (Replaces verbose process sections) */}
        <section className="py-20 border-t border-zinc-800/80 max-w-4xl mx-auto px-6">
          <div className="text-left mb-12">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block mb-1">
              Capabilities
            </span>
            <h2 className="font-heading text-2xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
              Everything you need. Zero fluff.
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {/* Card 1 */}
            <div className="p-6 rounded-xl border border-zinc-800 bg-[#111114] hover:border-zinc-700 transition flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300">
                  <Mic className="w-4 h-4" />
                </div>
                <h3 className="font-heading text-lg font-bold text-zinc-100 tracking-tight">
                  The Voice Simulator
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Real speech recognition with an AI that doesn't interrupt or judge. Practice framing architecture out loud until answers roll off your tongue.
                </p>
              </div>
              <span className="mt-6 text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                01 // conversational_engine
              </span>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-xl border border-zinc-800 bg-[#111114] hover:border-zinc-700 transition flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="font-heading text-lg font-bold text-zinc-100 tracking-tight">
                  Instant Telemetry
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Words-per-minute speedometers, verbal crutch counters ('um', 'like'), and technical completeness scores—delivered seconds after you stop speaking.
                </p>
              </div>
              <span className="mt-6 text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                02 // speech_analytics
              </span>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-xl border border-zinc-800 bg-[#111114] hover:border-zinc-700 transition flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300">
                  <Code2 className="w-4 h-4" />
                </div>
                <h3 className="font-heading text-lg font-bold text-zinc-100 tracking-tight">
                  Code Lab & ATS Match
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Integrated VS Code Monaco IDE with instant test-case execution, plus deep PDF resume parsing to find skill gaps before you send your application.
                </p>
              </div>
              <span className="mt-6 text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                03 // ide_and_resume
              </span>
            </div>
          </div>
        </section>

        {/* Minimal Call to Action */}
        <section className="py-24 border-t border-zinc-800/80 text-center px-6">
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="font-heading text-3xl sm:text-5xl font-bold text-zinc-100 tracking-[-0.03em]">
              Ready to get in the room?
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              No audience, no judgment, and no stakes. Just a calm place to practice until you're ready.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleGoogleLogin}
                disabled={loading !== null}
                className="bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-sm px-6 py-3 rounded-lg transition active:scale-[0.98] shadow-sm flex items-center gap-2 font-heading"
              >
                <span>Sign in with Google</span>
                <ArrowRight className="w-4 h-4 text-zinc-900" />
              </button>
              <button
                onClick={() => handleDemoLogin('student')}
                disabled={loading !== null}
                className="border border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 text-zinc-300 font-medium text-sm px-5 py-3 rounded-lg transition font-heading"
              >
                Instant candidate sandbox
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-zinc-800/60 py-8 px-6 text-xs text-zinc-500 font-mono">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>MockGenius • Built for engineers preparing for their next role</span>
          <div className="flex items-center gap-4 text-zinc-400">
            <button onClick={() => handleDemoLogin('admin')} className="hover:text-zinc-200 transition">
              [admin]
            </button>
            <span>•</span>
            <button onClick={() => handleDemoLogin('student')} className="hover:text-zinc-200 transition">
              [sandbox]
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
