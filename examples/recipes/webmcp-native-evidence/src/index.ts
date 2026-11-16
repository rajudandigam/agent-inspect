import { captureCase, type RecipeCaseId } from "./capture.js";

const cases: RecipeCaseId[] = [
  "good",
  "business-rejected",
  "wrong-resource",
  "missing-observer",
];

async function main() {
  const results = [];
  for (const id of cases) {
    results.push(await captureCase(id));
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        lane: "synthetic",
        native: "not_run",
        note: "Synthetic WebMCP operation-evidence cases only. Native Chromium proof lives in Trip Workbench strict evidence runs.",
        results,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
