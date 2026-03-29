import React, { useState, useEffect, useRef } from 'react';
import './PhoneCall.css';

function PhoneCall({ task, onAccept, onReject }) {
  const [callTime, setCallTime] = useState(0);
  const [isRinging, setIsRinging] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef(null);
  const ringtoneTimeoutRef = useRef(null);

  // Play ringtone sound
  const playRingtone = (context, muted) => {
    if (!context || muted) return;

    try {
      // Create oscillators for ringtone (1000Hz and 1400Hz)
      const osc1 = context.createOscillator();
      const osc2 = context.createOscillator();
      const gainNode = context.createGain();

      osc1.frequency.value = 1000;
      osc2.frequency.value = 1400;
      
      gainNode.gain.setValueAtTime(0.3, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.1, context.currentTime + 0.5);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(context.destination);

      osc1.start(context.currentTime);
      osc2.start(context.currentTime);
      osc1.stop(context.currentTime + 0.5);
      osc2.stop(context.currentTime + 0.5);

      // Schedule next ring after 1 second
      if (!muted) {
        ringtoneTimeoutRef.current = setTimeout(() => playRingtone(context, muted), 1000);
      }
    } catch (err) {
      console.log('Audio playback not available');
    }
  };

  // Initialize Web Audio API and start ringing
  useEffect(() => {
    try {
      // Create audio context
      const context = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = context;

      // Start ringing sound
      playRingtone(context, isMuted);
    } catch (err) {
      console.log('Audio context failed:', err);
    }

    const timer = setInterval(() => {
      setCallTime((prev) => prev + 1);
    }, 1000);

    // Ring animation
    const ringInterval = setInterval(() => {
      setIsRinging((prev) => !prev);
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(ringInterval);
      if (ringtoneTimeoutRef.current) {
        clearTimeout(ringtoneTimeoutRef.current);
      }
    };
  }, []);

  // Handle mute toggle
  useEffect(() => {
    if (isMuted) {
      if (ringtoneTimeoutRef.current) {
        clearTimeout(ringtoneTimeoutRef.current);
      }
    } else {
      if (audioContextRef.current) {
        playRingtone(audioContextRef.current, false);
      }
    }
  }, [isMuted]);

  // Play accept sound
  const playAcceptSound = () => {
    if (!audioContextRef.current || isMuted) return;

    try {
      const context = audioContextRef.current;
      const osc = context.createOscillator();
      const gainNode = context.createGain();

      osc.frequency.setValueAtTime(1500, context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, context.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0, context.currentTime + 0.1);

      osc.connect(gainNode);
      gainNode.connect(context.destination);

      osc.start(context.currentTime);
      osc.stop(context.currentTime + 0.1);
    } catch (err) {
      console.log('Accept sound failed');
    }
  };

  // Play reject sound
  const playRejectSound = () => {
    if (!audioContextRef.current || isMuted) return;

    try {
      const context = audioContextRef.current;
      const osc = context.createOscillator();
      const gainNode = context.createGain();

      osc.frequency.setValueAtTime(600, context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, context.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0, context.currentTime + 0.2);

      osc.connect(gainNode);
      gainNode.connect(context.destination);

      osc.start(context.currentTime);
      osc.stop(context.currentTime + 0.2);
    } catch (err) {
      console.log('Reject sound failed');
    }
  };

  const handleAccept = () => {
    playAcceptSound();
    onAccept();
  };

  const handleReject = () => {
    playRejectSound();
    onReject();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="phone-call-overlay">
      <div className={`phone-call-container ${isRinging ? 'ringing' : ''}`}>
        <div className="phone-call-inner">
          {/* Status Bar */}
          <div className="phone-status-bar">
            <span className="signal-dots">●●●●●</span>
            <span className="carrier">DeadlineMate</span>
            <button 
              className="mute-btn"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🔔'}
            </button>
          </div>

          {/* Main Content */}
          <div className="phone-call-content">
            {/* Avatar */}
            <div className="call-avatar">
              <span className="avatar-initial">
                {task?.user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>

            {/* User Info */}
            <div className="call-info">
              <h2 className="caller-name">{task?.user?.username || 'User'}</h2>
              <p className="call-status">Task Reminder</p>
            </div>

            {/* Call Timer */}
            <div className="call-timer">{formatTime(callTime)}</div>

            {/* Task Details */}
            <div className="task-details">
              <p className="task-title-call">{task?.title}</p>
              <p className="task-time-call">
                Due: {new Date(task?.due_date).toLocaleString()}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="phone-call-buttons">
              <button 
                className="call-button reject-btn"
                onClick={handleReject}
                title="Dismiss"
              >
                <span className="button-icon">✕</span>
              </button>
              <button 
                className="call-button accept-btn"
                onClick={handleAccept}
                title="Take action"
              >
                <span className="button-icon">✓</span>
              </button>
            </div>

            {/* Bottom Info */}
            <p className="call-footer">Tap to respond</p>
          </div>

          {/* Ringing Animation */}
          <div className={`ringing-animation ${isRinging ? 'active' : ''}`}></div>
        </div>
      </div>
    </div>
  );
}

export default PhoneCall;
