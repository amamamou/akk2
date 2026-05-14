"use client";

import React, { useEffect } from 'react';

export default function SuppressConsole() {
  useEffect(() => {
    try {
      // Suppress console methods in production or demo environments
      // This prevents accidental exposure of JWTs, tokens, or sensitive API responses
      const isDemoOrProduction = 
        (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') ||
        (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');
      
      if (isDemoOrProduction) {
        // Suppress all console output in production/demo to prevent token leaks
        // eslint-disable-next-line no-console
        console.log = () => {};
        // eslint-disable-next-line no-console
        console.debug = () => {};
        // eslint-disable-next-line no-console
        console.info = () => {};
        // eslint-disable-next-line no-console
        console.trace = () => {};
        
        // Keep warn and error for real issues (but even these could leak data)
        // In strict mode, you might also suppress these:
        // console.warn = () => {};
        // console.error = () => {};
      }
    } catch (e) {
      // Suppress any errors during console suppression
    }
  }, []);

  return null;
}

