import AVFAudio
import ExpoModulesCore
import UIKit

private let minimumBPM = 30
private let maximumBPM = 300
private let minimumBeatsPerMeasure = 1
private let maximumBeatsPerMeasure = 32
private let supportedClickRates = [0.25, 0.5, 1.0, 2.0, 3.0, 4.0]
private let sampleRate = 48_000.0
private let startLeadTime = 0.08

private final class MetronomeClock {
  private let audioEngine = AVAudioEngine()
  private let player = AVAudioPlayerNode()
  private let clockQueue = DispatchQueue(
    label: "com.marginallybetterapps.musictools.metronome",
    qos: .userInteractive
  )
  private let format = AVAudioFormat(
    commonFormat: .pcmFormatFloat32,
    sampleRate: sampleRate,
    channels: 1,
    interleaved: false
  )!

  var onPlayback: ((Bool) -> Void)?
  private var observers: [NSObjectProtocol] = []
  private var beatTimer: DispatchSourceTimer?
  private var isPlaying = false
  private var nextBeatDeadline: DispatchTime?
  private var onBeat: ((Int, Int, Int) -> Void)?
  private var beat = 0
  private var phase = 0
  private var beatsPerMeasure = 4
  private var clickRate = 1.0
  private var currentBPM = 120
  private var downbeatHaptic: UIImpactFeedbackGenerator?
  private var beatHaptic: UIImpactFeedbackGenerator?
  private var subdivisionHaptic: UIImpactFeedbackGenerator?

