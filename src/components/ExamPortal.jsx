import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Shield, ShieldAlert, Clock, AlertTriangle, User, Volume2, 
  Monitor, Eye, Bookmark, CheckCircle2, Activity, Zap, Compass
} from 'lucide-react';
import { loadQuestionBank } from '../data/questions';
import ActivityLogger, { EVENT_TYPES, SEVERITY } from '../services/ActivityLogger';

export default function ExamPortal({ webcamStream, screenStream, micStream, onExamComplete, studentInfo }) {
  // Load questions dynamically from localStorage (proctor-customized) or defaults
  const QUESTIONS = React.useMemo(() => loadQuestionBank(), []);
  const POINTS_PER_QUESTION = QUESTIONS.length > 0 ? Math.floor(100 / QUESTIONS.length) : 10;

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [trustScore, setTrustScore] = useState(100);
  const [latestWarning, setLatestWarning] = useState(null);
  const [warningCount, setWarningCount] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Proctor Status Indicators
  const [proctorStatus, setProctorStatus] = useState({
    face: 'Checking...',
    audio: 'Normal',
    screen: 'Active',
    window: 'Focused',
    gazeRatio: 1.0,
    audioLevel: 10
  });

  const [aiModelStatus, setAiModelStatus] = useState('Loading models...');
  const [liveTelemetryTicker, setLiveTelemetryTicker] = useState('AI Vision Core: Initializing 68 Landmark Mesh...');

  const videoRef = useRef(null);
  const screenRef = useRef(null);
  const audioIntervalRef = useRef(null);
  const aiIntervalRef = useRef(null);
  const idleCheckRef = useRef(null);
  const modelsLoaded = useRef(false);
  const isViolatingCooldown = useRef({});
  const gazeLeftFrames = useRef(0);
  const gazeRightFrames = useRef(0);
  const noFaceFrames = useRef(0);
  const multipleFacesFrames = useRef(0);
  const questionStartTime = useRef(Date.now());
  const isSubmitted = useRef(false);

  // Activity Logger instance (Module 3)
  const loggerRef = useRef(new ActivityLogger());

  // State refs for callbacks
  const stateRef = useRef({ warningCount, trustScore });
  useEffect(() => {
    stateRef.current = { warningCount, trustScore };
  }, [warningCount, trustScore]);

  // Hook up video and screen streams
  useEffect(() => {
    if (videoRef.current && webcamStream) {
      videoRef.current.srcObject = webcamStream;
    }
    if (screenRef.current && screenStream) {
      screenRef.current.srcObject = screenStream;
    }

    if (screenStream) {
      const track = screenStream.getVideoTracks()[0];
      if (track) {
        track.onended = () => {
          triggerViolation(EVENT_TYPES.SCREEN_SHARE_ENDED, SEVERITY.CRITICAL, 'Screen sharing was stopped by user.', 25);
        };
      }
    }

    loggerRef.current.logEvent(EVENT_TYPES.EXAM_STARTED, SEVERITY.LOW, 'Proctored exam session started.', {
      studentName: studentInfo?.name,
      studentRegNo: studentInfo?.regNo,
      totalQuestions: QUESTIONS.length,
    });
  }, [webcamStream, screenStream]);

  // Audio level monitoring
  useEffect(() => {
    if (!micStream) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(micStream);
      source.connect(analyser);
      analyser.fftSize = 256;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let highNoiseCounter = 0;

      audioIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const level = Math.min(100, Math.round((average / 128) * 100));

        if (level > 40) {
          highNoiseCounter++;
          setProctorStatus(prev => ({ ...prev, audio: 'High Noise', audioLevel: level }));
          setLiveTelemetryTicker(`Acoustic Sensor: High Noise Detected (${level}%)`);
          if (highNoiseCounter > 6) {
            triggerViolation(EVENT_TYPES.NOISE_DETECTED, SEVERITY.MEDIUM, 'Unusual room noise or speaking detected.', 10);
            highNoiseCounter = 0;
          }
        } else {
          if (highNoiseCounter > 0) highNoiseCounter--;
          setProctorStatus(prev => ({ ...prev, audio: 'Normal', audioLevel: level }));
        }
      }, 500);

      return () => {
        if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
        audioContext.close();
      };
    } catch (err) {
      console.error("Audio monitoring failed:", err);
    }
  }, [micStream]);

  // Tab switching, focus, keyboard, copy-paste monitoring
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation(EVENT_TYPES.TAB_SWITCH, SEVERITY.HIGH, 'Student navigated away from the exam tab.', 20);
        setProctorStatus(prev => ({ ...prev, window: 'Tab Hidden' }));
        setLiveTelemetryTicker('Security Alert: Browser Tab Switch Detected');
      } else {
        setProctorStatus(prev => ({ ...prev, window: 'Focused' }));
        setLiveTelemetryTicker('Telemetry: Candidate Refocused SafeExam Tab');
      }
    };

    const handleWindowBlur = () => {
      triggerViolation(EVENT_TYPES.FOCUS_LOST, SEVERITY.MEDIUM, 'Exam window lost focus.', 15);
      setProctorStatus(prev => ({ ...prev, window: 'Blurred' }));
      setLiveTelemetryTicker('Security Alert: Application Window Lost Focus');
    };

    const handleWindowFocus = () => {
      setProctorStatus(prev => ({ ...prev, window: 'Focused' }));
    };

    const fullscreenCheckInterval = setInterval(() => {
      if (!document.fullscreenElement) {
        triggerViolation(EVENT_TYPES.FULLSCREEN_EXIT, SEVERITY.MEDIUM, 'Exam is no longer running in fullscreen mode.', 15);
      }
    }, 2000);

    const handleCopyPaste = (e) => {
      e.preventDefault();
      triggerViolation(EVENT_TYPES.COPY_PASTE, SEVERITY.LOW, 'Candidate attempted to copy or paste content.', 5);
      setLiveTelemetryTicker('Clipboard Intercepted: Copy/Paste Action Suppressed');
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      triggerViolation(EVENT_TYPES.COPY_PASTE, SEVERITY.LOW, 'Candidate attempted to open the context menu.', 3);
      setLiveTelemetryTicker('Context Menu Blocked: Unauthorized Right-Click');
    };

    const handleKeyDown = (e) => {
      loggerRef.current.recordKeystroke();
      loggerRef.current.recordActivity();

      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
        triggerViolation(EVENT_TYPES.COPY_PASTE, SEVERITY.LOW, 'Attempted to refresh the exam page.', 5);
      }
      if (e.key === 'F12') {
        e.preventDefault();
        triggerViolation(EVENT_TYPES.DEVTOOLS_ATTEMPT, SEVERITY.HIGH, 'Attempted to open developer tools.', 10);
        setLiveTelemetryTicker('Critical Threat: F12 DevTools Access Prevented');
      }
    };

    const handleMouseMove = () => {
      loggerRef.current.recordActivity();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('copy', handleCopyPaste);
    window.addEventListener('paste', handleCopyPaste);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('copy', handleCopyPaste);
      window.removeEventListener('paste', handleCopyPaste);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(fullscreenCheckInterval);
    };
  }, []);

  // Idle detection check
  useEffect(() => {
    idleCheckRef.current = setInterval(() => {
      const { isIdle, idleDuration } = loggerRef.current.checkIdle(15000);
      if (isIdle) {
        triggerViolation(EVENT_TYPES.IDLE_DETECTED, SEVERITY.LOW, `No interaction detected for ${Math.round(idleDuration / 1000)} seconds.`, 3, null, { idleDurationMs: idleDuration });
        setLiveTelemetryTicker(`Inactivity Detector: ${Math.round(idleDuration / 1000)}s Idle Duration`);
      }
    }, 5000);

    return () => {
      if (idleCheckRef.current) clearInterval(idleCheckRef.current);
    };
  }, []);

  // AI Face & Gaze Tracking Loop (face-api.js)
  useEffect(() => {
    if (!webcamStream) return;

    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

    const loadAiModels = async () => {
      try {
        if (!window.faceapi) {
          setAiModelStatus('Waiting for CDN...');
          return;
        }
        setAiModelStatus('Loading weights...');
        await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        modelsLoaded.current = true;
        setAiModelStatus('AI Mesh Tracking 60 FPS');
        setLiveTelemetryTicker('Vision Core: 68-Point Facial Landmark Mesh Active');
      } catch (err) {
        console.error("Failed to load face-api models:", err);
        setAiModelStatus('AI Fallback Active');
      }
    };

    loadAiModels();

    aiIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !modelsLoaded.current || !window.faceapi) return;

      try {
        const detections = await window.faceapi.detectAllFaces(
          videoRef.current,
          new window.faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks();

        if (detections.length === 0) {
          setProctorStatus(prev => ({ ...prev, face: 'No Face', gazeRatio: 1.0 }));
          gazeLeftFrames.current = 0;
          gazeRightFrames.current = 0;
          multipleFacesFrames.current = 0;
          loggerRef.current.startFaceAbsent();
          loggerRef.current.endGazeAway();
          setLiveTelemetryTicker('Vision Alert: No Candidate Face in Camera Field');

          noFaceFrames.current += 1;
          if (noFaceFrames.current >= 3) {
            triggerViolation(EVENT_TYPES.FACE_ABSENT, SEVERITY.HIGH, 'Candidate is not visible in camera feed.', 15);
          }
        } else if (detections.length > 1) {
          setProctorStatus(prev => ({ ...prev, face: 'Multiple Faces', gazeRatio: 1.0 }));
          gazeLeftFrames.current = 0;
          gazeRightFrames.current = 0;
          noFaceFrames.current = 0;
          loggerRef.current.endFaceAbsent();
          loggerRef.current.endGazeAway();
          setLiveTelemetryTicker('Critical Alert: Multiple Persons Detected in Room');

          multipleFacesFrames.current += 1;
          if (multipleFacesFrames.current >= 3) {
            triggerViolation(EVENT_TYPES.MULTIPLE_FACES, SEVERITY.CRITICAL, 'More than one face detected in exam frame.', 25);
          }
        } else {
          noFaceFrames.current = 0;
          multipleFacesFrames.current = 0;
          loggerRef.current.endFaceAbsent();

          const landmarks = detections[0].landmarks.positions;
          const jawLeft = landmarks[0].x;
          const jawRight = landmarks[16].x;
          const noseTip = landmarks[30].x;
          const leftDist = noseTip - jawLeft;
          const rightDist = jawRight - noseTip;
          const ratio = leftDist / rightDist;

          setProctorStatus(prev => ({ ...prev, gazeRatio: Math.round(ratio * 100) / 100 }));

          if (ratio < 0.45) {
            setProctorStatus(prev => ({ ...prev, face: 'Looking Left' }));
            gazeRightFrames.current = 0;
            loggerRef.current.startGazeAway();
            setLiveTelemetryTicker('Vision Telemetry: Leftward Gaze Deviation');

            gazeLeftFrames.current += 1;
            if (gazeLeftFrames.current >= 3) {
              triggerViolation(EVENT_TYPES.GAZE_AWAY, SEVERITY.MEDIUM, 'Candidate is looking away from the screen (left).', 12);
            }
          } else if (ratio > 2.2) {
            setProctorStatus(prev => ({ ...prev, face: 'Looking Right' }));
            gazeLeftFrames.current = 0;
            loggerRef.current.startGazeAway();
            setLiveTelemetryTicker('Vision Telemetry: Rightward Gaze Deviation');

            gazeRightFrames.current += 1;
            if (gazeRightFrames.current >= 3) {
              triggerViolation(EVENT_TYPES.GAZE_AWAY, SEVERITY.MEDIUM, 'Candidate is looking away from the screen (right).', 12);
            }
          } else {
            setProctorStatus(prev => ({ ...prev, face: 'Center Focused' }));
            gazeLeftFrames.current = 0;
            gazeRightFrames.current = 0;
            loggerRef.current.endGazeAway();
            setLiveTelemetryTicker('Vision Telemetry: Center Gaze Aligned (Standard)');
          }
        }
      } catch (e) {
        console.error("AI inference error", e);
      }
    }, 1000);

    return () => {
      if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
    };
  }, [webcamStream]);

  // Exam timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          submitExam("Time Expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-submit on excessive violations
  useEffect(() => {
    if (warningCount >= 3 || trustScore <= 40) {
      submitExam("Suspended due to excessive proctoring violations");
    }
  }, [warningCount, trustScore]);

  // Trigger violation
  const triggerViolation = (eventType, severity, details, decayPoints, snapshot = null, extraMeta = {}) => {
    const now = Date.now();

    if (isViolatingCooldown.current[eventType] && now - isViolatingCooldown.current[eventType] < 3000) {
      return;
    }
    isViolatingCooldown.current[eventType] = now;

    let capturedSnapshot = snapshot;
    if (!capturedSnapshot && videoRef.current) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        capturedSnapshot = canvas.toDataURL('image/jpeg', 0.6);
      } catch (e) {
        console.error("Failed to capture snapshot", e);
      }
    }

    loggerRef.current.logEvent(eventType, severity, details, extraMeta, capturedSnapshot);

    setWarningCount(prev => prev + 1);
    setTrustScore(prev => Math.max(0, prev - decayPoints));

    const warningObj = {
      id: Math.random().toString(36).slice(2, 11),
      type: eventType,
      details,
      timestamp: new Date().toLocaleTimeString(),
      snapshot: capturedSnapshot,
      severity,
    };

    setLatestWarning(warningObj);
    playAlertTone();

    setTimeout(() => {
      setLatestWarning(curr => curr?.id === warningObj.id ? null : curr);
    }, 4000);
  };

  const playAlertTone = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) { /* ignore autoplay */ }
  };

  const selectOption = (optionIdx) => {
    const questionId = QUESTIONS[currentQuestionIdx].id;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIdx }));

    loggerRef.current.recordAnswer(questionId);
    loggerRef.current.recordActivity();

    loggerRef.current.logEvent(EVENT_TYPES.ANSWER_SELECTED, SEVERITY.LOW, `Answered question ${currentQuestionIdx + 1}`, {
      questionId,
      selectedOption: optionIdx,
    });

    const { isRapid, durationMs } = loggerRef.current.detectRapidSubmissions(questionId, questionStartTime.current);
    if (isRapid) {
      loggerRef.current.logEvent(EVENT_TYPES.RAPID_SUBMISSION, SEVERITY.MEDIUM, `Question ${currentQuestionIdx + 1} answered in ${Math.round(durationMs / 1000)}s (rapid)`, {
        questionId,
        durationMs,
      });
      setLiveTelemetryTicker(`Behavior Spike: Question ${currentQuestionIdx + 1} Answered in ${Math.round(durationMs / 1000)}s`);
    }
  };

  const toggleFlagQuestion = (qId) => {
    setFlaggedQuestions(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const changeQuestion = (newIdx) => {
    setCurrentQuestionIdx(newIdx);
    questionStartTime.current = Date.now();
  };

  const submitExam = useCallback((reason = "Submitted by Candidate") => {
    if (isSubmitted.current) return;
    isSubmitted.current = true;

    loggerRef.current.logEvent(EVENT_TYPES.EXAM_SUBMITTED, SEVERITY.LOW, `Exam submitted: ${reason}`, { reason });

    let score = 0;
    QUESTIONS.forEach(q => {
      if (selectedAnswers[q.id] === q.answer) {
        score += POINTS_PER_QUESTION;
      }
    });

    const activityLogs = loggerRef.current.exportLogs();
    const activitySummary = loggerRef.current.getActivitySummary();

    onExamComplete({
      score,
      totalQuestions: QUESTIONS.length,
      pointsPerQuestion: POINTS_PER_QUESTION,
      answers: selectedAnswers,
      activityLogs,
      activitySummary,
      warningCount: stateRef.current.warningCount,
      trustScore: stateRef.current.trustScore,
      exitReason: reason,
      studentInfo,
      sessionId: loggerRef.current.sessionId,
      examDate: new Date().toISOString(),
    });
  }, [selectedAnswers, studentInfo, onExamComplete]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timerColor = timeLeft <= 30 ? '#ef4444' : timeLeft <= 120 ? '#f59e0b' : '#818cf8';
  const answeredCount = Object.keys(selectedAnswers).length;
  const flaggedCount = Object.values(flaggedQuestions).filter(Boolean).length;
  const progressPercent = Math.round((answeredCount / QUESTIONS.length) * 100);

  const isGazeWarning = proctorStatus.face.includes('Looking') || proctorStatus.face === 'No Face';

  return (
    <div style={styles.dashboardContainer}>
      {/* Warning Overlay */}
      {latestWarning && (
        <div style={styles.warningAlert} className="shake" role="alert" aria-live="assertive">
          <AlertTriangle color="#ef4444" size={28} />
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', color: '#ef4444' }}>Warning: {latestWarning.type}</h4>
            <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.85rem', color: '#fca5a5' }}>
              {latestWarning.details} This incident is logged into candidate audit logs.
            </p>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="glass">
            <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', marginBottom: '0.5rem' }}>Submit Examination?</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              Are you sure you want to conclude your proctored exam? Once submitted, your answers will be locked and an integrity audit will be compiled.
            </p>

            <div style={styles.modalStats}>
              <div style={styles.modalStatItem}>
                <span style={styles.modalStatNum}>{answeredCount} / {QUESTIONS.length}</span>
                <span style={styles.modalStatLabel}>Answered</span>
              </div>
              <div style={styles.modalStatItem}>
                <span style={{ ...styles.modalStatNum, color: '#f59e0b' }}>{flaggedCount}</span>
                <span style={styles.modalStatLabel}>Flagged</span>
              </div>
              <div style={styles.modalStatItem}>
                <span style={{ ...styles.modalStatNum, color: '#ef4444' }}>{QUESTIONS.length - answeredCount}</span>
                <span style={styles.modalStatLabel}>Unanswered</span>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button onClick={() => setShowSubmitModal(false)} className="btn btn-secondary">
                Return to Exam
              </button>
              <button onClick={() => submitExam()} className="btn btn-success">
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.portalLayout}>
        {/* Left: Exam */}
        <div style={styles.leftPanel} className="glass">
          <div style={styles.panelHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield color="#6366f1" size={22} />
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>SafeExam Live Workspace</h3>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Progress: {answeredCount} of {QUESTIONS.length} answered ({progressPercent}%)
                </span>
              </div>
            </div>
            <div style={{ ...styles.timerBadge, borderColor: timerColor, color: timerColor }} aria-live="polite">
              <Clock size={16} />
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={styles.progressBarTrack}>
            <div style={{ ...styles.progressBarFill, width: `${progressPercent}%` }} />
          </div>

          <div style={styles.quizWrapper}>
            <div style={styles.questionNav}>
              {QUESTIONS.map((q, idx) => {
                const isSelected = selectedAnswers[q.id] !== undefined;
                const isCurrent = currentQuestionIdx === idx;
                const isFlagged = flaggedQuestions[q.id];

                return (
                  <button
                    key={q.id}
                    onClick={() => changeQuestion(idx)}
                    style={{
                      ...styles.navBtn,
                      backgroundColor: isCurrent
                        ? '#6366f1'
                        : isFlagged
                          ? 'rgba(245, 158, 11, 0.2)'
                          : isSelected
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(255,255,255,0.03)',
                      borderColor: isCurrent
                        ? '#6366f1'
                        : isFlagged
                          ? '#f59e0b'
                          : isSelected
                            ? '#059669'
                            : 'rgba(255,255,255,0.08)',
                      color: isCurrent || isSelected || isFlagged ? '#fff' : '#94a3b8',
                      position: 'relative'
                    }}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span style={styles.flagDot} />
                    )}
                  </button>
                );
              })}
            </div>

            <div style={styles.questionBox}>
              <div style={styles.questionMetaHeader}>
                <span style={styles.questionNum}>Question {currentQuestionIdx + 1} of {QUESTIONS.length}</span>
                <button
                  onClick={() => toggleFlagQuestion(QUESTIONS[currentQuestionIdx].id)}
                  style={{
                    ...styles.flagBtn,
                    color: flaggedQuestions[QUESTIONS[currentQuestionIdx].id] ? '#f59e0b' : '#64748b',
                    borderColor: flaggedQuestions[QUESTIONS[currentQuestionIdx].id] ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)',
                    backgroundColor: flaggedQuestions[QUESTIONS[currentQuestionIdx].id] ? 'rgba(245,158,11,0.1)' : 'transparent'
                  }}
                >
                  <Bookmark size={14} />
                  {flaggedQuestions[QUESTIONS[currentQuestionIdx].id] ? 'Flagged for Review' : 'Flag for Review'}
                </button>
              </div>

              <p style={styles.questionText}>{QUESTIONS[currentQuestionIdx].question}</p>

              <div style={styles.optionsList}>
                {QUESTIONS[currentQuestionIdx].options.map((option, idx) => {
                  const isSelected = selectedAnswers[QUESTIONS[currentQuestionIdx].id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => selectOption(idx)}
                      aria-pressed={isSelected}
                      style={{
                        ...styles.optionBtn,
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        borderColor: isSelected ? '#6366f1' : 'rgba(255,255,255,0.08)',
                        color: isSelected ? '#a5b4fc' : '#e2e8f0',
                      }}
                    >
                      <span style={{
                        ...styles.optionIndex,
                        backgroundColor: isSelected ? '#6366f1' : 'rgba(255,255,255,0.05)',
                        color: isSelected ? '#fff' : '#94a3b8'
                      }}>{String.fromCharCode(65 + idx)}</span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={styles.navControls}>
              <button
                disabled={currentQuestionIdx === 0}
                onClick={() => changeQuestion(currentQuestionIdx - 1)}
                className="btn btn-secondary"
              >
                Previous
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {currentQuestionIdx < QUESTIONS.length - 1 && (
                  <button onClick={() => changeQuestion(currentQuestionIdx + 1)} className="btn btn-secondary">
                    Next Question
                  </button>
                )}
                <button onClick={() => setShowSubmitModal(true)} className="btn btn-success pulsing">
                  Submit Exam
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Dynamic AI Proctor Feeds */}
        <div style={styles.rightPanel}>
          {/* Identity & Gaze HUD Card */}
          <div style={styles.monitorCard} className={`glass ${isGazeWarning ? 'neon-active' : ''}`}>
            <div style={styles.cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={15} color="#6366f1" />
                <span style={styles.cardTitle}>Vision Core & Gaze HUD</span>
              </div>
              <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                <span style={styles.pulseDot} /> AI 60 FPS
              </span>
            </div>

            {/* Video Workspace with Cyber Scanline and Corner Reticles */}
            <div style={styles.videoWorkspace}>
              <video ref={videoRef} autoPlay playsInline muted style={styles.proctorVideo} />
              <div className="scanline-effect" />

              {/* Corner Reticles */}
              <div style={{ ...styles.reticleCorner, top: '6px', left: '6px', borderTop: '2px solid #6366f1', borderLeft: '2px solid #6366f1' }} />
              <div style={{ ...styles.reticleCorner, top: '6px', right: '6px', borderTop: '2px solid #6366f1', borderRight: '2px solid #6366f1' }} />
              <div style={{ ...styles.reticleCorner, bottom: '6px', left: '6px', borderBottom: '2px solid #6366f1', borderLeft: '2px solid #6366f1' }} />
              <div style={{ ...styles.reticleCorner, bottom: '6px', right: '6px', borderBottom: '2px solid #6366f1', borderRight: '2px solid #6366f1' }} />

              {/* Dynamic Gaze Vector Compass Pill */}
              <div style={{
                ...styles.gazeCompassPill,
                borderColor: isGazeWarning ? '#ef4444' : '#10b981',
                color: isGazeWarning ? '#f87171' : '#34d399',
              }}>
                <Compass size={11} />
                <span>{proctorStatus.face} (x: {proctorStatus.gazeRatio || '1.0'})</span>
              </div>

              {/* Webcam Warning Overlay */}
              {proctorStatus.face !== 'Center Focused' && proctorStatus.face !== 'Checking...' && proctorStatus.face !== 'Detected' && (
                <div style={styles.videoOverlayAlert}>
                  <ShieldAlert size={32} color="#ef4444" />
                  <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#f87171' }}>{proctorStatus.face}</span>
                </div>
              )}

              <div style={styles.aiStatusBadge}>{aiModelStatus}</div>
            </div>

            {/* Micro Indicators with Dynamic Audio Waveform */}
            <div style={styles.telemetryGrid}>
              <div style={styles.telemetryItem}>
                <Eye size={13} color="#6366f1" />
                <span style={styles.telLabel}>Gaze:</span>
                <span style={{ ...styles.telVal, color: isGazeWarning ? '#ef4444' : '#10b981' }}>{proctorStatus.face}</span>
              </div>
              
              <div style={styles.telemetryItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <Volume2 size={13} color="#6366f1" />
                  {/* Dancing Audio Equalizer Bars */}
                  <div style={styles.audioBarsWrapper}>
                    <div style={{ ...styles.audioBar, backgroundColor: proctorStatus.audio === 'High Noise' ? '#ef4444' : '#10b981' }} className="audio-bar-1" />
                    <div style={{ ...styles.audioBar, backgroundColor: proctorStatus.audio === 'High Noise' ? '#ef4444' : '#10b981' }} className="audio-bar-2" />
                    <div style={{ ...styles.audioBar, backgroundColor: proctorStatus.audio === 'High Noise' ? '#ef4444' : '#10b981' }} className="audio-bar-3" />
                  </div>
                </div>
                <span style={styles.telLabel}>Acoustic:</span>
                <span style={{ ...styles.telVal, color: proctorStatus.audio === 'High Noise' ? '#ef4444' : '#10b981' }}>{proctorStatus.audio}</span>
              </div>

              <div style={styles.telemetryItem}>
                <Monitor size={13} color="#6366f1" />
                <span style={styles.telLabel}>Window:</span>
                <span style={{ ...styles.telVal, color: proctorStatus.window === 'Focused' ? '#10b981' : '#ef4444' }}>{proctorStatus.window}</span>
              </div>
            </div>
          </div>

          {/* Screen Stream Preview */}
          <div style={styles.monitorCard} className="glass">
            <div style={styles.cardHeader}>
              <Monitor size={15} color="#6366f1" />
              <span style={styles.cardTitle}>Live Screen Stream Mirror</span>
            </div>
            <div style={styles.videoWorkspace}>
              <video ref={screenRef} autoPlay playsInline muted style={styles.proctorVideo} />
            </div>
          </div>

          {/* Dynamic Trust Score Gauge */}
          <div style={styles.trustScoreCard} className="glass">
            <div style={styles.trustScoreRow}>
              <div>
                <span style={styles.trustTitle}>Session Integrity Index</span>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>Dynamic multi-factor behavioral trust score</p>
              </div>
              <span style={{
                ...styles.trustValue,
                color: trustScore > 75 ? '#10b981' : trustScore > 50 ? '#f59e0b' : '#ef4444'
              }}>{trustScore}%</span>
            </div>
            <div style={styles.trustTrack}>
              <div style={{
                ...styles.trustFill,
                width: `${trustScore}%`,
                backgroundColor: trustScore > 75 ? '#10b981' : trustScore > 50 ? '#f59e0b' : '#ef4444'
              }} />
            </div>
            <div style={styles.warningIndicatorRow}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Violation Counter:</span>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 'bold',
                color: warningCount > 1 ? '#ef4444' : warningCount > 0 ? '#f59e0b' : '#10b981'
              }}>{warningCount} / 3 Max</span>
            </div>
          </div>

          {/* Live Telemetry Activity Stream Ticker */}
          <div style={styles.tickerCard} className="glass">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
              <Activity size={13} color="#818cf8" />
              <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#818cf8', textTransform: 'uppercase' }}>Live Telemetry Stream</span>
            </div>
            <p style={styles.tickerText}>{liveTelemetryTicker}</p>
          </div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  dashboardContainer: { maxWidth: '1280px', margin: '1.5rem auto', padding: '0 1rem', position: 'relative' },
  warningAlert: { position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '2px solid #ef4444', borderRadius: '12px', padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)', backdropFilter: 'blur(8px)', width: '90%', maxWidth: '500px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8, 12, 20, 0.85)', backdropFilter: 'blur(6px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modalContent: { maxWidth: '480px', width: '100%', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' },
  modalStats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' },
  modalStatItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' },
  modalStatNum: { fontSize: '1.3rem', fontWeight: 'bold', color: '#10b981' },
  modalStatLabel: { fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' },
  modalActions: { display: 'flex', justifyContent: 'center', gap: '1rem' },
  portalLayout: { display: 'grid', gridTemplateColumns: '3fr 1.3fr', gap: '1.5rem' },
  leftPanel: { padding: '2rem', display: 'flex', flexDirection: 'column', minHeight: '600px' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', marginBottom: '0.75rem' },
  progressBarTrack: { width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1.25rem' },
  progressBarFill: { height: '100%', backgroundColor: '#6366f1', transition: 'width 0.3s ease' },
  timerBadge: { backgroundColor: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '0.5rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  quizWrapper: { flexGrow: 1, display: 'flex', flexDirection: 'column' },
  questionNav: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  navBtn: { width: '36px', height: '36px', borderRadius: '8px', border: '1px solid', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' },
  flagDot: { position: 'absolute', top: '2px', right: '2px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b' },
  questionBox: { flexGrow: 1, marginBottom: '2rem' },
  questionMetaHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  questionNum: { fontSize: '0.8rem', fontWeight: 'bold', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' },
  flagBtn: { display: 'flex', alignItems: 'center', gap: '0.35rem', border: '1px solid', borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.72rem', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' },
  questionText: { fontSize: '1.2rem', fontWeight: '600', color: '#f8fafc', marginTop: '0.3rem', marginBottom: '1.5rem', lineHeight: '1.5' },
  optionsList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  optionBtn: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '10px', border: '1px solid', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.95rem' },
  optionIndex: { width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' },
  navControls: { display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1.5rem', marginTop: 'auto' },
  rightPanel: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  monitorCard: { padding: '1rem' },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' },
  cardTitle: { fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8' },
  pulseDot: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#6366f1', display: 'inline-block', marginRight: '3px' },
  videoWorkspace: { backgroundColor: '#080c14', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '10px', height: '145px', overflow: 'hidden', position: 'relative' },
  proctorVideo: { width: '100%', height: '100%', objectFit: 'cover' },
  reticleCorner: { position: 'absolute', width: '12px', height: '12px', pointerEvents: 'none', zIndex: 2 },
  gazeCompassPill: { position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(8, 12, 20, 0.85)', border: '1px solid', borderRadius: '4px', padding: '0.15rem 0.45rem', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem', zIndex: 3, fontWeight: 'bold' },
  videoOverlayAlert: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(239, 68, 68, 0.35)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', backdropFilter: 'blur(2px)', zIndex: 4 },
  aiStatusBadge: { position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'rgba(8, 12, 20, 0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '0.2rem 0.4rem', fontSize: '0.62rem', color: '#e2e8f0', zIndex: 3 },
  telemetryGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.75rem' },
  telemetryItem: { backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '0.4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' },
  audioBarsWrapper: { display: 'flex', alignItems: 'flex-end', gap: '2px', height: '12px' },
  audioBar: { width: '2px', borderRadius: '1px' },
  telLabel: { fontSize: '0.62rem', color: '#64748b', fontWeight: 'bold' },
  telVal: { fontSize: '0.68rem', fontWeight: 'bold' },
  trustScoreCard: { padding: '1.25rem' },
  trustScoreRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  trustTitle: { fontSize: '0.85rem', fontWeight: '600', color: '#e2e8f0' },
  trustValue: { fontSize: '1.25rem', fontWeight: 'bold' },
  trustTrack: { width: '100%', height: '6px', backgroundColor: '#1e293b', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.75rem' },
  trustFill: { height: '100%', transition: 'all 0.5s ease' },
  warningIndicatorRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tickerCard: { padding: '0.65rem 0.85rem', border: '1px solid rgba(99, 102, 241, 0.2)' },
  tickerText: { fontSize: '0.72rem', color: '#94a3b8', margin: 0, fontFamily: 'var(--font-mono)' },
};
