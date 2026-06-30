# Current Codex Task

## Identity

```yaml
train: "v3.1.0"
chunk: "v3.1-release-prep"
status: "blocked"
executionMode: "autonomous-release-train"
```

## Manual gate

**Publish `@agent-inspect/harness` on npm** (see `docs/HARNESS.md` / prior instructions), then push local commits:

```bash
git push origin main
```

After harness is on npm, create Version Packages PR for v3.1.0.

## Next train after v3.1 publish

v3.2.0 framework adoption pack
