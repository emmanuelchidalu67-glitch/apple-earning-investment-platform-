import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Flame } from 'lucide-react';

interface FloatingLuckySpinButtonProps {
  onOpenLuckyWheel: () => void;
}

export const FloatingLuckySpinButton: React.FC<FloatingLuckySpinButtonProps> = ({
  onOpenLuckyWheel,
}) => {
  const { user } = useApp();

  // Side-docked position: side is 'right' or 'left', y is vertical position (in px)
  const [side, setSide] = useState<'right' | 'left'>('right');
  const [posY, setPosY] = useState<number>(() => {
    const saved = localStorage.getItem('aci_wheel_y');
    if (saved) {
      const parsed = Number(saved);
      if (!isNaN(parsed) && parsed > 60) return parsed;
    }
    return typeof window !== 'undefined' ? Math.max(100, window.innerHeight - 180) : 500;
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startY: number; startPosY: number }>({
    startY: 0,
    startPosY: 0,
  });
  const hasMovedRef = useRef(false);

  // Keep within vertical bounds on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosY((prev) => Math.min(Math.max(70, prev), window.innerHeight - 130));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = {
      startY: e.clientY,
      startPosY: posY,
    };
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaY = e.clientY - dragStartRef.current.startY;
    const deltaX = e.clientX;

    if (Math.abs(deltaY) > 5) {
      hasMovedRef.current = true;
    }

    // Check if dragged toward left or right edge
    if (deltaX < window.innerWidth / 2) {
      setSide('left');
    } else {
      setSide('right');
    }

    // Only allow vertical movement along the side edges
    const newY = Math.min(
      Math.max(70, dragStartRef.current.startPosY + deltaY),
      window.innerHeight - 130
    );
    setPosY(newY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    localStorage.setItem('aci_wheel_y', posY.toString());

    // If it was just a tap without dragging, open lucky spin modal
    if (!hasMovedRef.current) {
      onOpenLuckyWheel();
    }
  };

  const spinTickets = user?.spinBalance || 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: `${posY}px`,
        ...(side === 'right' ? { right: '12px' } : { left: '12px' }),
        zIndex: 45,
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="cursor-grab active:cursor-grabbing select-none"
      title="Lucky Spin (Side movable - drag up/down)"
    >
      {/* Small, clean, normal icon without heavy decorations */}
      <div className="relative w-10 h-10 rounded-full bg-slate-900 border border-sky-400/80 shadow-md flex items-center justify-center hover:bg-slate-800 transition">
        {/* Simple wheel / spin icon */}
        <Flame className="w-5 h-5 text-amber-400" />

        {/* Small ticket indicator if user has spins */}
        {spinTickets > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-pink-500 text-[9px] font-black text-white flex items-center justify-center">
            {spinTickets}
          </span>
        )}
      </div>
    </div>
  );
};
