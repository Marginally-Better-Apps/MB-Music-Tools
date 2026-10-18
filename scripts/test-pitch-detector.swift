import Foundation
func tone(_ hz: Double, amplitude: Double = 0.25, harmonics: Bool = false) -> [Float] {
  (0..<4096).map { i in
    let x = 2 * Double.pi * hz * Double(i) / 48000
    return Float(amplitude * (sin(x) + (harmonics ? 0.6 * sin(2*x) + 0.3 * sin(3*x) : 0)))
  }
}
for hz in [65.406, 110, 233.082, 440, 452.893, 880, 1760] {
  for harmonic in [false, true] {
    guard let pitch = PitchDetector.frequency(tone(hz, harmonics: harmonic), sampleRate: 48000) else { fatalError("Missing pitch at \(hz)") }
    precondition(abs(1200 * log2(pitch / hz)) < 3, "Inaccurate pitch \(pitch) expected \(hz)")
  }
}
precondition(PitchDetector.frequency(Array(repeating: 0, count: 4096), sampleRate: 48000) == nil)
precondition(PitchDetector.frequency(tone(440, amplitude: 0.0001), sampleRate: 48000) == nil)
var seed: UInt64 = 42
let noise: [Float] = (0..<4096).map { _ in seed = seed &* 6364136223846793005 &+ 1; return Float(Double(seed >> 33) / Double(UInt32.max) - 0.25) }
precondition(PitchDetector.frequency(noise, sampleRate: 48000) == nil)
print("Pitch detector: pure tones, harmonics, silence, low level and noise passed")
