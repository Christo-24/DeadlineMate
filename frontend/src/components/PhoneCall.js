import React, { useState, useEffect, useRef } from 'react';
import './PhoneCall.css';

function PhoneCall({ task, reminderTime, onAccept, onReject, onClose }) {
  const [callTime, setCallTime] = useState(0);
  const [isRinging, setIsRinging] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef(null);
  const ringtoneTimeoutRef = useRef(null);
  const activeOscsRef = useRef([]); // Currently playing oscillators
  const isDeadlineMetRef = useRef(false);
  const isCallActiveRef = useRef(true);
  const reminderTimeRef = useRef(reminderTime);

  // Update reminder time ref when prop changes
  useEffect(() => {
    reminderTimeRef.current = reminderTime;
  }, [reminderTime]);

  // Prevent body scroll when phone call is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Stop playing oscillators immediately
  const stopPlayingOscillators = () => {
    if (activeOscsRef.current && activeOscsRef.current.length > 0) {
      activeOscsRef.current.forEach(osc => {
        try {
          osc.stop();
        } catch (err) {
          // Already stopped
        }
      });
      activeOscsRef.current = [];
    }
  };
  useEffect(() => {
    if (task && task.due_date) {
      const now = new Date();
      const dueDate = new Date(task.due_date);
      isDeadlineMetRef.current = dueDate < now;
    }
  }, [task]);



  // Play ringtone sound
  const playRingtone = (context, muted) => {
    // Check if call is still active before playing
    if (!isCallActiveRef.current || !context || muted) return;

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

      // Track currently playing oscillators
      activeOscsRef.current.push(osc1, osc2);

      // Schedule next ring after 1 second (only if call is still active)
      if (!muted && isCallActiveRef.current) {
        ringtoneTimeoutRef.current = setTimeout(() => {
          playRingtone(context, muted);
        }, 1000);
      }
    } catch (err) {
      console.log('Audio playback not available');
    }
  };



  // Initialize Web Audio API and start ringing
  useEffect(() => {
    isCallActiveRef.current = true;

    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = context;

      // Start ringing immediately if not muted
      if (!isMuted) {
        playRingtone(context, false);
      }
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
      // Cleanup: stop all playing oscillators
      stopPlayingOscillators();
    };
  }, []);

  // Handle mute toggle
  useEffect(() => {
    if (!isCallActiveRef.current) return;

    if (isMuted) {
      // Stop all sounds when muted
      if (ringtoneTimeoutRef.current) {
        clearTimeout(ringtoneTimeoutRef.current);
        ringtoneTimeoutRef.current = null;
      }
      stopPlayingOscillators();
    } else {
      // Resume sounds when unmuted
      if (audioContextRef.current && isCallActiveRef.current) {
        // Clear any pending timeouts and start fresh
        if (ringtoneTimeoutRef.current) {
          clearTimeout(ringtoneTimeoutRef.current);
        }
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
    // Mark call as inactive to stop all audio
    isCallActiveRef.current = false;
    
    // Stop all ringtone audio immediately
    if (ringtoneTimeoutRef.current) {
      clearTimeout(ringtoneTimeoutRef.current);
      ringtoneTimeoutRef.current = null;
    }
    stopPlayingOscillators();
    
    // Play accept sound BEFORE suspending context
    playAcceptSound();
    
    // Suspend audio context after playing sound
    try {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.suspend();
      }
    } catch (err) {
      console.log('Error suspending audio context:', err);
    }
    
    onAccept();
  };

  const handleReject = () => {
    // Mark call as inactive to stop all audio
    isCallActiveRef.current = false;
    
    // Stop all ringtone audio immediately
    if (ringtoneTimeoutRef.current) {
      clearTimeout(ringtoneTimeoutRef.current);
      ringtoneTimeoutRef.current = null;
    }
    stopPlayingOscillators();
    
    // Play reject sound BEFORE suspending context
    playRejectSound();
    
    // Suspend audio context after playing sound
    try {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.suspend();
      }
    } catch (err) {
      console.log('Error suspending audio context:', err);
    }
    
    onReject();
  };

  const handleClose = () => {
    // Mark call as inactive to stop all audio
    isCallActiveRef.current = false;
    
    // Stop all ringtone audio immediately
    if (ringtoneTimeoutRef.current) {
      clearTimeout(ringtoneTimeoutRef.current);
      ringtoneTimeoutRef.current = null;
    }
    
    // Stop all playing oscillators
    stopPlayingOscillators();
    
    // Suspend audio context to stop all audio
    try {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.suspend();
      }
    } catch (err) {
      console.log('Error suspending audio context:', err);
    }
    
    // Call onClose callback
    if (onClose) {
      onClose();
    }
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
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="mute-btn"
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? '🔇' : '🔔'}
              </button>
              <button 
                className="close-btn"
                onClick={handleClose}
                title="Close Call"
              >
                ✕
              </button>
            </div>
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
              {isDeadlineMetRef.current && (
                <p className="deadline-status" style={{ color: '#ff4444', marginTop: '8px', fontSize: '12px' }}>
                  ⚠️ Deadline Passed - Call Mandatory
                </p>
              )}
              {!isDeadlineMetRef.current && reminderTime && (
                <p className="reminder-status" style={{ color: '#666', marginTop: '8px', fontSize: '12px' }}>
                  🔔 Reminder at {reminderTime}
                </p>
              )}
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
