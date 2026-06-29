import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const dot = useRef(null);
  const ring = useRef(null);
  const pos = useRef({ x: -100, y: -100 });
  const rPos = useRef({ x: -100, y: -100 });
  const raf = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (dot.current) {
        dot.current.style.left = `${e.clientX}px`;
        dot.current.style.top = `${e.clientY}px`;
      }
    };

    const animate = () => {
      rPos.current.x += (pos.current.x - rPos.current.x) * 0.12;
      rPos.current.y += (pos.current.y - rPos.current.y) * 0.12;
      if (ring.current) {
        ring.current.style.left = `${rPos.current.x}px`;
        ring.current.style.top = `${rPos.current.y}px`;
      }
      raf.current = requestAnimationFrame(animate);
    };

    const onEnter = (e) => {
      const t = e.target;
      if (
        t.tagName === 'BUTTON' ||
        t.tagName === 'A' ||
        t.classList.contains('chip') ||
        t.classList.contains('rec-card') ||
        t.classList.contains('engine-card') ||
        t.classList.contains('nav-link') ||
        t.closest('button') ||
        t.closest('a')
      ) {
        ring.current?.classList.add('hover');
        dot.current && (dot.current.style.transform = 'translate(-50%, -50%) scale(0)');
      }
    };
    const onLeave = () => {
      ring.current?.classList.remove('hover');
      dot.current && (dot.current.style.transform = 'translate(-50%, -50%) scale(1)');
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onEnter);
    document.addEventListener('mouseout', onLeave);
    raf.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onEnter);
      document.removeEventListener('mouseout', onLeave);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <>
      <div className="cursor-dot" ref={dot} />
      <div className="cursor-ring" ref={ring} />
    </>
  );
}
