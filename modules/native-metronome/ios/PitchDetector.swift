import Foundation

// YIN's cumulative normalized difference rejects noise and avoids harmonic octave jumps.
// Kept independent of AVAudioEngine so the exact shipping detector runs in CI.
enum PitchDetector {
  static func frequency(_ samples: [Float], sampleRate: Double) -> Double? {
    guard samples.count >= 2048, sampleRate > 0 else { return nil }
    let count = samples.count / 2
    let energy = samples.reduce(0.0) { $0 + Double($1 * $1) } / Double(samples.count)
    guard energy > 0.000025 else { return nil }
    let minimum = max(2, Int(sampleRate / 2000))
    let maximum = min(count - 1, Int(sampleRate / 55))
    guard maximum > minimum else { return nil }
    var difference = [Double](repeating: 0, count: maximum + 1)
    var sum = 0.0
    for lag in 1...maximum {
      var value = 0.0
      for index in 0..<count {
        let delta = Double(samples[index] - samples[index + lag])
        value += delta * delta
      }
      sum += value
      difference[lag] = sum == 0 ? 1 : value * Double(lag) / sum
    }
    var lag = minimum
    while lag < maximum - 1 {
      if difference[lag] < 0.12 {
        while lag + 1 < maximum && difference[lag + 1] < difference[lag] { lag += 1 }
        let left = difference[lag - 1], center = difference[lag], right = difference[lag + 1]
        let denominator = left - 2 * center + right
        let correction = abs(denominator) < 1e-12 ? 0 : 0.5 * (left - right) / denominator
        return sampleRate / (Double(lag) + correction)
      }
      lag += 1
    }
    return nil
  }
}
