import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface HelpPanelProps {
  onClose: () => void;
}

/**
 * HelpPanel - Modal overlay with game rules and scoring guide
 *
 * Designed for Maya (8 years old) but useful for all players:
 * - Large, readable text
 * - Visual examples where possible
 * - Organized by topic
 * - Easy to dismiss
 */
export function HelpPanel({ onClose }: HelpPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus management for accessibility
  useEffect(() => {
    const panel = panelRef.current;
    if (panel) {
      panel.focus();
    }

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        zIndex: 'var(--z-modal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
    >
      <motion.div
        ref={panelRef}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        style={{
          background: 'var(--color-background)',
          borderRadius: 'var(--radius-2xl)',
          border: '1px solid var(--color-border-strong)',
          maxWidth: 600,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--color-border)',
            position: 'sticky',
            top: 0,
            background: 'var(--color-background)',
            zIndex: 1,
          }}
        >
          <h2
            id="help-title"
            style={{
              margin: 0,
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-bold)',
            }}
          >
            How to Play Greedy
          </h2>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            aria-label="Close help"
            style={{
              fontSize: 'var(--font-size-xl)',
              minWidth: 44,
              minHeight: 44,
              padding: 0,
            }}
          >
            ×
          </button>
        </header>

        {/* Content */}
        <div
          style={{
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-5)',
          }}
        >
          {/* Goal */}
          <section>
            <h3 style={sectionTitleStyle}>Goal</h3>
            <p style={paragraphStyle}>
              Be the first player to reach <strong>10,000 points</strong>!
            </p>
          </section>

          {/* Basic Rules */}
          <section>
            <h3 style={sectionTitleStyle}>How to Play</h3>
            <ol style={{ ...paragraphStyle, paddingLeft: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li><strong>Roll</strong> all 5 dice to start your turn</li>
              <li><strong>Keep</strong> any dice that score points (see scoring below)</li>
              <li><strong>Choose:</strong> Roll the remaining dice for more points, or bank what you have</li>
              <li>If you roll and get NO scoring dice, you <strong>BUST</strong> and lose all points from this turn!</li>
            </ol>
          </section>

          {/* Getting On Board */}
          <section>
            <h3 style={sectionTitleStyle}>Getting On Board</h3>
            <p style={paragraphStyle}>
              Your first scoring turn must be worth at least <strong>650 points</strong> to "get on the board."
              Until then, any points you bank don't count!
            </p>
          </section>

          {/* Scoring */}
          <section>
            <h3 style={sectionTitleStyle}>Scoring</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 'var(--space-2)',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
              }}
            >
              <ScoreRow label="Single 1" points={100} />
              <ScoreRow label="Single 5" points={50} />
              <ScoreRow label="Three 1s" points={1000} highlight />
              <ScoreRow label="Three 2s" points={200} />
              <ScoreRow label="Three 3s" points={300} />
              <ScoreRow label="Three 4s" points={400} />
              <ScoreRow label="Three 5s" points={500} />
              <ScoreRow label="Three 6s" points={600} />
              <ScoreRow label="Four of a kind" points="2× triple" />
              <ScoreRow label="Five of a kind" points="4× triple" />
              <ScoreRow label="Small straight (4 in a row)" points={750} />
              <ScoreRow label="Large straight (5 in a row)" points={1500} highlight />
            </div>
          </section>

          {/* Hot Dice */}
          <section>
            <h3 style={sectionTitleStyle}>Hot Dice!</h3>
            <p style={paragraphStyle}>
              If you keep all 5 dice, you get <strong>5 fresh dice</strong> to roll again!
              Your points carry over - this is how you build huge scores.
            </p>
          </section>

          {/* Carryover */}
          <section>
            <h3 style={sectionTitleStyle}>Stealing Points</h3>
            <p style={paragraphStyle}>
              If someone banks with dice remaining, the next player can try to "steal" those points
              by continuing where they left off. But you must roll first - if you bust,
              you get nothing!
            </p>
          </section>

          {/* Tips */}
          <section>
            <h3 style={sectionTitleStyle}>Tips for New Players</h3>
            <ul style={{ ...paragraphStyle, paddingLeft: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li>Single 1s and 5s always score - they're your safety net</li>
              <li>The more dice you roll, the better your chance of scoring</li>
              <li>Bank often when you're close to 650 to get on the board</li>
              <li>Rolling with just 1 or 2 dice is very risky!</li>
              <li>Watch the other players' scores in the final round</li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <footer
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={onClose}
            className="btn btn-primary btn-lg"
            style={{ minWidth: 200 }}
          >
            Got it!
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 var(--space-2) 0',
  fontSize: 'var(--font-size-lg)',
  fontWeight: 'var(--font-weight-semibold)',
  color: 'var(--color-primary)',
};

const paragraphStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--font-size-base)',
  lineHeight: 'var(--line-height-relaxed)',
  color: 'var(--color-text-secondary)',
};

function ScoreRow({ label, points, highlight }: { label: string; points: number | string; highlight?: boolean }) {
  return (
    <>
      <span
        style={{
          fontSize: 'var(--font-size-base)',
          color: highlight ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          fontWeight: highlight ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 'var(--font-size-base)',
          fontWeight: 'var(--font-weight-bold)',
          color: highlight ? 'var(--color-primary)' : 'var(--color-text-primary)',
          textAlign: 'right',
        }}
      >
        {typeof points === 'number' ? points.toLocaleString() : points}
      </span>
    </>
  );
}