  init() {
    audioEngine.attach(player)
    audioEngine.connect(player, to: audioEngine.mainMixerNode, format: format)
    audioEngine.prepare()
    observers = [
      NotificationCenter.default.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: nil) { [weak self] note in
        if note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt == AVAudioSession.InterruptionType.began.rawValue { self?.stop() }
      },
      NotificationCenter.default.addObserver(forName: AVAudioSession.routeChangeNotification, object: nil, queue: nil) { [weak self] note in
        if note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt == AVAudioSession.RouteChangeReason.oldDeviceUnavailable.rawValue { self?.stop() }
      },
      NotificationCenter.default.addObserver(forName: .AVAudioEngineConfigurationChange, object: audioEngine, queue: nil) { [weak self] _ in
        // AVAudioEngine clears scheduled playback when its I/O configuration changes.
        // The notification arrives on an internal queue; do the restart on our clock.
        self?.clockQueue.async { [weak self] in
          guard let self, self.isPlaying else { return }
          guard !self.audioEngine.isRunning || !self.player.isPlaying else { return }
          do {
            try self.activateAudioSession()
            if !self.audioEngine.isRunning { try self.audioEngine.start() }
            self.beginLoop(bpm: self.currentBPM, after: startLeadTime)
          } catch {
            self.stopLocked()
          }
        }
      }
    ]
  }

  deinit { observers.forEach { NotificationCenter.default.removeObserver($0) } }

  func start(
    bpm: Int,
    beatsPerMeasure: Int,
    clickRate: Double,
    onBeat: @escaping (Int, Int, Int) -> Void
  ) {
    clockQueue.async { [weak self] in
      guard let self else { return }
      self.onBeat = onBeat
      self.beat = 0
      self.phase = 0
      self.beatsPerMeasure = self.normalizedBeatsPerMeasure(beatsPerMeasure)
      self.clickRate = self.normalizedClickRate(clickRate)
      self.isPlaying = true

      do {
        try self.activateAudioSession()
        if !self.audioEngine.isRunning {
          try self.audioEngine.start()
        }
        self.beginLoop(bpm: bpm, after: startLeadTime)
        self.onPlayback?(true)
      } catch {
        self.stopLocked()
      }
    }
  }

  func stop() {
    clockQueue.async { [weak self] in
      self?.stopLocked()
    }
  }

  func setTempo(_ bpm: Int) {
    clockQueue.async { [weak self] in
      guard let self, self.isPlaying else { return }

      let now = DispatchTime.now().uptimeNanoseconds
      let scheduled = self.nextBeatDeadline?.uptimeNanoseconds ?? now
      let delayNanoseconds = scheduled > now ? scheduled - now : 0
      let delay = max(startLeadTime, Double(delayNanoseconds) / 1_000_000_000)
      self.beginLoop(bpm: bpm, after: delay)
    }
  }

  func setTimeSignature(_ beatsPerMeasure: Int) {
    clockQueue.async { [weak self] in
      guard let self else { return }
      self.beatsPerMeasure = self.normalizedBeatsPerMeasure(beatsPerMeasure)
      self.beat = 0
      self.phase = 0
      guard self.isPlaying else { return }

      let now = DispatchTime.now().uptimeNanoseconds
      let scheduled = self.nextBeatDeadline?.uptimeNanoseconds ?? now
      let delayNanoseconds = scheduled > now ? scheduled - now : 0
      let delay = max(startLeadTime, Double(delayNanoseconds) / 1_000_000_000)
      self.beginLoop(bpm: self.currentBPM, after: delay)
    }
  }

  func setClickRate(_ clickRate: Double) {
    clockQueue.async { [weak self] in
      guard let self else { return }
      self.clickRate = self.normalizedClickRate(clickRate)
      self.beat = 0
      self.phase = 0
      guard self.isPlaying else { return }

      let now = DispatchTime.now().uptimeNanoseconds
      let scheduled = self.nextBeatDeadline?.uptimeNanoseconds ?? now
      let delayNanoseconds = scheduled > now ? scheduled - now : 0
      let delay = max(startLeadTime, Double(delayNanoseconds) / 1_000_000_000)
      self.beginLoop(bpm: self.currentBPM, after: delay)
    }
  }

  private func activateAudioSession() throws {
    try MusicAudioSession.acquire("metronome")
  }

  private func beginLoop(bpm: Int, after delay: TimeInterval) {
    let clampedBPM = min(maximumBPM, max(minimumBPM, bpm))
    currentBPM = clampedBPM
    let interval = 60.0 / Double(clampedBPM) / clickRate
    let intervalNanoseconds = Int(interval * 1_000_000_000)
    let buffer = makeMeasureBuffer(bpm: clampedBPM)

    beatTimer?.cancel()
    player.stop()
    player.scheduleBuffer(buffer, at: nil, options: .loops)
    player.prepare(withFrameCount: min(buffer.frameLength, 8192))

    let targetHostTime = mach_absolute_time() + AVAudioTime.hostTime(forSeconds: delay)
    player.play(at: AVAudioTime(hostTime: targetHostTime))

    let firstBeatDeadline = DispatchTime.now() + delay
    nextBeatDeadline = firstBeatDeadline

    let timer = DispatchSource.makeTimerSource(queue: clockQueue)
    timer.schedule(
      deadline: firstBeatDeadline,
      repeating: .nanoseconds(intervalNanoseconds),
      leeway: .milliseconds(1)
    )
    timer.setEventHandler { [weak self] in
      guard let self, self.isPlaying else { return }
      self.advancePulse()
      self.nextBeatDeadline = self.nextBeatDeadline?.advanced(
        by: .nanoseconds(intervalNanoseconds)
      )
      self.deliverBeat(self.beat, phase: self.phase, phaseCount: self.phaseCount)
    }
    beatTimer = timer
    timer.resume()
  }

  private func makeMeasureBuffer(bpm: Int) -> AVAudioPCMBuffer {
    let pattern = MetronomeClickPattern(
      sampleRate: sampleRate,
      bpm: bpm,
      beatsPerMeasure: beatsPerMeasure,
      clickRate: clickRate,
      startingBeat: beat,
      startingPhase: phase
    )
    let measureFrames = AVAudioFrameCount(pattern.frameCount)
    let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: measureFrames)!
    buffer.frameLength = measureFrames

    guard let samples = buffer.floatChannelData?[0] else { return buffer }
    pattern.write(to: samples)

    return buffer
  }

  private var phaseCount: Int {
    pattern.phaseCount
  }

  private func advancePulse() {
    (beat, phase) = nextPulse(afterBeat: beat, phase: phase)
  }

  private func nextPulse(afterBeat beat: Int, phase: Int) -> (Int, Int) {
    pattern.nextPulse(afterBeat: beat, phase: phase)
  }

  private func deliverBeat(_ beat: Int, phase: Int, phaseCount: Int) {
    let pulseInterval = 60.0 / Double(currentBPM) / clickRate
    let fastSubdivisions = pulseInterval < 0.09
    // Keep every visual pulse in sync with the audio, but spare the Taptic
    // Engine the 15-20 impacts per second of a fast subdivision pattern.
    let callback = onBeat
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      let isDownbeat = beat == 1 && phase == 1
      if phase == 1 {
        if self.downbeatHaptic == nil { self.downbeatHaptic = UIImpactFeedbackGenerator(style: .heavy) }
        if self.beatHaptic == nil { self.beatHaptic = UIImpactFeedbackGenerator(style: .soft) }
        (isDownbeat ? self.downbeatHaptic : self.beatHaptic)?.impactOccurred()
      } else if !fastSubdivisions {
        if self.subdivisionHaptic == nil { self.subdivisionHaptic = UIImpactFeedbackGenerator(style: .light) }
        self.subdivisionHaptic?.impactOccurred()
      }
      callback?(beat, phase, phaseCount)
    }
  }

  private func normalizedBeatsPerMeasure(_ beats: Int) -> Int {
    min(maximumBeatsPerMeasure, max(minimumBeatsPerMeasure, beats))
  }

  private func normalizedClickRate(_ value: Double) -> Double {
    supportedClickRates.contains(value) ? value : 1
  }

  private var pattern: MetronomeClickPattern {
    MetronomeClickPattern(
      sampleRate: sampleRate,
      bpm: currentBPM,
      beatsPerMeasure: beatsPerMeasure,
      clickRate: clickRate,
      startingBeat: beat,
      startingPhase: phase
    )
  }

  private func stopLocked() {
    isPlaying = false
    onPlayback?(false)
    nextBeatDeadline = nil
    beatTimer?.cancel()
    beatTimer = nil
    player.stop()
    audioEngine.pause()
    onBeat = nil
    MusicAudioSession.release("metronome")
  }
}

