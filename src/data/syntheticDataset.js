import { AnomalyDetector } from '../services/AnomalyDetector';
import { EVENT_TYPES, SEVERITY } from '../services/ActivityLogger';

const detector = new AnomalyDetector();

// Programmatic snapshot canvas helper for synthetic visual evidence
function createSyntheticSnapshot(title, color = '#ef4444') {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#0b0f19';
  ctx.fillRect(0, 0, 320, 240);

  // Security grid lines
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let i = 0; i < 320; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 240); ctx.stroke();
  }
  for (let i = 0; i < 240; i += 24) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(320, i); ctx.stroke();
  }

  // Bounding box frame
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 30, 240, 180);

  // Status text
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`ANOMALY: ${title}`, 50, 60);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px monospace';
  ctx.fillText('FLAGGED BY AI PROCTORING ENGINE', 50, 85);
  ctx.fillText(`TIMESTAMP: ${new Date().toLocaleTimeString()}`, 50, 105);

  ctx.fillStyle = color;
  ctx.fillRect(50, 130, 220, 30);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('EVIDENCE CAPTURED', 90, 150);

  return canvas.toDataURL('image/jpeg', 0.6);
}

export const SYNTHETIC_BENCHMARK_SESSIONS = [
  {
    sessionId: 'session-syn-01',
    studentInfo: { name: 'Rahul Sharma', regNo: '24091A3201', role: 'student' },
    examDate: new Date(Date.now() - 3600000 * 2).toISOString(),
    score: 90,
    totalQuestions: 10,
    pointsPerQuestion: 10,
    warningCount: 0,
    trustScore: 98,
    exitReason: 'Submitted by Candidate',
    activitySummary: {
      totalDuration: 540,
      tabSwitchCount: 0,
      focusLostCount: 0,
      faceAbsentCount: 0,
      faceAbsentDuration: 0,
      gazeAwayCount: 1,
      gazeAwayDuration: 4,
      noiseSpikeCount: 0,
      copyPasteAttempts: 0,
      fullscreenExits: 0,
      multipleFacesCount: 0,
      devtoolsAttempts: 0,
      totalIdleTime: 20,
      rapidSubmissions: 0,
      keystrokeCount: 142,
      avgKeystrokeRate: 15.7,
    },
    activityLogs: [
      { id: 'l1', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), localTime: '10:00:15 AM', eventType: EVENT_TYPES.EXAM_STARTED, severity: SEVERITY.LOW, details: 'Proctored exam session initialized.' },
      { id: 'l2', timestamp: new Date(Date.now() - 3600000 * 2 + 120000).toISOString(), localTime: '10:02:15 AM', eventType: EVENT_TYPES.ANSWER_SELECTED, severity: SEVERITY.LOW, details: 'Answered question 1' },
      { id: 'l3', timestamp: new Date(Date.now() - 3600000 * 2 + 240000).toISOString(), localTime: '10:04:15 AM', eventType: EVENT_TYPES.ANSWER_SELECTED, severity: SEVERITY.LOW, details: 'Answered question 2' },
      { id: 'l4', timestamp: new Date(Date.now() - 3600000 * 2 + 540000).toISOString(), localTime: '10:09:00 AM', eventType: EVENT_TYPES.EXAM_SUBMITTED, severity: SEVERITY.LOW, details: 'Exam submitted: Submitted by Candidate' },
    ],
  },
  {
    sessionId: 'session-syn-02',
    studentInfo: { name: 'Priya Patel', regNo: '24091A3202', role: 'student' },
    examDate: new Date(Date.now() - 3600000 * 5).toISOString(),
    score: 80,
    totalQuestions: 10,
    pointsPerQuestion: 10,
    warningCount: 4,
    trustScore: 48,
    exitReason: 'Submitted with Warnings',
    activitySummary: {
      totalDuration: 480,
      tabSwitchCount: 7,
      focusLostCount: 8,
      faceAbsentCount: 1,
      faceAbsentDuration: 14,
      gazeAwayCount: 6,
      gazeAwayDuration: 52,
      noiseSpikeCount: 1,
      copyPasteAttempts: 2,
      fullscreenExits: 3,
      multipleFacesCount: 0,
      devtoolsAttempts: 1,
      totalIdleTime: 45,
      rapidSubmissions: 1,
      keystrokeCount: 68,
      avgKeystrokeRate: 8.5,
    },
    activityLogs: [
      { id: 'lp1', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), localTime: '02:00:10 PM', eventType: EVENT_TYPES.EXAM_STARTED, severity: SEVERITY.LOW, details: 'Proctored session started.' },
      { id: 'lp2', timestamp: new Date(Date.now() - 3600000 * 5 + 60000).toISOString(), localTime: '02:01:10 PM', eventType: EVENT_TYPES.TAB_SWITCH, severity: SEVERITY.HIGH, details: 'Candidate switched tabs (search query attempt).', snapshot: createSyntheticSnapshot('TAB_SWITCH') },
      { id: 'lp3', timestamp: new Date(Date.now() - 3600000 * 5 + 130000).toISOString(), localTime: '02:02:20 PM', eventType: EVENT_TYPES.GAZE_AWAY, severity: SEVERITY.MEDIUM, details: 'Candidate looking away toward side desk.', snapshot: createSyntheticSnapshot('GAZE_AWAY') },
      { id: 'lp4', timestamp: new Date(Date.now() - 3600000 * 5 + 210000).toISOString(), localTime: '02:03:40 PM', eventType: EVENT_TYPES.DEVTOOLS_ATTEMPT, severity: SEVERITY.HIGH, details: 'Attempted to open browser developer tools (F12).' },
      { id: 'lp5', timestamp: new Date(Date.now() - 3600000 * 5 + 300000).toISOString(), localTime: '02:05:10 PM', eventType: EVENT_TYPES.TAB_SWITCH, severity: SEVERITY.HIGH, details: 'Repeated tab navigation event.', snapshot: createSyntheticSnapshot('TAB_SWITCH') },
    ],
  },
  {
    sessionId: 'session-syn-03',
    studentInfo: { name: 'Karthik Varma', regNo: '24091A3204', role: 'student' },
    examDate: new Date(Date.now() - 3600000 * 12).toISOString(),
    score: 30,
    totalQuestions: 10,
    pointsPerQuestion: 10,
    warningCount: 6,
    trustScore: 22,
    exitReason: 'Suspended due to excessive proctoring violations',
    activitySummary: {
      totalDuration: 320,
      tabSwitchCount: 4,
      focusLostCount: 5,
      faceAbsentCount: 3,
      faceAbsentDuration: 38,
      gazeAwayCount: 8,
      gazeAwayDuration: 75,
      noiseSpikeCount: 4,
      copyPasteAttempts: 4,
      fullscreenExits: 4,
      multipleFacesCount: 3,
      devtoolsAttempts: 2,
      totalIdleTime: 95,
      rapidSubmissions: 3,
      keystrokeCount: 22,
      avgKeystrokeRate: 4.1,
    },
    activityLogs: [
      { id: 'lk1', timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), localTime: '09:15:00 AM', eventType: EVENT_TYPES.EXAM_STARTED, severity: SEVERITY.LOW, details: 'Proctored session started.' },
      { id: 'lk2', timestamp: new Date(Date.now() - 3600000 * 12 + 45000).toISOString(), localTime: '09:15:45 AM', eventType: EVENT_TYPES.MULTIPLE_FACES, severity: SEVERITY.CRITICAL, details: 'Multiple faces detected in webcam frame (2 persons).', snapshot: createSyntheticSnapshot('MULTIPLE_FACES') },
      { id: 'lk3', timestamp: new Date(Date.now() - 3600000 * 12 + 110000).toISOString(), localTime: '09:16:50 AM', eventType: EVENT_TYPES.FACE_ABSENT, severity: SEVERITY.HIGH, details: 'Candidate completely absent from video frame.', snapshot: createSyntheticSnapshot('FACE_ABSENT') },
      { id: 'lk4', timestamp: new Date(Date.now() - 3600000 * 12 + 180000).toISOString(), localTime: '09:18:00 AM', eventType: EVENT_TYPES.NOISE_DETECTED, severity: SEVERITY.MEDIUM, details: 'Sustained conversational acoustic activity detected.' },
      { id: 'lk5', timestamp: new Date(Date.now() - 3600000 * 12 + 260000).toISOString(), localTime: '09:19:20 AM', eventType: EVENT_TYPES.COPY_PASTE, severity: SEVERITY.LOW, details: 'Candidate attempted to copy question payload.' },
    ],
  },
  {
    sessionId: 'session-syn-04',
    studentInfo: { name: 'Ananya Reddy', regNo: '24091A3203', role: 'student' },
    examDate: new Date(Date.now() - 3600000 * 24).toISOString(),
    score: 60,
    totalQuestions: 10,
    pointsPerQuestion: 10,
    warningCount: 2,
    trustScore: 68,
    exitReason: 'Submitted by Candidate',
    activitySummary: {
      totalDuration: 590,
      tabSwitchCount: 2,
      focusLostCount: 3,
      faceAbsentCount: 0,
      faceAbsentDuration: 0,
      gazeAwayCount: 3,
      gazeAwayDuration: 22,
      noiseSpikeCount: 2,
      copyPasteAttempts: 1,
      fullscreenExits: 1,
      multipleFacesCount: 0,
      devtoolsAttempts: 0,
      totalIdleTime: 140,
      rapidSubmissions: 3,
      keystrokeCount: 45,
      avgKeystrokeRate: 4.5,
    },
    activityLogs: [
      { id: 'la1', timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), localTime: '11:00:00 AM', eventType: EVENT_TYPES.EXAM_STARTED, severity: SEVERITY.LOW, details: 'Session started.' },
      { id: 'la2', timestamp: new Date(Date.now() - 3600000 * 24 + 90000).toISOString(), localTime: '11:01:30 AM', eventType: EVENT_TYPES.IDLE_DETECTED, severity: SEVERITY.LOW, details: 'No interaction detected for 60 seconds.' },
      { id: 'la3', timestamp: new Date(Date.now() - 3600000 * 24 + 180000).toISOString(), localTime: '11:03:00 AM', eventType: EVENT_TYPES.RAPID_SUBMISSION, severity: SEVERITY.MEDIUM, details: 'Question 4 answered in 2 seconds (rapid guessing pattern).' },
      { id: 'la4', timestamp: new Date(Date.now() - 3600000 * 24 + 320000).toISOString(), localTime: '11:05:20 AM', eventType: EVENT_TYPES.NOISE_DETECTED, severity: SEVERITY.MEDIUM, details: 'Background speech detected.' },
    ],
  },
  {
    sessionId: 'session-syn-05',
    studentInfo: { name: 'Sneha Rao', regNo: '24091A3206', role: 'student' },
    examDate: new Date(Date.now() - 3600000 * 30).toISOString(),
    score: 100,
    totalQuestions: 10,
    pointsPerQuestion: 10,
    warningCount: 0,
    trustScore: 100,
    exitReason: 'Submitted by Candidate',
    activitySummary: {
      totalDuration: 510,
      tabSwitchCount: 0,
      focusLostCount: 0,
      faceAbsentCount: 0,
      faceAbsentDuration: 0,
      gazeAwayCount: 0,
      gazeAwayDuration: 0,
      noiseSpikeCount: 0,
      copyPasteAttempts: 0,
      fullscreenExits: 0,
      multipleFacesCount: 0,
      devtoolsAttempts: 0,
      totalIdleTime: 12,
      rapidSubmissions: 0,
      keystrokeCount: 165,
      avgKeystrokeRate: 19.4,
    },
    activityLogs: [
      { id: 'ls1', timestamp: new Date(Date.now() - 3600000 * 30).toISOString(), localTime: '03:30:00 PM', eventType: EVENT_TYPES.EXAM_STARTED, severity: SEVERITY.LOW, details: 'Clean proctored session started.' },
      { id: 'ls2', timestamp: new Date(Date.now() - 3600000 * 30 + 510000).toISOString(), localTime: '03:38:30 PM', eventType: EVENT_TYPES.EXAM_SUBMITTED, severity: SEVERITY.LOW, details: 'Exam submitted: Perfect integrity score.' },
    ],
  }
].map(session => ({
  ...session,
  anomalyResult: detector.analyze(session.activitySummary),
}));
