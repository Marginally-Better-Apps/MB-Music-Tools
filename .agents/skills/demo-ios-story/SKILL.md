---
name: demo-ios-story
description: Implement and prove an iOS story from a GitHub issue through a pull request, including a Maestro acceptance flow, a simulator recording, a public Planista video permalink, and an unsigned IPA artifact. Use for feature issues, acceptance demos, PR previews, or changes to this repository's issue-to-PR delivery workflow.
---

# Demo an iOS Story

Deliver visible proof from the same end-to-end flow used for acceptance.

## Workflow

1. Read the GitHub issue and translate each observable acceptance criterion into a Maestro assertion or interaction in `.maestro/`. Ask only when the issue leaves a materially different product choice unresolved.
2. Inspect `AGENTS.md` and the exact versioned Expo documentation before changing app code. Keep iOS behavior and current Apple design conventions primary.
3. Implement the smallest complete story. Add or update unit tests for logic and components; do not substitute snapshots for behavioral E2E coverage.
4. Run `npm run validate`.
5. Run `npm run ios:e2e`. This builds the iOS simulator app, executes the Maestro flow, and records `artifacts/e2e-demo.mp4`.
6. Watch the recording before publishing it. Confirm it shows the whole acceptance path, contains no secrets or personal data, and ends in the expected state.
7. Upload the video with `scripts/upload-demo.sh artifacts/e2e-demo.mp4`. Treat the returned Planista link as public and unlisted.
8. Run `npm run ios:ipa` and verify `artifacts/MB-Music-Tools-unsigned.ipa` is a readable ZIP containing `Payload/*.app`.
9. After receiving authorization for each required Git operation, create or update one draft PR. Link the issue and include test results, the raw Planista demo permalink, and the unsigned IPA artifact link. Never claim the unsigned IPA installs directly: it must be signed before use on a physical iPhone.
10. Wait for CI. If CI records a newer successful demo, prefer its Planista link so the proof matches the reviewed commit.

## Acceptance-flow rules

- Assert user-visible outcomes, not implementation details.
- Give one story a focused flow; split unrelated journeys into separate YAML files.
- Reset app state when independence matters.
- Use accessibility text or stable IDs instead of coordinates.
- Make the recorded path understandable without narration.
- Never upload recordings that expose credentials, tokens, private user information, or unreleased confidential material.

## PR handoff

Report the issue, acceptance criteria covered, validation commands, Planista recording URL, IPA artifact URL, unsigned-installation caveat, and any intentional follow-up. The repository workflows update a marked PR comment rather than creating duplicate preview comments.
