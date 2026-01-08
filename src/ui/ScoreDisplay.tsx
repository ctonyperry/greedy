import { motion, AnimatePresence } from 'framer-motion';
import type { TurnState } from '../types/index.js';
import { ENTRY_THRESHOLD, TARGET_SCORE } from '../engine/constants.js';

interface ScoreDisplayProps {
  turnState: TurnState;
  isOnBoard: boolean;
  playerScore: number;
}

export function ScoreDisplay({ turnState, isOnBoard, playerScore }: ScoreDisplayProps) {
  const ownScore = turnState.turnScore - turnState.carryoverPoints;
  const needsEntry = !isOnBoard;
  const entryProgress = needsEntry ? Math.min(100, (ownScore / ENTRY_THRESHOLD) * 100) : 100;
  const targetProgress = Math.min(100, (playerScore / TARGET_SCORE) * 100);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 20,
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.6)' }}>Turn Score</span>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={turnState.turnScore}
            initial={{ scale: 1.5, color: '#4ade80' }}
            animate={{ scale: 1, color: '#fff' }}
            style={{ fontSize: 32, fontWeight: 'bold' }}
          >
            {turnState.turnScore.toLocaleString()}
          </motion.span>
        </AnimatePresence>
      </div>

      {turnState.carryoverPoints > 0 && (
        <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)' }}>
          Includes {turnState.carryoverPoints.toLocaleString()} from carryover
        </div>
      )}

      {needsEntry && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
              Entry Progress (need {ENTRY_THRESHOLD} own points)
            </span>
            <span style={{ fontSize: 12, color: entryProgress >= 100 ? '#4ade80' : '#fff' }}>
              {ownScore} / {ENTRY_THRESHOLD}
            </span>
          </div>
          <div
            style={{
              height: 8,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${entryProgress}%` }}
              style={{
                height: '100%',
                background: entryProgress >= 100 ? '#4ade80' : '#f59e0b',
                borderRadius: 4,
              }}
            />
          </div>
        </div>
      )}

      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
            Total Score
          </span>
          <span style={{ fontSize: 14, fontWeight: 'bold' }}>
            {playerScore.toLocaleString()} / {TARGET_SCORE.toLocaleString()}
          </span>
        </div>
        <div
          style={{
            height: 6,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${targetProgress}%` }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              borderRadius: 3,
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{turnState.diceRemaining}</div>
          <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.5)' }}>Dice Left</div>
        </div>
      </div>
    </div>
  );
}
