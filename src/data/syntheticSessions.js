/**
 * Synthetic Exam Activity Logs Dataset
 * 
 * Simulates realistic student exam sessions with behavioral data including:
 * - Tab switches, idle time, keystroke patterns
 * - Gaze tracking, face detection events
 * - Copy/paste attempts, fullscreen violations
 * - Rapid answer submissions
 * 
 * Each session represents a complete exam with an activity summary
 * and event-level logs for the Proctor Dashboard.
 */

const SESSION_TEMPLATES = [
  // ============================
  // Session 1: Clean Session - Good student
  // ============================
  {
    sessionId: 'session-demo-001',
    studentInfo: { name: 'Priya Sharma', regNo: '24091A3201', role: 'student' },
    score: 80,
    totalQuestions: 10,
    pointsPerQuestion: 10,
    trustScore: 95,
    warningCount: 0,
    exitReason: 'Submitted by Candidate',
    examDate: '2026-09-20T10:15:00.000Z',
    activitySummary: {
      totalDuration: 540,
      tabSwitchCount: 0,
      focusLostCount: 0,
      faceAbsentCount: 0,
      faceAbsentDuration: 0,
      gazeAwayCount: 1,
      gazeAwayDuration: 3.2,
      noiseSpikeCount: 0,
      copyPasteAttempts: 0,
      fullscreenExits: 0,
      multipleFacesCount: 0,
      devtoolsAttempts: 0,
      totalIdleTime: 12,
      rapidSubmissions: 0,
      keystrokeCount: 87,
      avgKeystrokeRate: 9.7,
    },
    activityLogs: [
      { id: 'ev-001a', timestamp: '2026-09-20T10:15:00.000Z', localTime: '3:45:00 PM', eventType: 'EXAM_STARTED', severity: 'LOW', details: 'Proctored exam session started.', metadata: { studentName: 'Priya Sharma', studentRegNo: '24091A3201', totalQuestions: 10 }, snapshot: null, elapsedMs: 0 },
      { id: 'ev-001b', timestamp: '2026-09-20T10:16:42.000Z', localTime: '3:46:42 PM', eventType: 'ANSWER_SELECTED', severity: 'LOW', details: 'Answered question 1', metadata: { questionId: 1, selectedOption: 1 }, snapshot: null, elapsedMs: 102000 },
      { id: 'ev-001c', timestamp: '2026-09-20T10:18:20.000Z', localTime: '3:48:20 PM', eventType: 'ANSWER_SELECTED', severity: 'LOW', details: 'Answered question 2', metadata: { questionId: 2, selectedOption: 1 }, snapshot: null, elapsedMs: 200000 },
      { id: 'ev-001d', timestamp: '2026-09-20T10:19:55.000Z', localTime: '3:49:55 PM', eventType: 'GAZE_AWAY', severity: 'MEDIUM', details: 'Candidate looked away briefly (left) — returned within 3s.', metadata: {}, snapshot: null, elapsedMs: 295000 },
      { id: 'ev-001e', timestamp: '2026-09-20T10:24:00.000Z', localTime: '3:54:00 PM', eventType: 'EXAM_SUBMITTED', severity: 'LOW', details: 'Exam submitted: Submitted by Candidate', metadata: { reason: 'Submitted by Candidate' }, snapshot: null, elapsedMs: 540000 },
    ],
    anomalyResult: {
      riskScore: 8,
      riskLevel: { label: 'Low Risk', range: '0-30', verdict: 'APPROVED', color: '#10b981', description: 'Exam completed within integrity standards. No patterns of systemic cheating detected.' },
      featureScores: {
        tabSwitchCount: { rawValue: 0, normalizedScore: 0, weight: 0.25, weightedContribution: 0, description: 'Tab/window switches during exam' },
        totalIdleTime: { rawValue: 12, normalizedScore: 0.1, weight: 0.10, weightedContribution: 0.01, description: 'Total idle seconds (no interaction)' },
        avgKeystrokeRate: { rawValue: 9.7, normalizedScore: 0.03, weight: 0.05, weightedContribution: 0, description: 'Avg keystrokes/min (low = suspicious)' },
        gazeAwayDuration: { rawValue: 3.2, normalizedScore: 0.05, weight: 0.20, weightedContribution: 0.01, description: 'Seconds looking away from screen' },
        faceAbsentDuration: { rawValue: 0, normalizedScore: 0, weight: 0.20, weightedContribution: 0, description: 'Seconds face not detected' },
        noiseSpikeCount: { rawValue: 0, normalizedScore: 0, weight: 0.05, weightedContribution: 0, description: 'Sustained high-noise periods' },
        rapidSubmissions: { rawValue: 0, normalizedScore: 0, weight: 0.10, weightedContribution: 0, description: 'Questions answered in < 5 seconds' },
        copyPasteAttempts: { rawValue: 0, normalizedScore: 0, weight: 0.05, weightedContribution: 0, description: 'Copy/paste/right-click attempts' },
      },
      summary: { totalFeaturesAnalyzed: 8, highestContributor: { feature: 'gazeAwayDuration', contribution: 0.01, description: 'Seconds looking away from screen' }, timestamp: '2026-09-20T10:24:00.000Z' },
    },
  },

  // ============================
  // Session 2: Medium Risk - Suspicious student
  // ============================
  {
    sessionId: 'session-demo-002',
    studentInfo: { name: 'Rahul Verma', regNo: '24091A3205', role: 'student' },
    score: 70,
    totalQuestions: 10,
    pointsPerQuestion: 10,
    trustScore: 65,
    warningCount: 2,
    exitReason: 'Submitted by Candidate',
    examDate: '2026-09-20T10:30:00.000Z',
    activitySummary: {
      totalDuration: 490,
      tabSwitchCount: 3,
      focusLostCount: 2,
      faceAbsentCount: 1,
      faceAbsentDuration: 8.5,
      gazeAwayCount: 5,
      gazeAwayDuration: 22.8,
      noiseSpikeCount: 2,
      copyPasteAttempts: 1,
      fullscreenExits: 1,
      multipleFacesCount: 0,
      devtoolsAttempts: 0,
      totalIdleTime: 45,
      rapidSubmissions: 2,
      keystrokeCount: 42,
      avgKeystrokeRate: 5.1,
    },
    activityLogs: [
      { id: 'ev-002a', timestamp: '2026-09-20T10:30:00.000Z', localTime: '4:00:00 PM', eventType: 'EXAM_STARTED', severity: 'LOW', details: 'Proctored exam session started.', metadata: { studentName: 'Rahul Verma', studentRegNo: '24091A3205', totalQuestions: 10 }, snapshot: null, elapsedMs: 0 },
      { id: 'ev-002b', timestamp: '2026-09-20T10:31:15.000Z', localTime: '4:01:15 PM', eventType: 'TAB_SWITCH', severity: 'HIGH', details: 'Student navigated away from the exam tab.', metadata: {}, snapshot: null, elapsedMs: 75000 },
      { id: 'ev-002c', timestamp: '2026-09-20T10:32:40.000Z', localTime: '4:02:40 PM', eventType: 'GAZE_AWAY', severity: 'MEDIUM', details: 'Candidate is looking away from the screen (right).', metadata: {}, snapshot: null, elapsedMs: 160000 },
      { id: 'ev-002d', timestamp: '2026-09-20T10:33:10.000Z', localTime: '4:03:10 PM', eventType: 'RAPID_SUBMISSION', severity: 'MEDIUM', details: 'Question 3 answered in 3s (rapid)', metadata: { questionId: 3, durationMs: 3100 }, snapshot: null, elapsedMs: 190000 },
      { id: 'ev-002e', timestamp: '2026-09-20T10:34:05.000Z', localTime: '4:04:05 PM', eventType: 'TAB_SWITCH', severity: 'HIGH', details: 'Student navigated away from the exam tab.', metadata: {}, snapshot: null, elapsedMs: 245000 },
      { id: 'ev-002f', timestamp: '2026-09-20T10:34:30.000Z', localTime: '4:04:30 PM', eventType: 'COPY_PASTE', severity: 'LOW', details: 'Candidate attempted to paste content.', metadata: {}, snapshot: null, elapsedMs: 270000 },
      { id: 'ev-002g', timestamp: '2026-09-20T10:35:50.000Z', localTime: '4:05:50 PM', eventType: 'FULLSCREEN_EXIT', severity: 'MEDIUM', details: 'Exam is no longer running in fullscreen mode.', metadata: {}, snapshot: null, elapsedMs: 350000 },
      { id: 'ev-002h', timestamp: '2026-09-20T10:36:20.000Z', localTime: '4:06:20 PM', eventType: 'NOISE_DETECTED', severity: 'MEDIUM', details: 'Unusual room noise or speaking detected.', metadata: {}, snapshot: null, elapsedMs: 380000 },
      { id: 'ev-002i', timestamp: '2026-09-20T10:38:10.000Z', localTime: '4:08:10 PM', eventType: 'TAB_SWITCH', severity: 'HIGH', details: 'Student navigated away from the exam tab.', metadata: {}, snapshot: null, elapsedMs: 490000 },
      { id: 'ev-002j', timestamp: '2026-09-20T10:38:10.000Z', localTime: '4:08:10 PM', eventType: 'EXAM_SUBMITTED', severity: 'LOW', details: 'Exam submitted: Submitted by Candidate', metadata: { reason: 'Submitted by Candidate' }, snapshot: null, elapsedMs: 490000 },
    ],
    anomalyResult: {
      riskScore: 47,
      riskLevel: { label: 'Medium Risk', range: '31-60', verdict: 'MANUAL REVIEW RECOMMENDED', color: '#f59e0b', description: 'Multiple warning triggers registered. Review the activity timeline before grading.' },
      featureScores: {
        tabSwitchCount: { rawValue: 3, normalizedScore: 0.6, weight: 0.25, weightedContribution: 0.15, description: 'Tab/window switches during exam' },
        totalIdleTime: { rawValue: 45, normalizedScore: 0.38, weight: 0.10, weightedContribution: 0.04, description: 'Total idle seconds (no interaction)' },
        avgKeystrokeRate: { rawValue: 5.1, normalizedScore: 0.49, weight: 0.05, weightedContribution: 0.02, description: 'Avg keystrokes/min (low = suspicious)' },
        gazeAwayDuration: { rawValue: 22.8, normalizedScore: 0.38, weight: 0.20, weightedContribution: 0.08, description: 'Seconds looking away from screen' },
        faceAbsentDuration: { rawValue: 8.5, normalizedScore: 0.28, weight: 0.20, weightedContribution: 0.06, description: 'Seconds face not detected' },
        noiseSpikeCount: { rawValue: 2, normalizedScore: 0.4, weight: 0.05, weightedContribution: 0.02, description: 'Sustained high-noise periods' },
        rapidSubmissions: { rawValue: 2, normalizedScore: 0.67, weight: 0.10, weightedContribution: 0.07, description: 'Questions answered in < 5 seconds' },
        copyPasteAttempts: { rawValue: 1, normalizedScore: 0.33, weight: 0.05, weightedContribution: 0.02, description: 'Copy/paste/right-click attempts' },
      },
      summary: { totalFeaturesAnalyzed: 8, highestContributor: { feature: 'tabSwitchCount', contribution: 0.15, description: 'Tab/window switches during exam' }, timestamp: '2026-09-20T10:38:10.000Z' },
    },
  },

  // ============================
  // Session 3: High Risk - Flagged/Suspended
  // ============================
  {
    sessionId: 'session-demo-003',
    studentInfo: { name: 'Aditya Reddy', regNo: '24091A3210', role: 'student' },
    score: 90,
    totalQuestions: 10,
    pointsPerQuestion: 10,
    trustScore: 25,
    warningCount: 3,
    exitReason: 'Suspended due to excessive proctoring violations',
    examDate: '2026-09-20T11:00:00.000Z',
    activitySummary: {
      totalDuration: 320,
      tabSwitchCount: 7,
      focusLostCount: 5,
      faceAbsentCount: 4,
      faceAbsentDuration: 35.2,
      gazeAwayCount: 8,
      gazeAwayDuration: 58.5,
      noiseSpikeCount: 3,
      copyPasteAttempts: 4,
      fullscreenExits: 3,
      multipleFacesCount: 2,
      devtoolsAttempts: 1,
      totalIdleTime: 85,
      rapidSubmissions: 5,
      keystrokeCount: 18,
      avgKeystrokeRate: 3.4,
    },
    activityLogs: [
      { id: 'ev-003a', timestamp: '2026-09-20T11:00:00.000Z', localTime: '4:30:00 PM', eventType: 'EXAM_STARTED', severity: 'LOW', details: 'Proctored exam session started.', metadata: { studentName: 'Aditya Reddy', studentRegNo: '24091A3210', totalQuestions: 10 }, snapshot: null, elapsedMs: 0 },
      { id: 'ev-003b', timestamp: '2026-09-20T11:00:45.000Z', localTime: '4:30:45 PM', eventType: 'RAPID_SUBMISSION', severity: 'MEDIUM', details: 'Question 1 answered in 2s (rapid)', metadata: { questionId: 1, durationMs: 2100 }, snapshot: null, elapsedMs: 45000 },
      { id: 'ev-003c', timestamp: '2026-09-20T11:01:10.000Z', localTime: '4:31:10 PM', eventType: 'TAB_SWITCH', severity: 'HIGH', details: 'Student navigated away from the exam tab.', metadata: {}, snapshot: null, elapsedMs: 70000 },
      { id: 'ev-003d', timestamp: '2026-09-20T11:01:20.000Z', localTime: '4:31:20 PM', eventType: 'COPY_PASTE', severity: 'LOW', details: 'Candidate attempted to paste content.', metadata: {}, snapshot: null, elapsedMs: 80000 },
      { id: 'ev-003e', timestamp: '2026-09-20T11:01:55.000Z', localTime: '4:31:55 PM', eventType: 'MULTIPLE_FACES', severity: 'CRITICAL', details: 'More than one face detected in exam frame.', metadata: {}, snapshot: null, elapsedMs: 115000 },
      { id: 'ev-003f', timestamp: '2026-09-20T11:02:30.000Z', localTime: '4:32:30 PM', eventType: 'TAB_SWITCH', severity: 'HIGH', details: 'Student navigated away from the exam tab.', metadata: {}, snapshot: null, elapsedMs: 150000 },
      { id: 'ev-003g', timestamp: '2026-09-20T11:02:50.000Z', localTime: '4:32:50 PM', eventType: 'FACE_ABSENT', severity: 'HIGH', details: 'Candidate is not visible in camera feed.', metadata: {}, snapshot: null, elapsedMs: 170000 },
      { id: 'ev-003h', timestamp: '2026-09-20T11:03:15.000Z', localTime: '4:33:15 PM', eventType: 'GAZE_AWAY', severity: 'MEDIUM', details: 'Candidate is looking away from the screen (left).', metadata: {}, snapshot: null, elapsedMs: 195000 },
      { id: 'ev-003i', timestamp: '2026-09-20T11:03:40.000Z', localTime: '4:33:40 PM', eventType: 'DEVTOOLS_ATTEMPT', severity: 'HIGH', details: 'Attempted to open developer tools.', metadata: {}, snapshot: null, elapsedMs: 220000 },
      { id: 'ev-003j', timestamp: '2026-09-20T11:04:10.000Z', localTime: '4:34:10 PM', eventType: 'TAB_SWITCH', severity: 'HIGH', details: 'Student navigated away from the exam tab.', metadata: {}, snapshot: null, elapsedMs: 250000 },
      { id: 'ev-003k', timestamp: '2026-09-20T11:04:30.000Z', localTime: '4:34:30 PM', eventType: 'NOISE_DETECTED', severity: 'MEDIUM', details: 'Unusual room noise or speaking detected.', metadata: {}, snapshot: null, elapsedMs: 270000 },
      { id: 'ev-003l', timestamp: '2026-09-20T11:05:00.000Z', localTime: '4:35:00 PM', eventType: 'MULTIPLE_FACES', severity: 'CRITICAL', details: 'More than one face detected in exam frame.', metadata: {}, snapshot: null, elapsedMs: 300000 },
      { id: 'ev-003m', timestamp: '2026-09-20T11:05:20.000Z', localTime: '4:35:20 PM', eventType: 'EXAM_SUBMITTED', severity: 'LOW', details: 'Exam submitted: Suspended due to excessive proctoring violations', metadata: { reason: 'Suspended due to excessive proctoring violations' }, snapshot: null, elapsedMs: 320000 },
    ],
    anomalyResult: {
      riskScore: 82,
      riskLevel: { label: 'High Risk', range: '61-100', verdict: 'FLAGGED / SUSPENDED', color: '#ef4444', description: 'Integrity threshold breached. Multiple major violations or screen termination occurred.' },
      featureScores: {
        tabSwitchCount: { rawValue: 7, normalizedScore: 1.0, weight: 0.25, weightedContribution: 0.25, description: 'Tab/window switches during exam' },
        totalIdleTime: { rawValue: 85, normalizedScore: 0.71, weight: 0.10, weightedContribution: 0.07, description: 'Total idle seconds (no interaction)' },
        avgKeystrokeRate: { rawValue: 3.4, normalizedScore: 0.66, weight: 0.05, weightedContribution: 0.03, description: 'Avg keystrokes/min (low = suspicious)' },
        gazeAwayDuration: { rawValue: 58.5, normalizedScore: 0.98, weight: 0.20, weightedContribution: 0.19, description: 'Seconds looking away from screen' },
        faceAbsentDuration: { rawValue: 35.2, normalizedScore: 1.0, weight: 0.20, weightedContribution: 0.20, description: 'Seconds face not detected' },
        noiseSpikeCount: { rawValue: 3, normalizedScore: 0.6, weight: 0.05, weightedContribution: 0.03, description: 'Sustained high-noise periods' },
        rapidSubmissions: { rawValue: 5, normalizedScore: 1.0, weight: 0.10, weightedContribution: 0.10, description: 'Questions answered in < 5 seconds' },
        copyPasteAttempts: { rawValue: 4, normalizedScore: 1.0, weight: 0.05, weightedContribution: 0.05, description: 'Copy/paste/right-click attempts' },
      },
      summary: { totalFeaturesAnalyzed: 8, highestContributor: { feature: 'tabSwitchCount', contribution: 0.25, description: 'Tab/window switches during exam' }, timestamp: '2026-09-20T11:05:20.000Z' },
    },
  },

  // ============================
  // Session 4: Clean Session - Another good student
  // ============================
  {
    sessionId: 'session-demo-004',
    studentInfo: { name: 'Sneha Patel', regNo: '24091A3215', role: 'student' },
    score: 90,
    totalQuestions: 10,
    pointsPerQuestion: 10,
    trustScore: 100,
    warningCount: 0,
    exitReason: 'Submitted by Candidate',
    examDate: '2026-09-20T10:20:00.000Z',
    activitySummary: {
      totalDuration: 580,
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
      totalIdleTime: 8,
      rapidSubmissions: 0,
      keystrokeCount: 102,
      avgKeystrokeRate: 10.6,
    },
    activityLogs: [
      { id: 'ev-004a', timestamp: '2026-09-20T10:20:00.000Z', localTime: '3:50:00 PM', eventType: 'EXAM_STARTED', severity: 'LOW', details: 'Proctored exam session started.', metadata: { studentName: 'Sneha Patel', studentRegNo: '24091A3215', totalQuestions: 10 }, snapshot: null, elapsedMs: 0 },
      { id: 'ev-004b', timestamp: '2026-09-20T10:29:40.000Z', localTime: '3:59:40 PM', eventType: 'EXAM_SUBMITTED', severity: 'LOW', details: 'Exam submitted: Submitted by Candidate', metadata: { reason: 'Submitted by Candidate' }, snapshot: null, elapsedMs: 580000 },
    ],
    anomalyResult: {
      riskScore: 3,
      riskLevel: { label: 'Low Risk', range: '0-30', verdict: 'APPROVED', color: '#10b981', description: 'Exam completed within integrity standards. No patterns of systemic cheating detected.' },
      featureScores: {
        tabSwitchCount: { rawValue: 0, normalizedScore: 0, weight: 0.25, weightedContribution: 0, description: 'Tab/window switches during exam' },
        totalIdleTime: { rawValue: 8, normalizedScore: 0.07, weight: 0.10, weightedContribution: 0.01, description: 'Total idle seconds (no interaction)' },
        avgKeystrokeRate: { rawValue: 10.6, normalizedScore: 0, weight: 0.05, weightedContribution: 0, description: 'Avg keystrokes/min (low = suspicious)' },
        gazeAwayDuration: { rawValue: 0, normalizedScore: 0, weight: 0.20, weightedContribution: 0, description: 'Seconds looking away from screen' },
        faceAbsentDuration: { rawValue: 0, normalizedScore: 0, weight: 0.20, weightedContribution: 0, description: 'Seconds face not detected' },
        noiseSpikeCount: { rawValue: 0, normalizedScore: 0, weight: 0.05, weightedContribution: 0, description: 'Sustained high-noise periods' },
        rapidSubmissions: { rawValue: 0, normalizedScore: 0, weight: 0.10, weightedContribution: 0, description: 'Questions answered in < 5 seconds' },
        copyPasteAttempts: { rawValue: 0, normalizedScore: 0, weight: 0.05, weightedContribution: 0, description: 'Copy/paste/right-click attempts' },
      },
      summary: { totalFeaturesAnalyzed: 8, highestContributor: { feature: 'totalIdleTime', contribution: 0.01, description: 'Total idle seconds (no interaction)' }, timestamp: '2026-09-20T10:29:40.000Z' },
    },
  },

  // ============================
  // Session 5: Medium Risk - Time expired
  // ============================
  {
    sessionId: 'session-demo-005',
    studentInfo: { name: 'Vikram Singh', regNo: '24091A3220', role: 'student' },
    score: 40,
    totalQuestions: 10,
    pointsPerQuestion: 10,
    trustScore: 72,
    warningCount: 1,
    exitReason: 'Time Expired',
    examDate: '2026-09-20T11:15:00.000Z',
    activitySummary: {
      totalDuration: 600,
      tabSwitchCount: 2,
      focusLostCount: 1,
      faceAbsentCount: 0,
      faceAbsentDuration: 0,
      gazeAwayCount: 3,
      gazeAwayDuration: 15.0,
      noiseSpikeCount: 1,
      copyPasteAttempts: 0,
      fullscreenExits: 0,
      multipleFacesCount: 0,
      devtoolsAttempts: 0,
      totalIdleTime: 110,
      rapidSubmissions: 1,
      keystrokeCount: 35,
      avgKeystrokeRate: 3.5,
    },
    activityLogs: [
      { id: 'ev-005a', timestamp: '2026-09-20T11:15:00.000Z', localTime: '4:45:00 PM', eventType: 'EXAM_STARTED', severity: 'LOW', details: 'Proctored exam session started.', metadata: { studentName: 'Vikram Singh', studentRegNo: '24091A3220', totalQuestions: 10 }, snapshot: null, elapsedMs: 0 },
      { id: 'ev-005b', timestamp: '2026-09-20T11:18:20.000Z', localTime: '4:48:20 PM', eventType: 'IDLE_DETECTED', severity: 'LOW', details: 'No interaction detected for 20 seconds.', metadata: { idleDurationMs: 20000 }, snapshot: null, elapsedMs: 200000 },
      { id: 'ev-005c', timestamp: '2026-09-20T11:19:40.000Z', localTime: '4:49:40 PM', eventType: 'TAB_SWITCH', severity: 'HIGH', details: 'Student navigated away from the exam tab.', metadata: {}, snapshot: null, elapsedMs: 280000 },
      { id: 'ev-005d', timestamp: '2026-09-20T11:21:00.000Z', localTime: '4:51:00 PM', eventType: 'GAZE_AWAY', severity: 'MEDIUM', details: 'Candidate is looking away from the screen (right).', metadata: {}, snapshot: null, elapsedMs: 360000 },
      { id: 'ev-005e', timestamp: '2026-09-20T11:22:30.000Z', localTime: '4:52:30 PM', eventType: 'NOISE_DETECTED', severity: 'MEDIUM', details: 'Unusual room noise or speaking detected.', metadata: {}, snapshot: null, elapsedMs: 450000 },
      { id: 'ev-005f', timestamp: '2026-09-20T11:25:00.000Z', localTime: '4:55:00 PM', eventType: 'EXAM_SUBMITTED', severity: 'LOW', details: 'Exam submitted: Time Expired', metadata: { reason: 'Time Expired' }, snapshot: null, elapsedMs: 600000 },
    ],
    anomalyResult: {
      riskScore: 35,
      riskLevel: { label: 'Medium Risk', range: '31-60', verdict: 'MANUAL REVIEW RECOMMENDED', color: '#f59e0b', description: 'Multiple warning triggers registered. Review the activity timeline before grading.' },
      featureScores: {
        tabSwitchCount: { rawValue: 2, normalizedScore: 0.4, weight: 0.25, weightedContribution: 0.10, description: 'Tab/window switches during exam' },
        totalIdleTime: { rawValue: 110, normalizedScore: 0.92, weight: 0.10, weightedContribution: 0.09, description: 'Total idle seconds (no interaction)' },
        avgKeystrokeRate: { rawValue: 3.5, normalizedScore: 0.65, weight: 0.05, weightedContribution: 0.03, description: 'Avg keystrokes/min (low = suspicious)' },
        gazeAwayDuration: { rawValue: 15.0, normalizedScore: 0.25, weight: 0.20, weightedContribution: 0.05, description: 'Seconds looking away from screen' },
        faceAbsentDuration: { rawValue: 0, normalizedScore: 0, weight: 0.20, weightedContribution: 0, description: 'Seconds face not detected' },
        noiseSpikeCount: { rawValue: 1, normalizedScore: 0.2, weight: 0.05, weightedContribution: 0.01, description: 'Sustained high-noise periods' },
        rapidSubmissions: { rawValue: 1, normalizedScore: 0.33, weight: 0.10, weightedContribution: 0.03, description: 'Questions answered in < 5 seconds' },
        copyPasteAttempts: { rawValue: 0, normalizedScore: 0, weight: 0.05, weightedContribution: 0, description: 'Copy/paste/right-click attempts' },
      },
      summary: { totalFeaturesAnalyzed: 8, highestContributor: { feature: 'tabSwitchCount', contribution: 0.10, description: 'Tab/window switches during exam' }, timestamp: '2026-09-20T11:25:00.000Z' },
    },
  },
];

/**
 * Get all synthetic sessions as an array.
 */
export function getSyntheticSessions() {
  return SESSION_TEMPLATES.map(s => ({ ...s, savedAt: s.examDate }));
}

/**
 * Get synthetic sessions formatted for localStorage seeding.
 */
export function seedSyntheticSessionsToStorage() {
  const STORAGE_KEY = 'safeexam_sessions';
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    const existingData = existing ? JSON.parse(existing) : [];
    const existingIds = new Set(existingData.map(s => s.sessionId));

    const newSessions = SESSION_TEMPLATES.filter(s => !existingIds.has(s.sessionId));
    if (newSessions.length > 0) {
      const merged = [...existingData, ...newSessions.map(s => ({ ...s, savedAt: s.examDate }))];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged.slice(0, 50)));
      return newSessions.length;
    }
    return 0;
  } catch (e) {
    console.error('Failed to seed synthetic sessions:', e);
    return 0;
  }
}

export default SESSION_TEMPLATES;
