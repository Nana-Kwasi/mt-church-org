import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

// Session Timeout Context
const SessionTimeoutContext = createContext();

// Custom hook to use session timeout
export const useSessionTimeout = () => {
  const context = useContext(SessionTimeoutContext);
  if (!context) {
    throw new Error('useSessionTimeout must be used within a SessionTimeoutProvider');
  }
  return context;
};

// Session Timeout Provider Component
export const SessionTimeoutProvider = ({ 
  children, 
  timeoutDuration = 15 * 60 * 1000, // 15 minutes
  warningTime = 2 * 60 * 1000,      // 2 minutes warning
  onTimeout,
  onWarning,
  onActivity
}) => {
  const [isActive, setIsActive] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  
  const lastActivityRef = useRef(Date.now());
  const timeoutIntervalRef = useRef(null);
  const warningShownRef = useRef(false);
  
  // Activity events to monitor
  const activityEvents = [
    'mousedown', 'mousemove', 'keypress', 'scroll', 
    'touchstart', 'click', 'focus', 'keydown'
  ];
  
  // Handle user activity
  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;
    
    if (showWarning) {
      setShowWarning(false);
    }
    
    if (onActivity) {
      onActivity();
    }
  }, [showWarning, onActivity]);
  
  // Handle session timeout
  const handleTimeout = useCallback(() => {
    console.log('Session timeout triggered');
    stop();
    setShowWarning(false);
    
    if (onTimeout) {
      onTimeout();
    } else {
      // Default timeout behavior
      alert('Your session has expired due to inactivity. You will be logged out.');
      window.location.reload();
    }
  }, [onTimeout]);
  
  // Check for timeout
  const checkTimeout = useCallback(() => {
    const now = Date.now();
    const timeSinceActivity = now - lastActivityRef.current;
    const timeUntilTimeout = timeoutDuration - timeSinceActivity;
    
    console.log(`Time since activity: ${timeSinceActivity}ms, Time until timeout: ${timeUntilTimeout}ms`);
    
    // Show warning if approaching timeout
    if (timeUntilTimeout <= warningTime && timeUntilTimeout > 0 && !warningShownRef.current) {
      console.log('Showing warning modal');
      setShowWarning(true);
      warningShownRef.current = true;
      setRemainingTime(Math.ceil(timeUntilTimeout / 1000));
      
      if (onWarning) {
        onWarning(Math.ceil(timeUntilTimeout / 1000));
      }
    }
    
    // Update remaining time if warning is shown
    if (showWarning && timeUntilTimeout > 0) {
      setRemainingTime(Math.ceil(timeUntilTimeout / 1000));
    }
    
    // Timeout reached
    if (timeSinceActivity >= timeoutDuration) {
      console.log('Timeout duration exceeded, triggering timeout');
      handleTimeout();
    }
  }, [timeoutDuration, warningTime, showWarning, onWarning, handleTimeout]);
  
  // Start monitoring
  const start = useCallback(() => {
    if (isActive) {
      console.log('Session monitoring already active');
      return;
    }
    
    console.log('Starting session timeout monitoring');
    setIsActive(true);
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    warningShownRef.current = false;
    
    // Add event listeners with passive option for better performance
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true, capture: true });
    });
    
    // Start checking for timeout every second
    timeoutIntervalRef.current = setInterval(checkTimeout, 1000);
    
    console.log('Session timeout monitoring started');
  }, [isActive, handleActivity, checkTimeout, activityEvents]);
  
  // Stop monitoring
  const stop = useCallback(() => {
    console.log('Stopping session timeout monitoring');
    setIsActive(false);
    setShowWarning(false);
    warningShownRef.current = false;
    
    // Remove event listeners
    activityEvents.forEach(event => {
      document.removeEventListener(event, handleActivity, { capture: true });
    });
    
    // Clear intervals
    if (timeoutIntervalRef.current) {
      clearInterval(timeoutIntervalRef.current);
      timeoutIntervalRef.current = null;
    }
    
    console.log('Session timeout monitoring stopped');
  }, [handleActivity, activityEvents]);
  
  // Extend session
  const extendSession = useCallback(() => {
    console.log('Session extended');
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    warningShownRef.current = false;
  }, []);
  
  // Get remaining time in seconds
  const getRemainingTime = useCallback(() => {
    const timeSinceActivity = Date.now() - lastActivityRef.current;
    const remaining = Math.max(0, timeoutDuration - timeSinceActivity);
    return Math.ceil(remaining / 1000);
  }, [timeoutDuration]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);
  
  // Auto-start when provider mounts
  useEffect(() => {
    start();
  }, [start]);
  
  const value = {
    isActive,
    showWarning,
    remainingTime,
    start,
    stop,
    extendSession,
    getRemainingTime,
    handleTimeout
  };
  
  return (
    <SessionTimeoutContext.Provider value={value}>
      {children}
      {showWarning && <SessionWarningModal />}
    </SessionTimeoutContext.Provider>
  );
};

// Warning Modal Component
const SessionWarningModal = () => {
  const { remainingTime, extendSession, handleTimeout } = useSessionTimeout();
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        extendSession();
      } else if (e.key === 'Enter') {
        extendSession();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [extendSession]);
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '420px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e5e7eb'
      }}>
        {/* Warning Icon */}
        <div style={{
          fontSize: '48px',
          marginBottom: '16px'
        }}>
          ⚠️
        </div>
        
        {/* Title */}
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#dc2626',
          margin: '0 0 16px 0'
        }}>
          Session Timeout Warning
        </h3>
        
        {/* Message */}
        <p style={{
          color: '#6b7280',
          marginBottom: '8px',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          Your session will expire in
        </p>
        
        {/* Countdown Timer */}
        <div style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#dc2626',
          marginBottom: '16px',
          fontFamily: 'monospace'
        }}>
          {formatTime(remainingTime)}
        </div>
        
        <p style={{
          color: '#6b7280',
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          due to inactivity. Click "Stay Logged In" to continue your session.
          <br />
          <small>(Press Enter or Escape to stay logged in)</small>
        </p>
        
        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={extendSession}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              minWidth: '140px'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
            autoFocus
          >
            Stay Logged In
          </button>
          
          <button
            onClick={handleTimeout}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              minWidth: '140px'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for individual components to control session timeout
export const useSessionControl = () => {
  const { start, stop, extendSession, isActive, getRemainingTime } = useSessionTimeout();
  
  return {
    start,
    stop,
    extendSession,
    isActive,
    getRemainingTime
  };
};

// Example usage component
export const SessionExample = () => {
  const { isActive, showWarning, remainingTime, getRemainingTime } = useSessionTimeout();
  const { extendSession } = useSessionControl();
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Session Status</h2>
      <p>Session monitoring active: {isActive ? '✅ Yes' : '❌ No'}</p>
      <p>Warning shown: {showWarning ? '⚠️ Yes' : '✅ No'}</p>
      <p>Time remaining: {Math.floor(getRemainingTime() / 60)}:{(getRemainingTime() % 60).toString().padStart(2, '0')}</p>
      
      <button 
        onClick={extendSession}
        style={{
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 16px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
      >
        Extend Session
      </button>
    </div>
  );
};