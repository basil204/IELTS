'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Magic UI: BlurFade
 * Smooth entrance transition with subtle blur + vertical slide when switching steps or revealing cards.
 */
export function BlurFade({
  children,
  delay = 0,
  duration = 0.35,
  yOffset = 10,
  className = ''
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{
        delay,
        duration,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Magic UI: NumberTicker
 * Animated tabular counter for lexical & learning telemetry.
 */
export function NumberTicker({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  className = ''
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}) {
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const durationMs = 950;
    let rafId = 0;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayVal(value * eased);
      if (progress < 1) {
        rafId = window.requestAnimationFrame(step);
      } else {
        setDisplayVal(value);
      }
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [value]);

  const formatted =
    decimals > 0
      ? displayVal.toFixed(decimals)
      : Math.round(displayVal).toLocaleString('en-US');

  return (
    <span className={`font-mono-data tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

/**
 * Magic UI: BorderBeam
 * Subtle animated Sky-Cerulean light beam along the border of focal cards (Login card, Active Lesson card).
 */
export function BorderBeam({
  duration = 8,
  className = ''
}: {
  duration?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden ${className}`}
    >
      <motion.div
        animate={{
          x: ['-100%', '200%']
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear'
        }}
        className="absolute top-0 left-0 h-[2px] w-1/2 bg-[#0284C7]"
      />
      <motion.div
        animate={{
          x: ['200%', '-100%']
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear'
        }}
        className="absolute bottom-0 left-0 h-[2px] w-1/2 bg-[#38BDF8]"
      />
    </div>
  );
}

/**
 * Magic UI: Marquee
 * Smooth infinite horizontal ticker that pauses on hover for student Hall of Fame & sample words.
 */
export function Marquee({
  children,
  reverse = false,
  className = ''
}: {
  children: React.ReactNode;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative flex overflow-hidden py-2 ${className}`}>
      <motion.div
        animate={{
          x: reverse ? ['-50%', '0%'] : ['0%', '-50%']
        }}
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: 'linear'
        }}
        className="flex min-w-max gap-4"
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Magic UI: AnimatedRoadmapBeam
 * Interactive 4-Stage connected beam showing progressive learning path (Stage 1 -> Stage 2 -> Stage 3 -> Stage 4).
 */
export function AnimatedRoadmapBeam({
  stages,
  activeStageIndex,
  onSelectStage
}: {
  stages: {
    code: string;
    band: string;
    title: string;
    sub: string;
    wordCount: number;
  }[];
  activeStageIndex: number;
  onSelectStage?: (idx: number) => void;
}) {
  return (
    <div className="relative">
      {/* Connecting horizontal line + animated Sky-Blue beam on desktop */}
      <div className="hidden lg:block absolute top-9 left-12 right-12 h-1 bg-[#DCEBFA] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: '0%' }}
          animate={{
            width: `${Math.min(100, ((activeStageIndex + 1) / stages.length) * 100)}%`
          }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="h-full bg-[#0284C7]"
        />
      </div>

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map((st, idx) => {
          const isCurrent = idx === activeStageIndex;
          const isPassed = idx < activeStageIndex;
          return (
            <button
              key={st.code}
              type="button"
              onClick={() => onSelectStage && onSelectStage(idx)}
              className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                isCurrent
                  ? 'bg-[#F0F7FF] border-[#0284C7] shadow-sm'
                  : isPassed
                    ? 'bg-[#ECFDF5] border-[#A7F3D0]'
                    : 'bg-[#FFFFFF] border-[#DCEBFA] hover:border-[#BAE6FD] hover:bg-[#F8FBFF]'
              }`}
            >
              {isCurrent && <BorderBeam duration={6} />}
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg font-mono-data text-xs font-extrabold ${
                    isCurrent
                      ? 'bg-[#0284C7] text-[#FFFFFF]'
                      : isPassed
                        ? 'bg-[#059669] text-[#FFFFFF]'
                        : 'bg-[#E0F2FE] text-[#0284C7]'
                  }`}
                >
                  {st.code}
                </span>
                <span className="font-mono-data text-xs font-bold text-[#0F172A]">
                  {st.band}
                </span>
              </div>

              <div className="font-display text-sm font-extrabold text-[#0F172A] mt-3">
                {st.title}
              </div>
              <div className="text-xs text-[#334155] mt-1">{st.sub}</div>
              <div className="mt-3 pt-2.5 border-t border-[#DCEBFA] flex items-center justify-between font-mono-data text-xs">
                <span className="text-[#64748B]">{st.wordCount} từ trọng tâm</span>
                <span
                  className={
                    isCurrent
                      ? 'text-[#0284C7] font-bold'
                      : isPassed
                        ? 'text-[#059669] font-bold'
                        : 'text-[#64748B]'
                  }
                >
                  {isCurrent
                    ? 'Đang mở →'
                    : isPassed
                      ? 'Đã mở khóa'
                      : 'Chọn chặng'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
