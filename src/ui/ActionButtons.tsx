import { motion } from 'framer-motion';

interface ActionButtonsProps {
  onBank: () => void;
  onKeepAndBank: () => void;
  onDeclineCarryover: () => void;
  canBank: boolean;
  canKeepAndBank: boolean;
  canDeclineCarryover: boolean;
}

export function ActionButtons({
  onBank,
  onKeepAndBank,
  onDeclineCarryover,
  canBank,
  canKeepAndBank,
  canDeclineCarryover,
}: ActionButtonsProps) {
  // Don't render if no buttons to show
  if (!canBank && !canKeepAndBank && !canDeclineCarryover) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}
    >
      {canKeepAndBank && (
        <motion.button
          onClick={onKeepAndBank}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: '14px 32px',
            fontSize: 16,
            fontWeight: 'bold',
            background: '#f59e0b',
            color: '#1a1a2e',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
          }}
        >
          Bank Points
        </motion.button>
      )}

      {canBank && (
        <motion.button
          onClick={onBank}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: '14px 32px',
            fontSize: 16,
            fontWeight: 'bold',
            background: '#f59e0b',
            color: '#1a1a2e',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
          }}
        >
          Bank
        </motion.button>
      )}

      {canDeclineCarryover && (
        <motion.button
          onClick={onDeclineCarryover}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: '14px 32px',
            fontSize: 16,
            fontWeight: 'bold',
            background: '#6b7280',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)',
          }}
        >
          Decline
        </motion.button>
      )}
    </div>
  );
}
