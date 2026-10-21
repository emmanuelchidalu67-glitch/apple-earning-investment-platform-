import React, { useEffect, useRef } from 'react';
import { Sparkles, Gem, CheckCircle2 } from 'lucide-react';
import { formatNaira } from '../utils/formatters';

interface InvestmentCanvasCelebrationProps {
  planName: string;
  capitalKobo: number;
  dailyYieldKobo: number;
  onDismiss: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  vRot: number;
  type: 'diamond' | 'star' | 'circle';
}

export const InvestmentCanvasCelebration: React.FC<InvestmentCanvasCelebrationProps> = ({
  planName,
  capitalKobo,
  dailyYieldKobo,
  onDismiss,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const colors = ['#38bdf8', '#0ea5e9', '#ec4899', '#f43f5e', '#a855f7', '#ffffff', '#fbbf24', '#67e8f9'];
    const particles: Particle[] = [];

    // Spawn 75 sparkling diamond particles from the center/lower half
    for (let i = 0; i < 75; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      particles.push({
        x: width / 2 + (Math.random() - 0.5) * 80,
        y: height / 2 + (Math.random() - 0.5) * 60,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.008 + 0.006,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.1,
        type: Math.random() > 0.4 ? 'diamond' : Math.random() > 0.5 ? 'star' : 'circle',
      });
    }

    const drawDiamond = (c: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number) => {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.beginPath();
      c.moveTo(0, -size);
      c.lineTo(size * 0.7, 0);
      c.lineTo(0, size);
      c.lineTo(-size * 0.7, 0);
      c.closePath();
      c.fill();
      c.restore();
    };

    const drawStar = (c: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number, rot: number) => {
      c.save();
      c.translate(cx, cy);
      c.rotate(rot);
      let step = Math.PI / spikes;
      c.beginPath();
      for (let i = 0; i < 2 * spikes; i++) {
        let r = i % 2 === 0 ? outerRadius : innerRadius;
        let x = Math.cos(i * step) * r;
        let y = Math.sin(i * step) * r;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.closePath();
      c.fill();
      c.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // subtle gravity
        p.rotation += p.vRot;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;

        if (p.type === 'diamond') {
          drawDiamond(ctx, p.x, p.y, p.size, p.rotation);
        } else if (p.type === 'star') {
          drawStar(ctx, p.x, p.y, 4, p.size, p.size * 0.4, p.rotation);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (particles.length > 0) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    // Auto dismiss after 4 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timer);
    };
  }, [onDismiss]);

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-pointer select-none"
    >
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Floating Positive Reinforcement Badge */}
      <div className="relative z-10 max-w-sm w-full bg-gradient-to-b from-[#091b38] via-[#0b1c3b] to-[#050e1d] border border-sky-400/50 rounded-3xl p-6 text-white text-center shadow-[0_0_50px_rgba(56,189,248,0.4)] animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 via-blue-500 to-pink-500 p-0.5 mx-auto mb-3 shadow-lg shadow-sky-500/40">
          <div className="w-full h-full bg-[#071328] rounded-[14px] flex items-center justify-center">
            <Gem className="w-9 h-9 text-sky-300 animate-pulse" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Investment Activated!</span>
        </div>

        <h3 className="text-xl font-black text-white tracking-wide mt-1">{planName}</h3>
        <p className="text-xs text-sky-200/90 mt-1">
          Where Your Money Is Growing Unstoppable
        </p>

        <div className="grid grid-cols-2 gap-2 my-4 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-bold">Capital</span>
            <p className="text-sm font-black font-mono text-white mt-0.5">
              {formatNaira(capitalKobo, false)}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-bold">Daily Yield</span>
            <p className="text-sm font-black font-mono text-emerald-400 mt-0.5">
              +{formatNaira(dailyYieldKobo, false)}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          Positive confirmation recorded. Your daily yields will accrue automatically every 24 hours.
        </p>

        <button
          onClick={onDismiss}
          className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:from-sky-400"
        >
          View in Portfolio Ledger
        </button>
      </div>
    </div>
  );
};
