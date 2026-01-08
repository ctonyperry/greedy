import { motion } from 'framer-motion';
import type { PlayerState } from '../types/index.js';

interface PlayerListProps {
  players: PlayerState[];
  currentPlayerIndex: number;
  isFinalRound: boolean;
}

export function PlayerList({ players, currentPlayerIndex, isFinalRound }: PlayerListProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 16,
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}>
        <span style={{ fontSize: 14, fontWeight: 'bold' }}>Players</span>
        {isFinalRound && (
          <span style={{
            fontSize: 11,
            padding: '2px 8px',
            background: '#ef4444',
            borderRadius: 4,
            fontWeight: 'bold',
          }}>
            FINAL ROUND
          </span>
        )}
      </div>

      {players.map((player, index) => (
        <motion.div
          key={player.id}
          animate={{
            scale: index === currentPlayerIndex ? 1 : 0.95,
            opacity: index === currentPlayerIndex ? 1 : 0.7,
          }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 12px',
            background: index === currentPlayerIndex
              ? 'rgba(74, 222, 128, 0.2)'
              : 'rgba(255, 255, 255, 0.03)',
            borderRadius: 8,
            border: index === currentPlayerIndex
              ? '2px solid rgba(74, 222, 128, 0.5)'
              : '2px solid transparent',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: index === currentPlayerIndex ? 'bold' : 'normal' }}>
              {player.name}
            </span>
            {player.isAI && (
              <span style={{
                fontSize: 10,
                padding: '1px 4px',
                background: 'rgba(139, 92, 246, 0.3)',
                borderRadius: 3,
              }}>
                AI
              </span>
            )}
            {!player.isOnBoard && (
              <span style={{
                fontSize: 10,
                padding: '1px 4px',
                background: 'rgba(251, 191, 36, 0.3)',
                borderRadius: 3,
              }}>
                Not on board
              </span>
            )}
          </div>
          <span style={{ fontWeight: 'bold', fontSize: 16 }}>
            {player.score.toLocaleString()}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
