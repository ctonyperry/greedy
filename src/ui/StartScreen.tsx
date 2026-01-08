import { useState } from 'react';
import { motion } from 'framer-motion';
import { ENTRY_THRESHOLD, TARGET_SCORE } from '../engine/constants.js';

export interface PlayerConfig {
  name: string;
  isAI: boolean;
  aiStrategy: string;
}

interface StartScreenProps {
  onStart: (players: PlayerConfig[]) => void;
}

const AI_STRATEGIES = [
  { id: 'conservative', name: 'Conservative', desc: 'Plays it safe, banks early' },
  { id: 'balanced', name: 'Balanced', desc: 'Weighs risk vs reward' },
  { id: 'aggressive', name: 'Aggressive', desc: 'Pushes for big scores' },
  { id: 'chaos', name: 'Chaos', desc: 'Unpredictable decisions' },
];

const MAX_PLAYERS = 12;

// Generate default players for up to 12
function createDefaultPlayers(): PlayerConfig[] {
  const strategies = ['balanced', 'aggressive', 'conservative', 'chaos'];
  return [
    { name: 'You', isAI: false, aiStrategy: 'balanced' },
    ...Array.from({ length: MAX_PLAYERS - 1 }, (_, i) => ({
      name: `CPU ${i + 1}`,
      isAI: true,
      aiStrategy: strategies[i % strategies.length],
    })),
  ];
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState<PlayerConfig[]>(createDefaultPlayers);

  const updatePlayer = (index: number, updates: Partial<PlayerConfig>) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], ...updates };
    setPlayers(newPlayers);
  };

  const handleStart = () => {
    onStart(players.slice(0, playerCount));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32,
        padding: 40,
        maxWidth: 500,
        margin: '0 auto',
      }}
    >
      <motion.h1
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        style={{
          fontSize: 64,
          margin: 0,
          background: 'linear-gradient(135deg, #4ade80, #3b82f6, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        GREEDY
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          fontSize: 18,
          opacity: 0.7,
          textAlign: 'center',
          maxWidth: 400,
        }}
      >
        A fast, high-risk dice game. Push your luck to build large scores, but beware—one bad roll can wipe out everything!
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          width: '100%',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 16,
          padding: 24,
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14, opacity: 0.8 }}>
            Number of Players
          </label>
          <select
            value={playerCount}
            onChange={(e) => setPlayerCount(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 16,
              fontWeight: 'bold',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: '2px solid rgba(74, 222, 128, 0.3)',
              borderRadius: 8,
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234ade80' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 16px center',
            }}
          >
            {Array.from({ length: MAX_PLAYERS - 1 }, (_, i) => i + 2).map((count) => (
              <option key={count} value={count} style={{ background: '#1a1a2e', color: '#fff' }}>
                {count} Players
              </option>
            ))}
          </select>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxHeight: 400,
          overflowY: 'auto',
          paddingRight: 8,
        }}>
          {Array.from({ length: playerCount }).map((_, index) => (
            <div
              key={index}
              style={{
                padding: 14,
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 12,
                border: players[index].isAI
                  ? '2px solid rgba(139, 92, 246, 0.3)'
                  : '2px solid rgba(74, 222, 128, 0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 12, opacity: 0.6, minWidth: 60 }}>
                  Player {index + 1}
                </span>
                <button
                  onClick={() => updatePlayer(index, { isAI: false })}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 'bold',
                    background: !players[index].isAI ? '#4ade80' : 'rgba(255, 255, 255, 0.1)',
                    color: !players[index].isAI ? '#1a1a2e' : '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Human
                </button>
                <button
                  onClick={() => updatePlayer(index, { isAI: true })}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 'bold',
                    background: players[index].isAI ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  AI
                </button>
              </div>

              <input
                type="text"
                value={players[index].name}
                onChange={(e) => updatePlayer(index, { name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: 16,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  color: '#fff',
                  outline: 'none',
                  marginBottom: players[index].isAI ? 12 : 0,
                }}
              />

              {players[index].isAI && (
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 11, opacity: 0.5 }}>
                    AI Strategy
                  </label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {AI_STRATEGIES.map((strategy) => (
                      <button
                        key={strategy.id}
                        onClick={() => updatePlayer(index, { aiStrategy: strategy.id })}
                        title={strategy.desc}
                        style={{
                          padding: '6px 10px',
                          fontSize: 11,
                          background:
                            players[index].aiStrategy === strategy.id
                              ? '#8b5cf6'
                              : 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        {strategy.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      <motion.button
        onClick={handleStart}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{
          padding: '18px 64px',
          fontSize: 20,
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          color: '#fff',
          border: 'none',
          borderRadius: 16,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
        }}
      >
        Start Game
      </motion.button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{
          fontSize: 12,
          opacity: 0.4,
          textAlign: 'center',
        }}
      >
        First to {TARGET_SCORE.toLocaleString()} wins. Score {ENTRY_THRESHOLD}+ in one turn to get on the board.
      </motion.div>
    </motion.div>
  );
}
