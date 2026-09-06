const SUPPORT_PROSE_SURFACE_PACKAGES = new Map([
  [
    "Official adapters (ai-sdk, openai-agents, langchain / LangGraph fidelity classes)",
    [
      "@agent-inspect/ai-sdk",
      "@agent-inspect/openai-agents",
      "@agent-inspect/langchain",
    ],
  ],
  ["Vitest / Jest reporters", ["@agent-inspect/vitest", "@agent-inspect/jest"]],
]);

/** Parse structurally valid two-column support rows without inferring package identity. */
export function parseSupportRows(markdown) {
  return [
    ...markdown.matchAll(
      /^[ \t]*\|[ \t]*([^|\r\n]+?)[ \t]*\|[ \t]*(\w+)[ \t]*\|[ \t]*$/gm,
    ),
  ].map(([, label, level]) => ({ label: label.trim(), level }));
}

/** Resolve only explicit package identifiers and allowlisted canonical prose surfaces. */
export function resolveSupportPackages(label) {
  const packageNames = new Set();
  for (const [, name] of label.matchAll(/`(@?[a-z0-9/@-]+)`/g)) {
    packageNames.add(name);
  }

  const normalizedLabel = label.replace(/\*\*/g, "").trim();
  for (const name of SUPPORT_PROSE_SURFACE_PACKAGES.get(normalizedLabel) ?? []) {
    packageNames.add(name);
  }
  return [...packageNames];
}

/** Build package bindings while keeping every maturity value document-driven. */
export function buildSupportMatrixLevels(markdown) {
  const matrixLevels = new Map();
  for (const { label, level } of parseSupportRows(markdown)) {
    for (const name of resolveSupportPackages(label)) {
      if (!matrixLevels.has(name)) matrixLevels.set(name, { level, label });
    }
  }
  return matrixLevels;
}

/** Return the governing row only when a package README claim disagrees with it. */
export function supportLevelDisagreement(matrixLevels, packageName, declaredLevel) {
  const governing = matrixLevels.get(packageName);
  return governing && governing.level !== declaredLevel ? governing : null;
}
