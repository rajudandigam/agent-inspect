#!/usr/bin/env node
/**
 * Render bounded showcase tapes from captured CLI output (no /private/tmp, no "gate" captions).
 * Requires ffmpeg on PATH. Run from repo root after generating starter traces.
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "packages/cli/dist/index.cjs");
const starter = path.join(root, "examples/starters/broken-agent-debugging");
const kit = path.join(root, "docs/demo-kit");
const out = path.join(root, "docs/assets/showcase");
const ffmpeg = "ffmpeg";

function runCli(args, cwd = starter) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: "utf8",
  });
  return {
    status: result.status ?? 1,
    stdout: (result.stdout ?? "").replace(/\r/g, ""),
  };
}

function relPath(text) {
  return text
    .replaceAll(starter, ".")
    .replaceAll("/private/tmp/agent-inspect-demo", ".")
    .replaceAll("/Users/dand/Dev/agent-inspect/examples/starters/broken-agent-debugging", ".");
}

function ff(args) {
  const result = spawnSync(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", ...args], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed: ${result.stderr || result.stdout}`);
  }
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function probe(file) {
  const result = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,duration,nb_frames",
      "-show_entries",
      "format=duration,size",
      "-of",
      "json",
      file,
    ],
    { encoding: "utf8" },
  );
  try {
    return JSON.parse(result.stdout || "{}");
  } catch {
    return {};
  }
}

function renderTranscript(id, lines, { holdLast = 2 } = {}) {
  const tmp = mkdtempSync(path.join(os.tmpdir(), `ai-tape-${id}-`));
  const framesDir = path.join(tmp, "frames");
  mkdirSync(framesDir);
  const shown = [];
  let frame = 0;
  const writeFrame = (text, copies = 1) => {
    const txt = path.join(tmp, `t${String(frame).padStart(4, "0")}.txt`);
    writeFileSync(txt, text.endsWith("\n") ? text : `${text}\n`);
    const first = path.join(framesDir, `f${String(frame).padStart(4, "0")}.png`);
    const py = spawnSync("python3", [path.join(root, "scripts/render-terminal-frame.py"), txt, first], {
      encoding: "utf8",
    });
    if (py.status !== 0) {
      throw new Error(py.stderr || py.stdout || "render-terminal-frame failed");
    }
    frame += 1;
    for (let i = 1; i < copies; i += 1) {
      copyFileSync(first, path.join(framesDir, `f${String(frame).padStart(4, "0")}.png`));
      frame += 1;
    }
  };

  writeFrame("demo $ ", 6);
  for (const line of lines) {
    if (line.startsWith("$ ")) {
      const cmd = line.slice(2);
      const prefix = "demo $ ";
      const chunk = 6;
      for (let i = 0; i <= cmd.length; i += chunk) {
        writeFrame(prefix + cmd.slice(0, i), 1);
      }
      writeFrame(`${prefix}${cmd}\n`, 2);
      shown.push(`demo $ ${cmd}`);
    } else {
      shown.push(line);
      writeFrame(`${shown.join("\n")}\n`, 4);
    }
  }
  writeFrame(`${shown.join("\n")}\n`, Math.round(holdLast / 0.08));

  const list = path.join(tmp, "frames.txt");
  writeFileSync(
    list,
    Array.from({ length: frame }, (_, i) => {
      const png = path.join(framesDir, `f${String(i).padStart(4, "0")}.png`);
      return `file '${png}'\nduration 0.08`;
    }).join("\n") + `\nfile '${path.join(framesDir, `f${String(frame - 1).padStart(4, "0")}.png`)}'\n`,
  );
  return { tmp, list, frames: frame };
}

function exportTape(id, lines, command) {
  const { tmp, list } = renderTranscript(id, lines);
  mkdirSync(path.join(out, "video"), { recursive: true });
  mkdirSync(path.join(out, "gif"), { recursive: true });
  mkdirSync(path.join(out, "posters"), { recursive: true });
  const mp4 = path.join(out, "video", `${id}.mp4`);
  const webm = path.join(out, "video", `${id}.webm`);
  const gif = path.join(out, "gif", `${id}.gif`);
  const poster = path.join(out, "posters", `${id}.png`);
  ff(["-f", "concat", "-safe", "0", "-i", list, "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4]);
  ff(["-i", mp4, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "36", webm]);
  ff(["-i", mp4, "-vf", "fps=10,scale=900:-1:flags=lanczos", "-loop", "0", gif]);
  ff(["-ss", "2", "-i", mp4, "-vframes", "1", poster]);
  rmSync(tmp, { recursive: true, force: true });
  return { id, command, mp4, webm, gif, poster };
}

if (!existsSync(cli)) {
  console.error("[showcase] build the CLI first");
  process.exit(1);
}

mkdirSync(out, { recursive: true });
mkdirSync(path.join(out, "diagrams"), { recursive: true });

const goodCheck = runCli([
  "check",
  "demo-good",
  "--dir",
  ".agent-inspect",
  "--preset",
  "trajectory",
  "--required-tool",
  "retrieve_policy",
  "--fail-on-observation",
  "failed",
]);
const regressionCheck = runCli([
  "check",
  "demo-regression",
  "--dir",
  ".agent-inspect",
  "--preset",
  "trajectory",
  "--required-tool",
  "retrieve_policy",
  "--forbidden-tool",
  "search_docs",
  "--fail-on-observation",
  "failed",
]);
const bundle = runCli([
  "bundle",
  "demo-good",
  "--dir",
  ".agent-inspect",
  "--profile",
  "share",
  "--out",
  "./evidence",
]);
const verify = runCli(["bundle", "verify", "./evidence"]);
const redact = runCli([
  "redact",
  "demo-pii",
  "--dir",
  ".agent-inspect-pii",
  "--profile",
  "share",
  "-o",
  "demo-pii.safe.jsonl",
]);

const checkLines = [
  "$ agent-inspect check demo-good --dir .agent-inspect --preset trajectory --required-tool retrieve_policy --fail-on-observation failed",
  ...relPath(goodCheck.stdout).trim().split("\n").slice(0, 8),
  `$ echo $?`,
  String(goodCheck.status),
  "$ agent-inspect check demo-regression --dir .agent-inspect --preset trajectory --required-tool retrieve_policy --forbidden-tool search_docs --fail-on-observation failed",
  ...relPath(regressionCheck.stdout).trim().split("\n").slice(0, 10),
  `$ echo $?`,
  String(regressionCheck.status),
];

const evidenceLines = [
  "$ agent-inspect bundle demo-good --dir .agent-inspect --profile share --out ./evidence",
  ...relPath(bundle.stdout).trim().split("\n"),
  "$ agent-inspect bundle verify ./evidence",
  ...relPath(verify.stdout).trim().split("\n").slice(0, 8),
];

const redactLines = [
  "$ agent-inspect redact demo-pii --dir .agent-inspect-pii --profile share -o demo-pii.safe.jsonl",
  ...relPath(redact.stdout).trim().split("\n").slice(0, 12),
];

const rendered = [
  exportTape("check-pass-fail", checkLines, "check --preset trajectory plus shorthands (pass then fail)"),
  exportTape("evidence-bundle", evidenceLines, "bundle --profile share && bundle verify"),
  exportTape("redact", redactLines, "redact --profile share writes a derived copy"),
];

function importKit(srcName, destId, kind) {
  const src = path.join(kit, srcName);
  if (!existsSync(src)) return null;
  const destMp4 = path.join(out, "video", `${destId}.mp4`);
  copyFileSync(src, destMp4);
  const webm = path.join(out, "video", `${destId}.webm`);
  const gif = path.join(out, "gif", `${destId}.gif`);
  const poster = path.join(out, "posters", `${destId}.png`);
  ff(["-i", destMp4, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "36", webm]);
  ff(["-i", destMp4, "-vf", "fps=10,scale=900:-1:flags=lanczos", "-loop", "0", gif]);
  ff(["-ss", "3", "-i", destMp4, "-vframes", "1", poster]);
  return { id: destId, command: kind, mp4: destMp4, webm, gif, poster };
}

if (existsSync(kit)) {
  const debug = importKit("01-debug-tree.mp4", "debug-tree", "list then view (source tape)");
  const explain = importKit("04-explain.mp4", "explain", "explain demo-good");
  if (debug) rendered.push(debug);
  if (explain) rendered.push(explain);
}

const CAPTIONS = {
  "check-pass-fail": {
    caption: "The same deterministic check exits 0 for demo-good and 1 for demo-regression.",
    transcript:
      "agent-inspect check demo-good --preset trajectory (exit 0); check demo-regression --preset trajectory plus shorthands (exit 1).",
  },
  "evidence-bundle": {
    caption: "Write share-checked Evidence v2 to ./evidence and verify hashes offline.",
    transcript:
      "agent-inspect bundle demo-good --profile share --out ./evidence; agent-inspect bundle verify ./evidence.",
  },
  redact: {
    caption: "redact writes a derived copy and does not mutate the source.",
    transcript: "agent-inspect redact demo-pii --profile share -o demo-pii.safe.jsonl",
  },
  "debug-tree": {
    caption: "List a local run, then inspect the execution tree.",
    transcript: "agent-inspect list --dir .agent-inspect; agent-inspect view demo-good --summary",
  },
  explain: {
    caption: "explain summarizes the local demo-good run.",
    transcript: "agent-inspect explain demo-good --dir .agent-inspect",
  },
};

const provenance = {
  generatedAt: "1970-01-01T00:00:00.000Z",
  packageVersion: JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version,
  rejected: [
    {
      path: "docs/demo-kit/b77a3f11-0728-4ddc-89ea-e27049ddd2e4.gif",
      reason: "PNG mislabeled as GIF; zero animation frames",
    },
    {
      path: "docs/demo-kit/06-run-live.mp4",
      reason: "Not re-recorded from the canonical starter; omitted from published showcase",
    },
    {
      path: "docs/demo-kit/02-gate-pass-fail.mp4",
      reason: "Captioned check as gate and used /private/tmp; re-recorded as check-pass-fail",
    },
  ],
  assets: rendered.map((item) => {
    const info = probe(item.gif);
    const stream = info.streams?.[0] ?? {};
    const format = info.format ?? {};
    const meta = CAPTIONS[item.id] ?? {};
    return {
      id: item.id,
      command: item.command,
      files: {
        gif: path.relative(root, item.gif),
        mp4: path.relative(root, item.mp4),
        webm: path.relative(root, item.webm),
        poster: path.relative(root, item.poster),
      },
      sha256: {
        gif: sha256(item.gif),
        mp4: sha256(item.mp4),
        webm: sha256(item.webm),
      },
      width: stream.width,
      height: stream.height,
      durationSec: Number(stream.duration || format.duration || 0),
      caption: meta.caption ?? item.command,
      transcript: meta.transcript ?? item.command,
      bytes: {
        gif: Number(format.size || 0) || readFileSync(item.gif).byteLength,
      },
    };
  }),
};

writeFileSync(path.join(out, "provenance.json"), `${JSON.stringify(provenance, null, 2)}\n`);
console.log(`[showcase] wrote ${rendered.length} tapes to docs/assets/showcase`);
