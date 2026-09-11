import { useState, useEffect, lazy, Suspense } from 'react';
import LandingPage from './components/LandingPage.js';
import Sidebar from './components/Sidebar.js';
import Navbar from './components/Navbar.js';
import StudentDashboard from './pages/StudentDashboard.js';
import { User } from './types.js';
import { api } from './lib/api.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';

// Lazy-loaded pages for optimal performance and chunk-splitting
const ResumeAnalyzer = lazy(() => import('./pages/ResumeAnalyzer.js'));
const InterviewPrep = lazy(() => import('./pages/InterviewPrep.js'));
const MockInterview = lazy(() => import('./pages/MockInterview.js'));
const Templates = lazy(() => import('./pages/Templates.js'));
const ProfileManagement = lazy(() => import('./pages/ProfileManagement.js'));
const FeedbackForm = lazy(() => import('./pages/FeedbackForm.js'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.js'));
const CodeSandbox = lazy(() => import('./pages/CodeSandbox.js'));

function ViewFallback() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-8rem)] p-8">
      <div className="w-full max-w-md p-6 glass-card rounded-2xl space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="space-y-1">
            <div className="h-3 w-32 shimmer-box rounded" />
            <div className="h-2 w-20 shimmer-box rounded" />
          </div>
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-10 w-full shimmer-box rounded-xl" />
          <div className="h-24 w-full shimmer-box rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<string>('student-dashboard');
  const [activeInterviewId, setActiveInterviewId] = useState<string | null>(null);

  useEffect(() => {
    // Check if user session already exists
    api.get('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Unauthorized');
      })
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
          // Standard initial navigation layout routing
          if (data.user.role === 'admin') {
            setCurrentView('admin-dashboard');
          } else {
            setCurrentView('student-dashboard');
          }
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'admin') {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('student-dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
    setCurrentView('student-dashboard');
    setActiveInterviewId(null);
  };

  const handleNavigate = (view: string, targetId?: string) => {
    if (view === 'mock-interview' && targetId) {
      setActiveInterviewId(targetId);
    }
    setCurrentView(view);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide">Syncing Placement Session State...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Determine current page view to render
  const renderView = () => {
    switch (currentView) {
      // Student Views
      case 'student-dashboard':
        return <StudentDashboard user={user} onNavigate={handleNavigate} />;
      case 'resume-analyzer':
        return <ResumeAnalyzer />;
      case 'interview-prep':
        return <InterviewPrep user={user} onNavigate={handleNavigate} />;
      case 'mock-interview':
        return activeInterviewId ? (
          <MockInterview interviewId={activeInterviewId} onNavigate={handleNavigate} />
        ) : (
          <InterviewPrep user={user} onNavigate={handleNavigate} />
        );
      case 'templates':
        return <Templates />;
      case 'code-sandbox':
        return <CodeSandbox />;
      case 'profile':
        return <ProfileManagement user={user} onProfileUpdate={(u) => setUser(u)} />;
      case 'feedback':
        return <FeedbackForm />;

      // Admin Views
      case 'admin-dashboard':
      case 'admin-students':
      case 'admin-feedbacks':
        return <AdminDashboard />;

      default:
        return <StudentDashboard user={user} onNavigate={handleNavigate} />;
    }
  };

  // Human-readable titles for navigation
  const getViewTitle = () => {
    switch (currentView) {
      case 'student-dashboard':
        return 'Placement Readiness Hub';
      case 'resume-analyzer':
        return 'ATS Keywords Optimizer';
      case 'interview-prep':
        return 'Mock Assessment Gate';
      case 'mock-interview':
        return 'AI Interview Assessor';
      case 'code-sandbox':
        return 'Code Lab Sandbox';
      case 'templates':
        return 'ATS-vetted Resume Frameworks';
      case 'profile':
        return 'Placement Settings';
      case 'feedback':
        return 'Share Experience';
      case 'admin-dashboard':
        return 'Analytics & Placements Summary';
      case 'admin-students':
        return 'Enrolled Candidates Directory';
      case 'admin-feedbacks':
        return 'Student Feedback Audits';
      default:
        return 'InterviewAI Portal';
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex">
      {/* a11y: Skip to main content link for keyboard and screen reader accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-zinc-800 focus:text-white focus:rounded-md focus:shadow-xl focus:ring-2 focus:ring-zinc-600 focus:outline-none text-xs font-bold transition-all"
      >
        Skip to main content
      </a>

      {/* Persistent Left Sidebar Navigation */}
      <Sidebar
        user={user}
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      {/* Main Content Layout Right Panel – responsive: no left padding on mobile */}
      <div className="flex-1 lg:pl-60 flex flex-col min-h-screen">
        <Navbar user={user} title={getViewTitle()} />
        
        <main id="main-content" tabIndex={-1} className="flex-1 bg-[#09090b] overflow-y-auto focus:outline-none">
          <ErrorBoundary fallbackTitle={`Error loading ${getViewTitle()}`}>
            <Suspense fallback={<ViewFallback />}>
              {renderView()}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
