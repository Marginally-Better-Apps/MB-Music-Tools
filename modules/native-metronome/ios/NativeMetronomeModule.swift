import AVFAudio
import ExpoModulesCore
import UIKit

private let minimumBPM = 30
private let maximumBPM = 300
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
  private var onBeat: ((Int) -> Void)?
  private var beat = 0

  init() {
    audioEngine.attach(player)
    audioEngine.connect(player, to: audioEngine.mainMixerNode, format: format)
    audioEngine.prepare()
  }

  func start(bpm: Int, onBeat: @escaping (Int) -> Void) {
    clockQueue.async { [weak self] in
      guard let self else { return }
      self.onBeat = onBeat
      self.beat = 0
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

  private func activateAudioSession() throws {
    let session = AVAudioSession.sharedInstance()
    try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
    try session.setActive(true)
  }

  private func beginLoop(bpm: Int, after delay: TimeInterval) {
    let clampedBPM = min(maximumBPM, max(minimumBPM, bpm))
    let interval = 60.0 / Double(clampedBPM)
    let intervalNanoseconds = Int(interval * 1_000_000_000)
    let buffer = makeBeatBuffer(bpm: clampedBPM)

    beatTimer?.cancel()
    player.stop()
    player.scheduleBuffer(buffer, at: nil, options: .loops)

    let targetHostTime = mach_absolute_time() + AVAudioTime.hostTime(forSeconds: delay)
    player.play(at: AVAudioTime(hostTime: targetHostTime))

    let firstBeat = DispatchTime.now() + delay
    nextBeatDeadline = firstBeat

    let timer = DispatchSource.makeTimerSource(queue: clockQueue)
    timer.schedule(
      deadline: firstBeat,
      repeating: .nanoseconds(intervalNanoseconds),
      leeway: .milliseconds(1)
    )
    timer.setEventHandler { [weak self] in
      guard let self, self.isPlaying else { return }
      self.beat += 1
      self.nextBeatDeadline = self.nextBeatDeadline?.advanced(
        by: .nanoseconds(intervalNanoseconds)
      )
      self.deliverBeat(self.beat)
    }
    beatTimer = timer
    timer.resume()
  }

  private func makeBeatBuffer(bpm: Int) -> AVAudioPCMBuffer {
    let intervalFrames = AVAudioFrameCount((sampleRate * 60.0 / Double(bpm)).rounded())
    let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: intervalFrames)!
    buffer.frameLength = intervalFrames

    guard let samples = buffer.floatChannelData?[0] else { return buffer }
    samples.initialize(repeating: 0, count: Int(intervalFrames))

    let clickFrames = min(Int(intervalFrames), Int(sampleRate * 0.018))
    for frame in 0..<clickFrames {
      let time = Double(frame) / sampleRate
      let envelope = exp(-time * 260.0)
      let tone = sin(2.0 * .pi * 1_600.0 * time)
      samples[frame] = Float(tone * envelope * 0.72)
    }

    return buffer
  }

  private func deliverBeat(_ beat: Int) {
    DispatchQueue.main.async { [weak self] in
      let haptic = UIImpactFeedbackGenerator(style: .soft)
      haptic.prepare()
      haptic.impactOccurred()
      self?.onBeat?(beat)
    }
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

    Function("start") { (bpm: Int) in
      self.clock.start(bpm: bpm) { [weak self] beat in
        self?.sendEvent("onBeat", ["beat": beat])
      }
    }

    Function("stop") {
      self.clock.stop()
    }

    Function("setTempo") { (bpm: Int) in
      self.clock.setTempo(bpm)
    }

    OnAppEntersBackground {
      self.clock.stop()
    }

    OnDestroy {
      self.clock.stop()
    }
  }
}
