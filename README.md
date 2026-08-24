# Marginally Better Music Tools

Free, open-source music tools for iPhone, built for the band student who deserves a great tuner, metronome, and practice companion without a subscription.

Tuner and Metronome are native tabs. Compact width (iPhone and iPad Split View) keeps the tab bar; regular-width iPad uses sidebar-adaptable chrome.

## Product direction

- iOS first, with Android and web kept healthy where practical
- Native Apple interaction patterns and Liquid Glass through Expo Router native tabs
- High-quality tuner, metronome, and future practice utilities
- Completely free and open source

## Local development

Requirements: Node.js 24+, npm, Xcode 26.4+, CocoaPods, and an iOS 26 simulator. Maestro CLI and Java 17+ are only needed when recording end-to-end flows.

```sh
npm ci
npm start
```

Use `npm run ios`, `npm run android`, or `npm run web` to open a target platform.

## Quality checks

```sh
npm run validate
```

That runs Expo Doctor, ESLint, TypeScript, and Jest.

Record the default Maestro smoke flow locally with:

```sh
./scripts/record-demo.sh
```

The clip is written to `artifacts/music-tools-demo.mp4`. CI does not record video.

## CI, Autoloader previews, and tagless releases

Pull requests against `main` run the validation suite, policy scripts, and an iOS Simulator Release build with an embedded JS bundle. They also archive an unsigned IPA, publish GitHub prerelease `pr-<number>`, and comment a tappable Autoloader link. Autoloader PR previews are described in [docs/AUTOLOADER_DEV_CYCLE.md](docs/AUTOLOADER_DEV_CYCLE.md).

On `main`, only these commit/PR titles produce a semantic unsigned IPA artifact:

- `fix: ...` → patch
- `feat: ...` → minor
- `feat!: ...` or `feat(scope)!: ...` → major

Other titles do not release. Versions are calculated from first-parent commit messages. Squash-merging is recommended so the PR title is retained as the commit subject. Unsigned IPAs must be signed separately before physical-device installation; Autoloader does that on-device after the first setup.

## Story acceptance

Each feature should arrive with a Maestro flow under `e2e/` that proves its acceptance criteria through visible behavior. Record that flow on this Mac with `./scripts/record-demo.sh`. The repository-local `demo-ios-story` skill documents the repeatable issue-to-PR workflow for coding agents.

## License

[MIT](LICENSE)
