# README adoption polish review (v3.5.4)

## Audit (pre-edit)

| Item | Finding |
| ---- | ------- |
| Version | **3.5.3** (sixteen linked public packages) |
| README length | ~138 lines — solid structure, weak brand/visual |
| Strengths | Install + 60s quickstart, path table, package map, safety, website links |
| Weaknesses | No centered brand/logo, no product-loop visual, duplicate docs tables, flat typography |
| Package READMEs | All 15 public scoped packages have README.md in `files` |
| Visual assets | GIFs in `docs/assets/demos/`; SVGs removed in 3.5.3 |
| Website | `apps/website` — hero: “Debug TypeScript AI agents locally”; loop: Capture → Inspect → Check → Redact |
| CHANGELOG Unreleased | Stale “post-v3.5 adoption polish” language |
| npm `files` | Missing TEAM-WORKFLOWS, DESIGN-PARTNER-GUIDE, TECHNICAL-GUIDE, framework guides, assets |

## Reference patterns (inspiration only)

- **Ponytail / Headroom:** centered brand, badges, 60s start, one proof visual
- **AI SDK / LangChain:** install near top, path-specific entry, docs links
- AgentInspect voice: practical, local-first, TypeScript, safe — not hype

## Final README structure

1. Centered logo + title + tagline + safety line  
2. Badges (npm, license, Node, TypeScript) + website/docs links  
3. Install  
4. 60-second quickstart  
5. Product-loop visual (one SVG)  
6. Choose your path  
7. What it helps with  
8. Real-world scenarios  
9. Package map  
10. Safety model  
11. Documentation (website + repo)  
12. What it is not  
13. Install/dev details  
14. Contributing  

## Link strategy

| Surface | Strategy |
| ------- | -------- |
| GitHub README | Relative `docs/*` for packaged docs; website for marketing pages |
| npm README | Same relative links for files in `package.json` `files`; absolute GitHub for examples/starters |
| Package READMEs | Absolute GitHub / website links (already) |

## Visual strategy

- `docs/assets/agent-inspect-logo.svg` (+ dark variant)
- `docs/assets/readme-product-loop.svg` — single hero visual in README
- GIFs remain in `docs/SCREENSHOTS.md` only

## Validation checklist

- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `git diff --check`
- [ ] `pnpm build` + `pnpm pack:smoke` + `npm pack --dry-run` (package files/assets)
- [ ] Linked docs exist and are in `files` or use absolute URLs
