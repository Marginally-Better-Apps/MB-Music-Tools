# Marginally Better Music Tools

Free, open-source music tools for iPhone, built for the band student who deserves a great tuner, metronome, and practice companion without a subscription.

This first pull request intentionally keeps Expo's SDK 57 starter screen. It gives us a known baseline while we establish the engineering and story-acceptance workflow around the app.

## Product direction

- iOS first, with Android and web kept healthy where practical
- Native Apple interaction patterns and Liquid Glass through Expo Router native tabs
- High-quality tuner, metronome, and future practice utilities
- Completely free and open source

## Local development

Requirements: Node.js 24+, npm, Xcode 26.4+, CocoaPods, FFmpeg, and an iOS 26 simulator.

```sh
npm ci
npm start
```

Use `npm run ios`, `npm run android`, or `npm run web` to open a target platform.

## Quality checks

Run the complete fast validation suite:

```sh
npm run validate
```

That runs Expo Doctor, ESLint, TypeScript, and Jest. To run the iOS end-to-end test and capture its demo video, install [Maestro 2.8.0](https://docs.maestro.dev/getting-started/installing-maestro), then run:

```sh
npm run ios:e2e
```

The recorded acceptance demo is written to `artifacts/e2e-demo.mp4`.

## iOS previews

Every in-repository pull request runs the acceptance flow on an iOS simulator, records it, builds an unsigned device IPA, and updates a PR comment with:

- a public Planista link to the demo video;
- a GitHub Actions artifact link for the unsigned IPA.

Build an unsigned IPA locally with:

```sh
npm run ios:ipa
```

The result is `artifacts/MB-Music-Tools-unsigned.ipa`. An unsigned IPA cannot be installed directly by stock iOS; it must first be signed with your Apple development identity or a sideloading tool. We deliberately keep credentials out of CI.

Every push to `main` also creates a GitHub Release named for the commit and attaches the unsigned IPA.

## Story acceptance

Each feature should arrive with a Maestro flow that proves its acceptance criteria through visible behavior. The automated PR preview records that exact flow, so reviewers see the same path the test validated. The repository-local `demo-ios-story` skill documents the repeatable issue-to-PR workflow for coding agents.

## License

[MIT](LICENSE)
