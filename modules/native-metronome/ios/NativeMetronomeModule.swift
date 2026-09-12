import AVFAudio
import ExpoModulesCore
import UIKit

private let minimumBPM = 30
private let maximumBPM = 300
private let minimumBeatsPerMeasure = 1
private let maximumBeatsPerMeasure = 32
private let supportedClickRates = [0.25, 0.5, 1.0, 2.0, 3.0, 4.0]
private let sampleRate = 48_000.0
private let startLeadTime = 0.04

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

  private var beatTimer: DispatchSourceTimer?
  private var isPlaying = false
  private var nextBeatDeadline: DispatchTime?
  private var onBeat: ((Int, Int, Int) -> Void)?
  private var beat = 0
  private var phase = 0
  private var beatsPerMeasure = 4
  private var clickRate = 1.0
  private var currentBPM = 120

  init() {
    audioEngine.attach(player)
    audioEngine.connect(player, to: audioEngine.mainMixerNode, format: format)
    audioEngine.prepare()
  }

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
      } catch {
        self.isPlaying = false
        self.onBeat = nil
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
    let session = AVAudioSession.sharedInstance()
    try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
    try session.setActive(true)
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
    let intervalFrames = AVAudioFrameCount(
      (sampleRate * 60.0 / Double(bpm) / clickRate).rounded()
    )
    let pulseCount = measurePulseCount
    let measureFrames = intervalFrames * AVAudioFrameCount(pulseCount)
    let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: measureFrames)!
    buffer.frameLength = measureFrames

    guard let samples = buffer.floatChannelData?[0] else { return buffer }
    samples.initialize(repeating: 0, count: Int(measureFrames))

    let clickFrames = min(Int(intervalFrames), Int(sampleRate * 0.018))
    var bufferBeat = beat
    var bufferPhase = phase
    for pulseOffset in 0..<pulseCount {
      (bufferBeat, bufferPhase) = nextPulse(afterBeat: bufferBeat, phase: bufferPhase)
      let isDownbeat = bufferBeat == 1 && bufferPhase == 1
      let isBeatStart = bufferPhase == 1
      let frequency = isDownbeat ? 2_100.0 : isBeatStart ? 1_600.0 : 1_320.0
      let amplitude = isDownbeat ? 0.9 : isBeatStart ? 0.62 : 0.42
      let frameOffset = pulseOffset * Int(intervalFrames)

      for frame in 0..<clickFrames {
        let time = Double(frame) / sampleRate
        let envelope = exp(-time * 260.0)
        let tone = sin(2.0 * .pi * frequency * time)
        samples[frameOffset + frame] = Float(tone * envelope * amplitude)
      }
    }

    return buffer
  }

  private var phaseCount: Int {
    max(1, Int(clickRate.rounded()))
  }

  private var beatStride: Int {
    clickRate < 1 ? Int((1 / clickRate).rounded()) : 1
  }

  private var measurePulseCount: Int {
    if beatStride == 1 {
      return beatsPerMeasure * phaseCount
    }
    return beatsPerMeasure / greatestCommonDivisor(beatsPerMeasure, beatStride)
  }

  private func advancePulse() {
    (beat, phase) = nextPulse(afterBeat: beat, phase: phase)
  }

  private func nextPulse(afterBeat beat: Int, phase: Int) -> (Int, Int) {
    if beat == 0 {
      return (1, 1)
    }
    if beatStride > 1 {
      return (((beat - 1 + beatStride) % beatsPerMeasure) + 1, 1)
    }
    if beat == 0 || phase >= phaseCount {
      return ((beat % beatsPerMeasure) + 1, 1)
    }
    return (beat, phase + 1)
  }

  private func deliverBeat(_ beat: Int, phase: Int, phaseCount: Int) {
    DispatchQueue.main.async { [weak self] in
      let isDownbeat = beat == 1 && phase == 1
      let haptic = UIImpactFeedbackGenerator(
        style: isDownbeat ? .heavy : phase == 1 ? .soft : .light
      )
      haptic.prepare()
      haptic.impactOccurred()
      self?.onBeat?(beat, phase, phaseCount)
    }
  }

  private func normalizedBeatsPerMeasure(_ beats: Int) -> Int {
    min(maximumBeatsPerMeasure, max(minimumBeatsPerMeasure, beats))
  }

  private func normalizedClickRate(_ value: Double) -> Double {
    supportedClickRates.contains(value) ? value : 1
  }

  private func greatestCommonDivisor(_ lhs: Int, _ rhs: Int) -> Int {
    var a = lhs
    var b = rhs
    while b != 0 {
      let remainder = a % b
      a = b
      b = remainder
    }
    return a
  }

  private func stopLocked() {
    isPlaying = false
    nextBeatDeadline = nil
    beatTimer?.cancel()
    beatTimer = nil
    player.stop()
    audioEngine.pause()
    onBeat = nil
    try? AVAudioSession.sharedInstance().setActive(
      false,
      options: .notifyOthersOnDeactivation
    )
  }
}

public final class NativeMetronomeModule: Module {
  private let clock = MetronomeClock()

  public func definition() -> ModuleDefinition {
    Name("NativeMetronome")

    Events("onBeat")

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

    OnAppEntersBackground {
      self.clock.stop()
    }

    OnDestroy {
      self.clock.stop()
    }
  }
}
