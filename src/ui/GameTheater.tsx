import { motion, AnimatePresence } from 'framer-motion';
import { Die } from './Die.js';
import type { Dice, DieValue } from '../types/index.js';
import { TurnPhase } from '../types/index.js';
import { useI18n } from '../i18n/index.js';
import { ENTRY_THRESHOLD } from '../engine/constants.js';

interface GameTheaterProps {
  // Player info
  playerName: string;
  isOnBoard: boolean;
  isAI: boolean;

  // Turn state
  turnPhase: TurnPhase;
  turnScore: number;
  carryoverPoints: number;
  diceRemaining: number;

  // Dice state
  currentRoll: Dice | null;
  keptDice: Dice;
  selectedIndices: number[];
  selectableIndices: Set<number>;
  scoringIndices: Set<number>;
  selectionScore: number;

  // Handlers
  onDieClick: (index: number) => void;
  onRoll: () => void;
  onBank: () => void;
  onKeepAndBank: () => void;
  onDeclineCarryover: () => void;

  // State
  canRoll: boolean;
  canBank: boolean;
  canKeepAndBank: boolean;
  canDeclineCarryover: boolean;
  isRolling: boolean;
  isAIActing: boolean;
  showHints: boolean;
}

/**
 * GameTheater - Unified game interaction area
 *
 * Design Philosophy:
 * - Single focus container for all game actions
 * - Phase-adaptive instruction at the top (hero element)
 * - Dice area is the visual center
 * - Actions at the bottom, context-aware
 * - Teaches rules through visual emphasis
 */
