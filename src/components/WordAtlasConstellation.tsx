'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { TopicStat } from '@/types/atlas';

interface Props {
  topics: TopicStat[];
  activeTopic: string;
  onSelectTopic: (topicId: string) => void;
}

interface StarNode {
  id: string;
  label: string;
  code: string;
  total: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

const PALETTE = ['#FACC15', '#EA580C', '#10B981', '#F4F1EA', '#38BDF8'];

export default function WordAtlasConstellation({ topics, activeTopic, onSelectTopic }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredTopic, setHoveredTopic] = useState<StarNode | null>(null);
  const nodesRef = useRef<StarNode[]>([]);

  useEffect(() => {
    const list = topics.length > 0 ? topics : [];
    nodesRef.current = list.map((t, idx) => {
      const angle = (idx / Math.max(1, list.length)) * Math.PI * 2;
      const ring = idx % 2 === 0 ? 0.34 : 0.21;
      return {
        id: t.id,
        label: t.vi,
        code: t.code,
        total: t.total,
        x: 0.5 + Math.cos(angle) * ring,
        y: 0.5 + Math.sin(angle) * ring,
        vx: (Math.random() - 0.5) * 0.00025,
        vy: (Math.random() - 0.5) * 0.00025,
        radius: Math.max(4, Math.min(8, Math.round(t.total / 95))),
        color: PALETTE[idx % PALETTE.length]
      };
    });
  }, [topics]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
      }
      ctx.save();
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const nodes = nodesRef.current;

      // Update gentle orbital drift
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0.12 || n.x > 0.88) n.vx *= -1;
        if (n.y < 0.14 || n.y > 0.86) n.vy *= -1;
      }

      // Draw constellation filaments
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = (a.x - b.x) * w;
          const dy = (a.y - b.y) * h;
          const dist = Math.hypot(dx, dy);
          if (dist < 115) {
            const alpha = (1 - dist / 115) * 0.35;
            ctx.strokeStyle =
              a.id === activeTopic || b.id === activeTopic
                ? `rgba(250, 204, 21, ${alpha + 0.25})`
                : `rgba(244, 241, 234, ${alpha})`;
            ctx.lineWidth = a.id === activeTopic || b.id === activeTopic ? 1.3 : 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x * w, a.y * h);
            ctx.lineTo(b.x * w, b.y * h);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const n of nodes) {
        const cx = n.x * w;
        const cy = n.y * h;
        const isSelected = n.id === activeTopic;

        if (isSelected) {
          ctx.beginPath();
          ctx.arc(cx, cy, n.radius + 6, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(cx, cy, isSelected ? n.radius + 2 : n.radius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#FACC15' : n.color;
        ctx.fill();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activeTopic]);

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let closest: StarNode | null = null;
    let minDist = 24;
    for (const n of nodesRef.current) {
      const d = Math.hypot(n.x * rect.width - mx, n.y * rect.height - my);
      if (d < minDist) {
        minDist = d;
        closest = n;
      }
    }
    setHoveredTopic(closest);
  };

  const handleClick = () => {
    if (hoveredTopic) {
      onSelectTopic(hoveredTopic.id);
    }
  };

  return (
    <div className="relative w-full h-44 select-none">
      <canvas
        ref={canvasRef}
        onMouseMove={handlePointerMove}
        onMouseLeave={() => setHoveredTopic(null)}
        onClick={handleClick}
        className="w-full h-full cursor-pointer block"
        aria-label="Bản đồ chùm sao 19 chủ đề từ vựng IELTS Word Atlas"
      />
      <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs font-mono-data text-[#B8B2A6]">
        <span>
          {hoveredTopic
            ? `${hoveredTopic.code} • ${hoveredTopic.label} (${hoveredTopic.total} từ)`
            : '19 CHÙM SAO CHỦ ĐỀ • 7,298 TỪ'}
        </span>
        <span className="text-[#FACC15]">CHẠM CHỌN CHỦ ĐỀ</span>
      </div>
    </div>
  );
}
