import { useRef, useEffect } from 'react';

/* 
  Pure canvas-based 3D ring animation — no Three.js dependency.
  Renders multiple tilted ellipses with glowing particles to simulate
  the orbiting ring aesthetic on an AMOLED black background.
*/

export default function SceneBackground3D() {
  const canvasRef = useRef(null);
  const raf = useRef(null);
  const scrollY = useRef(0);
  const t = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onScroll = () => { scrollY.current = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Ring definitions
    const rings = [
      { rx: 0.42, ry: 0.12, tilt: 0.4,  speed: 0.28, color: 'rgba(61,186,96,',   alpha: 0.22, lineW: 1.2  },
      { rx: 0.30, ry: 0.08, tilt: -0.5, speed: 0.40, color: 'rgba(46,168,85,',   alpha: 0.20, lineW: 1.0  },
      { rx: 0.20, ry: 0.055,tilt: 1.0,  speed: 0.55, color: 'rgba(76,204,114,',  alpha: 0.25, lineW: 0.9  },
      { rx: 0.13, ry: 0.035,tilt: 0.2,  speed: 0.80, color: 'rgba(94,234,160,',  alpha: 0.30, lineW: 1.5  },
      { rx: 0.50, ry: 0.06, tilt: 0.6,  speed: 0.18, color: 'rgba(26,122,64,',   alpha: 0.18, lineW: 0.7  },
      { rx: 0.24, ry: 0.065,tilt: -0.8, speed: 0.35, color: 'rgba(46,168,85,',   alpha: 0.18, lineW: 0.7  },
    ];

    // Particles
    const particles = Array.from({ length: 180 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.2 + 0.3,
      speed: Math.random() * 0.0002 + 0.00005,
      opacity: Math.random() * 0.4 + 0.1,
    }));

    const draw = () => {
      t.current += 0.008;
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H * 0.42 + scrollY.current * 0.08;

      ctx.clearRect(0, 0, W, H);

      // Very subtle radial background glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.5);
      grad.addColorStop(0, 'rgba(10,30,18,0.35)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Draw particles
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < 0) { p.y = 1; p.x = Math.random(); }
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(61,186,96,${p.opacity})`;
        ctx.fill();
      });

      // Draw rings
      rings.forEach((ring) => {
        const angle = t.current * ring.speed;
        const rx = ring.rx * W;
        const ry = ring.ry * W;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ring.tilt + Math.sin(t.current * ring.speed * 0.4) * 0.06);

        // Main ellipse
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `${ring.color}${ring.alpha})`;
        ctx.lineWidth = ring.lineW;
        ctx.stroke();

        // Bright moving dot on the ring
        const dotX = Math.cos(angle) * rx;
        const dotY = Math.sin(angle) * ry;
        const dotGrad = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 6);
        dotGrad.addColorStop(0, `${ring.color}0.9)`);
        dotGrad.addColorStop(1, `${ring.color}0)`);
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = dotGrad;
        ctx.fill();

        // Trailing glow arc
        ctx.beginPath();
        const trailStart = angle - 0.6;
        const trailEnd = angle;
        for (let a = trailStart; a <= trailEnd; a += 0.02) {
          const x = Math.cos(a) * rx;
          const y = Math.sin(a) * ry;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `${ring.color}${ring.alpha * 1.8})`;
        ctx.lineWidth = ring.lineW * 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.restore();
      });

      raf.current = requestAnimationFrame(draw);
    };

    raf.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.85,
      }}
    />
  );
}