export function GameTheater({
  playerName,
  isOnBoard,
  isAI,
  turnPhase,
  turnScore,
  carryoverPoints,
  diceRemaining,
  currentRoll,
  keptDice,
  selectedIndices,
  selectableIndices,
  scoringIndices,
  selectionScore,
  onDieClick,
  onRoll,
  onBank,
  onKeepAndBank,
  onDeclineCarryover,
  canRoll,
  canBank,
  canKeepAndBank,
  canDeclineCarryover,
  isRolling,
  isAIActing,
  showHints,
}: GameTheaterProps) {
  const { t } = useI18n();

  // Detect Hot Dice state (all 5 dice available after keeping, but haven't rolled yet)
  // Only true in DECIDING phase when you have 5 fresh dice to roll
  const isHotDice = diceRemaining === 5 && keptDice.length > 0 && turnPhase === TurnPhase.DECIDING;

  // Get phase-specific instruction (HERO element)
  const getInstruction = (): { text: string; emphasis: 'normal' | 'action' | 'celebration' | 'warning' } => {
    if (isAI) {
      if (isRolling) return { text: t('rolling'), emphasis: 'normal' };
      if (isAIActing) return { text: t('thinking'), emphasis: 'normal' };
      return { text: '', emphasis: 'normal' };
    }

    if (turnPhase === TurnPhase.ENDED) {
      return { text: t('bust'), emphasis: 'warning' };
    }

    if (isHotDice && turnPhase === TurnPhase.DECIDING) {
      return { text: t('hotDice'), emphasis: 'celebration' };
    }

    switch (turnPhase) {
      case TurnPhase.ROLLING:
        return { text: t('rollToStart'), emphasis: 'action' };
      case TurnPhase.STEAL_REQUIRED:
        // Dynamic risk messaging based on dice count
        if (diceRemaining === 1) {
          return { text: t('luckyBreakLow', { count: 1 }), emphasis: 'warning' };
        } else if (diceRemaining === 2) {
          return { text: t('luckyBreakMed'), emphasis: 'action' };
        }
        return { text: t('luckyBreakHigh'), emphasis: 'celebration' };
      case TurnPhase.KEEPING:
        if (selectedIndices.length === 0) {
          return { text: t('tapToKeep'), emphasis: 'action' };
        }
        // Show different message if player can't bank due to entry threshold
        if (needsEntryPoints) {
          return { text: t('keepRollingForEntry'), emphasis: 'warning' };
        }
        return { text: t('rollOrBank'), emphasis: 'normal' };
      case TurnPhase.DECIDING:
        // Show different message if player can't bank due to entry threshold
        if (needsEntryPoints) {
          return { text: t('keepRollingForEntry'), emphasis: 'warning' };
        }
        return { text: t('riskOrBank'), emphasis: 'action' };
      default:
        return { text: '', emphasis: 'normal' };
    }
  };

  const instruction = getInstruction();

  // Calculate entry progress for players not on board
  const ownScore = turnScore - carryoverPoints;
  const entryProgress = !isOnBoard ? Math.min(100, (ownScore / ENTRY_THRESHOLD) * 100) : 100;
  const needsEntryPoints = !isOnBoard && ownScore < ENTRY_THRESHOLD;

  // Get roll button text - compact version
  const getRollButtonContent = () => {
    if (isRolling) return t('rolling');

    // Hot dice - keeping all dice triggers fresh 5
    if (isHotDice || (selectedIndices.length > 0 && diceRemaining - selectedIndices.length === 0)) {
      return '🔥 Hot Dice';
    }

    // Show dice count for roll
    if (selectedIndices.length > 0) {
      const remaining = diceRemaining - selectedIndices.length;
      return `🎲 Roll ${remaining}`;
    }

    if (!currentRoll || currentRoll.length === 0) {
      return `🎲 Roll ${diceRemaining}`;
    }

    return `🎲 Roll ${diceRemaining}`;
  };

  // Determine if roll button should show fire styling
  const showFireButton = isHotDice || (selectedIndices.length > 0 && diceRemaining - selectedIndices.length === 0);

  return (
    <motion.section
      className="game-theater"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-2xl)',
        border: isAI ? '2px solid var(--color-accent)' : '2px solid var(--color-primary)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Hero Instruction */}
      <header
        style={{
          padding: 'var(--space-2) var(--space-3)',
          background: instruction.emphasis === 'celebration'
            ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
            : instruction.emphasis === 'warning'
            ? 'var(--color-danger)'
            : instruction.emphasis === 'action'
            ? isAI ? 'var(--color-accent)' : 'var(--color-primary)'
            : 'var(--color-surface-hover)',
          textAlign: 'center',
        }}
      >
        {/* Player name and turn score */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: instruction.text ? 'var(--space-2)' : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-bold)',
              color: instruction.emphasis !== 'normal' ? 'white' : 'var(--color-text-primary)',
            }}>
              {t('turnOf', { name: playerName })}
            </span>
            {isAI && (
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'white',
                }}
              >
                AI
              </span>
            )}
          </div>
          {turnScore > 0 && (
            <motion.span
              key={turnScore}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: instruction.emphasis !== 'normal' ? 'white' : 'var(--color-primary)',
              }}
            >
              +{turnScore.toLocaleString()}
            </motion.span>
          )}
        </div>

        {/* Phase instruction */}
        {instruction.text && (
          <motion.p
            key={instruction.text}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              margin: 0,
              fontSize: instruction.emphasis === 'celebration' ? 'var(--font-size-lg)' : 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-bold)',
              color: instruction.emphasis !== 'normal' ? 'white' : 'var(--color-text-secondary)',
              textTransform: instruction.emphasis === 'celebration' ? 'uppercase' : 'none',
            }}
          >
            {instruction.emphasis === 'celebration' && '🔥 '}
            {instruction.text}
            {instruction.emphasis === 'celebration' && ' 🔥'}
          </motion.p>
        )}
      </header>

      {/* Dice Area */}
      <div style={{ padding: 'var(--space-2) var(--space-3)', flex: 1 }}>
        {/* Available Dice */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            justifyContent: 'center',
            flexWrap: 'wrap',
            minHeight: 'calc(var(--die-size) + var(--space-2))',
            alignItems: 'center',
            marginBottom: 'var(--space-2)',
          }}
        >
          <AnimatePresence mode="popLayout">
            {currentRoll && currentRoll.length > 0 ? (
              // Show actual dice
              currentRoll.map((value, index) => {
                const isSelected = selectedIndices.includes(index);
                const isSelectable = selectableIndices.has(index);
                const isScoring = scoringIndices.has(index);

                if (isSelected) return null; // Selected dice shown in "keeping" section

                return (
                  <motion.div
                    key={`die-${index}`}
                    layout
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                  >
                    <Die
                      value={value}
                      selected={false}
                      disabled={!isSelectable || isAI}
                      onClick={() => onDieClick(index)}
                      rolling={isRolling}
                      scoringHint={showHints && isScoring && !isAI}
                    />
                  </motion.div>
                );
              })
            ) : (
              // Show placeholder dice when waiting to roll
              Array.from({ length: diceRemaining }).map((_, i) => (
                <motion.div
                  key={`placeholder-${i}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, transition: { delay: i * 0.05 } }}
                >
                  <Die
                    value={1 as DieValue}
                    disabled
                    dimmed
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Selection/Keeping Display */}
        <AnimatePresence>
          {(selectedIndices.length > 0 || keptDice.length > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: 'var(--color-primary-light)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-3)',
                marginBottom: 'var(--space-4)',
                border: '1px solid var(--color-primary)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 'var(--space-2)',
                }}
              >
                {/* Kept/Selected Dice */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-primary)',
                    fontWeight: 'var(--font-weight-semibold)',
                    flexShrink: 0,
                  }}>
                    {t('keeping')}:
                  </span>
                  <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                    {/* Show currently selected dice */}
                    {currentRoll && selectedIndices.map((index) => (
                      <motion.div
                        key={`selected-${index}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{ cursor: 'pointer' }}
                        onClick={() => onDieClick(index)}
                      >
                        <Die
                          value={currentRoll[index]}
                          selected
                          size="sm"
                        />
                      </motion.div>
                    ))}
                    {/* Show previously kept dice */}
                    {keptDice.map((value, index) => (
                      <motion.div key={`kept-${index}`}>
                        <Die
                          value={value}
                          disabled
                          size="sm"
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Score Preview */}
                {selectionScore > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    +{selectionScore}
                  </motion.span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Entry Progress (only for players not on board) */}
        {needsEntryPoints && !isAI && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              marginBottom: 'var(--space-2)',
              padding: 'var(--space-2)',
              background: entryProgress >= 100 ? 'var(--color-primary-light)' : 'var(--color-warning-light)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${entryProgress >= 100 ? 'var(--color-primary)' : 'var(--color-warning)'}`,
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-1)',
            }}>
              <span style={{
                fontSize: 'var(--font-size-xs)',
                color: entryProgress >= 100 ? 'var(--color-primary)' : 'var(--color-warning)',
                fontWeight: 'var(--font-weight-semibold)',
              }}>
                {entryProgress >= 100 ? t('readyToBoard') : t('entryProgress')}
              </span>
              <span style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-bold)',
              }}>
                {ownScore} / {ENTRY_THRESHOLD}
              </span>
            </div>
            <div
              style={{
                height: 4,
                background: 'rgba(0,0,0,0.1)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${entryProgress}%` }}
                style={{
                  height: '100%',
                  background: entryProgress >= 100 ? 'var(--color-primary)' : 'var(--color-warning)',
                  borderRadius: 'var(--radius-full)',
                }}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Action Buttons */}
      {!isAI && turnPhase !== TurnPhase.ENDED && (
        <footer
          style={{
            padding: 'var(--space-2) var(--space-3)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          {/* Primary action row - compact single line */}
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {/* Roll button */}
            {canRoll && (
              <motion.button
                onClick={onRoll}
                disabled={isRolling}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`btn ${showFireButton ? 'btn-fire' : 'btn-primary'}`}
                style={{
                  flex: 1,
                  padding: 'var(--space-2) var(--space-3)',
                  fontSize: 'var(--font-size-base)',
                  background: showFireButton
                    ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                    : undefined,
                }}
              >
                {getRollButtonContent()}
              </motion.button>
            )}

            {/* Bank button */}
            {(canBank || canKeepAndBank) && (
              <motion.button
                onClick={canKeepAndBank ? onKeepAndBank : onBank}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-warning"
                style={{
                  flex: 1,
                  padding: 'var(--space-2) var(--space-3)',
                  fontSize: 'var(--font-size-base)',
                }}
              >
                💰 {turnScore + selectionScore > 0 ? (turnScore + selectionScore).toLocaleString() : t('bank')}
              </motion.button>
            )}
          </div>

          {/* Decline carryover (secondary action) */}
          {canDeclineCarryover && (
            <motion.button
              onClick={onDeclineCarryover}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-ghost btn-sm"
              style={{ alignSelf: 'center' }}
            >
              {t('declineStartFresh')}
            </motion.button>
          )}
        </footer>
      )}

      {/* AI acting indicator */}
      {isAI && !isRolling && (
        <footer
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderTop: '1px solid var(--color-border)',
            textAlign: 'center',
          }}
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{
              fontSize: 'var(--font-size-base)',
              color: 'var(--color-accent)',
            }}
          >
            {t('aiThinking')}
          </motion.div>
        </footer>
      )}
    </motion.section>
  );
}
