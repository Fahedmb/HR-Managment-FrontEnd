import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

type AlertVariant = 'success' | 'warning' | 'danger' | 'info';

interface AlertProps {
  variant: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

const variantConfig: Record<AlertVariant, {
  bg: string;
  border: string;
  text: string;
  icon: React.ReactNode;
}> = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-400 dark:border-green-600',
    text: 'text-green-800 dark:text-green-300',
    icon: <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />,
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-400 dark:border-yellow-600',
    text: 'text-yellow-800 dark:text-yellow-300',
    icon: <AlertTriangle className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />,
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-400 dark:border-red-600',
    text: 'text-red-800 dark:text-red-300',
    icon: <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />,
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-400 dark:border-blue-600',
    text: 'text-blue-800 dark:text-blue-300',
    icon: <Info className="w-5 h-5 text-blue-500 dark:text-blue-400" />,
  },
};

export const Alert = ({ variant, title, message, onClose, className }: AlertProps) => {
  const cfg = variantConfig[variant];
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
        className={clsx(
          'flex items-start gap-3 rounded-lg border p-4',
          cfg.bg,
          cfg.border,
          className
        )}
      >
        <div className="flex-shrink-0 mt-0.5">{cfg.icon}</div>
        <div className="flex-1">
          {title && (
            <p className={clsx('text-sm font-semibold mb-0.5', cfg.text)}>{title}</p>
          )}
          <p className={clsx('text-sm', cfg.text)}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={clsx('flex-shrink-0 hover:opacity-70 transition-opacity', cfg.text)}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// Inline badge component
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const badgeVariants: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export const Badge = ({ children, variant = 'default', size = 'sm' }: BadgeProps) => (
  <span
    className={clsx(
      'inline-flex items-center gap-1 rounded-full font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      badgeVariants[variant]
    )}
  >
    {children}
  </span>
);

// Status badge for various entity statuses
export const statusVariantMap: Record<string, BadgeVariant> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'default',
  PENDING_CANCELLATION: 'warning',
  TODO: 'default',
  IN_PROGRESS: 'info',
  IN_REVIEW: 'purple',
  DONE: 'success',
  BLOCKED: 'danger',
  PLANNING: 'default',
  ACTIVE: 'info',
  ON_HOLD: 'warning',
  COMPLETED: 'success',
  SCHEDULED: 'info',
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  CRITICAL: 'danger',
};

export const StatusBadge = ({ status }: { status: string }) => (
  <Badge variant={statusVariantMap[status] ?? 'default'}>
    {status.replace('_', ' ')}
  </Badge>
);
