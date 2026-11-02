import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, ShieldAlert, Award, AlertTriangle, RefreshCw, CheckCircle, 
  BarChart3, Clock, FileText, User, Activity, Database, Printer, 
  Download, Check, X, ChevronDown, ChevronUp, PlusCircle, Sliders, 
  PlayCircle, Sparkles, Key, Zap, Search, ArrowUpDown, Maximize2
} from 'lucide-react';
import AnomalyDetector, { RISK_LEVELS } from '../services/AnomalyDetector';
import { SYNTHETIC_BENCHMARK_SESSIONS } from '../data/syntheticDataset';
import { QUESTIONS, loadQuestionBank } from '../data/questions';
import { EVENT_TYPES, SEVERITY } from '../services/ActivityLogger';
import QuestionBankManager from './QuestionBankManager';

const SESSIONS_STORAGE_KEY = 'safeexam_sessions';

function loadSessions() {
  try {
    const data = localStorage.getItem(SESSIONS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveSession(session) {
  const sessions = loadSessions();
  const existingIdx = sessions.findIndex(s => s.sessionId === session.sessionId);
  if (existingIdx >= 0) {
    sessions[existingIdx] = session;
  } else {
    sessions.unshift(session);
  }
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions.slice(0, 50)));
}

function generateSimulatedSnapshot(title, color = '#ef4444') {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#0b0f19';
  ctx.fillRect(0, 0, 320, 240);

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let i = 0; i < 320; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 240); ctx.stroke();
  }
  for (let i = 0; i < 240; i += 24) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(320, i); ctx.stroke();
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 30, 240, 180);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(`ANOMALY: ${title}`, 50, 60);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  ctx.fillText('AI PROCTORING LOGGED EVIDENCE', 50, 85);
  ctx.fillText(`TIMESTAMP: ${new Date().toLocaleTimeString()}`, 50, 105);

  ctx.fillStyle = color;
  ctx.fillRect(50, 130, 220, 30);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('FRAME EVIDENCE CAPTURED', 65, 150);

  return canvas.toDataURL('image/jpeg', 0.6);
}

const PRESET_SCENARIOS = [
  {
    id: 'clean',
    name: '🟢 High Integrity (Compliant Student)',
    desc: 'Low anomaly score, steady pacing, zero tab switches',
    data: { tabSwitches: 0, gazeAway: 2, faceAbsent: 0, noise: 0, idle: 15, rapid: 0, copyPaste: 0, score: 90 }
  },
  {
    id: 'tab_search',
    name: '🔴 Heavy Tab Switching & Web Search',
    desc: 'Frequent external tab navigation with devtools triggers',
    data: { tabSwitches: 8, gazeAway: 35, faceAbsent: 0, noise: 1, idle: 40, rapid: 1, copyPaste: 3, score: 70 }
  },
  {
    id: 'audio_collab',
    name: '🟡 Suspected Collaboration / Audio Anomaly',
    desc: 'Frequent room acoustic spikes and gaze deviation',
    data: { tabSwitches: 2, gazeAway: 30, faceAbsent: 0, noise: 5, idle: 70, rapid: 1, copyPaste: 0, score: 60 }
  },
  {
    id: 'impersonation',
    name: '🚨 Multiple Faces & Candidate Absence',
    desc: 'Severe visual anomaly: candidate leaves frame & second person enters',
    data: { tabSwitches: 4, gazeAway: 65, faceAbsent: 35, noise: 4, idle: 90, rapid: 2, copyPaste: 1, score: 30 }
  },
  {
    id: 'rapid_guess',
    name: '⚡ Rapid Guessing & Long Inactivity',
    desc: 'Extended idle periods followed by rapid answers (<3s)',
    data: { tabSwitches: 1, gazeAway: 15, faceAbsent: 0, noise: 0, idle: 180, rapid: 4, copyPaste: 0, score: 40 }
  }
];

