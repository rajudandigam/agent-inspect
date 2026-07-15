#!/usr/bin/env node
/**
 * Create AgentInspect 6.7.3 pre-v7 evidence OSS issue batch.
 *
 * Default: DRY_RUN (no GitHub mutations).
 * Create only when OSS_APPLY=1 and DRY_RUN is not "1".
 *
 * Usage:
 *   DRY_RUN=1 node scripts/create-oss-issue-batch-6.7.3-02.mjs
 *   OSS_APPLY=1 DRY_RUN=0 node scripts/create-oss-issue-batch-6.7.3-02.mjs
 *
 * Optional: OSS_PROJECT_NUMBER=1 to add created issues to a user project.
 * Never publishes, tags, releases, or changes collaborators.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REPO = process.env.OSS_REPO || 'rajudandigam/agent-inspect';
const BATCH_DIR = path.join(ROOT, '.github', 'LIVE_ISSUE_BATCH_6_7_ADOPTION_02');
const CREATED_MAP = path.join(ROOT, 'docs', 'community', 'CREATED-OSS-ISSUES-6.7.3-02.md');

const DRY_RUN = process.env.DRY_RUN !== '0';
const OSS_APPLY = process.env.OSS_APPLY === '1';
const PROJECT_NUMBER = process.env.OSS_PROJECT_NUMBER || '';

/** @type {{ file: string, title: string, milestone: string, labels: string[] }[]} */
const ISSUES = [
  {
    file: '001-external-pilot-feedback-form.md',
    title: 'Add external pilot feedback form and anonymized evidence template',
    milestone: 'External Pilot & Adoption',
    labels: [
      'documentation',
      'good first issue',
      'area:community',
      'community-owned',
      'status:ready',
      'priority:p1',
    ],
  },
  {
    file: '002-sync-pilot-kit-to-6.7.3.md',
    title: 'Sync pre-v7 pilot kit and adoption-evidence docs to 6.7.3',
    milestone: 'External Pilot & Adoption',
    labels: [
      'documentation',
      'testing',
      'good first issue',
      'area:community',
      'area:release',
      'community-owned',
      'status:ready',
      'priority:p1',
    ],
  },
  {
    file: '003-retained-ci-gate-pilot-recipe.md',
    title: 'Add a retained TraceContract/suite CI-gate pilot recipe',
    milestone: 'External Pilot & Adoption',
    labels: [
      'examples',
      'testing',
      'area:core',
      'community-owned',
      'status:ready',
      'difficulty:intermediate',
      'priority:p1',
      'support:beta',
    ],
  },
  {
    file: '004-windows-node22-esm-consumer-evidence.md',
    title: 'Record Windows Node 22 ESM packed-consumer evidence',
    milestone: '6.7.3 — Correctness & Portability',
    labels: [
      'testing',
      'area:release',
      'community-owned',
      'status:ready',
      'difficulty:intermediate',
      'priority:p1',
      'support:stable',
    ],
  },
  {
    file: '005-macos-cjs-consumer-evidence.md',
    title: 'Record macOS Node 20/22 CJS packed-consumer evidence',
    milestone: '6.7.3 — Correctness & Portability',
    labels: [
      'testing',
      'area:release',
      'community-owned',
      'status:ready',
      'difficulty:intermediate',
      'priority:p1',
      'support:stable',
    ],
  },
  {
    file: '006-node24-esm-cjs-consumer-evidence.md',
    title: 'Extend packed-consumer compatibility evidence to Node 24 ESM and CJS',
    milestone: '6.7.3 — Correctness & Portability',
    labels: [
      'testing',
      'area:release',
      'community-owned',
      'status:ready',
      'difficulty:intermediate',
      'priority:p2',
      'support:stable',
    ],
  },
  {
    file: '007-native-sqlite-install-matrix.md',
    title: 'Add native SQLite clean-install compatibility matrix',
    milestone: '6.7.3 — Correctness & Portability',
    labels: [
      'testing',
      'area:index',
      'area:release',
      'community-owned',
      'status:ready',
      'difficulty:advanced',
      'priority:p1',
      'support:beta',
    ],
  },
  {
    file: '008-extend-packed-golden-path-e2e.md',
    title: 'Extend packed golden-path E2E through report, check, bundle, and verify-safe',
    milestone: 'Golden Path & Examples',
    labels: [
      'testing',
      'examples',
      'area:core',
      'area:release',
      'community-owned',
      'status:ready',
      'difficulty:advanced',
      'priority:p1',
    ],
  },
  {
    file: '009-contract-fail-then-pass-fixture.md',
    title: 'Add broken-run → contract-fail → fixed-run golden-path fixture',
    milestone: 'Golden Path & Examples',
    labels: [
      'fixtures',
      'examples',
      'testing',
      'area:core',
      'community-owned',
      'status:ready',
      'difficulty:intermediate',
      'priority:p1',
      'support:beta',
    ],
  },
  {
    file: '010-safe-bundle-studio-import.md',
    title: 'Add share-safe bundle → local Studio import walkthrough',
    milestone: 'Golden Path & Examples',
    labels: [
      'documentation',
      'examples',
      'area:studio',
      'community-owned',
      'status:ready',
      'difficulty:intermediate',
      'priority:p2',
      'support:beta',
    ],
  },
  {
    file: '011-github-artifact-studio-import.md',
    title: 'Add GitHub Actions artifact → Studio import walkthrough',
    milestone: 'External Pilot & Adoption',
    labels: [
      'documentation',
      'examples',
      'testing',
      'area:studio',
      'community-owned',
      'status:ready',
      'difficulty:advanced',
      'priority:p2',
      'support:preview',
    ],
  },
  {
    file: '012-standards-preservation-corpus.md',
    title: 'Add OTLP/OpenInference preservation corpus for scope, links, events, and extensions',
    milestone: 'Standards Evidence',
    labels: [
      'testing',
      'fixtures',
      'area:standards',
      'integration:otel',
      'integration:openinference',
      'community-owned',
      'status:ready',
      'difficulty:advanced',
      'priority:p1',
      'support:preview',
    ],
  },
  {
    file: '013-standards-version-loss-consistency.md',
    title: 'Add standards tested-version and known-loss consistency check',
    milestone: 'Standards Evidence',
    labels: [
      'documentation',
      'testing',
      'good first issue',
      'area:standards',
      'community-owned',
      'status:ready',
      'priority:p1',
      'support:preview',
    ],
  },
  {
    file: '014-local-collector-roundtrip.md',
    title: 'Add local OpenTelemetry Collector round-trip recipe',
    milestone: 'Standards Evidence',
    labels: [
      'examples',
      'testing',
      'area:standards',
      'integration:otel',
      'community-owned',
      'status:ready',
      'difficulty:advanced',
      'priority:p1',
      'support:preview',
    ],
  },
  {
    file: '015-mcp-protocol-state-corpus.md',
    title: 'Add MCP protocol-state fixture corpus',
    milestone: 'Standards Evidence',
    labels: [
      'fixtures',
      'testing',
      'area:mcp',
      'integration:mcp',
      'community-owned',
      'status:ready',
      'difficulty:intermediate',
      'priority:p1',
      'support:supported',
    ],
  },
  {
    file: '016-writer-shutdown-concurrency-corpus.md',
    title: 'Add writer crash, concurrency, and shutdown regression corpus',
    milestone: '6.7.3 — Correctness & Portability',
    labels: [
      'testing',
      'area:core',
      'community-owned',
      'status:ready',
      'difficulty:advanced',
      'priority:p1',
      'support:stable',
    ],
  },
  {
    file: '017-third-party-adapter-conformance-ci.md',
    title: 'Add third-party adapter conformance CI template',
    milestone: 'Golden Path & Examples',
    labels: [
      'documentation',
      'testing',
      'area:adapters',
      'community-owned',
      'status:ready',
      'difficulty:intermediate',
      'priority:p2',
      'support:beta',
    ],
  },
  {
    file: '018-readme-support-network-consistency.md',
    title: 'Add package README support-level and network-behavior consistency check',
    milestone: 'Contributor Experience — 2026 Q3',
    labels: [
      'documentation',
      'testing',
      'good first issue',
      'area:release',
      'area:community',
      'community-owned',
      'status:ready',
      'priority:p2',
    ],
  },
  {
    file: '019-large-directory-performance-evidence.md',
    title: 'Add large trace-directory warning and performance evidence suite',
    milestone: '6.7.3 — Correctness & Portability',
    labels: [
      'testing',
      'fixtures',
      'area:index',
      'area:workspace',
      'community-owned',
      'status:ready',
      'difficulty:intermediate',
      'priority:p2',
      'support:beta',
    ],
  },
];

