import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiceRoll, TurnHistory, TurnHistoryEntry } from './DiceRoll.js';
import { ScoreDisplay } from './ScoreDisplay.js';
import { PlayerList } from './PlayerList.js';
import { ActionButtons } from './ActionButtons.js';
import { TurnPhase } from '../types/index.js';
import type { GameState, Dice, DieValue } from '../types/index.js';
import { gameReducer, getCurrentPlayer } from '../engine/game.js';
import { canBank as checkCanBank } from '../engine/turn.js';
import { validateKeep } from '../engine/validation.js';
import { scoreSelection } from '../engine/scoring.js';
import { makeAIDecision, AI_STRATEGIES } from '../ai/strategies.js';
import { ENTRY_THRESHOLD } from '../engine/constants.js';
import { gameLogger } from '../debug/GameLogger.js';

interface GameBoardProps {
  gameState: GameState;
  onGameStateChange: (state: GameState) => void;
}

function rollDice(count: number): Dice {
  return Array.from({ length: count }, () =>
    (Math.floor(Math.random() * 6) + 1) as DieValue
  );
}

// Stable empty array to avoid creating new references on every render
const EMPTY_DICE: Dice = [];

// AI action logging
function logAIAction(
  action: string,
  player: { name: string; score: number; isOnBoard: boolean },
  details: Record<string, unknown>
) {
  const timestamp = new Date().toLocaleTimeString();
  console.group(`🤖 [${timestamp}] AI: ${player.name} - ${action}`);
  console.log('Player State:', {
    score: player.score,
    isOnBoard: player.isOnBoard,
  });
  Object.entries(details).forEach(([key, value]) => {
    console.log(`${key}:`, value);
  });
  console.groupEnd();
}

