# @agent-inspect/tui

Optional terminal UI for `agent-inspect view --tui`.

## When to use

- Interactive local trace browsing in the terminal

## When not to use

- CI logs (use `report` / JSON)
- Terminals without basic Unicode/color support

## Install

```bash
npm install @agent-inspect/tui
```

## Example

```bash
npx agent-inspect view <run-id> --tui
```

## Privacy

- Reads local trace files only

## API

| Export | Purpose |
| ------ | ------- |
| `mapInputToAction` | Keybindings |
| `countTreeSteps` | Tree helpers |

## Limitations

- Experimental UX; prefer `view` / VS Code for large traces
- Terminal compatibility varies (iTerm, VS Code terminal, etc.)

## Version

`3.5.x`

## License

MIT
