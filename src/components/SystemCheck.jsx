import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, Monitor, Maximize, CheckCircle2, AlertCircle, Play } from 'lucide-react';

export default function SystemCheck({ onComplete }) {
  const [permissions, setPermissions] = useState({
    webcam: null, // 'loading', 'success', 'error'
    mic: null,
    screenShare: null,
    fullscreen: false
  });

  const [streams, setStreams] = useState({
    webcam: null,
    screenShare: null,
    mic: null
  });

  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const videoRef = useRef(null);
  const screenRef = useRef(null);
  const audioIntervalRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    // Listen to fullscreen changes
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setPermissions(prev => ({ ...prev, fullscreen: isFull }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      stopAllStreams();
    };
  }, []);

  const stopAllStreams = () => {
    if (streams.webcam) {
      streams.webcam.getTracks().forEach(track => track.stop());
    }
    if (streams.screenShare) {
      streams.screenShare.getTracks().forEach(track => track.stop());
    }
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const requestWebcam = async () => {
    setPermissions(prev => ({ ...prev, webcam: 'loading' }));
    try {
      // Stop existing tracks to prevent media stream leaks
      if (streams.webcam) {
        streams.webcam.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      setStreams(prev => ({ ...prev, webcam: stream }));
      setPermissions(prev => ({ ...prev, webcam: 'success' }));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setPermissions(prev => ({ ...prev, webcam: 'error' }));
      setErrorMsg('Failed to access webcam. Please check permissions.');
    }
  };

  const requestMic = async () => {
    setPermissions(prev => ({ ...prev, mic: 'loading' }));
    try {
      // Stop existing mic stream to prevent leaks
      if (streams.mic) {
        streams.mic.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStreams(prev => ({ ...prev, mic: stream }));
      setPermissions(prev => ({ ...prev, mic: 'success' }));
      
      // Wire up audio analysis
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      audioIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Map average volume (0-255) to 0-100 percentage
        setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
      }, 100);

      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setPermissions(prev => ({ ...prev, mic: 'error' }));
      setErrorMsg('Failed to access microphone. Please check permissions.');
    }
  };

  const requestScreenShare = async () => {
    setPermissions(prev => ({ ...prev, screenShare: 'loading' }));
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setStreams(prev => ({ ...prev, screenShare: stream }));
      setPermissions(prev => ({ ...prev, screenShare: 'success' }));
      
      if (screenRef.current) {
        screenRef.current.srcObject = stream;
      }

      // If user stops sharing screen, log as failure
      stream.getVideoTracks()[0].onended = () => {
        setPermissions(prev => ({ ...prev, screenShare: 'error' }));
        setStreams(prev => ({ ...prev, screenShare: null }));
      };
      
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setPermissions(prev => ({ ...prev, screenShare: 'error' }));
      setErrorMsg('Failed to share screen. Screen sharing is mandatory for proctoring.');
    }
  };

  const enterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setPermissions(prev => ({ ...prev, fullscreen: true }));
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to enter fullscreen. Please try again or press F11.');
    }
  };

  const handleStartExam = () => {
    if (
      permissions.webcam === 'success' &&
      permissions.mic === 'success' &&
      permissions.screenShare === 'success' &&
      permissions.fullscreen
    ) {
      // Pass all media streams back so ExamPortal can reuse them
      onComplete({
        webcamStream: streams.webcam,
        screenStream: streams.screenShare,
        micStream: streams.mic
      });
    }
  };

  const allPassed =
    permissions.webcam === 'success' &&
    permissions.mic === 'success' &&
    permissions.screenShare === 'success' &&
    permissions.fullscreen;

  return (
    <div style={styles.container}>
      <div style={styles.card} className="glass">
        <h2 style={styles.title}>Pre-Exam System Integrity Check</h2>
        <p style={styles.subtitle}>
          Please enable all proctoring modules below to proceed to your exam. Ensure you are in a quiet, well-lit room.
        </p>

        {errorMsg && (
          <div style={styles.errorBanner}>
            <AlertCircle size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div style={styles.grid}>
          {/* Webcam Check */}
          <div style={styles.checkCard} className="glass">
            <div style={styles.cardHeader}>
              <Camera color="#6366f1" size={24} />
              <span style={styles.cardTitle}>Webcam Stream</span>
              {permissions.webcam === 'success' ? (
                <CheckCircle2 color="#10b981" size={20} />
              ) : (
                <span style={styles.statusIndicator} />
              )}
            </div>
            
            <div style={styles.mediaContainer}>
              {permissions.webcam === 'success' ? (
                <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
              ) : (
                <div style={styles.placeholder}>
                  <Camera size={48} color="#64748b" />
                  <p style={{ marginTop: '0.5rem', color: '#64748b' }}>Camera Feed Inactive</p>
                </div>
              )}
            </div>

            <button
              onClick={requestWebcam}
              disabled={permissions.webcam === 'loading'}
              style={{
                ...styles.btnCheck,
                backgroundColor: permissions.webcam === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                color: permissions.webcam === 'success' ? '#34d399' : '#818cf8',
              }}
            >
              {permissions.webcam === 'success' ? 'Camera Enabled' : 'Enable Camera'}
            </button>
          </div>

          {/* Microphone Check */}
          <div style={styles.checkCard} className="glass">
            <div style={styles.cardHeader}>
              <Mic color="#6366f1" size={24} />
              <span style={styles.cardTitle}>Microphone Sensor</span>
              {permissions.mic === 'success' ? (
                <CheckCircle2 color="#10b981" size={20} />
              ) : (
                <span style={styles.statusIndicator} />
              )}
            </div>

            <div style={styles.micFeedbackContainer}>
              {permissions.mic === 'success' ? (
                <div style={styles.audioMeterWrapper}>
                  <p style={{ color: '#94a3b8', fontSize: '0.87rem' }}>Speak to test mic level</p>
                  <div style={styles.audioMeterTrack}>
                    <div
                      style={{
                        ...styles.audioMeterFill,
                        width: `${audioLevel}%`,
                        backgroundColor: audioLevel > 50 ? '#f59e0b' : '#10b981'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Level: {audioLevel}%</span>
                </div>
              ) : (
                <div style={styles.placeholder}>
                  <Mic size={48} color="#64748b" />
                  <p style={{ marginTop: '0.5rem', color: '#64748b' }}>Mic Feed Inactive</p>
                </div>
              )}
            </div>

            <button
              onClick={requestMic}
              disabled={permissions.mic === 'loading'}
              style={{
                ...styles.btnCheck,
                backgroundColor: permissions.mic === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                color: permissions.mic === 'success' ? '#34d399' : '#818cf8',
              }}
            >
              {permissions.mic === 'success' ? 'Microphone Enabled' : 'Enable Microphone'}
            </button>
          </div>

          {/* Screen Share Check */}
          <div style={styles.checkCard} className="glass">
            <div style={styles.cardHeader}>
              <Monitor color="#6366f1" size={24} />
              <span style={styles.cardTitle}>Screen Sharing</span>
              {permissions.screenShare === 'success' ? (
                <CheckCircle2 color="#10b981" size={20} />
              ) : (
                <span style={styles.statusIndicator} />
              )}
            </div>

            <div style={styles.mediaContainer}>
              {permissions.screenShare === 'success' ? (
                <video ref={screenRef} autoPlay playsInline muted style={styles.video} />
              ) : (
                <div style={styles.placeholder}>
                  <Monitor size={48} color="#64748b" />
                  <p style={{ marginTop: '0.5rem', color: '#64748b' }}>Screen Sharing Inactive</p>
                </div>
              )}
            </div>

            <button
              onClick={requestScreenShare}
              disabled={permissions.screenShare === 'loading'}
              style={{
                ...styles.btnCheck,
                backgroundColor: permissions.screenShare === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                color: permissions.screenShare === 'success' ? '#34d399' : '#818cf8',
              }}
            >
              {permissions.screenShare === 'success' ? 'Screen Shared' : 'Share Entire Screen'}
            </button>
          </div>

          {/* Fullscreen Check */}
          <div style={styles.checkCard} className="glass">
            <div style={styles.cardHeader}>
              <Maximize color="#6366f1" size={24} />
              <span style={styles.cardTitle}>Fullscreen Enforcement</span>
              {permissions.fullscreen ? (
                <CheckCircle2 color="#10b981" size={20} />
              ) : (
                <span style={styles.statusIndicator} />
              )}
            </div>

            <div style={styles.micFeedbackContainer}>
              <div style={styles.placeholder}>
                <Maximize size={48} color={permissions.fullscreen ? '#10b981' : '#64748b'} />
                <p style={{ marginTop: '0.5rem', color: '#94a3b8', textAlign: 'center', fontSize: '0.85rem' }}>
                  {permissions.fullscreen 
                    ? 'Fullscreen Mode Active' 
                    : 'System must occupy the entire screen during exam.'}
                </p>
              </div>
            </div>

            <button
              onClick={enterFullscreen}
              style={{
                ...styles.btnCheck,
                backgroundColor: permissions.fullscreen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                color: permissions.fullscreen ? '#34d399' : '#818cf8',
              }}
            >
              {permissions.fullscreen ? 'Fullscreen Active' : 'Enter Fullscreen'}
            </button>
          </div>
        </div>

        <div style={styles.footer}>
          <button
            onClick={handleStartExam}
            disabled={!allPassed}
            style={{
              ...styles.btnStart,
              cursor: allPassed ? 'pointer' : 'not-allowed',
              opacity: allPassed ? 1 : 0.6
            }}
            className={allPassed ? 'btn btn-primary pulsing' : 'btn btn-secondary'}
          >
            <Play size={18} />
            Start Proctored Exam
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '3rem auto',
    padding: '0 1rem',
  },
  card: {
    padding: '2.5rem',
    borderRadius: '16px',
  },
  title: {
    fontSize: '1.75rem',
    marginBottom: '0.5rem',
    background: 'linear-gradient(to right, #fff, #94a3b8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '0.95rem',
    textAlign: 'center',
    marginBottom: '2rem',
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
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2.5rem',
  },
  checkCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: '1.25rem',
    borderRadius: '12px',
    minHeight: '260px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  cardTitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#e2e8f0',
    flexGrow: 1,
  },
  statusIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#334155',
  },
  mediaContainer: {
    backgroundColor: '#080c14',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    height: '130px',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  micFeedbackContainer: {
    backgroundColor: '#080c14',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    height: '130px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
    padding: '1rem',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
  },
  audioMeterWrapper: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    alignItems: 'center',
  },
  audioMeterTrack: {
    width: '100%',
    height: '8px',
    backgroundColor: '#1e293b',
    borderRadius: '9999px',
    overflow: 'hidden',
  },
  audioMeterFill: {
    height: '100%',
    transition: 'width 0.1s ease',
  },
  btnCheck: {
    marginTop: 'auto',
    border: 'none',
    padding: '0.6rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
  },
  btnStart: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem 2.5rem',
    fontSize: '1.05rem',
  }
};
