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
  { id: 'conservative', name: 'Safe', desc: 'Banks early, avoids risk' },
  { id: 'balanced', name: 'Balanced', desc: 'Smart risk/reward decisions' },
  { id: 'aggressive', name: 'Risky', desc: 'Pushes for big scores' },
  { id: 'chaos', name: 'Wild', desc: 'Completely unpredictable' },
];

const MAX_PLAYERS = 12;

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

/**
 * StartScreen - Game setup with player configuration
 *
 * Mobile-first design with:
 * - Large touch targets for all controls
 * - Clear player type toggles
 * - Accessible form elements
 * - Quick start option for returning players
 */
export function StartScreen({ onStart }: StartScreenProps) {
  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState<PlayerConfig[]>(createDefaultPlayers);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updatePlayer = (index: number, updates: Partial<PlayerConfig>) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], ...updates };
    setPlayers(newPlayers);
  };

  const handleStart = () => {
    onStart(players.slice(0, playerCount));
  };

  const handleQuickStart = () => {
    // Quick 2-player game: You vs AI
    onStart([
      { name: 'You', isAI: false, aiStrategy: 'balanced' },
      { name: 'CPU', isAI: true, aiStrategy: 'balanced' },
    ]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-6)',
        padding: 'var(--space-5)',
        maxWidth: 500,
        margin: '0 auto',
        minHeight: '100%',
      }}
    >
      {/* Logo */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{ textAlign: 'center' }}
      >
        <h1
          style={{
            fontSize: 'var(--font-size-4xl)',
            fontWeight: 'var(--font-weight-bold)',
            margin: 0,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary), var(--color-accent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          GREEDY
        </h1>
        <p
          style={{
            fontSize: 'var(--font-size-lg)',
            color: 'var(--color-text-secondary)',
            marginTop: 'var(--space-2)',
          }}
        >
          A dice game of risk and reward
        </p>
      </motion.div>

      {/* Quick Start */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ width: '100%' }}
      >
        <button
          onClick={handleQuickStart}
          className="btn btn-primary btn-xl"
          style={{ width: '100%' }}
        >
          Quick Start (vs AI)
        </button>
      </motion.div>

      {/* Divider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)',
          width: '100%',
          color: 'var(--color-text-tertiary)',
        }}
      >
        <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
        <span style={{ fontSize: 'var(--font-size-sm)' }}>or customize</span>
        <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
      </div>

      {/* Player Count */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          width: '100%',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-4)',
        }}
      >
        <label
          htmlFor="player-count"
          style={{
            display: 'block',
            marginBottom: 'var(--space-2)',
            fontSize: 'var(--font-size-base)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Number of Players
        </label>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {[2, 3, 4, 5, 6].map((count) => (
            <button
              key={count}
              onClick={() => setPlayerCount(count)}
              className={`btn ${playerCount === count ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                minWidth: 48,
                minHeight: 48,
                flex: 1,
              }}
              aria-pressed={playerCount === count}
            >
              {count}
            </button>
          ))}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="btn btn-ghost"
            style={{ minWidth: 48, minHeight: 48 }}
            aria-expanded={showAdvanced}
          >
            {showAdvanced ? '−' : '+'}
          </button>
        </div>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            style={{ marginTop: 'var(--space-3)', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {[7, 8, 9, 10, 11, 12].map((count) => (
                <button
                  key={count}
                  onClick={() => setPlayerCount(count)}
                  className={`btn ${playerCount === count ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ minWidth: 48, minHeight: 48, flex: 1 }}
                  aria-pressed={playerCount === count}
                >
                  {count}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Player Configuration */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          maxHeight: 400,
          overflowY: 'auto',
          paddingRight: 'var(--space-2)',
        }}
      >
        {Array.from({ length: playerCount }).map((_, index) => (
          <PlayerCard
            key={index}
            index={index}
            player={players[index]}
            onUpdate={(updates) => updatePlayer(index, updates)}
          />
        ))}
      </motion.div>

      {/* Start Button */}
      <motion.button
        onClick={handleStart}
        className="btn btn-secondary btn-xl"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ width: '100%' }}
      >
        Start Game
      </motion.button>

      {/* Game Info */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
        }}
      >
        First to {TARGET_SCORE.toLocaleString()} wins.
        Score {ENTRY_THRESHOLD}+ in one turn to get on the board.
      </motion.p>
    </motion.div>
  );
}

interface PlayerCardProps {
  index: number;
  player: PlayerConfig;
  onUpdate: (updates: Partial<PlayerConfig>) => void;
}

function PlayerCard({ index, player, onUpdate }: PlayerCardProps) {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        border: player.isAI
          ? '2px solid var(--color-accent)'
          : '2px solid var(--color-primary)',
      }}
    >
      {/* Player type toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-3)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-tertiary)',
            minWidth: 70,
          }}
        >
          Player {index + 1}
        </span>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flex: 1 }}>
          <button
            onClick={() => onUpdate({ isAI: false })}
            className={`btn ${!player.isAI ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            style={{ flex: 1, minHeight: 44 }}
            aria-pressed={!player.isAI}
          >
            Human
          </button>
          <button
            onClick={() => onUpdate({ isAI: true })}
            className={`btn ${player.isAI ? 'btn-accent' : 'btn-ghost'} btn-sm`}
            style={{ flex: 1, minHeight: 44 }}
            aria-pressed={player.isAI}
          >
            AI
          </button>
        </div>
      </div>

      {/* Name input */}
      <input
        type="text"
        value={player.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="Enter name"
        aria-label={`Player ${index + 1} name`}
        style={{
          width: '100%',
          padding: 'var(--space-3)',
          fontSize: 'var(--font-size-base)',
          background: 'var(--color-surface-hover)',
          border: '2px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--color-text-primary)',
          outline: 'none',
          minHeight: 48,
        }}
      />

      {/* AI Strategy */}
      {player.isAI && (
        <div style={{ marginTop: 'var(--space-3)' }}>
          <span
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-tertiary)',
              display: 'block',
              marginBottom: 'var(--space-2)',
            }}
          >
            AI Personality
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {AI_STRATEGIES.map((strategy) => (
              <button
                key={strategy.id}
                onClick={() => onUpdate({ aiStrategy: strategy.id })}
                className={`btn ${player.aiStrategy === strategy.id ? 'btn-accent' : 'btn-ghost'} btn-sm`}
                style={{ minHeight: 44, flex: '1 1 45%' }}
                title={strategy.desc}
                aria-pressed={player.aiStrategy === strategy.id}
              >
                {strategy.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
