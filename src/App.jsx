import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import SystemCheck from './components/SystemCheck';
import ExamPortal from './components/ExamPortal';
import ProctorDashboard from './components/ProctorDashboard';
import { Shield } from 'lucide-react';

export default function App() {
  // Auth state (Module 1)
  const [currentUser, setCurrentUser] = useState(null); // { role, name, regNo }

  // App routing state
  const [view, setView] = useState('login'); // 'login', 'system-check', 'exam', 'proctor-dashboard'
  const [sessionStreams, setSessionStreams] = useState({ webcamStream: null, screenStream: null, micStream: null });
  const [sessionData, setSessionData] = useState(null);

  // Module 1: Login handler
  const handleLogin = (user) => {
    setCurrentUser(user);
    if (user.role === 'proctor') {
      setView('proctor-dashboard');
    } else {
      setView('system-check');
    }
  };

  // Module 2: System check passed — start exam
  const handleSystemCheckComplete = (streams) => {
    setSessionStreams(streams);
    setView('exam');
  };

  // Module 5: Exam completed — show dashboard
  const handleExamComplete = (data) => {
    // Stop webcam/screen streams to free hardware
    if (sessionStreams.webcamStream) {
      sessionStreams.webcamStream.getTracks().forEach(t => t.stop());
    }
    if (sessionStreams.screenStream) {
      sessionStreams.screenStream.getTracks().forEach(t => t.stop());
    }
    if (sessionStreams.micStream) {
      sessionStreams.micStream.getTracks().forEach(t => t.stop());
    }

    setSessionData(data);
    setView('proctor-dashboard');

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Start a new live candidate exam session from Proctor Dashboard
  const handleStartLiveSession = (candidateInfo) => {
    setCurrentUser(candidateInfo || { role: 'student', name: 'Candidate', regNo: '24091A3200' });
    setSessionData(null);
    setView('system-check');
  };

  // Reset to login
  const handleRestart = () => {
    setView('login');
    setCurrentUser(null);
    setSessionStreams({ webcamStream: null, screenStream: null, micStream: null });
    setSessionData(null);
  };

  // Logout (back to login)
  const handleLogout = () => {
    handleRestart();
  };

  return (
    <div style={styles.appContainer}>
      {/* Top Navigation Bar */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <Shield color="#6366f1" size={22} />
          <span style={styles.logoText}>SafeExam AI</span>
          <span style={styles.navBadge}>Proctoring System</span>
        </div>
        <div style={styles.navRight}>
          {currentUser && (
            <>
              {currentUser.role === 'proctor' && view !== 'proctor-dashboard' && (
                <button onClick={() => setView('proctor-dashboard')} style={styles.dashNavBtn}>
                  Return to Dashboard
                </button>
              )}
              <span style={styles.userInfo}>
                {currentUser.role === 'proctor' ? '🛡️' : '🎓'} {currentUser.name}
                {currentUser.regNo && ` (${currentUser.regNo})`}
              </span>
              <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
            </>
          )}
        </div>
      </nav>

      {/* View Router */}
      <main style={styles.mainContent}>
        {view === 'login' && (
          <LoginPage onLogin={handleLogin} />
        )}

        {view === 'system-check' && (
          <SystemCheck onComplete={handleSystemCheckComplete} />
        )}

        {view === 'exam' && (
          <ExamPortal
            webcamStream={sessionStreams.webcamStream}
            screenStream={sessionStreams.screenStream}
            micStream={sessionStreams.micStream}
            studentInfo={currentUser}
            onExamComplete={handleExamComplete}
          />
        )}

        {view === 'proctor-dashboard' && (
          <ProctorDashboard
            sessionData={sessionData}
            currentUser={currentUser}
            onStartLiveSession={handleStartLiveSession}
            onRestart={handleRestart}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          RGM College of Engineering and Technology (Autonomous), Nandyal — Dept. of CSE(DS)
        </p>
        <p style={styles.footerSub}>
          A.Y. 2026-2027 | I Semester | Online Proctoring with Behavior Analysis
        </p>
      </footer>
    </div>
  );
}

const styles = {
  appContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 2rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(8, 12, 20, 0.8)',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  logoText: {
    fontSize: '1.1rem',
    fontWeight: '800',
    background: 'linear-gradient(to right, #fff, #94a3b8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  navBadge: {
    fontSize: '0.65rem',
    fontWeight: 'bold',
    color: '#818cf8',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    padding: '0.15rem 0.5rem',
    borderRadius: '9999px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userInfo: {
    fontSize: '0.85rem',
    color: '#e2e8f0',
    fontWeight: '600',
  },
  dashNavBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.35)',
    color: '#a5b4fc',
    padding: '0.35rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.78rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#f87171',
    padding: '0.35rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.78rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  mainContent: {
    flex: 1,
  },
  footer: {
    textAlign: 'center',
    padding: '1.5rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
    marginTop: '2rem',
  },
  footerText: {
    color: '#475569',
    fontSize: '0.75rem',
    margin: 0,
  },
  footerSub: {
    color: '#334155',
    fontSize: '0.65rem',
    margin: '0.2rem 0 0 0',
  },
};
