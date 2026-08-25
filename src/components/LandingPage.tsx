import { useState, useEffect } from 'react';
import { Shield, Sparkles, BookOpen, BarChart3, ArrowRight, Chrome, User, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { User as UserType } from '../types.js';

interface LandingPageProps {
  onLoginSuccess: (user: UserType) => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const slideRight = {
  hidden: { opacity: 0, x: 48 },
  visible: { opacity: 1, x: 0 },
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [oauthUrlInstructions, setOauthUrlInstructions] = useState<string | null>(null);

  // Listen for login success event from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Allow messages from same origin or run.app origins
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        // Fetch newly logged-in user profile
        fetch('/api/auth/me')
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
      const response = await fetch('/api/auth/url');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.instructions || 'OAuth initial connection failed');
      }

      const { url } = await response.json();

      // Open Google authorization URL directly in popup
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
      // Give details of how to configure in Secrets if failing
      setOauthError(err.message);
      if (err.message.includes('Secrets')) {
        setOauthUrlInstructions(`To enable live Google OAuth:
1. Open Google Cloud Console -> APIs & Credentials.
2. Add Authorized Redirect URI: ${window.location.origin}/auth/callback
3. Add Client ID & Secret in AI Studio under Settings > Secrets (keys: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET).`);
      }
      setLoading(null);
    }
  };

  // Handle Demo login (instant preview helper)
  const handleDemoLogin = async (role: 'student' | 'admin') => {
    setLoading(role);
    try {
      const response = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });

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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-indigo-100">
      {/* Animated Gradient Top Line */}
      <motion.div
        className="h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500 w-full"
        initial={{ scaleX: 0, transformOrigin: 'left' }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />

      {/* Header */}
      <motion.header
        className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 transition-all"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-slate-900">
                Interview<span className="text-indigo-600">AI</span>
              </span>
              <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-semibold font-mono">
                Placement Co-Pilot
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleDemoLogin('student')}
              className="hidden sm:inline-flex text-xs font-semibold px-4 py-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition"
            >
              Student Demo
            </button>
            <button
              onClick={() => handleDemoLogin('admin')}
              className="hidden sm:inline-flex text-xs font-semibold px-4 py-2 text-indigo-600 border border-indigo-200 hover:bg-indigo-50 rounded-lg transition"
            >
              Admin Demo
            </button>
            <button
              onClick={handleGoogleLogin}
              disabled={loading !== null}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm shadow-indigo-100"
            >
              <Chrome className="w-4 h-4" />
              <span>Login</span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Hero */}
      <main className="flex-1">
        {/* Hero Section with Animated Background */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
          {/* Animated Background Grid Pattern */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0,transparent_50%)]" />
            <motion.div
              className="absolute top-20 left-10 w-72 h-72 bg-violet-300/20 rounded-full blur-3xl"
              animate={{
                x: [0, 30, 0],
                y: [0, -20, 0],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl"
              animate={{
                x: [0, -40, 0],
                y: [0, 30, 0],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-200/15 rounded-full blur-3xl"
              animate={{
                x: [-20, 20, -20],
                y: [-30, 10, -30],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              className="lg:col-span-7 space-y-8 text-center lg:text-left"
              variants={stagger}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200/60 text-violet-700 text-xs font-semibold px-4 py-2 rounded-full shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Placement Readiness Platform</span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                transition={{ duration: 0.6 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]"
              >
                Supercharge Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600">
                  Placement Readiness
                </span>{' '}
                With AI Guidance.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                transition={{ duration: 0.6 }}
                className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              >
                Scan your engineering resume for ATS scoring, optimize matching keywords, generate custom interview question repositories, and experience realistic mock interviews powered by Gemini AI.
              </motion.p>

              {/* Action Buttons Panel */}
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="pt-4 flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-4"
              >
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading !== null}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-bold px-8 py-4 rounded-xl transition shadow-lg shadow-slate-300 group"
                >
                  <Chrome className="w-5 h-5 text-violet-400" />
                  <span>{loading === 'google' ? 'Connecting...' : 'Sign In with Google'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </button>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleDemoLogin('student')}
                    disabled={loading !== null}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 border border-slate-300 hover:border-violet-500 hover:bg-violet-50 bg-white text-slate-700 font-semibold px-5 py-4 rounded-xl transition shadow-sm"
                  >
                    <User className="w-4 h-4 text-violet-600" />
                    <span>{loading === 'student' ? 'Entering...' : 'Demo Student'}</span>
                  </button>
                  <button
                    onClick={() => handleDemoLogin('admin')}
                    disabled={loading !== null}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 border border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 bg-white text-slate-700 font-semibold px-5 py-4 rounded-xl transition shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>{loading === 'admin' ? 'Entering...' : 'Demo Admin'}</span>
                  </button>
                </div>
              </motion.div>

              {/* Troubleshooting instructions */}
              {oauthError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left max-w-xl mx-auto lg:mx-0"
                >
                  <p className="text-xs font-semibold text-amber-800 flex items-center space-x-1.5 mb-1">
                    <Shield className="w-4 h-4 flex-shrink-0" />
                    <span>Configuration Notice / Error:</span>
                  </p>
                  <p className="text-xs text-amber-700 whitespace-pre-wrap">{oauthError}</p>
                  {oauthUrlInstructions && (
                    <div className="mt-2 pt-2 border-t border-amber-200">
                      <p className="text-[10px] font-mono text-amber-900 bg-amber-100/50 p-2 rounded whitespace-pre-wrap">
                        {oauthUrlInstructions}
                      </p>
                    </div>
                  )}
                  <p className="text-[10px] text-amber-600 mt-2 font-medium">
                    <strong>Pro Tip:</strong> Click the "Demo Student" or "Demo Admin" button to instantly bypass auth and test all platform core modules immediately!
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Right Interactive Card / Graphics */}
            <motion.div
              className="lg:col-span-5 relative"
              variants={slideRight}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-100 to-indigo-100 rounded-3xl blur-2xl opacity-70 -z-10 translate-x-4 translate-y-4" />

              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-100/50 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-full blur-xl -mr-16 -mt-16 -z-10" />

                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-red-400 to-pink-400" />
                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400" />
                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-400" />
                  </div>
                  <span className="text-xs font-semibold font-mono text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">
                    ATS Scanner V2.5
                  </span>
                </div>

                {/* Score Dial Component */}
                <div className="flex items-center space-x-6 bg-gradient-to-r from-slate-50 to-violet-50/30 p-4 rounded-2xl border border-slate-100">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="absolute w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" className="stroke-slate-200" strokeWidth="4" fill="none" />
                      <motion.circle
                        cx="32"
                        cy="32"
                        r="28"
                        className="stroke-violet-600"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray="175"
                        initial={{ strokeDashoffset: 175 }}
                        animate={{ strokeDashoffset: 35 }}
                        transition={{ duration: 1.2, delay: 0.8, ease: 'easeOut' }}
                      />
                    </svg>
                    <span className="font-bold text-lg text-slate-800">80%</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Predicted ATS Score</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Missing: Summary Statement, Docker, Node.js</p>
                  </div>
                </div>

                {/* Interview Preview Box */}
                <motion.div
                  className="space-y-3"
                  variants={stagger}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.6 }}
                >
                  <motion.div
                    variants={fadeIn}
                    transition={{ duration: 0.4 }}
                    className="text-xs font-bold uppercase text-slate-400 tracking-wider"
                  >
                    Gemini AI Interviewer
                  </motion.div>
                  <motion.div
                    variants={fadeUp}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs p-3.5 rounded-2xl rounded-tl-none font-medium leading-relaxed shadow-md shadow-indigo-200"
                  >
                    "Explain horizontal versus vertical scaling in database architecture. Which does PostgreSQL support natively?"
                  </motion.div>
                  <motion.div
                    variants={fadeUp}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 text-xs p-3.5 rounded-2xl rounded-tr-none font-mono ml-8 border border-slate-200"
                  >
                    "PostgreSQL supports vertical scaling natively by utilizing more RAM/CPU. For horizontal, we require sharding tools..."
                  </motion.div>
                </motion.div>

                <div className="flex items-center justify-between pt-2 text-xs text-slate-500 border-t border-slate-100">
                  <span className="flex items-center space-x-1">
                    <Shield className="w-3.5 h-3.5 text-violet-600" />
                    <span>GDPR Compliant</span>
                  </span>
                  <span className="font-mono text-violet-600 font-medium">Ready to Mock</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Feature Grid */}
        <motion.section
          className="bg-white border-y border-slate-200 py-16 px-4 sm:px-6 lg:px-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
        >
          <div className="max-w-7xl mx-auto space-y-12">
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="text-center space-y-3 max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Placement Success Core Modules
              </h2>
              <p className="text-slate-600 text-sm">
                Engineered specifically for engineering students to stand out in hyper-competitive selection rounds.
              </p>
            </motion.div>

            <motion.div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8" variants={stagger}>
              {/* Feature 1 */}
              <motion.div
                variants={cardVariant}
                transition={{ duration: 0.45 }}
                className="group p-6 bg-gradient-to-br from-slate-50 to-violet-50/30 rounded-2xl border border-slate-100 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100/50 transition-all duration-300 space-y-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-blue-200 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">ATS Resume Analyzer</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Predict real-time ATS scoring thresholds, scan missing core headers, and receive instantaneous keyword optimization lists.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                variants={cardVariant}
                transition={{ duration: 0.45 }}
                className="group p-6 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-100 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/50 transition-all duration-300 space-y-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-violet-200 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">AI Mock Interviews</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Participate in live step-by-step Q&A sessions. Submit answers and get evaluated on accuracy, grammar, confidence, and clarity.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                variants={cardVariant}
                transition={{ duration: 0.45 }}
                className="group p-6 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-100 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/50 transition-all duration-300 space-y-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-md shadow-indigo-200 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Placement Reports</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Earn multi-metric proficiency scores (Technical, Communication, Confidence) synthesized into professional PDF-friendly formats.
                </p>
              </motion.div>

              {/* Feature 4 */}
              <motion.div
                variants={cardVariant}
                transition={{ duration: 0.45 }}
                className="group p-6 bg-gradient-to-br from-slate-50 to-cyan-50/30 rounded-2xl border border-slate-100 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-100/50 transition-all duration-300 space-y-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-cyan-200 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Coordinator Admin Panel</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Provide administrators with centralized tools to filter student profiles, audit resume matching thresholds, and review mock reports.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Built By Section */}
        <motion.section
          className="py-12 px-4 sm:px-6 lg:px-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={fadeUp}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-slate-100 to-violet-50 border border-slate-200 px-6 py-3 rounded-full">
              <span className="text-xs text-slate-500 font-medium">Built by</span>
              <span className="text-xs font-bold text-slate-800">Lohith</span>
              <span className="text-slate-300">&</span>
              <span className="text-xs font-bold text-slate-800">Trupti</span>
            </div>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <motion.footer
        className="bg-gradient-to-b from-slate-900 to-slate-950 text-slate-400 py-10 px-4 border-t border-slate-800 text-center text-xs"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
        variants={fadeIn}
        transition={{ duration: 0.6 }}
      >
        <p>&copy; 2026 InterviewAI Placement Portal. Powered by Google Gemini AI Models. Strictly Google Authentication.</p>
        <p className="mt-2 text-slate-500">Designed & Developed with passion for placement success.</p>
      </motion.footer>
    </div>
  );
}
