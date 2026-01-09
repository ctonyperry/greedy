import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { StartScreen } from './ui/StartScreen.js';
import type { PlayerConfig } from './ui/StartScreen.js';
import { GameBoard } from './ui/GameBoard.js';
import { GameOver } from './ui/GameOver.js';
import { DebugFooter } from './ui/DebugFooter.js';
import { HelpPanel } from './ui/HelpPanel.js';
import { createGameState } from './engine/game.js';
import { gameLogger } from './debug/GameLogger.js';
import { useI18n } from './i18n/index.js';
import type { GameState } from './types/index.js';
import './styles/design-system.css';

type Screen = 'start' | 'game' | 'gameover';

/**
 * App - Root component with screen management
 *
 * Features:
 * - Responsive header with accessible controls
 * - Hint mode toggle for new players
 * - Language switcher (English/Portuguese)
 * - Smooth screen transitions
 */
export function App() {
  const { t } = useI18n();
  const [screen, setScreen] = useState<Screen>('start');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const handleStart = useCallback((players: PlayerConfig[]) => {
    gameLogger.reset();
    gameLogger.gameStart(players.map(p => ({
      name: p.name,
      isAI: p.isAI,
      aiStrategy: p.aiStrategy,
    })));
    const newGame = createGameState(players);
    setGameState(newGame);
    setScreen('game');
  }, []);

  const handleGameStateChange = useCallback((newState: GameState) => {
    setGameState(newState);
    if (newState.isGameOver) {
      const winner = newState.players.reduce((a, b) => a.score > b.score ? a : b);
      gameLogger.gameEnd(
        winner.name,
        newState.players.map(p => ({ name: p.name, score: p.score }))
      );
      setTimeout(() => setScreen('gameover'), 500);
    }
  }, []);

  const handleNewGame = useCallback(() => {
    setGameState(null);
    setScreen('start');
  }, []);

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: 'var(--space-2) var(--space-3)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.2)',
          minHeight: 'var(--header-height)',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-bold)',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {t('appTitle')}
        </h1>

        {/* Header actions */}
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            onClick={() => setShowHelp(true)}
            className="btn btn-ghost btn-sm"
            style={{ minHeight: 44, fontSize: 'var(--font-size-lg)' }}
            aria-label={t('howToPlay')}
          >
            ?
          </button>
          {screen !== 'start' && (
            <button
              onClick={handleNewGame}
              className="btn btn-ghost btn-sm"
              style={{ minHeight: 44 }}
            >
              {t('newGame')}
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        <AnimatePresence mode="wait">
          {screen === 'start' && (
            <motion.div
              key="start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ minHeight: '100%' }}
            >
              <StartScreen onStart={handleStart} />
            </motion.div>
          )}

          {screen === 'game' && gameState && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GameBoard
                gameState={gameState}
                onGameStateChange={handleGameStateChange}
                showHints
              />
            </motion.div>
          )}

          {screen === 'gameover' && gameState && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GameOver gameState={gameState} onNewGame={handleNewGame} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <DebugFooter />

      {/* Help panel */}
      <AnimatePresence>
        {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
      </AnimatePresence>
    </div>
  );
}
