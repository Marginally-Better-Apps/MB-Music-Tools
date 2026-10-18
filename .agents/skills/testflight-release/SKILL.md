---
name: testflight-release
description: Sign, upload, and verify MB Music Tools builds in TestFlight using the local Apple signing handoff. Use for this repository's TestFlight releases and signing recovery.
---

# TestFlight release

`app.json` is the source of truth. Keep `expo.name` as `MB Music Tools`, `ios.bundleIdentifier` as `com.marginallybetterapps.musictools`, and `ios.config.usesNonExemptEncryption` as `false`. Read the exact Expo version docs required by `AGENTS.md` before app changes. `ios/` is generated and ignored. Prebuild generates the `MBMusicTools` workspace and scheme.

## Existing credentials

Look for `/tmp/tf-drop/meta.json`, a distribution P12, an App Store provisioning profile, and an App Store Connect P8. Metadata uses `p12_password`, `key_id`, `issuer_id`, and `team_id`. The API key may also be installed in `~/.appstoreconnect/private_keys/AuthKey_<key_id>.p8`. Never print the password or key, copy them into the repo, or attach them to a PR.

Use `node .agents/skills/testflight-release/scripts/asc-api.cjs GET '/v1/apps?filter[bundleId]=com.marginallybetterapps.musictools' - /tmp/apps.json` for authenticated requests. The helper reads local metadata or `ASC_KEY_ID`, `ASC_ISSUER_ID`, and optional `ASC_KEY_PATH`. It never prints the JWT. For mutations, pass the method, endpoint, a JSON body file, and an optional result file. A successful 204 has no response body.

Before building, use the API to look up the app by its bundle ID. Team keys require an Issuer ID. Do not misdiagnose a 401 as a missing app. A successful empty app search means the record is absent. Creating app records may require an Admin account.

Validate the inputs:

- Decode the profile with `security cms -D`. Require the explicit application identifier, `get-task-allow: false`, no `ProvisionedDevices`, and no `ProvisionsAllDevices`. Check expiration.
- Verify the P12 password using `openssl pkcs12 -legacy`, passing the password through stdin. Extract its leaf certificate and verify that its DER bytes occur in the profile's `DeveloperCertificates`.
- Confirm that the P8 is a PEM private key and that a signed API request succeeds.

If inputs are missing, request only the missing items. If the user needs a remote file handoff, see [credential-handoff.md](credential-handoff.md). Do not start a public upload endpoint when local files already suffice.

## Archive and upload

Run app validation and simulator acceptance first. Use a new numeric build number greater than the app's existing builds. Keep marketing version consistent with the intended release.

Use a temporary keychain to avoid interactive macOS prompts. Save the original user keychain search list. Generate a random password, create and unlock the temporary keychain, import the P12 with `-A`, and configure the `apple-tool:,apple:,codesign:` partition list. Prepend the keychain to the search list. Restore the original list and remove the temporary keychain in a `finally` block after signing, including on failure. Do not reuse a locked keychain with an unknown password.

Archive with the generated workspace, Release configuration, and `generic/platform=iOS`. Set `CODE_SIGN_STYLE=Manual`, `DEVELOPMENT_TEAM`, `CODE_SIGN_IDENTITY` to the verified certificate SHA1, and `PROVISIONING_PROFILE_SPECIFIER` to the verified profile UUID. If dependency targets inherit a profile incorrectly, restrict signing settings to the app target through a temporary generated-project adjustment.

Export with an ExportOptions plist using the App Store distribution method supported by the installed Xcode, manual signing, the same team, and a provisioningProfiles mapping from the bundle ID to the profile UUID. Validate the exported IPA's bundle ID, version, embedded JS, and signing.

Run `xcrun altool --upload-app` with the P8 key ID and Issuer ID. Keep the upload attached to the execution tool's live session and poll that session; a detached upload can be killed before it commits. On an ambiguous failure, query App Store Connect for the build before retrying. Never report success merely because an upload process started.

Verify `GET /v1/apps/{appId}/builds` and wait for processing to finish. Resolve export compliance using the app's declared encryption answer. Add the build to the intended internal beta group. Creating a tester may require including its `betaGroups` relationship in the initial POST; bare creation and cross-app reassignment can return 409.

Internal testing and external testing are separate states. External distribution needs a beta app localization with description and feedback email, complete beta review contact details including phone, and a beta review submission. Reuse existing contact information; do not invent it. Enable a public join link only for the intended external group when distribution is authorized. Report the actual processing and review states. Apple review may remain pending after an otherwise successful upload.

Document the build number, commit, app ID, processing state, tester link when available, and any remaining Apple review requirement in the PR. Keep account credentials out of that record.

## Reusing a CI-built IPA

When the PR's unsigned IPA has passed CI, it can be signed locally without recompiling the app. Confirm that its source commit matches the intended app code, download it from the public `pr-<number>` release, and extract it with `ditto` so executable permissions survive. Check its bundle ID, embedded JS, native modules, microphone purpose, and background-audio mode before signing.

Assign a new build number in the extracted app's Info.plist. Embed the validated App Store profile. Derive signing entitlements from that profile, specializing any wildcard keychain access group to the app's bundle ID. Reject embedded extensions unless each has its own matching profile. In the temporary keychain described above, sign embedded frameworks and dylibs from the inside out, then sign the app with its entitlements and `--generate-entitlement-der`. Verify with `codesign --verify --deep --strict`. Package the `Payload` directory into an IPA and use the same upload and API verification steps.

An initially quiet `altool` process may be running `swinfo` to inspect the package. Inspect its child process states before restarting. API authentication is supported for uploads, but the current `altool --list-providers` command does not support API-key authentication; use the API helper to verify credentials instead.