export function GameBoard({ gameState, onGameStateChange }: GameBoardProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [isAIActing, setIsAIActing] = useState(false);
  const [turnHistory, setTurnHistory] = useState<TurnHistoryEntry[]>([]);
  const [aiTrigger, setAiTrigger] = useState(0); // Used to force AI effect re-evaluation
  const [currentTurnRolls, setCurrentTurnRolls] = useState<Dice[]>([]); // Dice kept per roll in current turn

  // Track the previous turn to detect when a turn ends
  const prevTurnRef = useRef<{ playerIndex: number; keptDice: Dice; turnScore: number } | null>(null);
  const prevPlayerIndexRef = useRef<number>(gameState.currentPlayerIndex);

  const currentPlayer = getCurrentPlayer(gameState);
  const { turn } = gameState;
  const isAITurn = currentPlayer.isAI;

  // Keep refs for values needed in async callbacks
  const gameStateRef = useRef(gameState);
  const onGameStateChangeRef = useRef(onGameStateChange);
  useEffect(() => {
    gameStateRef.current = gameState;
    onGameStateChangeRef.current = onGameStateChange;
  }, [gameState, onGameStateChange]);

  // Track turn history - detect when player changes and record the completed turn
  useEffect(() => {
    const prev = prevTurnRef.current;

    // If this is the first render or player changed, record the previous turn
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

    // Update ref for next comparison
    prevTurnRef.current = {
      playerIndex: gameState.currentPlayerIndex,
      keptDice: [...turn.keptDice],
      turnScore: turn.turnScore,
    };
  }, [gameState.currentPlayerIndex, gameState.players, turn.keptDice, turn.turnScore]);

  // Reset currentTurnRolls when player changes
  useEffect(() => {
    if (prevPlayerIndexRef.current !== gameState.currentPlayerIndex) {
      setCurrentTurnRolls([]);
      prevPlayerIndexRef.current = gameState.currentPlayerIndex;
    }
  }, [gameState.currentPlayerIndex]);

  // Track dice kept per roll by comparing keptDice length changes
  const prevKeptDiceLengthRef = useRef(0);
  useEffect(() => {
    const currentLength = turn.keptDice.length;
    const prevLength = prevKeptDiceLengthRef.current;

    // If keptDice grew, new dice were kept from this roll
    if (currentLength > prevLength) {
      const newlyKept = turn.keptDice.slice(prevLength);
      setCurrentTurnRolls(rolls => [...rolls, newlyKept]);
    } else if (currentLength === 0 && prevLength > 0) {
      // Turn was reset (bust or new turn)
      setCurrentTurnRolls([]);
    }

    prevKeptDiceLengthRef.current = currentLength;
  }, [turn.keptDice]);

  // Track when the AI can next act (timestamp-based to allow delays)
  const aiNextActionTimeRef = useRef(0);

  // AI turn handler
  useEffect(() => {
    if (!isAITurn || isRolling || gameState.isGameOver) {
      return;
    }

    // Check if we need to wait before acting
    const now = Date.now();
    const waitTime = aiNextActionTimeRef.current - now;
    if (waitTime > 0) {
      // Schedule a re-check after the wait time
      const waitTimeout = setTimeout(() => {
        // Increment trigger to force effect re-evaluation
        setAiTrigger(t => t + 1);
      }, waitTime + 50);
      return () => clearTimeout(waitTimeout);
    }

    const currentState = gameStateRef.current;
    const currentTurn = currentState.turn;
    const player = getCurrentPlayer(currentState);
    const strategyName = player.aiStrategy || 'balanced';
    const strategy = AI_STRATEGIES[strategyName];
    const decision = makeAIDecision(currentTurn, player.isOnBoard, strategy, strategyName);

    // Log AI decision-making
    console.log(`🤖 AI ${player.name} (${strategyName}) considering action in phase: ${currentTurn.phase} → Decision: ${decision.action}${decision.dice ? ` [${decision.dice.join(', ')}]` : ''}`);

    gameLogger.aiDecision(player.name, strategyName, currentTurn.phase, decision.action, {
      diceToKeep: decision.dice?.join(', '),
      currentRoll: currentTurn.currentRoll?.join(', '),
      turnScore: currentTurn.turnScore,
      diceRemaining: currentTurn.diceRemaining,
      isOnBoard: player.isOnBoard,
    });

    // Add delay for visual feedback
    const thinkDelay = currentTurn.phase === TurnPhase.ROLLING || currentTurn.phase === TurnPhase.STEAL_REQUIRED ? 800 : 600;

    // Mark next action time to prevent immediate re-triggering
    aiNextActionTimeRef.current = now + thinkDelay + 500;
    setIsAIActing(true);

    const thinkTimeout = setTimeout(() => {
      if (decision.action === 'ROLL') {
        // AI rolls
        setIsRolling(true);
        setTimeout(() => {
          const state = gameStateRef.current;
          const aiPlayer = getCurrentPlayer(state);
          const turnScoreBefore = state.turn.turnScore;
          const dice = rollDice(state.turn.diceRemaining);
          const newState = gameReducer(state, { type: 'ROLL', dice });

          const isBust = newState.turn.phase === TurnPhase.ENDED;
          logAIAction('ROLL', aiPlayer, {
            'Dice Count': state.turn.diceRemaining,
            'Roll Result': dice.join(', '),
            'Turn Score Before': turnScoreBefore,
            'Phase': state.turn.phase,
            'Result': isBust ? '💥 BUST!' : '✓ Has scoring dice',
          });

          gameLogger.roll(aiPlayer.name, true, dice.length, dice, isBust, turnScoreBefore);

          onGameStateChangeRef.current(newState);
          setIsRolling(false);
          setIsAIActing(false);

          // If busted, auto-end turn after delay
          if (isBust) {
            logAIAction('BUST - Turn Ended', aiPlayer, {
              'Points Lost': turnScoreBefore,
              'Final Score': aiPlayer.score,
            });
            gameLogger.bust(aiPlayer.name, true, dice, turnScoreBefore);
            setTimeout(() => {
              gameLogger.turnEnd(aiPlayer.name, true, 0, aiPlayer.score, aiPlayer.isOnBoard, aiPlayer.isOnBoard);
              onGameStateChangeRef.current(gameReducer(newState, { type: 'END_TURN' }));
            }, 1500);
          }
        }, 500);
      } else if (decision.action === 'KEEP' && decision.dice) {
        // AI keeps dice then continues (effect will re-run for next action)
        const state = gameStateRef.current;
        const aiPlayer = getCurrentPlayer(state);
        const keepScore = scoreSelection(decision.dice).score;
        const newState = gameReducer(state, { type: 'KEEP', dice: decision.dice });

        const isHotDice = newState.turn.diceRemaining === 5 && state.turn.diceRemaining !== 5;

        logAIAction('KEEP', aiPlayer, {
          'Current Roll': state.turn.currentRoll?.join(', '),
          'Keeping': decision.dice.join(', '),
          'Points from Keep': keepScore,
          'Turn Score After': newState.turn.turnScore,
          'Dice Remaining': newState.turn.diceRemaining,
          ...(isHotDice ? { '🔥 HOT DICE': 'All dice scored! Rolling 5 fresh dice' } : {}),
        });

        gameLogger.keep(aiPlayer.name, true, decision.dice, keepScore, newState.turn.turnScore, newState.turn.diceRemaining, isHotDice);

        // Set delay before next action so user can see kept dice
        const keepDelay = isHotDice ? 1500 : 1000;
        aiNextActionTimeRef.current = Date.now() + keepDelay;

        onGameStateChangeRef.current(newState);
        setIsAIActing(false);
      } else if (decision.action === 'BANK') {
        // AI banks
        const state = gameStateRef.current;
        const aiPlayer = getCurrentPlayer(state);
        const createdCarryover = state.turn.diceRemaining > 0;
        const newTotalScore = aiPlayer.score + state.turn.turnScore;
        const wasOnBoard = aiPlayer.isOnBoard;
        const isNowOnBoard = wasOnBoard || newTotalScore >= ENTRY_THRESHOLD;

        let newState = gameReducer(state, { type: 'BANK' });

        logAIAction('BANK', aiPlayer, {
          'Turn Score': state.turn.turnScore,
          'New Total Score': newTotalScore,
          'Dice Remaining': state.turn.diceRemaining,
          'Carryover Created': createdCarryover ? `Yes (${state.turn.diceRemaining} dice, ${state.turn.turnScore} points)` : 'No',
        });

        gameLogger.bank(aiPlayer.name, true, state.turn.turnScore, newTotalScore, state.turn.diceRemaining, createdCarryover);
        gameLogger.turnEnd(aiPlayer.name, true, state.turn.turnScore, newTotalScore, wasOnBoard, isNowOnBoard);

        newState = gameReducer(newState, { type: 'END_TURN' });
        onGameStateChangeRef.current(newState);
        setIsAIActing(false);
      } else if (decision.action === 'DECLINE_CARRYOVER') {
        // AI declines carryover
        const state = gameStateRef.current;
        const aiPlayer = getCurrentPlayer(state);

        logAIAction('DECLINE_CARRYOVER', aiPlayer, {
          'Carryover Points': state.carryoverPot?.points,
          'Carryover Dice': state.carryoverPot?.diceCount,
          'Reason': 'AI chose to start fresh turn instead',
        });

        const newState = gameReducer(state, { type: 'DECLINE_CARRYOVER' });
        onGameStateChangeRef.current(newState);
        setIsAIActing(false);
      } else {
        setIsAIActing(false);
      }
    }, thinkDelay);

    return () => {
      clearTimeout(thinkTimeout);
    };
  }, [isAITurn, turn.phase, isRolling, isAIActing, aiTrigger, gameState.isGameOver, gameState.currentPlayerIndex]);

  // Can roll: initial roll, deciding to roll again, steal attempt, OR keeping phase with dice selected
  const hasValidSelection = selectedIndices.length > 0 && turn.currentRoll !== null;
  const canRoll =
    !isRolling && (
      turn.phase === TurnPhase.ROLLING ||
      turn.phase === TurnPhase.DECIDING ||
      turn.phase === TurnPhase.STEAL_REQUIRED ||
      (turn.phase === TurnPhase.KEEPING && hasValidSelection)
    );

  const canBankNow =
    turn.phase === TurnPhase.DECIDING && checkCanBank(turn, currentPlayer.isOnBoard);

  // Combined keep + roll action
  const handleRoll = useCallback(() => {
    if (!canRoll) return;

    // If we have selected dice, keep them first
    if (selectedIndices.length > 0 && turn.currentRoll) {
      const selectedDice = selectedIndices.map((i) => turn.currentRoll![i]);
      const validation = validateKeep(turn.currentRoll, selectedDice);

      if (!validation.valid) {
        alert(validation.error || 'Invalid selection');
        return;
      }

      // Keep the dice, then roll
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

        // If busted, auto-end turn after a delay
        if (isBust) {
          gameLogger.bust(currentPlayer.name, false, dice, turnScoreBefore);
          setTimeout(() => {
            gameLogger.turnEnd(currentPlayer.name, false, 0, currentPlayer.score, currentPlayer.isOnBoard, currentPlayer.isOnBoard);
            onGameStateChange(gameReducer(newState, { type: 'END_TURN' }));
          }, 1500);
        }
      }, 500);
    } else {
      // Just roll (initial roll or deciding to continue)
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

        // If busted, auto-end turn after a delay
        if (isBust) {
          gameLogger.bust(currentPlayer.name, false, dice, turnScoreBefore);
          setTimeout(() => {
            gameLogger.turnEnd(currentPlayer.name, false, 0, currentPlayer.score, currentPlayer.isOnBoard, currentPlayer.isOnBoard);
            onGameStateChange(gameReducer(newState, { type: 'END_TURN' }));
          }, 1500);
        }
      }, 500);
    }
  }, [canRoll, turn.currentRoll, turn.diceRemaining, selectedIndices, gameState, onGameStateChange, currentPlayer]);

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

  // Keep selected dice and bank (end turn without rolling again)
  const handleKeepAndBank = useCallback(() => {
    if (selectedIndices.length === 0 || !turn.currentRoll) return;

    const selectedDice = selectedIndices.map((i) => turn.currentRoll![i]);
    const keepScore = scoreSelection(selectedDice).score;

    // Keep the dice, then bank and end turn
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

  // Calculate if banking would be valid after keeping selected dice
  const wouldBankBeValid = (() => {
    if (selectedScore === 0) return false;

    // Calculate total score after keeping
    const totalAfterKeep = turn.turnScore + selectedScore;

    // If already on board, can always bank
    if (currentPlayer.isOnBoard) return true;

    // If not on board, need ENTRY_THRESHOLD+ from own rolls (excluding carryover)
    const ownScore = totalAfterKeep - turn.carryoverPoints;
    return ownScore >= ENTRY_THRESHOLD;
  })();

  // Get status message
  const getStatusMessage = () => {
    if (isAITurn && isAIActing && !isRolling) return 'Thinking...';
    if (isAITurn && isRolling) return 'Rolling...';
    if (turn.phase === TurnPhase.ENDED) return 'Turn ended';
    if (isAITurn) return '';

    switch (turn.phase) {
      case TurnPhase.ROLLING:
        return 'Roll the dice to start';
      case TurnPhase.STEAL_REQUIRED:
        return 'Steal attempt! Roll the inherited dice';
      case TurnPhase.KEEPING:
        if (selectedIndices.length === 0) {
          return 'Tap scoring dice to keep them';
        }
        return wouldBankBeValid
          ? 'Keep & Roll to continue, or Bank Points to end turn'
          : `Keep & Roll to continue (need ${ENTRY_THRESHOLD}+ to get on board)`;
      case TurnPhase.DECIDING:
        return 'Roll again or bank your points';
      default:
        return '';
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 280px',
        gap: 24,
        padding: 24,
        maxWidth: 1000,
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: 'center',
            padding: 16,
            background: isAITurn ? 'rgba(139, 92, 246, 0.15)' : 'rgba(74, 222, 128, 0.1)',
            borderRadius: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {currentPlayer.name}'s Turn
            {isAITurn && (
              <span style={{ fontSize: 12, background: '#8b5cf6', padding: '2px 8px', borderRadius: 4 }}>
                AI
              </span>
            )}
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: 13, opacity: 0.7 }}>
            {getStatusMessage()}
          </p>
        </motion.div>

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
        />

        {selectedScore > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              textAlign: 'center',
              padding: 12,
              background: 'rgba(74, 222, 128, 0.15)',
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            Selected: <strong>+{selectedScore}</strong>
            {turn.turnScore > 0 && (
              <span style={{ marginLeft: 12, opacity: 0.8 }}>
                (Turn total: <strong>{turn.turnScore + selectedScore}</strong>)
              </span>
            )}
          </motion.div>
        )}

        <ActionButtons
          onBank={handleBank}
          onKeepAndBank={handleKeepAndBank}
          onDeclineCarryover={handleDeclineCarryover}
          canBank={canBankNow && !isAITurn}
          canKeepAndBank={hasValidSelection && !isAITurn && wouldBankBeValid && (turn.phase === TurnPhase.KEEPING || turn.phase === TurnPhase.STEAL_REQUIRED)}
          canDeclineCarryover={turn.phase === TurnPhase.STEAL_REQUIRED && !isAITurn}
        />

        <AnimatePresence>
          {turn.phase === TurnPhase.ENDED && turn.turnScore === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                textAlign: 'center',
                padding: 20,
                background: 'rgba(239, 68, 68, 0.2)',
                borderRadius: 12,
                fontSize: 24,
                fontWeight: 'bold',
              }}
            >
              BUST!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
      </div>
    </div>
  );
}
