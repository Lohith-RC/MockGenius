import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Terminal,
  Code2,
  Activity,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { User as UserType } from '../types.js';
import { api } from '../lib/api.js';
import { sound } from '../lib/sound.js';

interface LandingPageProps {
  onLoginSuccess: (user: UserType) => void;
}

type RoleTrack = 'sysdesign' | 'frontend' | 'backend' | 'behavioral';

interface QuestionScenario {
  id: RoleTrack;
  label: string;
  role: string;
  question: string;
  sampleAnswer: string;
  wpm: number;
  score: number;
  goodPoint: string;
  improvePoint: string;
}

const SCENARIOS: Record<RoleTrack, QuestionScenario> = {
  sysdesign: {
    id: 'sysdesign',
    label: 'System Design',
    role: 'Staff Infrastructure Round',
    question: 'How would you handle cache invalidation across 50 distributed edge nodes when high-frequency database writes occur?',
    sampleAnswer: 'I would use a Cache-Aside pattern combined with Change Data Capture (CDC) via Kafka. On database commit, an async event broadcasts to edge nodes with a small TTL buffer, avoiding synchronous write blocking while bounding eventual consistency to under 80ms.',
    wpm: 138,
    score: 94,
    goodPoint: 'Immediately addressed asynchronous CDC decoupling instead of naive dual-writes.',
    improvePoint: 'Consider quantifying what happens if Kafka partition consumer lag spikes.'
  },
  frontend: {
    id: 'frontend',
    label: 'Frontend & UI',
    role: 'Senior React Architect Round',
    question: 'How do you prevent UI layout jank and frame drops when rendering an infinite feed of 100,000 mixed-height media cards?',
    sampleAnswer: 'I would implement a dynamic windowing list using intersection observers, estimating item heights with a resize observer cache. By unmounting offscreen DOM nodes and keeping paint operations within 16ms animation frames, memory and reflow costs remain constant regardless of list depth.',
    wpm: 144,
    score: 96,
    goodPoint: 'Focused on constant DOM memory foot-print and RAF paint budgets.',
    improvePoint: 'Mention keyboard accessibility and scroll restoration strategies.'
  },
  backend: {
    id: 'backend',
    label: 'Backend & APIs',
    role: 'Distributed Services Round',
    question: 'A critical downstream payment gateway is experiencing intermittent 504 timeouts. How do you prevent cascade failure in your API tier?',
    sampleAnswer: 'I would deploy a circuit breaker pattern with exponential backoff and jitter. Once error rates breach 15%, the circuit trips to immediately fail-fast or route to an async retry queue, preventing database connection pool exhaustion in our upstream web tier.',
    wpm: 132,
    score: 92,
    goodPoint: 'Used jittered backoff to prevent thundering herd retry storms.',
    improvePoint: 'Detail whether idempotent request tokens are enforced on retries.'
  },
  behavioral: {
    id: 'behavioral',
    label: 'Leadership',
    role: 'Engineering Culture Round',
    question: 'Tell me about a disagreement with a product manager over shipping a feature with known architectural debt.',
    sampleAnswer: 'We had a hard deadline for Q3 launch, but shipping without schema versioning risked data migration locks later. I sat down with the PM, mapped the rollback cost in dollar terms, and proposed an MVP compromise: ship the core flow now with an automated migration guardrail, scheduling the full refactor in the very next sprint.',
    wpm: 136,
    score: 95,
    goodPoint: 'Translated technical risk into business and revenue impacts without being defensive.',
    improvePoint: 'Share how you followed up post-launch to ensure the refactor happened.'
  }
};

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [loading, setLoading] = useState<'google' | 'student' | 'admin' | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [oauthUrlInstructions, setOauthUrlInstructions] = useState<string | null>(null);
  const [activeTrack, setActiveTrack] = useState<RoleTrack>('sysdesign');
  const [viewMode, setViewMode] = useState<'dialogue' | 'feedback'>('dialogue');
  const [isMuted, setIsMuted] = useState(sound.isMuted());

  // Interactive Live Mic Testing on Landing Page
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [computedWpm, setComputedWpm] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll-driven animation transforms
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const heroScale = useTransform(smoothProgress, [0, 0.25], [1, 0.97]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.3], [1, 0.85]);
  const previewScale = useTransform(smoothProgress, [0.05, 0.35], [0.95, 1]);
  const previewY = useTransform(smoothProgress, [0.05, 0.35], [35, 0]);

  // Mouse spotlight coordinates
  const previewRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    previewRef.current.style.setProperty('--mouse-x', `${x}px`);
    previewRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  // Recording elapsed timer
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Handle live Web Speech test on Landing Page
  const handleToggleLiveMic = () => {
    sound.playClick(isRecording ? 800 : 1200);

    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      sound.playChime();
      const words = liveTranscript.trim().split(/\s+/).filter(Boolean).length;
      const mins = Math.max(recordingSeconds, 2) / 60;
      setComputedWpm(Math.round(words / mins));
      return;
    }

    // Check Speech Recognition support
    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechAPI) {
      // Fallback simulation
      handleSimulateVoice();
      return;
    }

    try {
      const recognition = new SpeechAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      setLiveTranscript('');
      setRecordingSeconds(0);
      setComputedWpm(null);
      setIsRecording(true);
      sound.playMicStart();

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        setLiveTranscript(transcript);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      handleSimulateVoice();
    }
  };

  // Fallback simulator for users without a working microphone
  const handleSimulateVoice = () => {
    setIsRecording(true);
    setLiveTranscript('');
    setRecordingSeconds(0);
    setComputedWpm(null);
    sound.playMicStart();

    const text = SCENARIOS[activeTrack].sampleAnswer;
    const words = text.split(' ');
    let currentIdx = 0;

    const interval = setInterval(() => {
      currentIdx += 4;
      if (currentIdx >= words.length) {
        clearInterval(interval);
        setLiveTranscript(text);
        setIsRecording(false);
        setComputedWpm(SCENARIOS[activeTrack].wpm);
        sound.playChime();
      } else {
        setLiveTranscript(words.slice(0, currentIdx).join(' '));
      }
    }, 200);
  };

  const handleSelectTrack = (track: RoleTrack) => {
    sound.playClick(1000);
    setActiveTrack(track);
    setLiveTranscript('');
    setComputedWpm(null);
  };

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) sound.playClick(1200);
  };

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
    sound.playClick();
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
    sound.playClick();
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

  const currentScenario = SCENARIOS[activeTrack];
  const activeAnswer = liveTranscript || currentScenario.sampleAnswer;
  const activeWpm = computedWpm || currentScenario.wpm;

  return (
    <div className="min-h-[100dvh] bg-[#09090b] text-[#f4f4f5] font-sans selection:bg-zinc-800 selection:text-white flex flex-col relative overflow-x-hidden">
      {/* Scroll-Driven Top Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-zinc-200 origin-left z-50 pointer-events-none"
        style={{ scaleX: smoothProgress }}
      />

      {/* Sticky Minimal Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#09090b]/85 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-heading font-bold text-lg text-zinc-100 tracking-tight">
              MockGenius
            </span>
            <span className="hidden sm:inline-block text-[11px] text-zinc-500 font-mono">
              / conversational interview lab
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Tactile Audio Mute Toggle */}
            <button
              onClick={handleToggleSound}
              className="p-1.5 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs transition"
              title={isMuted ? 'Unmute UI sounds' : 'Mute UI sounds'}
              aria-label="Toggle UI Sound Effects"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-zinc-300" />}
            </button>

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
              className="text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-900 px-4 py-2 rounded-md transition active:scale-[0.98] shadow-sm flex items-center gap-1.5 font-heading"
            >
              {loading === 'google' ? 'Connecting...' : 'Sign in'}
              <ArrowRight className="w-3.5 h-3.5 text-zinc-900" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Hero */}
      <main className="flex-1">
        <motion.section
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="pt-24 pb-12 md:pt-32 md:pb-16 px-6 max-w-4xl mx-auto text-center will-change-transform"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400 text-xs font-mono mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Interactive Simulator • Try Your Voice Below</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl font-bold tracking-[-0.04em] text-zinc-100 leading-[1.08]">
            Talk through tech interviews <br className="hidden sm:inline" />
            <span className="text-zinc-500 font-medium">before the stakes are real.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Pick a track, answer out loud into your mic, and see your live pacing, verbal filler habits, and technical depth in real time.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleGoogleLogin}
              disabled={loading !== null}
              className="bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-sm px-6 py-3 rounded-lg transition active:scale-[0.98] shadow-sm flex items-center gap-2 font-heading"
            >
              <span>{loading === 'google' ? 'Connecting to Google...' : 'Get started with Google'}</span>
              <ArrowRight className="w-4 h-4 text-zinc-900" />
            </button>

            <button
              onClick={() => handleDemoLogin('student')}
              disabled={loading !== null}
              className="border border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 font-medium text-sm px-5 py-3 rounded-lg transition active:scale-[0.98] font-heading"
            >
              {loading === 'student' ? 'Launching...' : 'Explore Candidate Sandbox'}
            </button>
          </div>

          {oauthError && (
            <div className="mt-6 p-4 rounded-lg bg-red-950/30 border border-red-900/50 text-red-300 text-xs text-left max-w-md mx-auto font-mono">
              <p className="font-semibold">{oauthError}</p>
              {oauthUrlInstructions && (
                <pre className="mt-2 p-2 bg-black/60 rounded text-[10px] whitespace-pre-wrap text-zinc-400">
                  {oauthUrlInstructions}
                </pre>
              )}
            </div>
          )}
        </motion.section>

        {/* ULTRA-ENGAGING INTERACTIVE HERO PREVIEW CARD */}
        <motion.section
          style={{ scale: previewScale, y: previewY }}
          className="px-4 sm:px-6 max-w-4xl mx-auto mb-24 will-change-transform"
        >
          {/* Interactive Role Switcher Filter Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3 px-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(Object.keys(SCENARIOS) as RoleTrack[]).map((track) => (
                <button
                  key={track}
                  onClick={() => handleSelectTrack(track)}
                  className={`px-3 py-1.5 rounded-md text-xs font-heading font-medium transition ${
                    activeTrack === track
                      ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                      : 'border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {SCENARIOS[track].label}
                </button>
              ))}
            </div>

            {/* Quick Live Mic Action Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleLiveMic}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition border ${
                  isRecording
                    ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                }`}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{isRecording ? `Stop Recording (${recordingSeconds}s)` : 'Test Your Mic Live'}</span>
              </button>
            </div>
          </div>

          {/* Mouse-Tracking Spotlight Window */}
          <div
            ref={previewRef}
            onMouseMove={handleMouseMove}
            className="spotlight-interactive text-left border border-zinc-800 bg-[#121215] rounded-xl overflow-hidden shadow-2xl"
          >
            {/* macOS Chrome Header */}
            <div className="px-5 py-3 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="ml-2 text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                  {currentScenario.role}
                </span>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-md border border-zinc-800 text-[11px] font-mono">
                <button
                  onClick={() => { sound.playClick(900); setViewMode('dialogue'); }}
                  className={`px-2.5 py-0.5 rounded transition ${
                    viewMode === 'dialogue' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  dialogue
                </button>
                <button
                  onClick={() => { sound.playClick(900); setViewMode('feedback'); }}
                  className={`px-2.5 py-0.5 rounded transition ${
                    viewMode === 'feedback' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  feedback
                </button>
              </div>
            </div>

            {/* Interactive Content */}
            <div className="p-6 sm:p-8">
              {viewMode === 'dialogue' ? (
                <div className="space-y-6">
                  {/* Spoken Question */}
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-zinc-300">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-mono text-zinc-500">AI Interviewer</span>
                      <p className="text-sm sm:text-base text-zinc-100 font-medium leading-relaxed font-heading">
                        "{currentScenario.question}"
                      </p>
                    </div>
                  </div>

                  {/* Candidate Spoken Response */}
                  <div className="flex gap-4 pl-4 sm:pl-8 border-l border-zinc-800">
                    <div className={`w-8 h-8 rounded-md border flex items-center justify-center flex-shrink-0 transition ${
                      isRecording ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-zinc-900 border-zinc-700 text-emerald-400'
                    }`}>
                      <Mic className="w-4 h-4" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-mono text-zinc-400">
                          {isRecording ? 'Listening live to your microphone...' : 'Spoken Response Transcript'}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                          {activeWpm} wpm • {activeWpm >= 120 && activeWpm <= 155 ? 'optimal cadence' : 'measured'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-300 font-mono leading-relaxed min-h-[50px]">
                        "{activeAnswer}"
                        {isRecording && <span className="inline-block w-1.5 h-3.5 ml-1 bg-emerald-400 animate-pulse align-middle" />}
                      </p>
                    </div>
                  </div>

                  {/* Status Strip & Live Mic Controls */}
                  <div className="pt-2 flex items-center justify-between flex-wrap gap-2 text-xs text-zinc-500 font-mono border-t border-zinc-800/80">
                    <div className="flex items-center gap-3">
                      <span>Fillers: 0 detected</span>
                      <span>•</span>
                      <span>Latency: &lt; 350ms</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSimulateVoice}
                        className="text-[11px] text-zinc-400 hover:text-zinc-200 underline font-mono"
                      >
                        [replay sample answer]
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-zinc-100 font-heading">
                        Competency Evaluation: {currentScenario.label}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5 font-mono">Scored against verified staff engineer rubrics</p>
                    </div>
                    
                    {/* Animated SVG Radial Score Meter */}
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-12 h-12 circle-progress" viewBox="0 0 36 36">
                          <path
                            className="text-zinc-800"
                            strokeWidth="3"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-emerald-400"
                            strokeDasharray="100, 100"
                            strokeDashoffset={100 - currentScenario.score}
                            strokeWidth="3"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className="absolute font-mono text-xs font-bold text-emerald-400">
                          {currentScenario.score}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/50">
                      <span className="text-[11px] font-mono text-zinc-400 block mb-1">Strongest Point</span>
                      <p className="text-xs text-zinc-300 leading-snug">
                        {currentScenario.goodPoint}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/50">
                      <span className="text-[11px] font-mono text-zinc-400 block mb-1">Room to Improve</span>
                      <p className="text-xs text-zinc-300 leading-snug">
                        {currentScenario.improvePoint}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/50">
                      <span className="text-[11px] font-mono text-zinc-400 block mb-1">Cadence Feedback</span>
                      <p className="text-xs text-zinc-300 leading-snug">
                        {activeWpm} words per minute. Pacing is natural, steady, and clear.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* PUNCHY CAPABILITY MATRIX */}
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
                01 // voice_engine
              </span>
            </div>

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
