import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiceRoll, TurnHistory, TurnHistoryEntry } from './DiceRoll.js';
import { ScoreDisplay } from './ScoreDisplay.js';
import { PlayerList } from './PlayerList.js';
import { ActionButtons } from './ActionButtons.js';
import { HelpPanel } from './HelpPanel.js';
import { TurnPhase } from '../types/index.js';
import type { GameState, Dice, DieValue } from '../types/index.js';
import { gameReducer, getCurrentPlayer } from '../engine/game.js';
import { canBank as checkCanBank } from '../engine/turn.js';
import { validateKeep } from '../engine/validation.js';
import { scoreSelection } from '../engine/scoring.js';
import { makeAIDecision, AI_STRATEGIES } from '../ai/strategies.js';
import { ENTRY_THRESHOLD } from '../engine/constants.js';
import { gameLogger } from '../debug/GameLogger.js';
import { useI18n } from '../i18n/index.js';

interface GameBoardProps {
  gameState: GameState;
  onGameStateChange: (state: GameState) => void;
  showHints?: boolean;
}

function rollDice(count: number): Dice {
  return Array.from({ length: count }, () =>
    (Math.floor(Math.random() * 6) + 1) as DieValue
  );
}

const EMPTY_DICE: Dice = [];

/**
 * GameBoard - Main game interface with responsive layout
 *
 * Layout strategy:
 * - Mobile (< 768px): Single column, stacked sections
 * - Tablet (768-1023px): Two columns with sidebar
 * - Desktop (1024px+): Comfortable spacing, optional turn history
 */
