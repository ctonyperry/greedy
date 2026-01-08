import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Die } from './Die.js';
import type { Dice, DieValue } from '../types/index.js';
import { getSelectableIndices } from '../engine/validation.js';

interface DiceRollProps {
  dice: Dice;
  diceRemaining: number;
  onSelectionChange: (selectedIndices: number[]) => void;
  onRoll?: () => void;
  canRoll?: boolean;
  disabled?: boolean;
  rolling?: boolean;
  aiKeptDice?: Dice;
  selectedCount?: number;
}

export function DiceRoll({
  dice,
  diceRemaining,
  onSelectionChange,
  onRoll,
  canRoll = false,
  disabled,
  rolling,
  aiKeptDice,
  selectedCount = 0,
}: DiceRollProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const prevDiceRef = useRef<string>('');
  const [lastRolledValues, setLastRolledValues] = useState<DieValue[]>([]);

  // Reset selection when dice actually change (new roll)
  useEffect(() => {
    const diceKey = JSON.stringify(dice);
    if (diceKey !== prevDiceRef.current) {
      prevDiceRef.current = diceKey;
      setSelectedIndices(new Set());
      onSelectionChange([]);
      // Store the rolled values
      if (dice.length > 0) {
        setLastRolledValues([...dice]);
      }
    }
  }, [dice, onSelectionChange]);

  // Calculate which dice are selectable based on current selection
  const selectableIndices = useMemo(() => {
    if (disabled || rolling || dice.length === 0) {
      return new Set<number>();
    }
    return getSelectableIndices(dice, Array.from(selectedIndices));
  }, [dice, selectedIndices, disabled, rolling]);

  const toggleDie = (index: number) => {
    if (disabled || rolling) return;
    if (!selectableIndices.has(index)) return;

    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
    onSelectionChange(Array.from(newSelected));
  };

  const isAITurn = aiKeptDice !== undefined;

  // Split dice into roll section and keep section
  const rollDice = dice.map((value, index) => ({ value, index })).filter(d => !selectedIndices.has(d.index));
  const keepDice = isAITurn
    ? []
    : dice.map((value, index) => ({ value, index })).filter(d => selectedIndices.has(d.index));

  // Calculate how many placeholder dice to show
  const actualDiceInRoll = rollDice.length;
  const diceAfterKeeping = diceRemaining - selectedCount;
  const placeholderCount = dice.length === 0 ? diceRemaining : Math.max(0, diceAfterKeeping - actualDiceInRoll);

  // Get roll button text
  const getRollButtonText = () => {
    if (rolling) return '...';
    if (selectedCount > 0) {
      if (diceAfterKeeping === 0) return 'Hot!';
      return `Roll ${diceAfterKeeping}`;
    }
    if (dice.length === 0) return 'Roll';
    return `Roll ${diceRemaining}`;
  };

  return (
    <LayoutGroup>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Roll Section with inline button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 0,
          }}
        >
          {/* Dice area */}
          <div
            style={{
              flex: 1,
              padding: '24px 20px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px 0 0 16px',
              minHeight: 108,
              position: 'relative',
            }}
          >
            <span style={{
              position: 'absolute',
              top: 8,
              left: 12,
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.4)',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              Roll
            </span>

            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
              minHeight: 60,
              alignItems: 'center',
            }}>
              <AnimatePresence mode="popLayout">
                {/* Show actual rolled dice */}
                {rollDice.map(({ value, index }) => {
                  const isSelectable = selectableIndices.has(index);
                  return (
                    <motion.div
                      key={`die-${index}`}
                      layoutId={`die-${index}`}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                      <Die
                        value={value}
                        selected={false}
                        disabled={disabled || !isSelectable}
                        onClick={() => toggleDie(index)}
                        rolling={rolling}
                      />
                    </motion.div>
                  );
                })}

                {/* Show placeholder dice for remaining dice to roll */}
                {Array.from({ length: placeholderCount }).map((_, i) => {
                  const placeholderValue = lastRolledValues[rollDice.length + i] || (Math.floor(Math.random() * 6) + 1) as DieValue;
                  return (
                    <motion.div
                      key={`placeholder-${i}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 0.4, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                      <Die
                        value={placeholderValue}
                        disabled={true}
                        dimmed={true}
                        rolling={rolling}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {dice.length === 0 && placeholderCount === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: 16,
                  }}
                >
                  Press Roll to start
                </motion.div>
              )}
            </div>
          </div>

          {/* Inline Roll Button */}
          {onRoll && canRoll && !isAITurn && (
            <motion.button
              onClick={onRoll}
              disabled={rolling}
              whileHover={rolling ? {} : { scale: 1.02 }}
              whileTap={rolling ? {} : { scale: 0.98 }}
              animate={rolling ? { opacity: 0.7 } : { opacity: 1 }}
              style={{
                padding: '0 24px',
                fontSize: 14,
                fontWeight: 'bold',
                background: selectedCount > 0
                  ? 'linear-gradient(135deg, #4ade80, #22c55e)'
                  : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                color: '#fff',
                border: 'none',
                borderRadius: '0 16px 16px 0',
                cursor: rolling ? 'wait' : 'pointer',
                minWidth: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: selectedCount > 0
                  ? 'inset 0 0 20px rgba(0,0,0,0.1)'
                  : 'inset 0 0 20px rgba(0,0,0,0.1)',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {getRollButtonText()}
            </motion.button>
          )}

          {/* Placeholder for button space when not rollable */}
          {(!onRoll || !canRoll || isAITurn) && (
            <div
              style={{
                width: 80,
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '0 16px 16px 0',
                borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            />
          )}
        </div>

        {/* Keep Section */}
        <div
          style={{
            padding: 20,
            background: (keepDice.length > 0 || (aiKeptDice && aiKeptDice.length > 0))
              ? isAITurn ? 'rgba(139, 92, 246, 0.1)' : 'rgba(74, 222, 128, 0.1)'
              : 'rgba(255, 255, 255, 0.02)',
            borderRadius: 12,
            border: (keepDice.length > 0 || (aiKeptDice && aiKeptDice.length > 0))
              ? isAITurn ? '2px solid rgba(139, 92, 246, 0.3)' : '2px solid rgba(74, 222, 128, 0.3)'
              : '2px dashed rgba(255, 255, 255, 0.1)',
            minHeight: 88,
            position: 'relative',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{
            position: 'absolute',
            top: 8,
            left: 12,
            fontSize: 11,
            color: (keepDice.length > 0 || (aiKeptDice && aiKeptDice.length > 0))
              ? isAITurn ? 'rgba(139, 92, 246, 0.8)' : 'rgba(74, 222, 128, 0.8)'
              : 'rgba(255, 255, 255, 0.3)',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            {isAITurn ? 'AI Keeping' : 'Keep'}
          </span>

          <div style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
            minHeight: 50,
            alignItems: 'center',
          }}>
            {/* Human turn: show selected dice */}
            {!isAITurn && (
              <AnimatePresence mode="popLayout">
                {keepDice.map(({ value, index }) => (
                  <motion.div
                    key={`die-${index}`}
                    layoutId={`die-${index}`}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <Die
                      value={value}
                      selected={true}
                      disabled={disabled}
                      onClick={() => toggleDie(index)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {/* AI turn: show kept dice */}
            {isAITurn && aiKeptDice && aiKeptDice.length > 0 && (
              <AnimatePresence mode="popLayout">
                {aiKeptDice.map((value, index) => (
                  <motion.div
                    key={`ai-kept-${index}`}
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <Die
                      value={value}
                      selected={true}
                      disabled={true}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {/* Empty state messages */}
            {!isAITurn && keepDice.length === 0 && dice.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  color: 'rgba(255, 255, 255, 0.3)',
                  fontSize: 13,
                }}
              >
                Tap dice above to keep them
              </motion.div>
            )}

            {isAITurn && (!aiKeptDice || aiKeptDice.length === 0) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  color: 'rgba(139, 92, 246, 0.5)',
                  fontSize: 13,
                }}
              >
                AI is thinking...
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </LayoutGroup>
  );
}

interface KeptDiceProps {
  dice: Dice;
}

export function KeptDice({ dice }: KeptDiceProps) {
  if (dice.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: 16,
        background: 'rgba(74, 222, 128, 0.1)',
        borderRadius: 12,
        justifyContent: 'center',
        flexWrap: 'wrap',
        border: '2px solid rgba(74, 222, 128, 0.3)',
      }}
    >
      <span style={{
        width: '100%',
        textAlign: 'center',
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: 8,
      }}>
        Banked This Turn
      </span>
      {dice.map((value, index) => (
        <motion.div
          key={index}
          initial={{ scale: 0 }}
          animate={{ scale: 0.8 }}
        >
          <Die value={value} disabled />
        </motion.div>
      ))}
    </div>
  );
}

// Turn history entry
export interface TurnHistoryEntry {
  playerName: string;
  dice: Dice;
  score: number;
  busted: boolean;
  isAI: boolean;
}

interface TurnHistoryProps {
  history: TurnHistoryEntry[];
  currentTurnRolls: Dice[];
  currentTurnScore?: number;
  maxVisible?: number;
}

export function TurnHistory({ history, currentTurnRolls, currentTurnScore = 0, maxVisible = 3 }: TurnHistoryProps) {
  const hasCurrentTurn = currentTurnRolls.length > 0 || currentTurnScore > 0;
  const recentHistory = history.slice(-maxVisible);

  if (!hasCurrentTurn && recentHistory.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 12,
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 12,
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <span style={{
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.5)',
        textTransform: 'uppercase',
        letterSpacing: 1,
      }}>
        Recent Turns
      </span>

      {/* Current turn */}
      {hasCurrentTurn && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: 10,
            background: 'rgba(74, 222, 128, 0.15)',
            borderRadius: 8,
            border: '1px solid rgba(74, 222, 128, 0.3)',
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: currentTurnRolls.length > 0 ? 6 : 0,
          }}>
            <span style={{ fontSize: 11, color: 'rgba(74, 222, 128, 0.9)', fontWeight: 'bold' }}>
              Current Turn
            </span>
            {currentTurnScore > 0 && (
              <span style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: 'rgba(74, 222, 128, 0.9)',
              }}>
                +{currentTurnScore}
              </span>
            )}
          </div>
          {currentTurnRolls.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {currentTurnRolls.map((rollDice, rollIndex) => (
                <div
                  key={rollIndex}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{
                    fontSize: 9,
                    color: 'rgba(74, 222, 128, 0.6)',
                    minWidth: 14,
                  }}>
                    {rollIndex + 1}.
                  </span>
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {rollDice.map((value, dieIndex) => (
                      <motion.div
                        key={dieIndex}
                        initial={{ scale: 0 }}
                        animate={{ scale: 0.55 }}
                      >
                        <Die value={value} disabled />
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Previous turns */}
      {recentHistory.slice().reverse().map((entry, index) => (
        <motion.div
          key={`history-${history.length - index}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 - (index * 0.2) }}
          style={{
            padding: 10,
            background: entry.busted
              ? 'rgba(239, 68, 68, 0.1)'
              : 'rgba(255, 255, 255, 0.05)',
            borderRadius: 8,
            border: entry.busted
              ? '1px solid rgba(239, 68, 68, 0.2)'
              : '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: entry.dice.length > 0 ? 6 : 0,
          }}>
            <span style={{
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              {entry.playerName}
              {entry.isAI && (
                <span style={{
                  fontSize: 9,
                  background: 'rgba(139, 92, 246, 0.3)',
                  padding: '1px 4px',
                  borderRadius: 3,
                }}>
                  AI
                </span>
              )}
            </span>
            <span style={{
              fontSize: 12,
              fontWeight: 'bold',
              color: entry.busted
                ? 'rgba(239, 68, 68, 0.8)'
                : 'rgba(74, 222, 128, 0.8)',
            }}>
              {entry.busted ? 'BUST' : `+${entry.score}`}
            </span>
          </div>
          {entry.dice.length > 0 && (
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {entry.dice.map((value, dieIndex) => (
                <div
                  key={dieIndex}
                  style={{
                    width: 20,
                    height: 20,
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 'bold',
                    opacity: 0.7,
                  }}
                >
                  {value}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
