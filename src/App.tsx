import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { StartScreen } from './ui/StartScreen.js';
import type { PlayerConfig } from './ui/StartScreen.js';
import { GameBoard } from './ui/GameBoard.js';
import { GameOver } from './ui/GameOver.js';
import { DebugFooter } from './ui/DebugFooter.js';
import { createGameState } from './engine/game.js';
import { gameLogger } from './debug/GameLogger.js';
import type { GameState } from './types/index.js';

type Screen = 'start' | 'game' | 'gameover';

export function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [gameState, setGameState] = useState<GameState | null>(null);

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
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #4ade80, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          GREEDY
        </h1>
        {screen !== 'start' && (
          <button
            onClick={handleNewGame}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            New Game
          </button>
        )}
      </header>

      <main style={{ flex: 1, padding: '24px 0' }}>
        <AnimatePresence mode="wait">
          {screen === 'start' && (
            <motion.div
              key="start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
    </div>
  );
}
