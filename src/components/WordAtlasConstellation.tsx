'use client';

import React, { useEffect, useRef } from 'react';
import type { TopicStat } from '@/types/atlas';

interface Props {
  topics: TopicStat[];
  activeTopic: string;
  onSelectTopic: (topicId: string) => void;
}

export default function WordAtlasConstellation({
  topics,
  activeTopic,
  onSelectTopic
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 280;
    const height = 168;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Subtle concentric radar rings on light sky ground
    const cx = width / 2;
    const cy = height / 2;
    ctx.strokeStyle = '#DCEBFA';
    ctx.lineWidth = 1;
    [34, 62, 86].forEach((r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    const visibleTopics = topics.slice(0, 12);
    const nodes = visibleTopics.map((t, idx) => {
      const angle = (idx / visibleTopics.length) * Math.PI * 2 - Math.PI / 2;
      const ring = idx % 2 === 0 ? 64 : 38;
      return {
        id: t.id,
        label: t.vi,
        total: t.total,
        x: cx + Math.cos(angle) * ring,
        y: cy + Math.sin(angle) * (ring * 0.78)
      };
    });

    // Connect constellation lines
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      const b = nodes[(i + 1) % nodes.length];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      if (i % 2 === 0) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(a.x, a.y);
        ctx.stroke();
      }
    }

    // Center hub
    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    // Topic nodes
    nodes.forEach((n) => {
      const isSelected = n.id === activeTopic;
      ctx.beginPath();
      ctx.arc(n.x, n.y, isSelected ? 6.5 : 4.2, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#0284C7' : '#38BDF8';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }, [topics, activeTopic]);

  return (
    <div className="mt-3 space-y-3">
      <div className="relative rounded-xl bg-[#F0F7FF] border border-[#DCEBFA] p-2 flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-[280px] h-[168px] block"
          aria-label="Bản đồ mạng lưới 19 chủ đề IELTS"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {topics.slice(0, 6).map((t) => {
          const active = activeTopic === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTopic(t.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono-data font-bold transition-colors cursor-pointer border ${
                active
                  ? 'bg-[#0284C7] text-[#FFFFFF] border-[#0284C7]'
                  : 'bg-[#F0F7FF] text-[#334155] border-[#DCEBFA] hover:bg-[#E0F2FE] hover:text-[#0F172A]'
              }`}
            >
              {t.vi} ({t.total})
            </button>
          );
        })}
      </div>
    </div>
  );
}