/** Semantic skip map from Phase 1 (titles that must not be created if already open with same scope). Empty for this batch. */
const SEMANTIC_SKIP_TITLES = new Set();

function fail(message) {
  console.error(`[oss-batch-6.7.3-02] ERROR: ${message}`);
  process.exit(1);
}

function ghJson(args) {
  const r = spawnSync('gh', args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  if (r.status !== 0) {
    fail(`gh ${args.join(' ')} failed:\n${r.stderr || r.stdout}`);
  }
  return JSON.parse(r.stdout || 'null');
}

function ghOk(args) {
  const r = spawnSync('gh', args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  return { status: r.status ?? 1, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function stripFrontMeta(markdown) {
  // Bodies are pure markdown; ensure title heading is not duplicated as body only.
  // GitHub issue body uses content after first H1 (script passes --title separately).
  const lines = markdown.split(/\r?\n/);
  if (lines[0]?.startsWith('# ')) {
    return lines.slice(1).join('\n').replace(/^\n+/, '');
  }
  return markdown;
}

function main() {
  console.log(`[oss-batch-6.7.3-02] repo=${REPO}`);
  console.log(`[oss-batch-6.7.3-02] DRY_RUN=${DRY_RUN} OSS_APPLY=${OSS_APPLY}`);

  const auth = ghOk(['auth', 'status']);
  if (auth.status !== 0) {
    fail('gh auth status failed — run: gh auth refresh -h github.com');
  }
  console.log('[oss-batch-6.7.3-02] gh auth OK');

  if (!existsSync(BATCH_DIR)) fail(`missing batch dir ${BATCH_DIR}`);
  const files = readdirSync(BATCH_DIR).filter((f) => f.endsWith('.md')).sort();
  if (files.length !== ISSUES.length) {
    fail(`expected ${ISSUES.length} markdown files, found ${files.length}`);
  }

  const existing = ghJson([
    'issue',
    'list',
    '--repo',
    REPO,
    '--state',
    'all',
    '--limit',
    '500',
    '--json',
    'number,title,state,url',
  ]);
  const byTitle = new Map(existing.map((i) => [i.title, i]));

  const labelList = ghJson(['label', 'list', '--repo', REPO, '--limit', '300', '--json', 'name']);
  const labelNames = new Set(labelList.map((l) => l.name));

  const milestones = ghJson([
    'api',
    '--paginate',
    `repos/${REPO}/milestones?state=open`,
  ]);
  const milestoneByTitle = new Map(milestones.map((m) => [m.title, m]));

  const requiredLabels = new Set(ISSUES.flatMap((i) => i.labels));
  for (const name of requiredLabels) {
    if (!labelNames.has(name)) fail(`missing label: ${name}`);
  }
  console.log(`[oss-batch-6.7.3-02] labels OK (${requiredLabels.size} unique)`);

  for (const issue of ISSUES) {
    if (!milestoneByTitle.has(issue.milestone)) {
      fail(`missing open milestone: ${issue.milestone}`);
    }
  }
  console.log('[oss-batch-6.7.3-02] milestones OK');

  /** @type {{ file: string, title: string, action: string, reason?: string, number?: number, url?: string }[]} */
  const plan = [];

  for (const issue of ISSUES) {
    const fullPath = path.join(BATCH_DIR, issue.file);
    if (!existsSync(fullPath)) fail(`missing body ${issue.file}`);
    const bodyRaw = readFileSync(fullPath, 'utf8');
    const h1 = bodyRaw.match(/^# (.+)$/m)?.[1]?.trim();
    if (h1 && h1 !== issue.title) {
      fail(`title mismatch in ${issue.file}: file H1 "${h1}" vs manifest "${issue.title}"`);
    }

    if (SEMANTIC_SKIP_TITLES.has(issue.title)) {
      plan.push({ file: issue.file, title: issue.title, action: 'SKIP_SEMANTIC' });
      continue;
    }

    const hit = byTitle.get(issue.title);
    if (hit) {
      plan.push({
        file: issue.file,
        title: issue.title,
        action: 'SKIP_EXACT_TITLE',
        reason: `${hit.state} #${hit.number} ${hit.url}`,
        number: hit.number,
        url: hit.url,
      });
      continue;
    }

    plan.push({ file: issue.file, title: issue.title, action: 'CREATE' });
  }

  console.log('\n[oss-batch-6.7.3-02] plan:');
  for (const row of plan) {
    console.log(`  ${row.action.padEnd(18)} ${row.file} — ${row.title}${row.reason ? ` (${row.reason})` : ''}`);
  }

  const toCreate = plan.filter((p) => p.action === 'CREATE');
  console.log(`\n[oss-batch-6.7.3-02] create count: ${toCreate.length}`);

  if (DRY_RUN || !OSS_APPLY) {
    console.log(
      '\n[oss-batch-6.7.3-02] DRY RUN — no issues created. Set OSS_APPLY=1 DRY_RUN=0 after maintainer approval.',
    );
    if (!PROJECT_NUMBER) {
      console.log(
        '[oss-batch-6.7.3-02] Manual project add later: open https://github.com/users/rajudandigam/projects/1 and add created issues.',
      );
    }
    return;
  }

  /** @type {{ file: string, title: string, number: number, url: string, labels: string[], milestone: string }[]} */
  const created = [];

  for (const issue of ISSUES) {
    const row = plan.find((p) => p.file === issue.file);
    if (!row || row.action !== 'CREATE') continue;

    const body = stripFrontMeta(readFileSync(path.join(BATCH_DIR, issue.file), 'utf8'));
    const args = [
      'issue',
      'create',
      '--repo',
      REPO,
      '--title',
      issue.title,
      '--body',
      body,
      '--milestone',
      issue.milestone,
    ];
    for (const label of issue.labels) {
      args.push('--label', label);
    }

    console.log(`[oss-batch-6.7.3-02] MUTATE create: ${issue.title}`);
    const r = spawnSync('gh', args, { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 });
    if (r.status !== 0) {
      fail(`create failed for ${issue.file}:\n${r.stderr || r.stdout}`);
    }
    const url = (r.stdout || '').trim();
    const numberMatch = url.match(/\/issues\/(\d+)/);
    if (!numberMatch) fail(`could not parse issue number from: ${url}`);
    const number = Number(numberMatch[1]);
    created.push({
      file: issue.file,
      title: issue.title,
      number,
      url,
      labels: issue.labels,
      milestone: issue.milestone,
    });
    console.log(`[oss-batch-6.7.3-02] created #${number} ${url}`);

    if (PROJECT_NUMBER) {
      console.log(`[oss-batch-6.7.3-02] MUTATE project-item add #${number} → project ${PROJECT_NUMBER}`);
      const pr = ghOk([
        'project',
        'item-add',
        PROJECT_NUMBER,
        '--owner',
        'rajudandigam',
        '--url',
        url,
      ]);
      if (pr.status !== 0) {
        console.warn(
          `[oss-batch-6.7.3-02] project add failed for #${number}: ${pr.stderr || pr.stdout}`,
        );
        console.warn(
          '[oss-batch-6.7.3-02] Manual: add issue to https://github.com/users/rajudandigam/projects/1',
        );
      }
    }
  }

  const lines = [
    '# Created OSS Issues — 6.7.3 Adoption Evidence (02)',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Repo: ${REPO}`,
    '',
    '| File | Number | Title | URL | Milestone |',
    '| ---- | ------ | ----- | --- | --------- |',
    ...created.map(
      (c) =>
        `| \`${c.file}\` | #${c.number} | ${c.title} | ${c.url} | ${c.milestone} |`,
    ),
    '',
    'Labels and milestones applied per apply manifest.',
    '',
  ];
  writeFileSync(CREATED_MAP, lines.join('\n'));
  console.log(`[oss-batch-6.7.3-02] wrote ${CREATED_MAP}`);

  if (!PROJECT_NUMBER) {
    console.log(
      '[oss-batch-6.7.3-02] Manual project add: https://github.com/users/rajudandigam/projects/1',
    );
    for (const c of created) console.log(`  - #${c.number} ${c.url}`);
  }

  console.log(`[oss-batch-6.7.3-02] done — created ${created.length} issues`);
}

main();
