/** Protocol fee percentage charged on each campaign (matches smart contract) */
export const PROTOCOL_FEE_PERCENT = 10

/** USDC uses 6 decimal places */
export const USDC_DECIMALS = 6

/** Maximum allowed participants per campaign (matches smart contract) */
export const MAX_PARTICIPANTS_LIMIT = 10000

/** Human-readable labels for each task type */
export const TASK_TYPES = ['👍 Like', '🔄 Retweet', '💬 Comment'] as const

/** Reusable Tailwind class strings */
export const styles = {
  input:
    'w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-emerald-500 focus:outline-none',
  card: 'border border-gray-800 rounded-xl p-6 bg-gray-900/50',
  buttonPrimary:
    'px-4 py-2 rounded-lg bg-emerald-500 text-black text-sm font-bold hover:bg-emerald-400',
  buttonPrimaryFull:
    'w-full py-3 rounded-lg bg-emerald-500 text-black font-bold hover:bg-emerald-400 disabled:opacity-50',
} as const
