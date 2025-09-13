import { useEffect, useRef } from "react";

interface ConfettiCanvasProps {
  origin: { x: number; y: number };
  durationMs?: number;
  count?: number;
  colors?: string[];
  onDone?: () => void;
}

export default function ConfettiCanvas({
  origin,
  durationMs = 1400,
  count = 90,
  colors = ["#f59e0b", "#fde68a", "#fca5a5", "#86efac", "#93c5fd", "#c7d2fe"],
  onDone,
}: ConfettiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      life: number;
      decay: number;
      rot: number;
      vr: number;
    }> = [];

    const rect = { x: origin.x, y: origin.y };
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 6;
      particles.push({
        x: rect.x,
        y: rect.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 3 + Math.random() * 4,
        color: colors[i % colors.length],
        life: 1,
        decay: 0.015 + Math.random() * 0.02,
        rot: Math.random() * 360,
        vr: -6 + Math.random() * 12,
      });
    }

    const start = performance.now();
    const gravity = 0.25;
    const friction = 0.992;

    const tick = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.vy += gravity;
        p.vx *= friction;
        p.vy *= friction;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= p.decay;
        if (p.life <= 0) continue;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.2);
        ctx.restore();
      }
      if (t < durationMs) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onDone?.();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [origin.x, origin.y, durationMs, count, colors, onDone]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: 70, pointerEvents: "none" }}
    />
  );
}
