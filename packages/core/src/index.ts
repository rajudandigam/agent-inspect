import chalk from "chalk";
import { nanoid } from "nanoid";

/**
 * Toolchain-only placeholder. The public API (`inspectRun`, `step`, `observe`)
 * will ship in a later implementation phase per the PRD.
 */
export function scaffoldPing(): string {
  return chalk.green(`agent-inspect:${nanoid(8)}`);
}
