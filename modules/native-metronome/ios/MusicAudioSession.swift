import AVFAudio
import Foundation

// Both instruments share one session. Stopping either must not silence the other.
enum MusicAudioSession {
  private static let lock = NSLock()
  private static var clients = Set<String>()

  static func acquire(_ client: String) throws {
    lock.lock()
    defer { lock.unlock() }
    let session = AVAudioSession.sharedInstance()
    // Keeping this category stable prevents tab changes from rebuilding audio routes.
    if session.category != .playAndRecord {
      try session.setCategory(.playAndRecord, mode: .measurement, options: [.defaultToSpeaker, .mixWithOthers, .allowBluetoothHFP])
      try session.setAllowHapticsAndSystemSoundsDuringRecording(true)
      // A little more render headroom helps dense click patterns on busy phones.
      try? session.setPreferredIOBufferDuration(0.023)
    }
    try session.setActive(true)
    clients.insert(client)
  }

  static func release(_ client: String) {
    lock.lock()
    defer { lock.unlock() }
    clients.remove(client)
    if clients.isEmpty {
      try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
  }
}
