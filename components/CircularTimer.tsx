
import React from 'react';
import { TimerMode } from '../types';

interface CircularTimerProps {
  timeLeft: number;
  totalTime: number;
  mode: TimerMode;
  isActive: boolean;
  label?: string;
}

const CircularTimer: React.FC<CircularTimerProps> = ({ timeLeft, totalTime, mode, isActive, label }) => {
  const radius = 140; 
  const stroke = 12; 
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (timeLeft / totalTime) * circumference;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getGradientId = () => `gradient-${mode}`;

  const getGradientColors = () => {
    switch (mode) {
      case TimerMode.WORK: return { start: '#E66F66', end: '#FFB8B0', shadow: 'rgba(230, 111, 102, 0.4)' };
      case TimerMode.SHORT_BREAK: return { start: '#6FAF76', end: '#CFE7DB', shadow: 'rgba(111, 175, 118, 0.45)' };
      case TimerMode.LONG_BREAK: return { start: '#5B88D0', end: '#9FC3F0', shadow: 'rgba(91, 136, 208, 0.45)' };
      default: return { start: '#9CA3AF', end: '#D1D5DB', shadow: 'rgba(156, 163, 175, 0.2)' };
    }
  };

  const colors = getGradientColors();

  return (
    <div className="relative flex items-center justify-center p-8">
      <div className="absolute inset-0 rounded-full blur-3xl opacity-20 dark:opacity-10 transition-colors duration-1000" style={{ backgroundColor: colors.start }}></div>
      <div className="relative rounded-full bg-white/40 dark:bg-gray-800/40 shadow-glass dark:shadow-glass-dark backdrop-blur-md border border-white/50 dark:border-white/5 p-2 transition-colors duration-500">
        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg] transition-all duration-500">
          <defs>
            <linearGradient id={getGradientId()} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.start} />
              <stop offset="100%" stopColor={colors.end} />
            </linearGradient>
          </defs>
          <circle stroke="currentColor" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} className="text-[#F0F0F2] dark:text-gray-700/50" />
          <circle stroke={`url(#${getGradientId()})`} fill="transparent" strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)', strokeLinecap: 'round', filter: isActive ? `drop-shadow(0px 0px 8px ${colors.shadow})` : 'none' }} r={normalizedRadius} cx={radius} cy={radius} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-7xl font-sans font-semibold tracking-tighter text-[#1D1D1F] dark:text-white select-none">{formatTime(timeLeft)}</span>
            {label && (
                <div className={`mt-2 flex items-center gap-2 px-3 py-1 rounded-full transition-colors duration-500 ${isActive ? 'bg-white/60 dark:bg-white/10' : 'bg-transparent'}`}>
                    {isActive && (
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-morandi-work opacity-75" style={{backgroundColor: colors.start}}></span>
                            <span className="relative inline-flex rounded-full h-2 w-2" style={{backgroundColor: colors.start}}></span>
                        </span>
                    )}
                    <span className="text-xs font-medium uppercase tracking-widest opacity-70 text-morandi-text-secondary dark:text-gray-400">
                        {label}
                    </span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CircularTimer;
