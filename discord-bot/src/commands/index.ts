import { ICommand } from './ICommand';
import { accountCommand } from './accountCommand';
import { linkCommand } from './linkCommand';
import { unlinkCommand } from './unlinkCommand';
import { matchAnalyzeCommand } from './matchAnalyzeCommand';
import { luckyBlessingCommand } from './luckyBlessingCommand';

export const commands: ICommand[] = [
  accountCommand,
  linkCommand,
  unlinkCommand,
  matchAnalyzeCommand,
  luckyBlessingCommand
];

export const commandMap = new Map<string, ICommand>();
export const aliasMap = new Map<string, ICommand>();

for (const cmd of commands) {
  commandMap.set(cmd.name.toLowerCase(), cmd);
  if (cmd.aliases) {
    for (const alias of cmd.aliases) {
      aliasMap.set(alias.toLowerCase(), cmd);
    }
  }
}

export function findCommand(name: string): ICommand | undefined {
  const lower = name.toLowerCase();
  return commandMap.get(lower) || aliasMap.get(lower);
}
