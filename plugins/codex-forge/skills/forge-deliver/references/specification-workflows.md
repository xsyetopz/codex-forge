# Specification workflows

## Outcome contract

Before implementation, record the user-visible outcome, constraints, rejected assumptions, and observable acceptance criteria. Describe what and why before prescribing how; resolve only ambiguities that change the implementation boundary.

## Repository context

Map the owning symbols, callers, consumers, and affected tests. Prefer graph-derived impact context when the repository provides it, then use the smallest affected regression set as an executable specification.

## Delivery boundary

Keep requirements and implementation synchronized through targeted changes rather than regenerating unrelated code. Treat deterministic tests and validators as authority for state transitions; prompts guide work but do not replace enforcement.
