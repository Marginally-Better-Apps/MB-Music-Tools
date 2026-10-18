import AVFAudio
import ExpoModulesCore
import UIKit

public final class NativeTunerModule: Module {
  private let engine = AVAudioEngine()
  private let analysis = DispatchQueue(label: "com.marginallybetterapps.musictools.pitch", qos: .userInitiated)
  private var observers: [NSObjectProtocol] = []
  private var listening = false
  private var requested = false
  private var generation = 0
  private var recent: [Double] = []
  private var misses = 0

  public func definition() -> ModuleDefinition {
    Name("NativeTuner")
    Events("onPitch", "onStatus")
    AsyncFunction("start") { (promise: Promise) in
      self.requested = true
      AVAudioSession.sharedInstance().requestRecordPermission { [weak self] allowed in
        DispatchQueue.main.async {
          guard let self else { promise.resolve("unavailable"); return }
          guard self.requested else { promise.resolve("idle"); return }
          guard allowed else {
            self.sendEvent("onStatus", ["status": "denied"])
            promise.resolve("denied")
            return
          }
          promise.resolve(self.begin())
        }
      }
    }.runOnQueue(.main)
    AsyncFunction("stop") { self.requested = false; self.stopListening() }.runOnQueue(.main)
    OnAppEntersBackground { self.stopListening() }
    OnAppEntersForeground { if self.requested { _ = self.begin() } }
    OnDestroy {
      self.requested = false
      self.stopListening()
      self.observers.forEach { NotificationCenter.default.removeObserver($0) }
    }
    OnCreate {
      self.observers = [
        NotificationCenter.default.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { [weak self] notification in self?.audioInterrupted(notification) },
        NotificationCenter.default.addObserver(forName: .AVAudioEngineConfigurationChange, object: self.engine, queue: .main) { [weak self] _ in self?.configurationChanged() }
      ]
    }
  }

  private func audioInterrupted(_ notification: Notification) {
    DispatchQueue.main.async {
      let type = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt
      if type == AVAudioSession.InterruptionType.began.rawValue {
        self.stopListening()
      } else if self.requested && UIApplication.shared.applicationState == .active {
        _ = self.begin()
      }
    }
  }

  private func configurationChanged() {
    DispatchQueue.main.async {
      guard self.listening && !self.engine.isRunning else { return }
      self.stopListening()
      if self.requested { _ = self.begin() }
    }
  }

  private func begin() -> String {
    guard !listening else { return "listening" }
    guard AVAudioSession.sharedInstance().recordPermission == .granted else { return "denied" }
    do {
      try MusicAudioSession.acquire("tuner")
      let input = engine.inputNode
      let format = input.outputFormat(forBus: 0)
      guard format.sampleRate > 0 && format.channelCount > 0 else { throw NSError(domain: "Microphone unavailable", code: 1) }
      generation += 1
      let token = generation
      input.installTap(onBus: 0, bufferSize: 4096, format: format) { [weak self] buffer, _ in
        guard let channel = buffer.floatChannelData?[0] else { return }
        let samples = Array(UnsafeBufferPointer(start: channel, count: Int(buffer.frameLength)))
        let rate = buffer.format.sampleRate
        self?.analysis.async { [weak self] in
          let frequency = PitchDetector.frequency(samples, sampleRate: rate)
          DispatchQueue.main.async { self?.publish(frequency, generation: token) }
        }
      }
      listening = true
      engine.prepare()
      try engine.start()
      sendEvent("onStatus", ["status": "listening"])
      return "listening"
    } catch {
      stopListening()
      sendEvent("onStatus", ["status": "unavailable"])
      return "unavailable"
    }
  }

  private func publish(_ frequency: Double?, generation token: Int) {
    guard listening && token == generation else { return }
    guard let frequency else {
      misses += 1
      if misses >= 3 {
        recent.removeAll()
        sendEvent("onPitch", ["frequency": 0])
      }
      return
    }
    misses = 0
    if let previous = recent.last, abs(1200 * log2(frequency / previous)) > 80 { recent.removeAll() }
    recent.append(frequency)
    recent = Array(recent.suffix(3))
    guard recent.count >= 2 else { return }
    sendEvent("onPitch", ["frequency": recent.sorted()[recent.count / 2]])
  }

  private func stopListening() {
    generation += 1
    if listening { engine.inputNode.removeTap(onBus: 0) }
    listening = false
    engine.stop()
    recent.removeAll()
    misses = 0
    MusicAudioSession.release("tuner")
    sendEvent("onPitch", ["frequency": 0])
  }
}
