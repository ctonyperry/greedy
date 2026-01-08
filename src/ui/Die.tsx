import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { DieValue } from '../types/index.js';

interface DieProps {
  value: DieValue;
  selected?: boolean;
  disabled?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  rolling?: boolean;
}

const dieFaces: Record<DieValue, ReactNode> = {
  1: (
    <div className="die-face">
      <span className="pip center" />
    </div>
  ),
  2: (
    <div className="die-face">
      <span className="pip top-right" />
      <span className="pip bottom-left" />
    </div>
  ),
  3: (
    <div className="die-face">
      <span className="pip top-right" />
      <span className="pip center" />
      <span className="pip bottom-left" />
    </div>
  ),
  4: (
    <div className="die-face">
      <span className="pip top-left" />
      <span className="pip top-right" />
      <span className="pip bottom-left" />
      <span className="pip bottom-right" />
    </div>
  ),
  5: (
    <div className="die-face">
      <span className="pip top-left" />
      <span className="pip top-right" />
      <span className="pip center" />
      <span className="pip bottom-left" />
      <span className="pip bottom-right" />
    </div>
  ),
  6: (
    <div className="die-face">
      <span className="pip top-left" />
      <span className="pip top-right" />
      <span className="pip middle-left" />
      <span className="pip middle-right" />
      <span className="pip bottom-left" />
      <span className="pip bottom-right" />
    </div>
  ),
};

export function Die({ value, selected, disabled, dimmed, onClick, rolling }: DieProps) {
  return (
    <motion.button
      className={`die ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''} ${dimmed ? 'dimmed' : ''}`}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      animate={
        rolling
          ? {
              rotateX: [0, 360, 720],
              rotateY: [0, 360, 720],
            }
          : { rotateX: 0, rotateY: 0 }
      }
      transition={
        rolling
          ? { duration: 0.5, ease: 'easeOut' }
          : { duration: 0.2 }
      }
      style={{
        width: 60,
        height: 60,
        background: dimmed ? 'rgba(255, 255, 255, 0.15)' : selected ? '#4ade80' : '#fff',
        border: dimmed ? '2px dashed rgba(255, 255, 255, 0.3)' : 'none',
        borderRadius: 8,
        cursor: disabled ? 'default' : 'pointer',
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
        boxShadow: dimmed
          ? 'none'
          : selected
          ? '0 0 20px rgba(74, 222, 128, 0.5)'
          : '0 4px 12px rgba(0, 0, 0, 0.3)',
        opacity: disabled && !dimmed ? 0.5 : 1,
      }}
    >
      {dieFaces[value]}
      <style>{`
        .die-face {
          width: 50px;
          height: 50px;
          position: relative;
        }
        .pip {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #1a1a2e;
          border-radius: 50%;
        }
        .center { top: 50%; left: 50%; transform: translate(-50%, -50%); }
        .top-left { top: 6px; left: 6px; }
        .top-right { top: 6px; right: 6px; }
        .middle-left { top: 50%; left: 6px; transform: translateY(-50%); }
        .middle-right { top: 50%; right: 6px; transform: translateY(-50%); }
        .bottom-left { bottom: 6px; left: 6px; }
        .bottom-right { bottom: 6px; right: 6px; }
        .die.selected .pip { background: #1a1a2e; }
        .die.dimmed .pip { background: rgba(255, 255, 255, 0.4); }
      `}</style>
    </motion.button>
  );
}
