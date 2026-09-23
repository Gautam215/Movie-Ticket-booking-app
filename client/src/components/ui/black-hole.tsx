import { useEffect, useRef } from 'react';

type Star = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkle: number;
};

const TAU = Math.PI * 2;

function random(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function createStars(width: number, height: number): Star[] {
  const count = Math.min(180, Math.max(80, Math.floor((width * height) / 14000)));
  return Array.from({ length: count }, (_, index) => ({
    x: random(index + 1) * width,
    y: random(index + 101) * height,
    radius: random(index + 201) * 1.35 + 0.25,
    alpha: random(index + 301) * 0.7 + 0.18,
    twinkle: random(index + 401) * TAU,
  }));
}

export default function BlackHole() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;
    const contextValue = element.getContext('2d');
    if (!contextValue) return;
    const canvas: HTMLCanvasElement = element;
    const context: CanvasRenderingContext2D = contextValue;

    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let animationFrame = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      stars = createStars(width, height);
    }

    function draw(time: number) {
      const seconds = time * 0.001;
      const centerX = width * (width < 680 ? 0.72 : 0.7);
      const centerY = height * (width < 680 ? 0.42 : 0.45);
      const radius = Math.max(86, Math.min(width, height) * (width < 680 ? 0.16 : 0.19));
      const rotation = seconds * 0.06;

      context.clearRect(0, 0, width, height);

      const atmosphere = context.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius * 4.4);
      atmosphere.addColorStop(0, 'rgba(255, 120, 50, 0.2)');
      atmosphere.addColorStop(0.34, 'rgba(102, 188, 255, 0.08)');
      atmosphere.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = atmosphere;
      context.fillRect(0, 0, width, height);

      for (const star of stars) {
        const alpha = star.alpha * (0.76 + Math.sin(seconds * 0.5 + star.twinkle) * 0.24);
        context.beginPath();
        context.fillStyle = `rgba(238, 246, 255, ${alpha})`;
        context.arc(star.x, star.y, star.radius, 0, TAU);
        context.fill();
      }

      context.save();
      context.translate(centerX, centerY);
      context.rotate(rotation - 0.18);
      context.scale(1, 0.36);
      context.globalCompositeOperation = 'lighter';

      for (let index = 0; index < 18; index += 1) {
        const ringRadius = radius * (1.1 + index * 0.075);
        const ringGradient = context.createLinearGradient(-ringRadius, 0, ringRadius, 0);
        ringGradient.addColorStop(0, 'rgba(56, 130, 255, 0)');
        ringGradient.addColorStop(0.22, `rgba(80, 165, 255, ${0.08 + index * 0.003})`);
        ringGradient.addColorStop(0.5, `rgba(255, 213, 130, ${0.18 + index * 0.006})`);
        ringGradient.addColorStop(0.78, `rgba(255, 98, 35, ${0.14 + index * 0.005})`);
        ringGradient.addColorStop(1, 'rgba(255, 50, 22, 0)');
        context.beginPath();
        context.strokeStyle = ringGradient;
        context.lineWidth = Math.max(1.2, radius * 0.018);
        context.arc(0, 0, ringRadius, 0, TAU);
        context.stroke();
      }

      context.restore();

      const lens = context.createRadialGradient(centerX, centerY, radius * 0.74, centerX, centerY, radius * 1.22);
      lens.addColorStop(0, 'rgba(0, 0, 0, 1)');
      lens.addColorStop(0.72, 'rgba(0, 0, 0, 1)');
      lens.addColorStop(0.86, 'rgba(255, 108, 38, 0.88)');
      lens.addColorStop(0.96, 'rgba(255, 205, 125, 0.28)');
      lens.addColorStop(1, 'rgba(255, 255, 255, 0)');
      context.beginPath();
      context.fillStyle = lens;
      context.arc(centerX, centerY, radius * 1.22, 0, TAU);
      context.fill();

      context.save();
      context.translate(centerX, centerY);
      context.rotate(-rotation * 1.4 + 0.28);
      context.scale(1, 0.28);
      context.beginPath();
      context.strokeStyle = 'rgba(255, 197, 110, 0.78)';
      context.shadowBlur = 22;
      context.shadowColor = 'rgba(255, 88, 35, 0.85)';
      context.lineWidth = Math.max(2, radius * 0.035);
      context.arc(0, 0, radius * 1.05, 0, TAU);
      context.stroke();
      context.restore();

      if (!reducedMotion) animationFrame = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    draw(0);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <div className="black-hole-background" aria-hidden="true"><canvas ref={canvasRef} /></div>;
}
