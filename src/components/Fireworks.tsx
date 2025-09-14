import { useEffect, useRef } from "react";

interface FireworksProps {
  durationMs?: number;
  bursts?: number;
  particlesPerBurst?: number;
  colors?: string[];
  onDone?: () => void;
}

// Bottom fountain burst with circular confetti and smooth fall
export default function Fireworks({
  durationMs = 4200,
  bursts = 1,
  particlesPerBurst = 220,
  colors = ["#f472b6", "#f59e0b", "#93c5fd", "#86efac", "#fca5a5", "#fde68a"],
  onDone,
}: FireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const vwRef = useRef<number>(0);
  const vhRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const resize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      vwRef.current = vw;
      vhRef.current = vh;
      canvas.width = Math.floor(vw * dpr);
      canvas.height = Math.floor(vh * dpr);
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vh}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    type Confetti = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      decay: number;
      r: number; // radius
      color: string;
      angle: number;
      spin: number;
      wobble: number;
      wobbleSpeed: number;
      tilt: number;
      tiltSpeed: number;
    };

    const confetti: Confetti[] = [];
    const getLaunch = () => ({ x: vwRef.current / 2, y: vhRef.current * 0.9 });

    const createBurst = () => {
      const c = getLaunch();
      const spread = Math.PI * 0.45; // narrower fan
      for (let i = 0; i < particlesPerBurst; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread; // upwards narrow fan
        const speed = 5.8 + Math.random() * 4.8;
        const vx = Math.cos(angle) * speed * (0.9 + Math.random() * 0.15);
        const vy = Math.sin(angle) * speed * (0.9 + Math.random() * 0.15);
        const r = 2 + Math.random() * 2.5; // smaller circles
        confetti.push({
          x: c.x + (Math.random() - 0.5) * 6,
          y: c.y + (Math.random() - 0.5) * 6,
          vx,
          vy,
          life: 1,
          decay: 0.004 + Math.random() * 0.006,
          r,
          color: colors[i % colors.length],
          angle: Math.random() * Math.PI * 2,
          spin: (-1 + Math.random() * 2) * 0.12,
          wobble: Math.random() * 8,
          wobbleSpeed: 0.04 + Math.random() * 0.08,
          tilt: Math.random() * Math.PI * 2,
          tiltSpeed: (-1 + Math.random() * 2) * 0.09,
        });
      }
    };

    // Single bottom burst at start
    const burstTimes: number[] = [0];

    const start = performance.now();
    const gravity = 0.12; // gentle fall
    const drag = 0.997; // smooth damping
    const terminalVy = 4.8; // slower terminal velocity

    const tick = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // subtle wind
      const timeWind = Math.sin(t * 0.0014) * 0.002;

      for (const bt of burstTimes) {
        if (t >= bt && t < bt + 30) createBurst();
      }

      for (const p of confetti) {
        p.vy += gravity * (0.97 + 0.06 * Math.random());
        if (p.vy > terminalVy) p.vy = terminalVy;
        p.vx += timeWind + 0.001 * Math.sin(p.tilt * 1.1);
        p.vx *= drag;
        p.vy *= drag;
        p.x += p.vx + Math.cos(p.wobble) * 0.5;
        p.y += p.vy + Math.sin(p.wobble * 0.85) * 0.18;
        p.wobble += p.wobbleSpeed;
        p.tilt += p.tiltSpeed;
        p.angle += p.spin;
        p.life -= p.decay;
        if (p.life <= 0) continue;

        const flip = (Math.sin(p.tilt) + 1) * 0.5; // 0..1

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
        // soft highlight
        ctx.globalAlpha = Math.max(0, p.life) * 0.22 * (0.65 + 0.35 * flip);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(-p.r * 0.35, -p.r * 0.35, p.r * 0.35, 0, Math.PI * 2);
        ctx.fill();
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
  }, [durationMs, bursts, particlesPerBurst, colors, onDone]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: 70, pointerEvents: "none" }}
    />
  );
}
