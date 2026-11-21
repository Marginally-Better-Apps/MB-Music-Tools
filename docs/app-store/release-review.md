# App Store release review

Reviewed October 9, 2026. The app is free, with no ads, subscriptions, purchases, or account requirement.

The release scope is a tuner and metronome. No additional practice feature is required to ship this version.

## Features present

- Chromatic tuner with note and cents display, an in-tune haptic, silence/noise rejection, and microphone permission recovery.
- Concert, B-flat, E-flat, and F written-note transposition, saved between launches.
- Metronome at 30–300 BPM, tap tempo, drag controls, downbeat accents, and six click rhythms.
- Common and custom time signatures, with 1–32 beats and note units from 1 through 32.
- Background playback, audio interruption handling, and saved practice settings.
- Native iPhone tabs, iPad sidebar, automatic/light/dark appearance, and open-source notices.

## Consistency with MB Converter

Compared the latest `origin/main` in an isolated worktree at commit `b59a15e`. The sibling checkout's uncommitted work was preserved.

Both apps use a Settings sheet with native grouped sections and an appearance picker. Music Tools now has a branded app header, Name/Version/Build rows, View on GitHub, and Open Source Licenses. Converter's history and diagnostics controls are specific to conversion and do not belong in this app.

Music Tools also includes an on-device privacy policy and Help and Feedback. The Phosphor icon's source and MIT notice are in Settings > Open Source Licenses > Phosphor Icons and in `assets/icon-source/`.

The microphone permission message now says "your device" so its wording also fits iPad.

## Optional future features

- Reference pitch adjustment such as A = 442 Hz. This release uses A = 440 Hz.
- A wider pitch range for very low brass notes. The current detector accepts approximately 55–2000 Hz, so notes below A1 are outside its range.
- Drones, practice logs, setlists, and additional transpositions.

These are product choices, not completed features. The listing describes the current app.

## Apple preparation

App ID `6814243665`, bundle ID `com.marginallybetterapps.musictools`, version `1.0.0`.

Saved the description, subtitle, keywords, support/privacy URL, copyright, Music category, content-rights declaration, review notes, and existing beta review contact. Saved and verified a free price, enabled all 175 storefronts, and completed the age-rating answers for a 4+ rating. Following owner approval on October 9, release is set to automatic after Apple approval.

Support and privacy: https://planista.shloklab.us/XCVprRN6-T7j9vTO

Existing beta builds 1–4 predate these changes and are not the final release candidate. Distribution-signed build 6 contains the approved preview code.

## Final Gala preview

Delivered build **5** through Gala on October 9, 2026:

https://shloks-macbook-air.taildb44.ts.net/gala/mb-music-tools-51d8bc43/

Signing and delivery passed. The HTTPS install page returned 200 and identifies MB Music Tools build 5. Downloaded the signed IPA and verified its checksum, bundle ID, version 1.0.0/build 5, corrected microphone prompt, and deep code signature. It targets iPhone and iPad, with two devices in its development profile. The owner approved proceeding with publication on October 9. Gala delivery links expire after 48 hours.

The fresh unsigned Release archive passed native-module, microphone-purpose, background-audio, encryption-answer, iPhone/iPad-family, and embedded-JavaScript checks. It can supply the approved App Store build after distribution signing; no second full native compilation should be needed.

Unsigned IPA: `artifacts/app-store-review/MB-Music-Tools-preview-unsigned.ipa`.

Unsigned SHA-256: `de684c9fe20d7c3e57c8edc223a9e351df3cde78e0fed80987be91436e3ffffb`.

Gala signed SHA-256: `23c004efce45441134961e89eb0bf98585a4f6e0634277b334c1f0cc0e1f00cc`.

The source is the current working tree on `redesign/minimal-instruments`, based on commit `819c180`. Changes are not committed. The pre-existing `ios-build.sh` edit was preserved.

After preview delivery, the App Store draft remained Prepare for Submission with no selected build. Owner approval now authorizes upload and review submission.

## Review submission

Owner approval received October 9. Uploaded build 6, confirmed successful processing, selected it for version 1.0.0, and added it to the internal Team TestFlight group.

