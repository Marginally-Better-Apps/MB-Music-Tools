---
name: demo-ios-story
description: Implement and prove an iOS story from a GitHub issue through a pull request, including a Maestro acceptance flow, a local simulator recording, and Autoloader unsigned IPA previews from CI. Use for feature issues, acceptance demos, PR previews, or changes to this repository's issue-to-PR delivery workflow.
---

# Demo an iOS Story

Deliver visible proof from the same end-to-end flow used for acceptance. Record on this Mac. Do not put Maestro or Planista in CI.

## Workflow

1. Read the GitHub issue and translate each observable acceptance criterion into a Maestro assertion or interaction in `e2e/`. Ask only when the issue leaves a materially different product choice unresolved.
2. Inspect `AGENTS.md` and the exact versioned Expo documentation before changing app code. Keep iOS behavior and current Apple design conventions primary.
3. Implement the smallest complete story. Add or update unit tests for logic and components; do not substitute snapshots for behavioral E2E coverage.
4. Run `npm run validate`.
5. Run `./scripts/record-demo.sh` (optional second argument is the output path, optional third is `iPhone` or `iPad`). Watch the recording. Confirm it shows the whole acceptance path, contains no secrets or personal data, and ends in the expected state.
6. After receiving authorization for each required Git operation, create or update one ready-for-review PR against `main`. Link the issue. If you have a recording worth sharing, upload it with the file-upload skill and comment the permalink. Do not wait for CI to record video; it will not.
7. Wait for CI. The unsigned IPA preview is the Autoloader comment, not a GitHub Actions artifact page. Autoloader signs on-device. Never claim the raw IPA installs on a physical iPhone without signing.

## Acceptance-flow rules

- Assert user-visible outcomes, not implementation details.
- Give one story a focused flow; split unrelated journeys into separate YAML files.
- Reset app state when independence matters.
- Use accessibility text or stable IDs instead of coordinates.
- Make the recorded path understandable without narration.
- Bound the recorded interactions with `startRecording` and `stopRecording`.
- Never upload recordings that expose credentials, tokens, private user information, or unreleased confidential material.

## PR handoff

Report the issue, acceptance criteria covered, validation commands, local recording path or permalink if you published one, and the Autoloader preview once CI comments it. The unsigned-IPA workflow updates a marked PR comment rather than creating duplicate preview comments.
