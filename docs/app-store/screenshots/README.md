# App Store screenshots

Captured from the Release build on iOS 26.5, with the status bar set to 9:41.

- iPhone 17 Pro Max: 1320 × 2868, App Store Connect `APP_IPHONE_67`.
- iPad Pro 13-inch: 2064 × 2752, `APP_IPAD_PRO_3GEN_129`.
- PNG, RGB, no alpha. Captures keep their original proportions.

Store order:

1. `01-metronome-light.png`
2. `02-rhythm-light.png`
3. `07-tuner-bflat-dark.png`
4. `05-metronome-dark.png`
5. `03-settings-light.png`

The tuner capture shows the real idle state and transposition control. It does not contain a fabricated pitch reading. Physical microphone response still needs review on the Gala preview.

To capture again, install a Release simulator build and run:

```sh
maestro test --device DEVICE_UDID --test-output-dir /tmp/mb-store-capture e2e/app-store-screenshots.yaml
```

Maestro writes the PNGs inside the run's `app-store-screenshots/takeScreenshot/` directory. Use that directory as the input to the branding script:

```sh
swift scripts/brand-store-screenshots.swift RAW_DIRECTORY OUTPUT_DIRECTORY
```

The original captures and upload verification manifest are under `artifacts/app-store-review/`. The store draft has these ten screenshots, with no release build selected yet.