public final class NativeMetronomeModule: Module {
  private let clock = MetronomeClock()

  public func definition() -> ModuleDefinition {
    Name("NativeMetronome")

    Events("onBeat", "onPlayback")
    OnCreate {
      self.clock.onPlayback = { [weak self] playing in
        DispatchQueue.main.async { self?.sendEvent("onPlayback", ["playing": playing]) }
      }
    }

    Function("start") { (bpm: Int, beatsPerMeasure: Int, clickRate: Double) in
      self.clock.start(
        bpm: bpm,
        beatsPerMeasure: beatsPerMeasure,
        clickRate: clickRate
      ) { [weak self] beat, phase, phaseCount in
        self?.sendEvent(
          "onBeat",
          ["beat": beat, "phase": phase, "phaseCount": phaseCount]
        )
      }
    }

    Function("stop") {
      self.clock.stop()
    }

    Function("setTempo") { (bpm: Int) in
      self.clock.setTempo(bpm)
    }

    Function("setTimeSignature") { (beatsPerMeasure: Int) in
      self.clock.setTimeSignature(beatsPerMeasure)
    }

    Function("setClickRate") { (clickRate: Double) in
      self.clock.setClickRate(clickRate)
    }

    Function("readPreferences") { () -> String? in
      UserDefaults.standard.string(forKey: "music.preferences.v1")
    }

    Function("writePreferences") { (value: String) in
      UserDefaults.standard.set(value, forKey: "music.preferences.v1")
    }

    OnDestroy {
      self.clock.stop()
    }
  }
}
