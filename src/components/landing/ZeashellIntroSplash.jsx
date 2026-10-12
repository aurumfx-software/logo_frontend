import React, { useState, useEffect } from 'react';
import { HiLocationMarker } from 'react-icons/hi';

export default function ZeashellIntroSplash({ onFinish, minDuration = 1800 }) {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    // Run minimal 2-color invert animation for minDuration ms then smoothly reveal landing page
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      const removeTimer = setTimeout(() => {
        setIsMounted(false);
        if (onFinish) onFinish();
      }, 500);
      return () => clearTimeout(removeTimer);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onFinish]);

  if (!isMounted) return null;

  return (
    <div
      className={`zeas-intro-splash-minimal ${isFadingOut ? 'fade-out' : ''}`}
      aria-label="Loading Logo Kerala"
      role="status"
    >
      <div className="zeas-intro-minimal-content">
        <span className="zeas-intro-minimal-logo">LOGO</span>
        <HiLocationMarker className="zeas-intro-minimal-pin" />
      </div>
    </div>
  );
}
