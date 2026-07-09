import { describe, expect, it } from "vitest";

import {
  listSuiteTemplates,
  normalizeSuiteConfig,
  resolveSuiteTemplate,
  SUITE_TEMPLATE_IDS,
} from "../../src/suite/index.js";

describe("suite templates", () => {
  it("lists all PM/QA templates", () => {
    expect(listSuiteTemplates()).toEqual([...SUITE_TEMPLATE_IDS]);
    expect(SUITE_TEMPLATE_IDS).toHaveLength(8);
  });

  it("generates deterministic valid configs", () => {
    for (const id of SUITE_TEMPLATE_IDS) {
      const config = resolveSuiteTemplate(id);
      expect(() => normalizeSuiteConfig(config)).not.toThrow();
      expect(config.name).toBe(id);
      expect(config.cases.length).toBeGreaterThan(0);
    }
  });

  it("rejects unknown template ids", () => {
    expect(() => resolveSuiteTemplate("unknown-template")).toThrow(/Unknown suite template/);
  });
});
