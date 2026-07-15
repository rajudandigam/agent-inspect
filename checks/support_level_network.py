"""Consistency: package support-level vs network-behavior claims."""

from __future__ import annotations

from typing import Any


def check_support_and_network(pkg: dict[str, Any]) -> list[str]:
    """Return list of consistency problems (empty if OK)."""
    problems: list[str] = []
    support = str(pkg.get("support_level") or pkg.get("support") or "").lower()
    network = str(pkg.get("network_behavior") or pkg.get("network") or "").lower()
    if support in {"offline", "airgapped"} and network in {"required", "egress", "online"}:
        problems.append(
            "support_level is offline/airgapped but network_behavior requires egress"
        )
    if support in {"cloud", "hosted"} and network in {"none", "disabled", "offline"}:
        problems.append(
            "support_level is cloud/hosted but network_behavior claims no network"
        )
    return problems