export function GameBoard({ gameState, onGameStateChange, showHints = false }: GameBoardProps) {
  const { t } = useI18n();
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [isAIActing, setIsAIActing] = useState(false);
  const [turnHistory, setTurnHistory] = useState<TurnHistoryEntry[]>([]);
  const [aiTrigger, setAiTrigger] = useState(0);
  const [currentTurnRolls, setCurrentTurnRolls] = useState<Dice[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  const prevTurnRef = useRef<{ playerIndex: number; keptDice: Dice; turnScore: number } | null>(null);
  const prevPlayerIndexRef = useRef<number>(gameState.currentPlayerIndex);

  const currentPlayer = getCurrentPlayer(gameState);
  const { turn } = gameState;
  const isAITurn = currentPlayer.isAI;

  const gameStateRef = useRef(gameState);
  const onGameStateChangeRef = useRef(onGameStateChange);
  useEffect(() => {
    gameStateRef.current = gameState;
    onGameStateChangeRef.current = onGameStateChange;
  }, [gameState, onGameStateChange]);

  // Track turn history
  useEffect(() => {
    const prev = prevTurnRef.current;
    if (prev !== null && prev.playerIndex !== gameState.currentPlayerIndex) {
      const prevPlayer = gameState.players[prev.playerIndex];
      const busted = prev.turnScore === 0;
      setTurnHistory(history => [
        ...history,
        {
          playerName: prevPlayer.name,
          dice: prev.keptDice,
          score: prev.turnScore,
          busted,
          isAI: prevPlayer.isAI,
        },
      ]);
    }
    prevTurnRef.current = {
      playerIndex: gameState.currentPlayerIndex,
      keptDice: [...turn.keptDice],
      turnScore: turn.turnScore,
    };
  }, [gameState.currentPlayerIndex, gameState.players, turn.keptDice, turn.turnScore]);

  // Reset rolls when player changes
  useEffect(() => {
    if (prevPlayerIndexRef.current !== gameState.currentPlayerIndex) {
      setCurrentTurnRolls([]);
      prevPlayerIndexRef.current = gameState.currentPlayerIndex;
    }
  }, [gameState.currentPlayerIndex]);

  // Track kept dice per roll
  const prevKeptDiceLengthRef = useRef(0);
  useEffect(() => {
    const currentLength = turn.keptDice.length;
    const prevLength = prevKeptDiceLengthRef.current;
    if (currentLength > prevLength) {
      const newlyKept = turn.keptDice.slice(prevLength);
      setCurrentTurnRolls(rolls => [...rolls, newlyKept]);
    } else if (currentLength === 0 && prevLength > 0) {
      setCurrentTurnRolls([]);
    }
    prevKeptDiceLengthRef.current = currentLength;
  }, [turn.keptDice]);

  // AI action timing
  const aiNextActionTimeRef = useRef(0);

  // AI turn handler
  useEffect(() => {
    if (!isAITurn || isRolling || gameState.isGameOver) return;

    const now = Date.now();
    const waitTime = aiNextActionTimeRef.current - now;
    if (waitTime > 0) {
      const waitTimeout = setTimeout(() => setAiTrigger(t => t + 1), waitTime + 50);
      return () => clearTimeout(waitTimeout);
    }

    const currentState = gameStateRef.current;
    const currentTurn = currentState.turn;
    const player = getCurrentPlayer(currentState);
    const strategyName = player.aiStrategy || 'balanced';
    const strategy = AI_STRATEGIES[strategyName];
    const decision = makeAIDecision(currentTurn, player.isOnBoard, strategy, strategyName);

    gameLogger.aiDecision(player.name, strategyName, currentTurn.phase, decision.action, {
      diceToKeep: decision.dice?.join(', '),
      currentRoll: currentTurn.currentRoll?.join(', '),
      turnScore: currentTurn.turnScore,
      diceRemaining: currentTurn.diceRemaining,
      isOnBoard: player.isOnBoard,
    });

    const thinkDelay = currentTurn.phase === TurnPhase.ROLLING || currentTurn.phase === TurnPhase.STEAL_REQUIRED ? 800 : 600;
    aiNextActionTimeRef.current = now + thinkDelay + 500;
    setIsAIActing(true);

    const thinkTimeout = setTimeout(() => {
      if (decision.action === 'ROLL') {
        setIsRolling(true);
        setTimeout(() => {
          const state = gameStateRef.current;
          const aiPlayer = getCurrentPlayer(state);
          const turnScoreBefore = state.turn.turnScore;
          const dice = rollDice(state.turn.diceRemaining);
          const newState = gameReducer(state, { type: 'ROLL', dice });
          const isBust = newState.turn.phase === TurnPhase.ENDED;

          gameLogger.roll(aiPlayer.name, true, dice.length, dice, isBust, turnScoreBefore);
          onGameStateChangeRef.current(newState);
          setIsRolling(false);
          setIsAIActing(false);

          if (isBust) {
            gameLogger.bust(aiPlayer.name, true, dice, turnScoreBefore);
            setTimeout(() => {
              gameLogger.turnEnd(aiPlayer.name, true, 0, aiPlayer.score, aiPlayer.isOnBoard, aiPlayer.isOnBoard);
              onGameStateChangeRef.current(gameReducer(newState, { type: 'END_TURN' }));
            }, 1500);
          }
        }, 500);
      } else if (decision.action === 'KEEP' && decision.dice) {
        const state = gameStateRef.current;
        const aiPlayer = getCurrentPlayer(state);
        const keepScore = scoreSelection(decision.dice).score;
        const newState = gameReducer(state, { type: 'KEEP', dice: decision.dice });
        const isHotDice = newState.turn.diceRemaining === 5 && state.turn.diceRemaining !== 5;

        gameLogger.keep(aiPlayer.name, true, decision.dice, keepScore, newState.turn.turnScore, newState.turn.diceRemaining, isHotDice);

        const keepDelay = isHotDice ? 1500 : 1000;
        aiNextActionTimeRef.current = Date.now() + keepDelay;
        onGameStateChangeRef.current(newState);
        setIsAIActing(false);
      } else if (decision.action === 'BANK') {
        const state = gameStateRef.current;
        const aiPlayer = getCurrentPlayer(state);
        const createdCarryover = state.turn.diceRemaining > 0;
        const newTotalScore = aiPlayer.score + state.turn.turnScore;
        const wasOnBoard = aiPlayer.isOnBoard;
        const isNowOnBoard = wasOnBoard || newTotalScore >= ENTRY_THRESHOLD;

        let newState = gameReducer(state, { type: 'BANK' });
        gameLogger.bank(aiPlayer.name, true, state.turn.turnScore, newTotalScore, state.turn.diceRemaining, createdCarryover);
        gameLogger.turnEnd(aiPlayer.name, true, state.turn.turnScore, newTotalScore, wasOnBoard, isNowOnBoard);

        newState = gameReducer(newState, { type: 'END_TURN' });
        onGameStateChangeRef.current(newState);
        setIsAIActing(false);
      } else if (decision.action === 'DECLINE_CARRYOVER') {
        const state = gameStateRef.current;
        const newState = gameReducer(state, { type: 'DECLINE_CARRYOVER' });
        onGameStateChangeRef.current(newState);
        setIsAIActing(false);
      } else {
        setIsAIActing(false);
      }
    }, thinkDelay);

    return () => clearTimeout(thinkTimeout);
  }, [isAITurn, turn.phase, isRolling, isAIActing, aiTrigger, gameState.isGameOver, gameState.currentPlayerIndex]);

  const hasValidSelection = selectedIndices.length > 0 && turn.currentRoll !== null;
  const canRoll = !isRolling && (
    turn.phase === TurnPhase.ROLLING ||
    turn.phase === TurnPhase.DECIDING ||
    turn.phase === TurnPhase.STEAL_REQUIRED ||
    (turn.phase === TurnPhase.KEEPING && hasValidSelection)
  );

  const canBankNow = turn.phase === TurnPhase.DECIDING && checkCanBank(turn, currentPlayer.isOnBoard);

  const handleRoll = useCallback(() => {
    if (!canRoll) return;

    if (selectedIndices.length > 0 && turn.currentRoll) {
      const selectedDice = selectedIndices.map((i) => turn.currentRoll![i]);
      const validation = validateKeep(turn.currentRoll, selectedDice);

      if (!validation.valid) {
        alert(validation.error || 'Invalid selection');
        return;
      }

      const keepScore = scoreSelection(selectedDice).score;
      let newState = gameReducer(gameState, { type: 'KEEP', dice: selectedDice });
      const isHotDice = newState.turn.diceRemaining === 5 && turn.diceRemaining !== 5;

      gameLogger.keep(currentPlayer.name, false, selectedDice, keepScore, newState.turn.turnScore, newState.turn.diceRemaining, isHotDice);

      setIsRolling(true);
      setSelectedIndices([]);

      setTimeout(() => {
        const dice = rollDice(newState.turn.diceRemaining);
        const turnScoreBefore = newState.turn.turnScore;
        newState = gameReducer(newState, { type: 'ROLL', dice });
        const isBust = newState.turn.phase === TurnPhase.ENDED;

        gameLogger.roll(currentPlayer.name, false, dice.length, dice, isBust, turnScoreBefore);
        onGameStateChange(newState);
        setIsRolling(false);

        if (isBust) {
          gameLogger.bust(currentPlayer.name, false, dice, turnScoreBefore);
          setTimeout(() => {
            gameLogger.turnEnd(currentPlayer.name, false, 0, currentPlayer.score, currentPlayer.isOnBoard, currentPlayer.isOnBoard);
            onGameStateChange(gameReducer(newState, { type: 'END_TURN' }));
          }, 1500);
        }
      }, 500);
    } else {
      setIsRolling(true);
      setSelectedIndices([]);

      setTimeout(() => {
        const dice = rollDice(turn.diceRemaining);
        const turnScoreBefore = turn.turnScore;
        const newState = gameReducer(gameState, { type: 'ROLL', dice });
        const isBust = newState.turn.phase === TurnPhase.ENDED;

        gameLogger.roll(currentPlayer.name, false, dice.length, dice, isBust, turnScoreBefore);
        onGameStateChange(newState);
        setIsRolling(false);

        if (isBust) {
          gameLogger.bust(currentPlayer.name, false, dice, turnScoreBefore);
          setTimeout(() => {
            gameLogger.turnEnd(currentPlayer.name, false, 0, currentPlayer.score, currentPlayer.isOnBoard, currentPlayer.isOnBoard);
            onGameStateChange(gameReducer(newState, { type: 'END_TURN' }));
          }, 1500);
        }
      }, 500);
    }
  }, [canRoll, turn.currentRoll, turn.diceRemaining, selectedIndices, gameState, onGameStateChange, currentPlayer, turn.turnScore]);

  const handleBank = useCallback(() => {
    if (!canBankNow) return;

    const createdCarryover = turn.diceRemaining > 0;
    const newTotalScore = currentPlayer.score + turn.turnScore;
    const wasOnBoard = currentPlayer.isOnBoard;
    const isNowOnBoard = wasOnBoard || newTotalScore >= ENTRY_THRESHOLD;

    gameLogger.bank(currentPlayer.name, false, turn.turnScore, newTotalScore, turn.diceRemaining, createdCarryover);
    gameLogger.turnEnd(currentPlayer.name, false, turn.turnScore, newTotalScore, wasOnBoard, isNowOnBoard);

    let newState = gameReducer(gameState, { type: 'BANK' });
    newState = gameReducer(newState, { type: 'END_TURN' });
    onGameStateChange(newState);
    setSelectedIndices([]);
  }, [canBankNow, gameState, onGameStateChange, turn.turnScore, turn.diceRemaining, currentPlayer]);

  const handleDeclineCarryover = useCallback(() => {
    if (turn.phase !== TurnPhase.STEAL_REQUIRED) return;
    const newState = gameReducer(gameState, { type: 'DECLINE_CARRYOVER' });
    onGameStateChange(newState);
    setSelectedIndices([]);
  }, [turn.phase, gameState, onGameStateChange]);

  const handleKeepAndBank = useCallback(() => {
    if (selectedIndices.length === 0 || !turn.currentRoll) return;

    const selectedDice = selectedIndices.map((i) => turn.currentRoll![i]);
    const keepScore = scoreSelection(selectedDice).score;

    let newState = gameReducer(gameState, { type: 'KEEP', dice: selectedDice });
    const turnScoreAfterKeep = newState.turn.turnScore;
    const diceRemainingAfterKeep = newState.turn.diceRemaining;
    const isHotDice = diceRemainingAfterKeep === 5 && turn.diceRemaining !== 5;

    gameLogger.keep(currentPlayer.name, false, selectedDice, keepScore, turnScoreAfterKeep, diceRemainingAfterKeep, isHotDice);

    const createdCarryover = diceRemainingAfterKeep > 0;
    const newTotalScore = currentPlayer.score + turnScoreAfterKeep;
    const wasOnBoard = currentPlayer.isOnBoard;
    const isNowOnBoard = wasOnBoard || newTotalScore >= ENTRY_THRESHOLD;

    gameLogger.bank(currentPlayer.name, false, turnScoreAfterKeep, newTotalScore, diceRemainingAfterKeep, createdCarryover);
    gameLogger.turnEnd(currentPlayer.name, false, turnScoreAfterKeep, newTotalScore, wasOnBoard, isNowOnBoard);

    newState = gameReducer(newState, { type: 'BANK' });
    newState = gameReducer(newState, { type: 'END_TURN' });
    onGameStateChange(newState);
    setSelectedIndices([]);
  }, [selectedIndices, turn.currentRoll, turn.diceRemaining, gameState, onGameStateChange, currentPlayer]);

  const selectedDice = turn.currentRoll
    ? selectedIndices.map((i) => turn.currentRoll![i])
    : [];
  const selectedScore = selectedDice.length > 0 ? scoreSelection(selectedDice).score : 0;

  const wouldBankBeValid = (() => {
    if (selectedScore === 0) return false;
    const totalAfterKeep = turn.turnScore + selectedScore;
    if (currentPlayer.isOnBoard) return true;
    const ownScore = totalAfterKeep - turn.carryoverPoints;
    return ownScore >= ENTRY_THRESHOLD;
  })();

  const getStatusMessage = () => {
    if (isAITurn && isAIActing && !isRolling) return t('thinking');
    if (isAITurn && isRolling) return t('rolling');
    if (turn.phase === TurnPhase.ENDED) return t('turnEnded');
    if (isAITurn) return '';

    switch (turn.phase) {
      case TurnPhase.ROLLING:
        return t('rollToStart');
      case TurnPhase.STEAL_REQUIRED:
        return t('stealAttempt');
      case TurnPhase.KEEPING:
        if (selectedIndices.length === 0) {
          return t('tapToKeep');
        }
        return wouldBankBeValid
          ? t('rollOrBank')
          : t('needThreshold', { threshold: ENTRY_THRESHOLD });
      case TurnPhase.DECIDING:
        return t('riskOrBank');
      default:
        return '';
    }
  };

  return (
    <div
      className="game-board"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        padding: 'var(--space-4)',
        maxWidth: 'var(--max-content-width)',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Mobile: Status bar at top */}
      <header
        aria-label="Current player status"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          padding: 'var(--space-4)',
          background: isAITurn ? 'var(--color-accent-light)' : 'var(--color-primary-light)',
          borderRadius: 'var(--radius-xl)',
          border: isAITurn
            ? '2px solid var(--color-accent)'
            : '2px solid var(--color-primary)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-bold)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            {t('turnOf', { name: currentPlayer.name })}
            {isAITurn && (
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  background: 'var(--color-accent)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                AI
              </span>
            )}
          </h2>
          <button
            onClick={() => setShowHelp(true)}
            className="btn btn-ghost btn-sm"
            aria-label={t('showRules')}
            style={{
              fontSize: 'var(--font-size-lg)',
              minWidth: 44,
              minHeight: 44,
            }}
          >
            ?
          </button>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {getStatusMessage()}
        </p>
      </header>

      {/* Main game area - responsive grid */}
      <div
        className="game-content"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 'var(--space-4)',
        }}
      >
        {/* Primary column: Dice and actions */}
        <main className="game-main" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <DiceRoll
            dice={turn.currentRoll || EMPTY_DICE}
            diceRemaining={turn.currentRoll?.length || turn.diceRemaining}
            onSelectionChange={setSelectedIndices}
            onRoll={handleRoll}
            canRoll={canRoll}
            disabled={isAITurn || (turn.phase !== TurnPhase.KEEPING && turn.phase !== TurnPhase.STEAL_REQUIRED)}
            rolling={isRolling}
            aiKeptDice={isAITurn ? turn.keptDice : undefined}
            selectedCount={selectedIndices.length}
            showHints={showHints}
          />

          {/* Selection feedback */}
          <AnimatePresence>
            {selectedScore > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-3)',
                  background: 'var(--color-primary-light)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--font-size-base)',
                  border: '1px solid var(--color-primary)',
                }}
              >
                {t('selected')} <strong style={{ color: 'var(--color-primary)' }}>+{selectedScore}</strong>
                {turn.turnScore > 0 && (
                  <span style={{ marginLeft: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>
                    ({t('turnTotal')} <strong>{turn.turnScore + selectedScore}</strong>)
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <ActionButtons
            onBank={handleBank}
            onKeepAndBank={handleKeepAndBank}
            onDeclineCarryover={handleDeclineCarryover}
            canBank={canBankNow && !isAITurn}
            canKeepAndBank={hasValidSelection && !isAITurn && wouldBankBeValid && (turn.phase === TurnPhase.KEEPING || turn.phase === TurnPhase.STEAL_REQUIRED)}
            canDeclineCarryover={turn.phase === TurnPhase.STEAL_REQUIRED && !isAITurn}
          />

          {/* Bust notification */}
          <AnimatePresence>
            {turn.phase === TurnPhase.ENDED && turn.turnScore === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-5)',
                  background: 'var(--color-danger-light)',
                  border: '2px solid var(--color-danger)',
                  borderRadius: 'var(--radius-xl)',
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-danger)',
                }}
                role="alert"
              >
                {t('bust')}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Sidebar: Score and players */}
        <aside
          className="game-sidebar"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <ScoreDisplay
            turnState={turn}
            isOnBoard={currentPlayer.isOnBoard}
            playerScore={currentPlayer.score}
          />
          <PlayerList
            players={gameState.players}
            currentPlayerIndex={gameState.currentPlayerIndex}
            isFinalRound={gameState.isFinalRound}
          />
          <TurnHistory
            history={turnHistory}
            currentTurnRolls={currentTurnRolls}
            currentTurnScore={turn.turnScore}
            maxVisible={3}
          />
        </aside>
      </div>

      {/* Help panel */}
      <AnimatePresence>
        {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
      </AnimatePresence>

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 768px) {
          .game-content {
            grid-template-columns: 1fr 320px !important;
          }
        }

        @media (min-width: 1024px) {
          .game-content {
            grid-template-columns: 1fr 360px !important;
            gap: var(--space-5) !important;
          }
          .game-board {
            padding: var(--space-5) !important;
          }
        }
      `}</style>
    </div>
  );
}
