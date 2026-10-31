import React, { useState, useEffect } from 'react';
import { UserCircle, ShieldCheck, LogIn, AlertCircle, Eye, EyeOff, Sparkles, CheckCircle2, Zap } from 'lucide-react';

const STORAGE_KEYS = {
  STUDENT: 'safeexam_remember_student',
  PROCTOR: 'safeexam_remember_proctor',
};

export default function LoginPage({ onLogin }) {
  const [studentName, setStudentName] = useState('');
  const [studentRegNo, setStudentRegNo] = useState('');
  const [rememberStudent, setRememberStudent] = useState(false);

  const [proctorUser, setProctorUser] = useState('');
  const [proctorPass, setProctorPass] = useState('');
  const [rememberProctor, setRememberProctor] = useState(false);
  const [showProctorPass, setShowProctorPass] = useState(false);

  const [error, setError] = useState('');

  // Load remembered credentials on mount
  useEffect(() => {
    try {
      const savedStudent = localStorage.getItem(STORAGE_KEYS.STUDENT);
      if (savedStudent) {
        const parsed = JSON.parse(savedStudent);
        if (parsed.name) setStudentName(parsed.name);
        if (parsed.regNo) setStudentRegNo(parsed.regNo);
        setRememberStudent(true);
      }

      const savedProctor = localStorage.getItem(STORAGE_KEYS.PROCTOR);
      if (savedProctor) {
        const parsed = JSON.parse(savedProctor);
        if (parsed.user) setProctorUser(parsed.user);
        if (parsed.pass) setProctorPass(parsed.pass);
        setRememberProctor(true);
      }
    } catch (e) {
      console.warn('Failed to load remembered credentials', e);
    }
  }, []);

  const handleStudentLogin = (e) => {
    e.preventDefault();
    if (!studentName.trim() || !studentRegNo.trim()) {
      setError('Please enter your full name and registration number.');
      return;
    }
    setError('');

    if (rememberStudent) {
      localStorage.setItem(
        STORAGE_KEYS.STUDENT,
        JSON.stringify({ name: studentName.trim(), regNo: studentRegNo.trim() })
      );
    } else {
      localStorage.removeItem(STORAGE_KEYS.STUDENT);
    }

    onLogin({ role: 'student', name: studentName.trim(), regNo: studentRegNo.trim() });
  };

  const handleProctorLogin = (e) => {
    e.preventDefault();
    if (proctorUser === 'admin' && proctorPass === 'admin123') {
      setError('');

      if (rememberProctor) {
        localStorage.setItem(
          STORAGE_KEYS.PROCTOR,
          JSON.stringify({ user: proctorUser, pass: proctorPass })
        );
      } else {
        localStorage.removeItem(STORAGE_KEYS.PROCTOR);
      }

      onLogin({ role: 'proctor', name: 'Admin' });
    } else {
      setError('Invalid proctor credentials. (Hint: admin / admin123)');
    }
  };

  // Quick Demo Auto-Fill Helpers
  const fillStudentDemo = () => {
    setStudentName('Abhishek Kumar');
    setStudentRegNo('24091A3202');
    setError('');
  };

  const fillProctorDemo = () => {
    setProctorUser('admin');
    setProctorPass('admin123');
    setError('');
  };

  const isStudentValid = studentName.trim().length > 2 && studentRegNo.trim().length > 3;
  const isProctorValid = proctorUser === 'admin' && proctorPass === 'admin123';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.badgeRow}>
          <span style={styles.badge}>Module 1: Authentication & Role Management</span>
          <span style={styles.badgeLive}>🟢 System Online</span>
        </div>
        <h2 style={styles.title}>SafeExam AI — Secure Login Portal</h2>
        <p style={styles.subtitle}>
          Select your portal role and authenticate to access the AI-proctored examination ecosystem.
        </p>
      </div>

      {error && (
        <div style={styles.errorBanner} className="shake">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div style={styles.cardsRow}>
        {/* Student Login Card */}
        <form onSubmit={handleStudentLogin} style={styles.card} className="glass">
          <div style={styles.cardAccent} />
          <div style={styles.cardTopHeader}>
            <UserCircle size={38} color="#6366f1" />
            <button type="button" onClick={fillStudentDemo} style={styles.demoFillBtn}>
              <Zap size={13} color="#818cf8" />
              Quick Demo Fill
            </button>
          </div>
          
          <h3 style={styles.cardTitle}>Student Exam Portal</h3>
          <p style={styles.cardDesc}>Enter candidate credentials to verify system diagnostics and commence assessment.</p>

          <div style={styles.fieldGroup}>
            <div style={styles.labelRow}>
              <label style={styles.label}>Full Name</label>
              {studentName.trim().length > 2 && <CheckCircle2 size={13} color="#10b981" />}
            </div>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Abhishek Kumar"
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <div style={styles.labelRow}>
              <label style={styles.label}>Registration Number</label>
              {studentRegNo.trim().length > 3 && <CheckCircle2 size={13} color="#10b981" />}
            </div>
            <input
              type="text"
              value={studentRegNo}
              onChange={(e) => setStudentRegNo(e.target.value)}
              placeholder="e.g. 24091A3202"
              style={styles.input}
            />
          </div>

          <div style={styles.rememberRow}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={rememberStudent}
                onChange={(e) => setRememberStudent(e.target.checked)}
                style={styles.checkbox}
              />
              <span>Remember student details</span>
            </label>
          </div>

          <button
            type="submit"
            className={`btn btn-primary ${isStudentValid ? 'pulsing' : ''}`}
            style={styles.loginBtn}
          >
            <LogIn size={16} />
            Login & Begin System Check
          </button>
        </form>

        {/* Proctor Login Card */}
        <form onSubmit={handleProctorLogin} style={styles.card} className="glass">
          <div style={{ ...styles.cardAccent, background: 'linear-gradient(to right, #10b981, #059669)' }} />
          <div style={styles.cardTopHeader}>
            <ShieldCheck size={38} color="#10b981" />
            <button type="button" onClick={fillProctorDemo} style={styles.demoFillBtnProctor}>
              <Sparkles size={13} color="#34d399" />
              Quick Demo Fill
            </button>
          </div>
          
          <h3 style={styles.cardTitle}>Proctor & Evaluation Dashboard</h3>
          <p style={styles.cardDesc}>Access candidate telemetry audits, synthetic stress-testing, and post-exam reports.</p>

          <div style={styles.fieldGroup}>
            <div style={styles.labelRow}>
              <label style={styles.label}>Admin Username</label>
              {proctorUser === 'admin' && <CheckCircle2 size={13} color="#10b981" />}
            </div>
            <input
              type="text"
              value={proctorUser}
              onChange={(e) => setProctorUser(e.target.value)}
              placeholder="Username: admin"
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <div style={styles.labelRow}>
              <label style={styles.label}>Admin Password</label>
              {proctorPass === 'admin123' && <CheckCircle2 size={13} color="#10b981" />}
            </div>
            <div style={styles.passwordWrapper}>
              <input
                type={showProctorPass ? 'text' : 'password'}
                value={proctorPass}
                onChange={(e) => setProctorPass(e.target.value)}
                placeholder="Password: admin123"
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowProctorPass(prev => !prev)}
                style={styles.togglePassBtn}
                title={showProctorPass ? 'Hide password' : 'Show password'}
              >
                {showProctorPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={styles.rememberRow}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={rememberProctor}
                onChange={(e) => setRememberProctor(e.target.checked)}
                style={styles.checkbox}
              />
              <span>Remember credentials</span>
            </label>
          </div>

          <button
            type="submit"
            className={`btn btn-success ${isProctorValid ? 'pulsing' : ''}`}
            style={styles.loginBtn}
          >
            <LogIn size={16} />
            Authenticate as Proctor
          </button>
        </form>
      </div>

      <p style={styles.footerNote}>
        RGM College of Engineering and Technology (Autonomous), Nandyal — Dept. of CSE(DS)
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '960px',
    margin: '2.5rem auto',
    padding: '0 1.5rem',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  badgeRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.6rem',
    marginBottom: '0.75rem',
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    color: '#818cf8',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    padding: '0.3rem 0.8rem',
    borderRadius: '9999px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  badgeLive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    color: '#34d399',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    padding: '0.3rem 0.8rem',
    borderRadius: '9999px',
    letterSpacing: '0.03em',
  },
  title: {
    fontSize: '2.1rem',
    background: 'linear-gradient(to right, #fff, #94a3b8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '0.95rem',
    lineHeight: '1.5',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#f87171',
    padding: '0.75rem 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
    maxWidth: '500px',
    margin: '0 auto 1.5rem auto',
  },
  cardsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '2rem',
    marginBottom: '2rem',
  },
  card: {
    padding: '2.25rem 2rem',
    borderRadius: '16px',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(to right, #6366f1, #4f46e5)',
  },
  cardTopHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  demoFillBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    color: '#a5b4fc',
    padding: '0.3rem 0.65rem',
    borderRadius: '6px',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  demoFillBtnProctor: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    color: '#6ee7b7',
    padding: '0.3rem 0.65rem',
    borderRadius: '6px',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  cardTitle: {
    fontSize: '1.25rem',
    color: '#f8fafc',
    marginBottom: '0.35rem',
  },
  cardDesc: {
    color: '#94a3b8',
    fontSize: '0.82rem',
    lineHeight: '1.4',
    marginBottom: '1.5rem',
  },
  fieldGroup: {
    marginBottom: '1rem',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.35rem',
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#f8fafc',
    fontSize: '0.92rem',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
  },
  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  togglePassBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.25rem',
    marginTop: '0.25rem',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.8rem',
    color: '#94a3b8',
    cursor: 'pointer',
    userSelect: 'none',
  },
  checkbox: {
    accentColor: '#6366f1',
    cursor: 'pointer',
    width: '15px',
    height: '15px',
  },
  loginBtn: {
    width: '100%',
    marginTop: '0.25rem',
    justifyContent: 'center',
  },
  footerNote: {
    textAlign: 'center',
    color: '#475569',
    fontSize: '0.75rem',
    marginTop: '2rem',
  },
};
