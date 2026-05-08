export type TuiAction =
  | "up"
  | "down"
  | "expand"
  | "collapse"
  | "toggle"
  | "details"
  | "help"
  | "quit"
  | "unknown";

/** Map Ink `useInput` args to a semantic action. Pure helper for tests. */
export function mapInputToAction(
  input: string,
  key: Partial<{
    name: string;
    ctrl: boolean;
    meta: boolean;
    shift: boolean;
    return: boolean;
    escape: boolean;
    upArrow: boolean;
    downArrow: boolean;
    leftArrow: boolean;
    rightArrow: boolean;
  }> = {},
): TuiAction {
  if (key.escape === true) return "quit";
  if (key.ctrl === true && input === "c") return "quit";

  if (input === "q" || input === "Q") return "quit";

  if (input === "?") return "help";

  if (input === "d" || input === "D") return "details";

  if (key.return === true) return "expand";

  if (input === " ") return "toggle";

  if (key.upArrow === true || input === "k") return "up";
  if (key.downArrow === true || input === "j") return "down";
  if (key.rightArrow === true || input === "l") return "expand";
  if (key.leftArrow === true || input === "h") return "collapse";

  return "unknown";
}
