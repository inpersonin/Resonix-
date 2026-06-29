import { useEffect, useRef } from 'react';

export default function AudioWaveform({ active }) {
  const canvas = useRef(null);
  const bars = useRef(Array.from({ length: 32 }, () => Math.random() * 0.3 + 0.1));
  const raf = useRef(null);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const W = canvas.current.width;
      const H = canvas.current.height;
      ctx.clearRect(0, 0, W, H);

      const n = bars.current.length;
      const barW = (W / n) * 0.6;
      const gap = (W / n) * 0.4;

      bars.current = bars.current.map((v) => {
        const target = active
          ? Math.random() * 0.75 + 0.15
          : Math.random() * 0.18 + 0.05;
        return v + (target - v) * (active ? 0.25 : 0.06);
      });

      bars.current.forEach((v, i) => {
        const x = i * (barW + gap);
        const h = v * H;
        const y = (H - h) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + h);
        grad.addColorStop(0, 'rgba(76, 204, 114, 0.8)');
        grad.addColorStop(0.5, 'rgba(61, 186, 96, 0.95)');
        grad.addColorStop(1, 'rgba(76, 204, 114, 0.8)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, h, barW / 2);
        ctx.fill();
      });

      raf.current = requestAnimationFrame(draw);
    };

    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [active]);

  return (
    <canvas
      ref={canvas}
      width={300}
      height={36}
      style={{ width: '100%', height: '36px', display: 'block' }}
    />
  );
}
