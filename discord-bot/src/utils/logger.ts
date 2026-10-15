/**
 * Custom logger with colored output matching Valorant theme
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  valorantRed: '\x1b[38;2;250;68;84m',
  radiantTeal: '\x1b[38;2;0;245;212m'
};

function timestamp(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

export const logger = {
  info(message: string, ...args: unknown[]) {
    console.log(
      `${colors.dim}[${timestamp()}]${colors.reset} ${colors.cyan}[INFO]${colors.reset} ${message}`,
      ...args
    );
  },

  success(message: string, ...args: unknown[]) {
    console.log(
      `${colors.dim}[${timestamp()}]${colors.reset} ${colors.green}[SUCCESS]${colors.reset} ${message}`,
      ...args
    );
  },

  warn(message: string, ...args: unknown[]) {
    console.warn(
      `${colors.dim}[${timestamp()}]${colors.reset} ${colors.yellow}[WARN]${colors.reset} ${message}`,
      ...args
    );
  },

  error(message: string, error?: unknown) {
    console.error(
      `${colors.dim}[${timestamp()}]${colors.reset} ${colors.valorantRed}[ERROR]${colors.reset} ${message}`,
      error !== undefined ? error : ''
    );
  },

  debug(message: string, ...args: unknown[]) {
    if (process.env.DEBUG === 'true') {
      console.log(
        `${colors.dim}[${timestamp()}]${colors.reset} ${colors.magenta}[DEBUG]${colors.reset} ${message}`,
        ...args
      );
    }
  },

  valorant(message: string, ...args: unknown[]) {
    console.log(
      `${colors.dim}[${timestamp()}]${colors.reset} ${colors.valorantRed}🎯 [VALORANT]${colors.reset} ${message}`,
      ...args
    );
  }
};
