from typing import Any
def check_tested_version_known_loss(std: dict[str, Any]) -> list[str]:
    problems = []
    tested = std.get("tested_version") or std.get("testedVersion")
    known_loss = std.get("known_loss") or std.get("knownLoss")
    if known_loss not in (None, "", [], {}) and not tested:
        problems.append("known_loss is set but tested_version is missing")
    return problems