export default function ProctorDashboard({ sessionData, currentUser, onStartLiveSession, onRestart }) {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [anomalyResult, setAnomalyResult] = useState(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'risk_desc' | 'score_desc' | 'trust_desc'
  const [showAnswerReview, setShowAnswerReview] = useState(false);

  // New Session Modal state
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [modalTab, setModalTab] = useState('simulate');
  
  // Question Bank Manager state
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [activeQuestions, setActiveQuestions] = useState(() => loadQuestionBank());
  
  // Simulation Form State
  const [simCandidateName, setSimCandidateName] = useState('Vikas Varma');
  const [simCandidateRegNo, setSimCandidateRegNo] = useState('24091A3218');
  const [simValues, setSimValues] = useState({
    tabSwitches: 6,
    gazeAway: 40,
    faceAbsent: 10,
    noise: 3,
    idle: 50,
    rapid: 2,
    copyPaste: 2,
    score: 70
  });

  // Live Exam Dispatch Form State
  const [dispatchName, setDispatchName] = useState('Kavya Sharma');
  const [dispatchRegNo, setDispatchRegNo] = useState('24091A3225');
  const [dispatchSubject, setDispatchSubject] = useState('Data Science & ML Comprehensive Assessment');
  const [dispatchStrictness, setDispatchStrictness] = useState('standard');
  const [generatedPassCode, setGeneratedPassCode] = useState(null);

  // Live calculate simulated risk prediction on the fly
  const liveSimulatedRisk = useMemo(() => {
    const summary = {
      totalDuration: 500,
      tabSwitchCount: Number(simValues.tabSwitches),
      focusLostCount: Number(simValues.tabSwitches) + 1,
      faceAbsentCount: Number(simValues.faceAbsent) > 0 ? 2 : 0,
      faceAbsentDuration: Number(simValues.faceAbsent),
      gazeAwayCount: Number(simValues.gazeAway) > 0 ? Math.ceil(simValues.gazeAway / 8) : 0,
      gazeAwayDuration: Number(simValues.gazeAway),
      noiseSpikeCount: Number(simValues.noise),
      copyPasteAttempts: Number(simValues.copyPaste),
      fullscreenExits: Number(simValues.tabSwitches) > 2 ? 2 : 0,
      multipleFacesCount: Number(simValues.faceAbsent) > 20 ? 1 : 0,
      devtoolsAttempts: Number(simValues.copyPaste) > 1 ? 1 : 0,
      totalIdleTime: Number(simValues.idle),
      rapidSubmissions: Number(simValues.rapid),
      keystrokeCount: Math.max(10, 150 - Number(simValues.idle) / 2),
      avgKeystrokeRate: Math.max(2, (150 - Number(simValues.idle) / 2) / (500 / 60)),
    };
    const detector = new AnomalyDetector();
    return detector.analyze(summary);
  }, [simValues]);

  // Initialize and load sessions
  useEffect(() => {
    let existingSessions = loadSessions();

    if (existingSessions.length === 0) {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(SYNTHETIC_BENCHMARK_SESSIONS));
      existingSessions = SYNTHETIC_BENCHMARK_SESSIONS;
    }

    if (sessionData && sessionData.sessionId) {
      const detector = new AnomalyDetector();
      const result = detector.analyze(sessionData.activitySummary || {});
      setAnomalyResult(result);

      const sessionToSave = {
        ...sessionData,
        anomalyResult: result,
        savedAt: new Date().toISOString(),
      };
      saveSession(sessionToSave);
      setActiveSession(sessionToSave);
      existingSessions = loadSessions();
    } else if (existingSessions.length > 0) {
      setActiveSession(existingSessions[0]);
      setAnomalyResult(existingSessions[0].anomalyResult || null);
    }

    setSessions(existingSessions);
  }, [sessionData]);

  const handleLoadBenchmark = () => {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(SYNTHETIC_BENCHMARK_SESSIONS));
    setSessions(SYNTHETIC_BENCHMARK_SESSIONS);
    setActiveSession(SYNTHETIC_BENCHMARK_SESSIONS[0]);
    setAnomalyResult(SYNTHETIC_BENCHMARK_SESSIONS[0].anomalyResult);
    setSelectedSnapshot(null);
  };

  const handleClearHistory = () => {
    localStorage.removeItem(SESSIONS_STORAGE_KEY);
    setSessions([]);
    setActiveSession(null);
    setAnomalyResult(null);
    setSelectedSnapshot(null);
  };

  const loadSession = (session) => {
    setActiveSession(session);
    setAnomalyResult(session.anomalyResult || null);
    setSelectedSnapshot(null);
  };

  const handleApplyPreset = (preset) => {
    setSimValues({ ...preset.data });
  };

  const handleCreateSimulatedSession = () => {
    const summary = {
      totalDuration: 500,
      tabSwitchCount: Number(simValues.tabSwitches),
      focusLostCount: Number(simValues.tabSwitches) + 1,
      faceAbsentCount: Number(simValues.faceAbsent) > 0 ? 2 : 0,
      faceAbsentDuration: Number(simValues.faceAbsent),
      gazeAwayCount: Number(simValues.gazeAway) > 0 ? Math.ceil(simValues.gazeAway / 8) : 0,
      gazeAwayDuration: Number(simValues.gazeAway),
      noiseSpikeCount: Number(simValues.noise),
      copyPasteAttempts: Number(simValues.copyPaste),
      fullscreenExits: Number(simValues.tabSwitches) > 2 ? 2 : 0,
      multipleFacesCount: Number(simValues.faceAbsent) > 20 ? 1 : 0,
      devtoolsAttempts: Number(simValues.copyPaste) > 1 ? 1 : 0,
      totalIdleTime: Number(simValues.idle),
      rapidSubmissions: Number(simValues.rapid),
      keystrokeCount: Math.max(10, 150 - Number(simValues.idle) / 2),
      avgKeystrokeRate: Math.max(2, (150 - Number(simValues.idle) / 2) / (500 / 60)),
    };

    const detector = new AnomalyDetector();
    const result = detector.analyze(summary);

    const activityLogs = [
      { id: 'sim-1', timestamp: new Date().toISOString(), localTime: new Date().toLocaleTimeString(), eventType: EVENT_TYPES.EXAM_STARTED, severity: SEVERITY.LOW, details: 'Simulated exam session initialized.' }
    ];

    if (summary.tabSwitchCount > 0) {
      activityLogs.push({
        id: 'sim-tab',
        timestamp: new Date().toISOString(),
        localTime: new Date().toLocaleTimeString(),
        eventType: EVENT_TYPES.TAB_SWITCH,
        severity: SEVERITY.HIGH,
        details: `${summary.tabSwitchCount} tab switch events detected during testing.`,
        snapshot: generateSimulatedSnapshot('TAB_SWITCH', '#ef4444')
      });
    }

    if (summary.gazeAwayDuration > 15) {
      activityLogs.push({
        id: 'sim-gaze',
        timestamp: new Date().toISOString(),
        localTime: new Date().toLocaleTimeString(),
        eventType: EVENT_TYPES.GAZE_AWAY,
        severity: SEVERITY.MEDIUM,
        details: `Gaze deviation away from monitor accumulated ${summary.gazeAwayDuration}s.`,
        snapshot: generateSimulatedSnapshot('GAZE_AWAY', '#f59e0b')
      });
    }

    if (summary.faceAbsentDuration > 0) {
      activityLogs.push({
        id: 'sim-face',
        timestamp: new Date().toISOString(),
        localTime: new Date().toLocaleTimeString(),
        eventType: EVENT_TYPES.FACE_ABSENT,
        severity: SEVERITY.HIGH,
        details: `Candidate not visible in frame for ${summary.faceAbsentDuration}s.`,
        snapshot: generateSimulatedSnapshot('FACE_ABSENT', '#ef4444')
      });
    }

    if (summary.noiseSpikeCount > 0) {
      activityLogs.push({
        id: 'sim-noise',
        timestamp: new Date().toISOString(),
        localTime: new Date().toLocaleTimeString(),
        eventType: EVENT_TYPES.NOISE_DETECTED,
        severity: SEVERITY.MEDIUM,
        details: `${summary.noiseSpikeCount} acoustic speech/noise spikes detected.`
      });
    }

    if (summary.rapidSubmissions > 0) {
      activityLogs.push({
        id: 'sim-rapid',
        timestamp: new Date().toISOString(),
        localTime: new Date().toLocaleTimeString(),
        eventType: EVENT_TYPES.RAPID_SUBMISSION,
        severity: SEVERITY.MEDIUM,
        details: `${summary.rapidSubmissions} questions submitted in < 5 seconds.`
      });
    }

    const newSession = {
      sessionId: `session-sim-${Date.now()}`,
      studentInfo: {
        name: simCandidateName.trim() || 'Simulated Candidate',
        regNo: simCandidateRegNo.trim() || '24091A3299',
        role: 'student'
      },
      examDate: new Date().toISOString(),
      score: Number(simValues.score),
      totalQuestions: 10,
      pointsPerQuestion: 10,
      warningCount: Math.min(6, Math.floor(summary.tabSwitchCount / 2 + summary.noiseSpikeCount / 2)),
      trustScore: Math.max(0, 100 - result.riskScore),
      exitReason: result.riskScore > 60 ? 'Suspended due to excessive proctoring violations' : 'Submitted by Candidate',
      activitySummary: summary,
      activityLogs,
      anomalyResult: result,
      savedAt: new Date().toISOString(),
    };

    saveSession(newSession);
    const updated = loadSessions();
    setSessions(updated);
    setActiveSession(newSession);
    setAnomalyResult(result);
    setShowNewSessionModal(false);
  };

  const handleLaunchLiveExam = () => {
    setShowNewSessionModal(false);
    if (onStartLiveSession) {
      onStartLiveSession({
        role: 'student',
        name: dispatchName.trim() || 'Test Candidate',
        regNo: dispatchRegNo.trim() || '24091A3200',
        subject: dispatchSubject,
        strictness: dispatchStrictness,
      });
    }
  };

  const handleGeneratePass = () => {
    const code = `EXAM-${Math.floor(1000 + Math.random() * 9000)}-${dispatchRegNo.slice(-4) || 'DS'}`;
    setGeneratedPassCode(code);
  };

  const handleExportJSON = () => {
    if (!activeData) return;
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", jsonStr);
    downloadAnchor.setAttribute("download", `ProctorReport_${activeData.studentInfo?.regNo || 'Session'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  const activeData = activeSession || sessionData || {};
  const logs = activeData.activityLogs || [];
  const summary = activeData.activitySummary || {};
  const student = activeData.studentInfo || {};
  const answers = activeData.answers || {};

  // Search & Filter & Sort Pipeline
  const filteredSessions = useMemo(() => {
    return sessions
      .filter(s => {
        // Risk Filter
        if (filterRisk !== 'ALL') {
          const score = s.anomalyResult?.riskScore ?? 0;
          if (filterRisk === 'LOW' && score > 30) return false;
          if (filterRisk === 'MEDIUM' && (score <= 30 || score > 60)) return false;
          if (filterRisk === 'HIGH' && score <= 60) return false;
        }

        // Search Filter (Name or RegNo)
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const name = (s.studentInfo?.name || '').toLowerCase();
          const regNo = (s.studentInfo?.regNo || '').toLowerCase();
          if (!name.includes(term) && !regNo.includes(term)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'risk_desc') return (b.anomalyResult?.riskScore || 0) - (a.anomalyResult?.riskScore || 0);
        if (sortBy === 'score_desc') return (b.score || 0) - (a.score || 0);
        if (sortBy === 'trust_desc') return (b.trustScore || 0) - (a.trustScore || 0);
        return new Date(b.examDate || 0) - new Date(a.examDate || 0); // recent
      });
  }, [sessions, filterRisk, searchTerm, sortBy]);

  const violationLogs = logs.filter(l =>
    l.severity === 'HIGH' || l.severity === 'CRITICAL' || l.severity === 'MEDIUM'
  );
  const violationCounts = violationLogs.reduce((acc, curr) => {
    acc[curr.eventType] = (acc[curr.eventType] || 0) + 1;
    return acc;
  }, {});
  const categories = Object.keys(violationCounts);
  const counts = Object.values(violationCounts);
  const maxCount = Math.max(...counts, 1);

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.header} className="glass">
        <div>
          <span style={styles.badgeLine}>Module 5: Proctor Dashboard & Evaluation</span>
          <h2 style={styles.title}>Candidate Proctoring Evaluation & Behavior Audit</h2>
          {activeData.exitReason && (
            <p style={styles.subtitle}>Active Candidate Session: <strong style={{ color: '#f87171' }}>{activeData.exitReason}</strong></p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={handlePrint} className="btn btn-secondary">
            <Printer size={16} />
            Print Report
          </button>
          <button onClick={handleExportJSON} className="btn btn-secondary">
            <Download size={16} />
            Export JSON
          </button>
          <button onClick={() => setShowNewSessionModal(true)} className="btn btn-primary pulsing">
            <PlusCircle size={16} />
            New Exam Session
          </button>
          <button onClick={() => setShowQuestionBank(true)} className="btn btn-secondary" style={{ backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)', color: '#fbbf24' }}>
            <FileText size={16} />
            Question Bank ({activeQuestions.length})
          </button>
        </div>
      </div>

      {/* QUESTION BANK MANAGER MODAL */}
      {showQuestionBank && (
        <QuestionBankManager
          onClose={() => setShowQuestionBank(false)}
          onSaved={(updated) => setActiveQuestions(updated)}
        />
      )}

      {/* NEW SESSION MANAGEMENT MODAL */}
      {showNewSessionModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.newSessionModal} className="glass">
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} color="#6366f1" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>Exam Session Manager</h3>
              </div>
              <button onClick={() => setShowNewSessionModal(false)} style={styles.btnCloseModal}>
                <X size={18} />
              </button>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 1.25rem 0' }}>
              Create a new candidate examination or simulate custom behavioral anomaly profiles to benchmark the AI Anomaly Detection Engine.
            </p>

            {/* Modal Tabs */}
            <div style={styles.modalTabRow}>
              <button
                onClick={() => setModalTab('simulate')}
                style={{
                  ...styles.modalTabBtn,
                  backgroundColor: modalTab === 'simulate' ? '#6366f1' : 'rgba(255,255,255,0.03)',
                  borderColor: modalTab === 'simulate' ? '#6366f1' : 'rgba(255,255,255,0.08)',
                  color: modalTab === 'simulate' ? '#fff' : '#94a3b8',
                }}
              >
                <Sliders size={15} />
                Simulate Behavioral Anomaly Profile
              </button>
              <button
                onClick={() => setModalTab('dispatch')}
                style={{
                  ...styles.modalTabBtn,
                  backgroundColor: modalTab === 'dispatch' ? '#6366f1' : 'rgba(255,255,255,0.03)',
                  borderColor: modalTab === 'dispatch' ? '#6366f1' : 'rgba(255,255,255,0.08)',
                  color: modalTab === 'dispatch' ? '#fff' : '#94a3b8',
                }}
              >
                <PlayCircle size={15} />
                Dispatch Live Candidate Exam
              </button>
            </div>

            {/* TAB 1: SIMULATION & STRESS-TESTING */}
            {modalTab === 'simulate' && (
              <div style={styles.simContainer}>
                {/* Live Real-Time Risk Prediction Banner */}
                <div style={{
                  ...styles.liveRiskBanner,
                  borderColor: liveSimulatedRisk.riskLevel.color,
                  backgroundColor: `${liveSimulatedRisk.riskLevel.color}15`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Activity size={26} color={liveSimulatedRisk.riskLevel.color} />
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Live AI Predicted Risk:</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '1.4rem', color: liveSimulatedRisk.riskLevel.color }}>
                          {liveSimulatedRisk.riskScore}%
                        </strong>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: liveSimulatedRisk.riskLevel.color }}>
                          {liveSimulatedRisk.riskLevel.label} ({liveSimulatedRisk.riskLevel.verdict})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preset Selector */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={styles.formLabel}>Quick Presets (Domain Testing Scenarios)</label>
                  <div style={styles.presetGrid}>
                    {PRESET_SCENARIOS.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => handleApplyPreset(preset)}
                        style={styles.presetCard}
                      >
                        <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#e2e8f0', display: 'block' }}>{preset.name}</span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{preset.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Candidate Info */}
                <div style={styles.formRowTwo}>
                  <div>
                    <label style={styles.formLabel}>Candidate Name</label>
                    <input
                      type="text"
                      value={simCandidateName}
                      onChange={e => setSimCandidateName(e.target.value)}
                      style={styles.modalInput}
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>Registration Number</label>
                    <input
                      type="text"
                      value={simCandidateRegNo}
                      onChange={e => setSimCandidateRegNo(e.target.value)}
                      style={styles.modalInput}
                    />
                  </div>
                </div>

                {/* Sliders Grid */}
                <div style={styles.slidersGrid}>
                  <div style={styles.sliderBox}>
                    <div style={styles.sliderHeader}>
                      <span>Tab Switches:</span>
                      <strong>{simValues.tabSwitches}</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={simValues.tabSwitches}
                      onChange={e => setSimValues(v => ({ ...v, tabSwitches: e.target.value }))}
                      style={styles.rangeInput}
                    />
                  </div>

                  <div style={styles.sliderBox}>
                    <div style={styles.sliderHeader}>
                      <span>Gaze Away (seconds):</span>
                      <strong>{simValues.gazeAway}s</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="120"
                      value={simValues.gazeAway}
                      onChange={e => setSimValues(v => ({ ...v, gazeAway: e.target.value }))}
                      style={styles.rangeInput}
                    />
                  </div>

                  <div style={styles.sliderBox}>
                    <div style={styles.sliderHeader}>
                      <span>Face Absent (seconds):</span>
                      <strong>{simValues.faceAbsent}s</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      value={simValues.faceAbsent}
                      onChange={e => setSimValues(v => ({ ...v, faceAbsent: e.target.value }))}
                      style={styles.rangeInput}
                    />
                  </div>

                  <div style={styles.sliderBox}>
                    <div style={styles.sliderHeader}>
                      <span>Noise Spikes:</span>
                      <strong>{simValues.noise}</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="8"
                      value={simValues.noise}
                      onChange={e => setSimValues(v => ({ ...v, noise: e.target.value }))}
                      style={styles.rangeInput}
                    />
                  </div>

                  <div style={styles.sliderBox}>
                    <div style={styles.sliderHeader}>
                      <span>Idle Time (seconds):</span>
                      <strong>{simValues.idle}s</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="300"
                      value={simValues.idle}
                      onChange={e => setSimValues(v => ({ ...v, idle: e.target.value }))}
                      style={styles.rangeInput}
                    />
                  </div>

                  <div style={styles.sliderBox}>
                    <div style={styles.sliderHeader}>
                      <span>Rapid Submissions (&lt;5s):</span>
                      <strong>{simValues.rapid}</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={simValues.rapid}
                      onChange={e => setSimValues(v => ({ ...v, rapid: e.target.value }))}
                      style={styles.rangeInput}
                    />
                  </div>
                </div>

                {/* Score slider */}
                <div style={{ ...styles.sliderBox, marginTop: '0.75rem' }}>
                  <div style={styles.sliderHeader}>
                    <span>Academic Exam Score:</span>
                    <strong>{simValues.score} / 100 pts</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={simValues.score}
                    onChange={e => setSimValues(v => ({ ...v, score: e.target.value }))}
                    style={styles.rangeInput}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                  <button onClick={() => setShowNewSessionModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button onClick={handleCreateSimulatedSession} className="btn btn-primary">
                    <Zap size={16} />
                    Run Anomaly Engine & Add to Database
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: DISPATCH LIVE EXAM */}
            {modalTab === 'dispatch' && (
              <div style={styles.simContainer}>
                <div style={styles.formRowTwo}>
                  <div>
                    <label style={styles.formLabel}>Candidate Full Name</label>
                    <input
                      type="text"
                      value={dispatchName}
                      onChange={e => setDispatchName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      style={styles.modalInput}
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>University Reg Number</label>
                    <input
                      type="text"
                      value={dispatchRegNo}
                      onChange={e => setDispatchRegNo(e.target.value)}
                      placeholder="e.g. 24091A3201"
                      style={styles.modalInput}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label style={styles.formLabel}>Subject / Exam Assessment Title</label>
                  <input
                    type="text"
                    value={dispatchSubject}
                    onChange={e => setDispatchSubject(e.target.value)}
                    style={styles.modalInput}
                  />
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label style={styles.formLabel}>Proctoring Strictness Level</label>
                  <div style={styles.strictnessRow}>
                    {[
                      { id: 'standard', name: 'Standard', desc: 'Standard 3-warning limit with baseline AI thresholds' },
                      { id: 'high', name: 'High Strictness', desc: 'Sensitive facial gaze & noise triggers (2-warning limit)' },
                      { id: 'strict', name: 'Ultra Strict', desc: 'Instant flag on any tab switch or screen exit' },
                    ].map(st => (
                      <button
                        key={st.id}
                        onClick={() => setDispatchStrictness(st.id)}
                        style={{
                          ...styles.strictnessCard,
                          borderColor: dispatchStrictness === st.id ? '#6366f1' : 'rgba(255,255,255,0.08)',
                          backgroundColor: dispatchStrictness === st.id ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                        }}
                      >
                        <span style={{ fontWeight: 'bold', color: '#e2e8f0', fontSize: '0.85rem' }}>{st.name}</span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{st.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {generatedPassCode && (
                  <div style={styles.passCodeBanner}>
                    <Key size={16} color="#10b981" />
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Generated Candidate Access Key:</span>
                      <strong style={{ display: 'block', fontSize: '1.1rem', color: '#10b981', letterSpacing: '0.05em' }}>{generatedPassCode}</strong>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.75rem' }}>
                  <button onClick={handleGeneratePass} className="btn btn-secondary">
                    <Key size={15} />
                    Generate Access Key
                  </button>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setShowNewSessionModal(false)} className="btn btn-secondary">
                      Close
                    </button>
                    <button onClick={handleLaunchLiveExam} className="btn btn-success">
                      <PlayCircle size={16} />
                      Start Live Exam Workspace
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Session History & Live Multi-Search Panel */}
      <div style={styles.historySection} className="glass">
        <div style={styles.historyTopRow}>
          <div>
            <h3 style={{ fontSize: '1rem', color: '#e2e8f0', margin: 0 }}>
              <Clock size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
              Session Audit Database ({sessions.length} records)
            </h3>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Search candidates, filter risk anomalies, and drill into telemetry evidence.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={handleLoadBenchmark} style={styles.benchmarkBtn}>
              <Database size={13} />
              Reset Benchmark Dataset
            </button>
            <button onClick={handleClearHistory} style={styles.clearBtn}>
              Clear
            </button>
          </div>
        </div>

        {/* Search & Sorting Controls Bar */}
        <div style={styles.searchSortBar}>
          <div style={styles.searchBox}>
            <Search size={15} color="#64748b" />
            <input
              type="text"
              placeholder="Search candidate name or reg number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={styles.sortWrapper}>
              <ArrowUpDown size={14} color="#818cf8" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={styles.sortSelect}
              >
                <option value="recent">Most Recent Date</option>
                <option value="risk_desc">Highest Malpractice Risk</option>
                <option value="score_desc">Highest Academic Score</option>
                <option value="trust_desc">Highest Trust Index</option>
              </select>
            </div>
          </div>
        </div>

        {/* Risk Filter Tabs */}
        <div style={styles.filterTabs}>
          {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map(rf => (
            <button
              key={rf}
              onClick={() => setFilterRisk(rf)}
              style={{
                ...styles.filterBtn,
                backgroundColor: filterRisk === rf ? '#6366f1' : 'rgba(255,255,255,0.03)',
                borderColor: filterRisk === rf ? '#6366f1' : 'rgba(255,255,255,0.08)',
                color: filterRisk === rf ? '#fff' : '#94a3b8',
              }}
            >
              {rf === 'ALL' ? `All Sessions (${sessions.length})` : `${rf} Risk`}
            </button>
          ))}
        </div>

        {filteredSessions.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.85rem', padding: '1rem' }}>No sessions match the current search or risk filter.</p>
        ) : (
          <div style={styles.historyTable}>
            <div style={styles.historyHeaderRow}>
              <span style={styles.historyCol}>Student</span>
              <span style={styles.historyCol}>Reg No</span>
              <span style={styles.historyCol}>Date & Time</span>
              <span style={styles.historyCol}>Academic Score</span>
              <span style={styles.historyCol}>Malpractice Risk</span>
              <span style={styles.historyCol}>Audit</span>
            </div>
            {filteredSessions.slice(0, 10).map((s, idx) => (
              <div key={idx} style={{
                ...styles.historyRow,
                backgroundColor: activeSession?.sessionId === s.sessionId ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                borderColor: activeSession?.sessionId === s.sessionId ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.04)'
              }}>
                <span style={{ ...styles.historyCol, fontWeight: 'bold', color: '#f8fafc' }}>
                  {s.studentInfo?.name || 'Unknown Candidate'}
                </span>
                <span style={styles.historyCol}>{s.studentInfo?.regNo || '—'}</span>
                <span style={styles.historyCol}>
                  {s.examDate ? new Date(s.examDate).toLocaleDateString() : '—'}
                </span>
                <span style={styles.historyCol}>{s.score} / {(s.totalQuestions || 10) * (s.pointsPerQuestion || 10)}</span>
                <span style={styles.historyCol}>
                  <span style={{
                    ...styles.riskBadge,
                    backgroundColor: s.anomalyResult?.riskLevel?.color ? `${s.anomalyResult.riskLevel.color}20` : 'rgba(255,255,255,0.05)',
                    color: s.anomalyResult?.riskLevel?.color || '#94a3b8',
                    borderColor: s.anomalyResult?.riskLevel?.color || 'rgba(255,255,255,0.1)',
                  }}>
                    {s.anomalyResult?.riskLevel?.label || 'N/A'} ({s.anomalyResult?.riskScore ?? '—'}%)
                  </span>
                </span>
                <span style={styles.historyCol}>
                  <button onClick={() => loadSession(s)} style={styles.viewBtn}>
                    {activeSession?.sessionId === s.sessionId ? 'Active' : 'Inspect'}
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {activeData.score !== undefined && (
        <>
          <div style={styles.statsGrid}>
            <div style={styles.statCard} className="glass">
              <span style={styles.statLabel}>Candidate Profile</span>
              <div style={styles.statRow}>
                <User size={32} color="#6366f1" />
                <div>
                  <span style={{ ...styles.statVal, fontSize: '1.2rem' }}>{student.name || 'Unknown'}</span>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Reg: {student.regNo || '—'}</p>
                </div>
              </div>
            </div>

            <div style={styles.statCard} className="glass">
              <span style={styles.statLabel}>Academic Performance</span>
              <div style={styles.statRow}>
                <Award size={32} color="#10b981" />
                <div>
                  <span style={styles.statVal}>{activeData.score} / {(activeData.totalQuestions || 10) * (activeData.pointsPerQuestion || 10)}</span>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                    Correct: {Math.round(activeData.score / (activeData.pointsPerQuestion || 10))} of {activeData.totalQuestions || 10}
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              ...styles.statCard,
              borderLeft: `4px solid ${anomalyResult?.riskLevel?.color || '#64748b'}`
            }} className="glass">
              <span style={styles.statLabel}>Malpractice Likelihood (ML)</span>
              <div style={styles.statRow}>
                <Activity size={32} color={anomalyResult?.riskLevel?.color || '#64748b'} />
                <div>
                  <span style={styles.statVal}>{anomalyResult?.riskScore ?? '—'}%</span>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                    {anomalyResult?.riskLevel?.verdict || 'Pending Analysis'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div style={styles.dashboardGrid}>
            {/* Left: Activity Timeline */}
            <div style={styles.logCard} className="glass">
              <h3 style={styles.cardTitle}>
                <FileText size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
                Behavioral Activity Logs ({logs.length} events logged)
              </h3>
              <p style={styles.cardSubtitle}>
                Time-stamped audit events captured by the background activity logging service.
              </p>

              {violationLogs.length === 0 ? (
                <div style={styles.emptyState}>
                  <CheckCircle size={48} color="#10b981" />
                  <h4 style={{ marginTop: '1rem', color: '#e2e8f0' }}>Zero Anomaly Session</h4>
                  <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No high or medium severity behavioral flags registered.</p>
                </div>
              ) : (
                <div style={styles.logTimeline}>
                  {violationLogs.map((event) => (
                    <div key={event.id} style={styles.timelineItem}>
                      <div style={{
                        ...styles.timelineBadge,
                        borderColor: event.severity === 'CRITICAL' ? '#ef4444' : event.severity === 'HIGH' ? '#f59e0b' : '#6366f1'
                      }}>
                        <AlertTriangle color={event.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'} size={12} />
                      </div>
                      <div style={styles.timelineContent}>
                        <div style={styles.timelineHeader}>
                          <span style={styles.timelineType}>{event.eventType}</span>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <span style={{
                              ...styles.severityBadge,
                              backgroundColor: event.severity === 'CRITICAL' ? 'rgba(239,68,68,0.15)' : event.severity === 'HIGH' ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)',
                              color: event.severity === 'CRITICAL' ? '#f87171' : event.severity === 'HIGH' ? '#fbbf24' : '#818cf8',
                            }}>{event.severity}</span>
                            <span style={styles.timelineTime}>{event.localTime}</span>
                          </div>
                        </div>
                        <p style={styles.timelineDetails}>{event.details}</p>
                        {event.snapshot && (
                          <button onClick={() => setSelectedSnapshot(event)} style={styles.btnEvidence}>
                            <Maximize2 size={11} /> View Evidence
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Charts & Anomaly Analysis */}
            <div style={styles.chartsColumn}>
              {/* Anomaly Feature Breakdown */}
              {anomalyResult && (
                <div style={styles.chartCard} className="glass">
                  <h3 style={styles.chartTitle}>
                    <BarChart3 size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
                    Anomaly Engine — Feature Contribution Matrix
                  </h3>
                  <div style={styles.featureTable}>
                    {Object.entries(anomalyResult.featureScores).map(([name, data]) => (
                      <div key={name} style={styles.featureRow}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: '600' }}>{name}</span>
                          <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b' }}>{data.description}</p>
                        </div>
                        <div style={{ width: '80px', textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{data.rawValue}</span>
                        </div>
                        <div style={{ width: '60px' }}>
                          <div style={styles.miniBar}>
                            <div style={{
                              ...styles.miniBarFill,
                              width: `${Math.round(data.normalizedScore * 100)}%`,
                              backgroundColor: data.normalizedScore > 0.6 ? '#ef4444' : data.normalizedScore > 0.3 ? '#f59e0b' : '#10b981'
                            }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {anomalyResult.summary?.highestContributor && (
                    <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.75rem' }}>
                      Primary Risk Factor: <strong style={{ color: '#fca5a5' }}>{anomalyResult.summary.highestContributor.feature}</strong>
                    </p>
                  )}
                </div>
              )}

              {/* SVG Bar Chart */}
              <div style={styles.chartCard} className="glass">
                <h3 style={styles.chartTitle}>Anomaly Distribution by Category</h3>
                {categories.length === 0 ? (
                  <div style={styles.emptyChart}>No incidents to plot for this candidate</div>
                ) : (
                  <div style={styles.svgChartContainer}>
                    <svg viewBox="0 0 400 220" style={{ width: '100%', height: 'auto' }}>
                      {categories.map((category, idx) => {
                        const barWidth = 24;
                        const spacing = (400 - 40 - categories.length * barWidth) / (categories.length + 1);
                        const x = 30 + spacing + idx * (barWidth + spacing);
                        const barHeight = (violationCounts[category] / maxCount) * 130;
                        const y = 160 - barHeight;
                        return (
                          <g key={category}>
                            <defs>
                              <linearGradient id={`barGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ef4444" />
                                <stop offset="100%" stopColor="#f59e0b" />
                              </linearGradient>
                            </defs>
                            <rect x={x} y={y} width={barWidth} height={barHeight} rx={4} fill={`url(#barGrad-${idx})`} />
                            <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="bold">{violationCounts[category]}</text>
                            <text x={x + barWidth / 2} y="180" textAnchor="middle" fill="#64748b" fontSize="8" transform={`rotate(12, ${x + barWidth / 2}, 180)`}>
                              {category.length > 14 ? category.slice(0, 12) + '...' : category}
                            </text>
                          </g>
                        );
                      })}
                      <line x1="20" y1="160" x2="380" y2="160" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Snapshot Drawer */}
              {selectedSnapshot && (
                <div style={styles.snapshotDrawer} className="glass">
                  <div style={styles.drawerHeader}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Visual Anomaly Evidence</span>
                    <button onClick={() => setSelectedSnapshot(null)} style={styles.btnCloseDrawer}>Close</button>
                  </div>
                  <p style={styles.drawerSub}>{selectedSnapshot.eventType} at {selectedSnapshot.localTime}</p>
                  <div style={styles.drawerImageContainer}>
                    <img src={selectedSnapshot.snapshot} alt="Evidence" style={styles.evidenceImg} />
                  </div>
                </div>
              )}

              {/* Integrity Report / Recommendation */}
              {anomalyResult && (
                <div style={styles.reportCard} className="glass">
                  <h3 style={styles.chartTitle}>
                    <Shield size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
                    Official Post-Exam Integrity Report
                  </h3>
                  <div style={styles.reportGrid}>
                    <div style={styles.reportRow}><span style={styles.reportLabel}>Candidate</span><span style={styles.reportVal}>{student.name || '—'}</span></div>
                    <div style={styles.reportRow}><span style={styles.reportLabel}>Registration ID</span><span style={styles.reportVal}>{student.regNo || '—'}</span></div>
                    <div style={styles.reportRow}><span style={styles.reportLabel}>Timestamp</span><span style={styles.reportVal}>{activeData.examDate ? new Date(activeData.examDate).toLocaleString() : '—'}</span></div>
                    <div style={styles.reportRow}><span style={styles.reportLabel}>Exam Score</span><span style={styles.reportVal}>{activeData.score} / {(activeData.totalQuestions || 10) * (activeData.pointsPerQuestion || 10)}</span></div>
                    <div style={styles.reportRow}><span style={styles.reportLabel}>Trust Index</span><span style={styles.reportVal}>{activeData.trustScore}%</span></div>
                    <div style={styles.reportRow}><span style={styles.reportLabel}>Malpractice Risk</span><span style={{ ...styles.reportVal, color: anomalyResult.riskLevel.color }}>{anomalyResult.riskScore}%</span></div>
                    <div style={styles.reportRow}><span style={styles.reportLabel}>Total Events</span><span style={styles.reportVal}>{logs.length}</span></div>
                    <div style={styles.reportRow}><span style={styles.reportLabel}>Violations</span><span style={styles.reportVal}>{violationLogs.length}</span></div>
                  </div>
                  <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: `${anomalyResult.riskLevel.color}10`, border: `1px solid ${anomalyResult.riskLevel.color}40`, borderRadius: '8px' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      {anomalyResult.riskScore <= 30 ? <CheckCircle color="#10b981" size={20} /> : anomalyResult.riskScore <= 60 ? <AlertTriangle color="#f59e0b" size={20} /> : <ShieldAlert color="#ef4444" size={20} />}
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.85rem', color: anomalyResult.riskLevel.color }}>{anomalyResult.riskLevel.verdict}</h4>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>{anomalyResult.riskLevel.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Collapsible Candidate Answer Key Review */}
          <div style={{ marginTop: '1.5rem' }}>
            <button
              onClick={() => setShowAnswerReview(prev => !prev)}
              style={styles.answerReviewToggle}
              className="glass"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={16} color="#6366f1" />
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Question-by-Question Candidate Answer Key Audit</span>
              </div>
              {showAnswerReview ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showAnswerReview && (
              <div style={styles.answerReviewContainer} className="glass">
                {QUESTIONS.map((q, idx) => {
                  const candidateAnswerIdx = answers[q.id];
                  const isAnswered = candidateAnswerIdx !== undefined;
                  const isCorrect = candidateAnswerIdx === q.answer;

                  return (
                    <div key={q.id} style={styles.answerReviewItem}>
                      <div style={styles.answerReviewHeader}>
                        <span style={styles.answerReviewNum}>Question {idx + 1}</span>
                        {isCorrect ? (
                          <span style={styles.correctBadge}><Check size={12} /> Correct (+{POINTS_PER_QUESTION || 10} pts)</span>
                        ) : (
                          <span style={styles.incorrectBadge}><X size={12} /> {isAnswered ? 'Incorrect' : 'Unanswered'} (0 pts)</span>
                        )}
                      </div>
                      <p style={styles.answerReviewQuestion}>{q.question}</p>
                      <div style={styles.answerOptionsGrid}>
                        {q.options.map((opt, optIdx) => {
                          const isCandidateChoice = candidateAnswerIdx === optIdx;
                          const isActualCorrect = q.answer === optIdx;

                          let borderColor = 'rgba(255,255,255,0.05)';
                          let bgColor = 'rgba(255,255,255,0.01)';
                          let color = '#94a3b8';

                          if (isActualCorrect) {
                            borderColor = '#10b981';
                            bgColor = 'rgba(16, 185, 129, 0.1)';
                            color = '#34d399';
                          } else if (isCandidateChoice && !isCorrect) {
                            borderColor = '#ef4444';
                            bgColor = 'rgba(239, 68, 68, 0.1)';
                            color = '#f87171';
                          }

                          return (
                            <div key={optIdx} style={{ ...styles.answerOptionTile, borderColor, backgroundColor: bgColor, color }}>
                              <span style={{ fontWeight: 'bold', marginRight: '0.4rem' }}>{String.fromCharCode(65 + optIdx)}.</span>
                              <span>{opt}</span>
                              {isCandidateChoice && <span style={styles.candidateChoiceTag}>Selected</span>}
                              {isActualCorrect && <span style={styles.correctChoiceTag}>Key</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const POINTS_PER_QUESTION = 10;

const styles = {
  container: { maxWidth: '1280px', margin: '2rem auto', padding: '0 1rem' },
  header: { padding: '2rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  badgeLine: { fontSize: '0.75rem', fontWeight: 'bold', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', display: 'block' },
  title: { fontSize: '1.6rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.4rem' },
  subtitle: { color: '#94a3b8', fontSize: '0.85rem', margin: 0 },
  historySection: { padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' },
  historyTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' },
  benchmarkBtn: { display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' },
  clearBtn: { backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', padding: '0.35rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' },
  
  // Search and Sort Bar
  searchSortBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.45rem 0.85rem', flex: 1, minWidth: '240px' },
  searchInput: { background: 'none', border: 'none', color: '#f8fafc', fontSize: '0.82rem', outline: 'none', width: '100%' },
  sortWrapper: { display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.35rem 0.75rem' },
  sortSelect: { background: 'none', border: 'none', color: '#a5b4fc', fontSize: '0.78rem', outline: 'none', cursor: 'pointer', fontWeight: 'bold' },

  filterTabs: { display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' },
  filterBtn: { border: '1px solid', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' },
  historyTable: { overflowX: 'auto' },
  historyHeaderRow: { display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.2fr 0.6fr', gap: '0.5rem', padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '0.72rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' },
  historyRow: { display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.2fr 0.6fr', gap: '0.5rem', padding: '0.6rem 0.75rem', borderBottom: '1px solid', fontSize: '0.82rem', color: '#e2e8f0', alignItems: 'center', borderRadius: '6px', transition: 'all 0.2s' },
  historyCol: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  riskBadge: { display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 'bold', border: '1px solid' },
  viewBtn: { backgroundColor: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 'bold' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' },
  statCard: { padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  statLabel: { fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' },
  statRow: { display: 'flex', alignItems: 'center', gap: '1rem' },
  statVal: { fontSize: '1.5rem', fontWeight: '800', color: '#f8fafc', display: 'block' },
  dashboardGrid: { display: 'grid', gridTemplateColumns: '1.7fr 1.3fr', gap: '1.5rem' },
  logCard: { padding: '1.5rem', borderRadius: '16px', minHeight: '400px' },
  cardTitle: { fontSize: '1rem', color: '#f8fafc', marginBottom: '0.2rem' },
  cardSubtitle: { fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '280px', textAlign: 'center' },
  logTimeline: { display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '1.25rem', marginLeft: '0.5rem', maxHeight: '500px', overflowY: 'auto' },
  timelineItem: { position: 'relative', paddingBottom: '0.25rem' },
  timelineBadge: { position: 'absolute', left: '-24px', top: '4px', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#0f172a', border: '2px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  timelineContent: { backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.6rem 0.8rem' },
  timelineHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem', flexWrap: 'wrap', gap: '0.3rem' },
  timelineType: { fontSize: '0.8rem', fontWeight: 'bold', color: '#fca5a5' },
  timelineTime: { fontSize: '0.68rem', color: '#64748b', fontFamily: 'monospace' },
  severityBadge: { display: 'inline-block', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 'bold' },
  timelineDetails: { fontSize: '0.75rem', color: '#94a3b8', margin: 0, lineHeight: '1.3' },
  btnEvidence: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.4rem', backgroundColor: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '6px', color: '#818cf8', padding: '0.25rem 0.5rem', fontSize: '0.7rem', cursor: 'pointer' },
  chartsColumn: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  chartCard: { padding: '1.25rem', borderRadius: '12px' },
  chartTitle: { fontSize: '0.9rem', color: '#e2e8f0', marginBottom: '1rem', fontWeight: '600' },
  emptyChart: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', fontSize: '0.8rem', color: '#64748b' },
  svgChartContainer: { backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '8px', padding: '0.5rem' },
  featureTable: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  featureRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' },
  miniBar: { width: '100%', height: '5px', backgroundColor: '#1e293b', borderRadius: '9999px', overflow: 'hidden' },
  miniBarFill: { height: '100%', transition: 'width 0.5s ease' },
  snapshotDrawer: { padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.25)' },
  drawerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' },
  drawerSub: { fontSize: '0.72rem', color: '#64748b', margin: '0 0 0.5rem 0' },
  btnCloseDrawer: { backgroundColor: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' },
  drawerImageContainer: { borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#000' },
  evidenceImg: { width: '100%', maxHeight: '200px', objectFit: 'contain' },
  reportCard: { padding: '1.25rem', borderRadius: '12px' },
  reportGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' },
  reportRow: { display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' },
  reportLabel: { fontSize: '0.75rem', color: '#64748b', fontWeight: '600' },
  reportVal: { fontSize: '0.75rem', color: '#e2e8f0', fontWeight: '600' },
  answerReviewToggle: { width: '100%', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#f8fafc', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.02)' },
  answerReviewContainer: { padding: '1.5rem', borderRadius: '12px', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  answerReviewItem: { paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  answerReviewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' },
  answerReviewNum: { fontSize: '0.78rem', fontWeight: 'bold', color: '#6366f1', textTransform: 'uppercase' },
  correctBadge: { display: 'inline-flex', alignItems: 'center', gap: '0.2rem', backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' },
  incorrectBadge: { display: 'inline-flex', alignItems: 'center', gap: '0.2rem', backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' },
  answerReviewQuestion: { fontSize: '0.92rem', color: '#f8fafc', fontWeight: '500', marginBottom: '0.75rem' },
  answerOptionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' },
  answerOptionTile: { padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid', fontSize: '0.8rem', display: 'flex', alignItems: 'center', position: 'relative' },
  candidateChoiceTag: { marginLeft: 'auto', fontSize: '0.65rem', backgroundColor: 'rgba(239,68,68,0.2)', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 'bold' },
  correctChoiceTag: { marginLeft: 'auto', fontSize: '0.65rem', backgroundColor: 'rgba(16,185,129,0.2)', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 'bold' },

  // Modal Styles
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8, 12, 20, 0.85)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' },
  newSessionModal: { maxWidth: '720px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnCloseModal: { backgroundColor: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.2rem' },
  modalTabRow: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' },
  modalTabBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', border: '1px solid', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' },
  simContainer: { display: 'flex', flexDirection: 'column' },
  liveRiskBanner: { padding: '0.85rem 1.25rem', borderRadius: '10px', border: '1px solid', marginBottom: '1.25rem', transition: 'all 0.3s ease' },
  formLabel: { display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.03em' },
  presetGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' },
  presetCard: { backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '0.6rem 0.8rem', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' },
  formRowTwo: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' },
  modalInput: { width: '100%', padding: '0.65rem 0.85rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none' },
  slidersGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' },
  sliderBox: { backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.6rem 0.8rem' },
  sliderHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' },
  rangeInput: { width: '100%', cursor: 'pointer', accentColor: '#6366f1' },
  strictnessRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' },
  strictnessCard: { padding: '0.75rem', borderRadius: '8px', border: '1px solid', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  passCodeBanner: { display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px', padding: '0.75rem 1rem', marginTop: '1.25rem' },
};
