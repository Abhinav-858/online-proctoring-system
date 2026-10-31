// ActivityLogger.js - Structured Event Logging Service
// Part of Module 3: Activity Logging Service

const EVENT_TYPES = {
  TAB_SWITCH: 'TAB_SWITCH',
  IDLE_DETECTED: 'IDLE_DETECTED',
  KEYSTROKE_BURST: 'KEYSTROKE_BURST',
  FACE_ABSENT: 'FACE_ABSENT',
  GAZE_AWAY: 'GAZE_AWAY',
  NOISE_DETECTED: 'NOISE_DETECTED',
  FULLSCREEN_EXIT: 'FULLSCREEN_EXIT',
  COPY_PASTE: 'COPY_PASTE',
  ANSWER_SELECTED: 'ANSWER_SELECTED',
  RAPID_SUBMISSION: 'RAPID_SUBMISSION',
  MULTIPLE_FACES: 'MULTIPLE_FACES',
  FOCUS_LOST: 'FOCUS_LOST',
  DEVTOOLS_ATTEMPT: 'DEVTOOLS_ATTEMPT',
  SCREEN_SHARE_ENDED: 'SCREEN_SHARE_ENDED',
  EXAM_STARTED: 'EXAM_STARTED',
  EXAM_SUBMITTED: 'EXAM_SUBMITTED',
};

const SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

class ActivityLogger {
  constructor() {
    this.logs = [];
    this.sessionId = this._generateId();
    this.startTime = Date.now();
    this.keystrokeCount = 0;
    this.lastActivityTime = Date.now();
    this.idleIntervals = []; // Array of {start, end} idle periods
    this.answerTimestamps = {}; // questionId -> timestamp
    this.gazeAwayStart = null;
    this.gazeAwayTotal = 0; // total ms looking away
    this.faceAbsentStart = null;
    this.faceAbsentTotal = 0; // total ms face absent
  }

  _generateId() {
    return 'session-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 6);
  }

  // Log a structured event
  logEvent(eventType, severity, details, metadata = {}, snapshot = null) {
    const event = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      localTime: new Date().toLocaleTimeString(),
      eventType,
      severity,
      details,
      metadata,
      snapshot,
      elapsedMs: Date.now() - this.startTime,
    };
    this.logs.push(event);
    return event;
  }

  // Track keystroke
  recordKeystroke() {
    this.keystrokeCount++;
    this.lastActivityTime = Date.now();
  }

  // Track mouse/touch activity
  recordActivity() {
    this.lastActivityTime = Date.now();
  }

  // Track answer selection with timestamp
  recordAnswer(questionId) {
    this.answerTimestamps[questionId] = Date.now();
    this.lastActivityTime = Date.now();
  }

  // Track gaze away start/end
  startGazeAway() {
    if (!this.gazeAwayStart) {
      this.gazeAwayStart = Date.now();
    }
  }

  endGazeAway() {
    if (this.gazeAwayStart) {
      this.gazeAwayTotal += (Date.now() - this.gazeAwayStart);
      this.gazeAwayStart = null;
    }
  }

  // Track face absent start/end
  startFaceAbsent() {
    if (!this.faceAbsentStart) {
      this.faceAbsentStart = Date.now();
    }
  }

  endFaceAbsent() {
    if (this.faceAbsentStart) {
      this.faceAbsentTotal += (Date.now() - this.faceAbsentStart);
      this.faceAbsentStart = null;
    }
  }

  // Check for idle state (call periodically)
  checkIdle(thresholdMs = 15000) {
    const now = Date.now();
    const idleDuration = now - this.lastActivityTime;
    if (idleDuration >= thresholdMs) {
      return { isIdle: true, idleDuration };
    }
    return { isIdle: false, idleDuration: 0 };
  }

  // Detect rapid answer submissions (question answered in < 5 seconds)
  detectRapidSubmissions(questionId, questionStartTime) {
    const answerTime = this.answerTimestamps[questionId];
    if (answerTime && questionStartTime) {
      const duration = answerTime - questionStartTime;
      if (duration < 5000) {
        return { isRapid: true, durationMs: duration };
      }
    }
    return { isRapid: false, durationMs: null };
  }

  // Generate activity summary feature vector for anomaly detection
  getActivitySummary() {
    const totalDuration = (Date.now() - this.startTime) / 1000; // seconds
    const tabSwitchCount = this.logs.filter(l => l.eventType === EVENT_TYPES.TAB_SWITCH).length;
    const focusLostCount = this.logs.filter(l => l.eventType === EVENT_TYPES.FOCUS_LOST).length;
    const faceAbsentCount = this.logs.filter(l => l.eventType === EVENT_TYPES.FACE_ABSENT).length;
    const gazeAwayCount = this.logs.filter(l => l.eventType === EVENT_TYPES.GAZE_AWAY).length;
    const noiseSpikeCount = this.logs.filter(l => l.eventType === EVENT_TYPES.NOISE_DETECTED).length;
    const copyPasteAttempts = this.logs.filter(l => l.eventType === EVENT_TYPES.COPY_PASTE).length;
    const fullscreenExits = this.logs.filter(l => l.eventType === EVENT_TYPES.FULLSCREEN_EXIT).length;
    const multipleFacesCount = this.logs.filter(l => l.eventType === EVENT_TYPES.MULTIPLE_FACES).length;
    const devtoolsAttempts = this.logs.filter(l => l.eventType === EVENT_TYPES.DEVTOOLS_ATTEMPT).length;
    const idleEvents = this.logs.filter(l => l.eventType === EVENT_TYPES.IDLE_DETECTED);
    const rapidSubmissions = this.logs.filter(l => l.eventType === EVENT_TYPES.RAPID_SUBMISSION).length;

    // Calculate total idle time from idle event metadata
    const totalIdleTime = idleEvents.reduce((sum, e) => sum + (e.metadata.idleDurationMs || 0), 0) / 1000;

    // Finalize any ongoing gaze/face tracking
    let gazeAwayDuration = this.gazeAwayTotal / 1000;
    if (this.gazeAwayStart) {
      gazeAwayDuration += (Date.now() - this.gazeAwayStart) / 1000;
    }
    let faceAbsentDuration = this.faceAbsentTotal / 1000;
    if (this.faceAbsentStart) {
      faceAbsentDuration += (Date.now() - this.faceAbsentStart) / 1000;
    }

    const avgKeystrokeRate = totalDuration > 0 ? (this.keystrokeCount / (totalDuration / 60)) : 0; // per minute

    return {
      totalDuration,
      tabSwitchCount,
      focusLostCount,
      faceAbsentCount,
      faceAbsentDuration,
      gazeAwayCount,
      gazeAwayDuration,
      noiseSpikeCount,
      copyPasteAttempts,
      fullscreenExits,
      multipleFacesCount,
      devtoolsAttempts,
      totalIdleTime,
      rapidSubmissions,
      keystrokeCount: this.keystrokeCount,
      avgKeystrokeRate,
    };
  }

  // Export all logs as structured array
  exportLogs() {
    return [...this.logs];
  }

  // Get total event count
  getEventCount() {
    return this.logs.length;
  }

  // Get events filtered by type
  getEventsByType(eventType) {
    return this.logs.filter(l => l.eventType === eventType);
  }

  // Get events filtered by severity
  getEventsBySeverity(severity) {
    return this.logs.filter(l => l.severity === severity);
  }
}

export { EVENT_TYPES, SEVERITY, ActivityLogger };
export default ActivityLogger;
