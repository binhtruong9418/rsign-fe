import React, { useState, useEffect } from 'react';

interface SessionTimerProps {
  expiresAt: number;
  onExpired: () => void;
  className?: string;
}

const SessionTimer: React.FC<SessionTimerProps> = ({ expiresAt, onExpired, className = '' }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const remaining = expiresAt - Date.now();

      if (remaining <= 0) {
        setTimeRemaining(0);
        onExpired();
      } else {
        setTimeRemaining(remaining);
      }
    };

    // Initial update
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getColorClass = (): string => {
    if (timeRemaining > 300000) return 'text-green-600'; // > 5 minutes
    if (timeRemaining > 60000) return 'text-yellow-600'; // 1-5 minutes
    return 'text-red-600 animate-pulse'; // < 1 minute
  };

  const getWarningMessage = (): string | null => {
    if (timeRemaining <= 60000 && timeRemaining > 0) {
      return 'Session expiring soon!';
    }
    if (timeRemaining <= 0) {
      return 'Session expired';
    }
    return null;
  };

  const warningMessage = getWarningMessage();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`font-mono text-lg font-semibold ${getColorClass()}`}>
        ⏱️ {formatTime(timeRemaining)}
      </div>
      {warningMessage && (
        <span className="text-sm text-red-600 font-medium">{warningMessage}</span>
      )}
    </div>
  );
};

export default SessionTimer;
