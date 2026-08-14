// Lightweight canvas particle burst — the delight moment when the Konami
// code (see konami.ts) engages max-motion. Self-contained: creates its own
// canvas, runs for ~1.4s, then removes itself entirely. Reduced motion is
// already handled upstream — konami.ts never calls this at all for those
// visitors, so there's no separate guard needed here.
const COLORS = ['#7d97ff', '#ff8fd6', '#f2f3f5', '#9a9ba8'];
const DURATION = 1400;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

export function burstConfetti(): void {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-burst';
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  document.body.append(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const originX = innerWidth / 2;
  const originY = innerHeight / 2;
  const particles: Particle[] = Array.from({ length: 80 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    return {
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 4,
      color: COLORS[(Math.random() * COLORS.length) | 0],
    };
  });

  const start = performance.now();

  function frame(now: number) {
    if (!ctx) return;
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.vy += 0.15; // gravity
      p.x += p.vx;
      p.y += p.vy;
      ctx.globalAlpha = Math.max(0, 1 - elapsed / DURATION);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    if (elapsed < DURATION) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(frame);
}
