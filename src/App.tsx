import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage.js';
import Sidebar from './components/Sidebar.js';
import Navbar from './components/Navbar.js';
import StudentDashboard from './pages/StudentDashboard.js';
import ResumeAnalyzer from './pages/ResumeAnalyzer.js';
import InterviewPrep from './pages/InterviewPrep.js';
import MockInterview from './pages/MockInterview.js';
import Templates from './pages/Templates.js';
import ProfileManagement from './pages/ProfileManagement.js';
import FeedbackForm from './pages/FeedbackForm.js';
import AdminDashboard from './pages/AdminDashboard.js';
import { User } from './types.js';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<string>('student-dashboard');
  const [activeInterviewId, setActiveInterviewId] = useState<string | null>(null);

  useEffect(() => {
    // Check if user session already exists
    fetch('/api/auth/me')
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
      await fetch('/api/auth/logout', { method: 'POST' });
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
    <div className="min-h-screen bg-[#020617] text-slate-100 flex">
      {/* Persistent Left Sidebar Navigation */}
      <Sidebar
        user={user}
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      {/* Main Content Layout Right Panel – responsive: no left padding on mobile */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <Navbar user={user} title={getViewTitle()} />
        
        <main className="flex-1 bg-[#020617] overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
