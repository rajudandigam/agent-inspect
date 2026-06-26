# Manual First Publication Checklist

Use this only after Codex completes chunk 20, the full v1.8 release gate passes, and Codex prepares the exact tarball.

1. Confirm the package is no longer private and is version `1.8.0`.
2. Confirm `publishConfig.access` is `public`.
3. Confirm the packed manifest contains registry versions, not `workspace:*`.
4. Clean-install the tarball and verify ESM, CJS, declarations, processor construction, and no-network behavior.
5. Inspect the tarball for source maps, declarations, licenses, and accidental fixtures/secrets.
6. Authenticate with an npm account authorized for the `@agent-inspect` scope.
7. Publish the exact validated tarball:

```bash
npm publish <validated-tarball>.tgz --access public
```

8. Verify:

```bash
npm view @agent-inspect/openai-agents@1.8.0 version
npm view @agent-inspect/openai-agents dist-tags --json
npm view @agent-inspect/openai-agents@1.8.0 dependencies peerDependencies --json
```

9. Configure package-level Trusted Publishing for `.github/workflows/publish.yml` if npm supports it for this package.
10. Start a fresh Codex thread with `PROMPT-RESUME-AFTER-OPENAI-FIRST-PUBLISH.md`.

Do not publish from an unpacked workspace directory unless the package manager has rewritten workspace dependencies and the resulting manifest/tarball was inspected.