Apple accepted the App Store review submission at **2026-10-09 19:07:48 UTC**. Independently re-read both the review submission and the store version: both report **WAITING_FOR_REVIEW**, and the version selects build 6 with **AFTER_APPROVAL** release. The app will publish automatically after Apple approves it. It is not live yet.

The submission checks reported no missing privacy, agreement, or storefront requirement. Browser automation was unavailable, so the App Privacy questionnaire itself was not inspected. The reviewed app has no app-side data collection or tracking; microphone audio stays on the device. A public privacy policy is saved in the listing. The earlier request for a manual privacy step is no longer blocking submission.

App Store Connect: https://appstoreconnect.apple.com/apps/6814243665/distribution

## Distribution build

Signed the tested unsigned archive as version 1.0.0, build 6, with the account's existing valid Apple Distribution certificate. Created an explicit App Store profile matching that certificate and the Music Tools bundle ID. Verified its expiration, certificate match, disabled debugging entitlement, absence of device restrictions, and the complete app's deep signature. The temporary signing keychain was removed and the original keychain search list restored.

IPA: `artifacts/app-store-review/MB-Music-Tools-App-Store-1.0.0-6.ipa`.

SHA-256: `b6a3978e4700814c3a64d37776f417c2e5e5cd31394805d998acbeffd35065b6`.

Native SDK build: `23F73` (Xcode 26.5). Signing details are in `artifacts/app-store-review/app-store-signing-result.json`. Apple's package validation and upload both succeeded with no errors. Delivery ID and processed build ID: `b0ddfbf8-b730-48d3-8965-bdf1a5778d7c`. Server processing is **VALID**, App Store eligible, with `usesNonExemptEncryption: false`. Apple's build-bundle metadata confirms SDK and platform build `23F73`.

Review submission ID: `ba87436e-a610-4c43-bc47-bec44ca7f77f`. State: **WAITING_FOR_REVIEW**. Release evidence is saved in `artifacts/app-store-review/app-store-release-state.json` and the validation, upload, and delivery-status logs in that directory.

## Validation and screenshots

Expo Doctor: 20/20 checks passed after updating six SDK 57 patch versions.

Native pitch detector tests passed for pure tones, harmonics, silence, low input levels, and noise. Native metronome audio tests passed for 100 measures and 1,600 audible pulses at 300 BPM with sixteenth-note clicks.

ESLint and TypeScript passed. All 15 Jest suites and 103 tests passed with the 60-second test timeout used by the existing Gala recipe. The initial run hit the default five-second timeout in the large license-screen test.

The Release simulator build passed. The screenshot acceptance flow passed on iPhone 17 Pro Max and iPad Pro 13-inch. It checks metronome start/stop, 6/8 triplet playback, appearance changes, settings navigation, icon attribution, tuner permission state, and B-flat transposition.

The existing custom-meter and preferences flows also passed on iPad, including 32/32 playback and saved tempo, meter, rhythm, and appearance after relaunch.

The microphone denial/recovery flow passed on iPhone SE. The small-phone UI flow also passed, including metronome start/stop, scrolling to 16th-note rhythm selection, the privacy page, icon attribution, and E-flat transposition. The flow handles the first-launch permission dialog and scrolls before tapping a SwiftUI control below the visible area.

One small-phone playback rerun failed under simulator CoreAudio overload and invalid audio-device errors. It did not reproduce after restarting our simulator. The later failures in rhythm selection came from the test's label and scroll targeting, and were corrected in the flow. Physical playback, microphone response, haptics, and interruption checks remain part of the owner's Gala review.

Five branded screenshots for each device size are in `docs/app-store/screenshots/`. All ten uploaded App Store Connect assets reached COMPLETE, and their checksums match the final PNGs. The upload manifest is `artifacts/app-store-review/screenshot-upload-manifest.json`. Raw captures remain under `artifacts/app-store-review/raw-iphone/` and `raw-ipad/`.

Screenshot sheet: https://planista.shloklab.us/qx8BewrWhhYRmzE2

The local Xcode 26.5 SDK stat-cache helper stalled. Local build commands disable it with `SDK_STAT_CACHE_ENABLE=NO`. Simulator screenshots use `ARCHS=arm64 ONLY_ACTIVE_ARCH=YES` on this Apple Silicon Mac.
