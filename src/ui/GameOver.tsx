import { motion } from 'framer-motion';
import type { GameState } from '../types/index.js';
import { getWinner } from '../engine/game.js';

interface GameOverProps {
  gameState: GameState;
  onNewGame: () => void;
}

export function GameOver({ gameState, onNewGame }: GameOverProps) {
  const winner = getWinner(gameState);

  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        padding: 40,
        maxWidth: 500,
        margin: '0 auto',
      }}
    >
      <motion.h1
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        style={{
          fontSize: 48,
          margin: 0,
          background: 'linear-gradient(135deg, #4ade80, #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Game Over!
      </motion.h1>

      {winner && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.3 }}
          style={{
            padding: 24,
            background: 'rgba(74, 222, 128, 0.2)',
            borderRadius: 16,
            textAlign: 'center',
            border: '2px solid rgba(74, 222, 128, 0.5)',
          }}
        >
          <div style={{ fontSize: 18, opacity: 0.8, marginBottom: 8 }}>Winner</div>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>{winner.name}</div>
          <div style={{ fontSize: 24, marginTop: 8 }}>
            {winner.score.toLocaleString()} points
          </div>
        </motion.div>
      )}

      <div
        style={{
          width: '100%',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 16,
          padding: 20,
        }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: 16, opacity: 0.8 }}>Final Standings</h3>
        {sortedPlayers.map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: index === 0 ? 'rgba(74, 222, 128, 0.1)' : 'transparent',
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background:
                    index === 0
                      ? '#fbbf24'
                      : index === 1
                      ? '#94a3b8'
                      : index === 2
                      ? '#b45309'
                      : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  fontWeight: 'bold',
                  fontSize: 14,
                }}
              >
                {index + 1}
              </span>
              <span style={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>
                {player.name}
              </span>
            </div>
            <span style={{ fontWeight: 'bold' }}>{player.score.toLocaleString()}</span>
          </motion.div>
        ))}
      </div>

      <motion.button
        onClick={onNewGame}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          padding: '16px 48px',
          fontSize: 18,
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
        }}
      >
        New Game
      </motion.button>
    </motion.div>
  );
}
