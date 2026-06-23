# ADR-0001: Record architecture decisions

- **Status**: Accepted
- **Date**: 2026-06-23

## Context
We need a durable, reviewable trail of *why* significant technical choices were made, per the Engineering Protocol §3.

## Decision
We record every architecturally significant decision as a short Markdown ADR in `docs/adr/NNNN-title.md`, using the
Nygard format (Context · Decision · Consequences). ADRs are immutable once Accepted; a later ADR supersedes an earlier one.

## Consequences
- New contributors can read the decision history.
- Changing a protocol rule requires a new ADR, not a silent edit.
