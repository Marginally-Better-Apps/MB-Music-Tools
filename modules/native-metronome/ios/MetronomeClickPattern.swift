import Foundation

// Kept separate from the player so the exact samples sent to AVAudioEngine can
// also be checked with offline rendering on macOS.
struct MetronomeClickPattern {
  let sampleRate: Double
  let bpm: Int
  let beatsPerMeasure: Int
  let clickRate: Double
  let startingBeat: Int
  let startingPhase: Int

  var intervalFrames: Int {
    max(1, Int((sampleRate * 60.0 / Double(bpm) / clickRate).rounded()))
  }

  var phaseCount: Int { max(1, Int(clickRate.rounded())) }
  var beatStride: Int { clickRate < 1 ? Int((1 / clickRate).rounded()) : 1 }

  var pulseCount: Int {
    if beatStride == 1 { return beatsPerMeasure * phaseCount }
    return beatsPerMeasure / greatestCommonDivisor(beatsPerMeasure, beatStride)
  }

  var frameCount: Int { intervalFrames * pulseCount }

  func nextPulse(afterBeat beat: Int, phase: Int) -> (Int, Int) {
    if beat == 0 { return (1, 1) }
    if beatStride > 1 {
      return (((beat - 1 + beatStride) % beatsPerMeasure) + 1, 1)
    }
    if phase >= phaseCount { return ((beat % beatsPerMeasure) + 1, 1) }
    return (beat, phase + 1)
  }

  func write(to samples: UnsafeMutablePointer<Float>) {
    for frame in 0..<frameCount { samples[frame] = 0 }

    let clickFrames = min(intervalFrames, Int(sampleRate * 0.024))
    var beat = startingBeat
    var phase = startingPhase
    for pulseOffset in 0..<pulseCount {
      (beat, phase) = nextPulse(afterBeat: beat, phase: phase)
      let isDownbeat = beat == 1 && phase == 1
      let isBeatStart = phase == 1
      let frequency = isDownbeat ? 2_100.0 : isBeatStart ? 1_600.0 : 1_320.0
      let amplitude = isDownbeat ? 0.95 : isBeatStart ? 0.8 : 0.58
      let frameOffset = pulseOffset * intervalFrames

      for frame in 0..<clickFrames {
        let time = Double(frame) / sampleRate
        let envelope = exp(-time * 180.0)
        let tone = sin(2.0 * .pi * frequency * time)
        samples[frameOffset + frame] = Float(tone * envelope * amplitude)
      }
    }
  }

  private func greatestCommonDivisor(_ lhs: Int, _ rhs: Int) -> Int {
    var a = lhs
    var b = rhs
    while b != 0 {
      (a, b) = (b, a % b)
    }
    return a
  }
}
