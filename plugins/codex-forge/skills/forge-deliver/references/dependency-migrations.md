# Dependency migration workflow

1. Identify the package-manager source of truth, current version, requested target, and supported runtime range.
2. Read current primary migration guidance and release notes for the exact version boundary.
3. Update the minimum declarations and lock state, then repair actual call sites through the supported API.
4. Run package checks and integrations that exercise the changed API.
5. Separate verified repository behavior from unavailable network, platform, or production evidence.
