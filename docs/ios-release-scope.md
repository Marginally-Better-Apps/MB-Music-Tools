# iOS instrument release

One release combines the open backlog with appearance settings and credits. The approved scrub and tap tempo interaction stays. Instrument screens use numbers, musical notation, SF Symbols, and the Tuner / Metronome tabs. Settings and microphone recovery use only necessary labels.

## Combined scope

- #39: scrub and tap tempo, custom meter, six click rhythms and downbeat emphasis.
- #20: restore tempo, meter and rhythm after relaunch.
- #21: keep native audio playing while locked or backgrounded.
- #23: native microphone pitch detection, large note and cents, level geometry and one haptic when entering tune.
- #24: settled silence, honest permission denial and Settings recovery.
- #25: persistent Concert, B♭, E♭ and F written-note transposition.
- Settings: system / light / dark appearance, repository link and bundled open-source licenses.
- Delivery: one feature PR, green CI, public Autoloader preview and TestFlight upload where the account permits.

#22 and #26 require real musicians to practice and report feedback. This release supplies their build. They remain open until that feedback exists.

## Original issue details

### #20 Remember the last tempo after relaunch

Nobody wants to re-enter 72 every time they open the app. Last BPM, time signature, and click rhythm come back on launch.

Depends on the shipped scrub UI in #39 (PR #38). Signatures and rhythm now exist, so this covers all three.

## Done when

- Killing and relaunching the app restores the last BPM, time signature (e.g. 7/8), and click rhythm (e.g. triplet).
- A fresh install still starts at 120, 4/4, quarter.
- Jest or an integration test covers read/write of the stored values. Do not snapshot the whole screen.

## Leave for later

- Setlists, named marks, or a history list
- Sync across devices

### #21 Metronome keeps clicking when the phone sleeps

Practice happens with the phone on a stand, screen dark. If the click dies when iOS backgrounds the app, testers will go back to a $2 clip-on.

Depends on the clicking metronome.

## Done when

- Starting the metronome keeps the click going through lock screen and app switcher, until the student stops it.
- Stopping still goes silent.
- The Info.plist / Expo audio session is set for playback, not a one-shot effect.
- Maestro can prove start/stop in-app. Lock-screen proof is a short clip or notes on the PR from a simulator or device, not a fake E2E sleep.

## Leave for later

- Lock-screen media controls beyond play/stop
- Watch companion

### #22 Put a metronome build on a few real phones

Code does not count as shipped until someone practices with it. After the metronome clicks, changes tempo, and survives the lock screen, put a build on 2–4 phones that are not yours.

Autoloader is fine for people who already have the first-run dance. TestFlight is better for a band kid.

## Done when

- At least two people who play an instrument have the build on a physical iPhone.
- You asked them to run a scale or a warm-up with only this metronome for one session.
- Notes land on this issue: what BPM they used, what broke, what they reached for and could not find.
- We do not start tuner work to dodge that conversation.

## Leave for later

- Public App Store listing
- A feedback form inside the app
- Android testers

### #23 Tuner names the pitch and shows cents

The Tuner tab still says "Play a note when you are ready." A student should play a note and see which pitch it is, and how many cents sharp or flat, at A=440 concert pitch.

This is the other half of the app. Do it after a metronome is in testers' hands, not instead of that.

## Look

Steal Apple Level and Compass, not GuitarTuna.

The canvas is a horizon / spirit level. Two marks (the same family as the metronome) sit apart when you are sharp or flat and kiss when you are in tune. Flat tips one way, sharp the other. When you enter a tight cents window the plane snaps flat, the marks lock, and the phone ticks once like Measure’s Level at 0°.

The note name is the Compass heading: huge, system type, stand-readable (Bb, A4). Cents are the degree number (±12), not a paragraph. In-tune vs sharp vs flat must be obvious from the geometry, not from a green/red lecture.

No needle. No LED dot strip. No rainbow cents. No guitar headstock. No strobe unless a later story asks for it. Idle is a settled, dim horizon, not a hunting needle.

If Liquid Glass distorts a grid as you approach 0 on the system Level, we can echo that later. First ship is the snap, the type, and the two marks.

## Done when

- First open asks for microphone access in a way that makes sense for a tuner.
- A stable pitched note shows a huge note name (A4, Bb3, etc.) and a cents offset a stranger can read across a music stand.
- In-tune vs sharp vs flat is obvious from the horizon / two marks without reading a paragraph. Crossing into tune plays a single lock haptic on devices that have one.
- Jest covers frequency → note name and cents at a few known pitches (A4 = 440, A4 + 50 cents, etc.).
- Maestro can reach Tuner and see the idle horizon. Do not fake a flute in E2E. Proof of detection is a unit/integration test plus a short device or simulator clip on the PR if you have a tone generator.

