"""Consistency: tested-version vs known-loss fields."""

from __future__ import annotations

from typing import Any


def check_tested_version_known_loss(std: dict[str, Any]) -> list[str]:
    problems: list[str] = []
    tested = std.get("tested_version") or std.get("testedVersion")
    known_loss = std.get("known_loss") or std.get("knownLoss")
    if known_loss not in (None, "", [], {}):
        if not tested:
            problems.append("known_loss is set but tested_version is missing")
    return problems