## Leave for later

- Bb / Eb / F transposition
- Alternate concert A (442)
- Temperaments, drones, or a strobe view
- Saving a "were you in tune" history
- Fancy glass-grid distortion

### #24 Tuner stays calm when the room is quiet or the mic is denied

A hunting horizon on silence, or a crash after "Don't Allow," will get the app deleted in a rehearsal hall.

Depends on pitch detection.

## Look

Denied and silence use the same settled Level: dim marks, no fake note name, no twitching cents. Copy is one short line, Measure-quiet, plus a path to Settings. Do not invent an onboarding carousel.

## Done when

- Denied microphone shows a short explanation and a path to Settings. It does not pretend to hear a note.
- Silence or noise below a sensible threshold shows the idle horizon, not a random pitch.
- Coming back from Settings (permission newly granted) starts hearing without a reinstall.
- Jest or a focused test covers the denied and below-threshold paths.

## Leave for later

- Fancy permission onboarding
- A calibration wizard

### #25 Tuner transposes for Bb, Eb, and F instruments

Concert pitch only is a piano app. Clarinet, trumpet, alto sax, and horn kids will bounce if they have to do the math.

Depends on a tuner that already names pitches.

## Look

Transposition is the Compass footer: Concert, Bb, Eb, F as a quiet segmented control. The huge written note is what changes. The horizon still tells sounding cents. Do not add a second tuner UI.

## Done when

- A control chooses Concert, Bb, Eb, or F. Default Concert.
- The displayed note is the written note for that instrument. Cents stay honest to the sounding pitch.
- Choice persists across launch.
- Jest covers a few known transpositions (sounding Bb3 on a Bb instrument reads C).
- Maestro: switch away from Concert and assert the control and a visible note label change if a test tone is practical; otherwise unit tests carry the math.

## Leave for later

- C extension, octave-transposing instruments, and custom offsets
- Separate "sounding vs written" pedagogy copy

### #26 Put tuner and metronome on the same testers

Same people who practiced with the metronome now get a build that also hears a pitch. Ask them to tune, then play a scale with the click.

## Done when

- The same 2–4 players have a build with both tools.
- Notes on this issue: did the tuner agree with a clip-on or a piano, what transposition they needed, and whether they still wanted another app open.
- One sentence on what we will change next. If the answer is "iPad sidebar polish," ignore it unless they actually practiced on an iPad.

## Leave for later

- App Store
- In-app feedback form

### #39 Metronome ships scrub tempo, custom meter, and click rhythm as built in #38

Replaces #19 (closed as obsolete). Owner approved the story/19 branch UI in PR #38: +/- steppers and the standalone Tap button are gone on purpose — they did not feel right in hand.

## What shipped (canonical)
- Tempo is a ScrubbableNumber, 30-300, default 120. Tapping the number acts as tap tempo; horizontal drag scrubs. No +/- steppers, no separate Tap button.
- Time signature is a custom fraction editor (two scrub numbers): beats per measure 1-32, beat unit 1/2/4/8/16/32. Default 4/4.
- Beat dots: one dot per beat in a 42pt slot, 24pt circle. Beat 1 has an accent edge; playback uses a separate pulse layer so animations cannot leave dots stretched. Beat 1 is audibly distinct and has a stronger haptic.
- Click rhythm is a separate native segmented picker: Whole, Half, Quarter, Eighth, Triplet, 16th with note-image icons. Rates 0.25x/0.5x/1x/2x/3x/4x the quarter-note beat. Meter changes do not silently change rhythm. 6/8 clicks six times with accent on 1.
- A11y values report e.g. Beat 1 of 4, pulse 1 of 3, 4/4 plus Beats per measure and Note type labels.

## Done when
- Scrub/tap tempo sets 30-300, updates the big number, follows while playing.
- Custom meter editor persists across the session; changing while stopped applies on next start, changing while playing does not stack downbeats.
- Rhythm picker switches click subdivision with distinct sound/haptic/beat event per subnote; whole/half stride across beats.
- Jest covers tempo clamp/interval, beat cycling, rhythm rates/strides, meter bounds.
- Maestro: time-signature flow, click-rhythm triplet flow, custom-meter-bounds flow (the 3 yamls in PR #38) all pass.
- PR #38 merges and closes this issue.

## Leave for later
- Polyrhythm, setlists, subdivisions beyond these six
- #20 persist, #21 background — separate issues

