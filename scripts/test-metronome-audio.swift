import AVFAudio
import Foundation

let sampleRate = 48_000.0
let pattern = MetronomeClickPattern(
  sampleRate: sampleRate,
  bpm: 300,
  beatsPerMeasure: 4,
  clickRate: 4,
  startingBeat: 0,
  startingPhase: 0
)
let format = AVAudioFormat(
  commonFormat: .pcmFormatFloat32,
  sampleRate: sampleRate,
  channels: 1,
  interleaved: false
)!
let clickBuffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(pattern.frameCount))!
clickBuffer.frameLength = AVAudioFrameCount(pattern.frameCount)
pattern.write(to: clickBuffer.floatChannelData![0])

let engine = AVAudioEngine()
let player = AVAudioPlayerNode()
engine.attach(player)
engine.connect(player, to: engine.mainMixerNode, format: format)
try engine.enableManualRenderingMode(.offline, format: format, maximumFrameCount: 2048)
player.scheduleBuffer(clickBuffer, at: nil, options: .loops)
try engine.start()
player.play()

let measureCount = 100
let totalFrames = measureCount * pattern.frameCount
let output = AVAudioPCMBuffer(pcmFormat: engine.manualRenderingFormat, frameCapacity: 2048)!
var energies = [Double](repeating: 0, count: measureCount * pattern.pulseCount)
var renderedFrames = 0
while renderedFrames < totalFrames {
  let frames = min(2048, totalFrames - renderedFrames)
  guard try engine.renderOffline(AVAudioFrameCount(frames), to: output) == .success else {
    fatalError("AVAudioEngine could not render the click loop")
  }
  let samples = output.floatChannelData![0]
  for frame in 0..<frames {
    let value = Double(samples[frame])
    precondition(value.isFinite && abs(value) <= 1, "Click samples must remain safe for playback")
    energies[(renderedFrames + frame) / pattern.intervalFrames] += value * value
  }
  renderedFrames += frames
}

let rms = energies.map { sqrt($0 / Double(pattern.intervalFrames)) }
precondition(rms.count == 1600)
precondition(rms.allSatisfy { $0 >= 0.085 }, "A fast sixteenth-note pulse is too weak or absent")
for measure in 0..<measureCount {
  let first = measure * pattern.pulseCount
  precondition(rms[first] > rms[first + 4], "The downbeat must stand out")
  precondition(rms[first + 4] > rms[first + 5], "Each new beat must stand out from its subdivisions")
}
print("Metronome audio passed: 100 measures, 1,600 audible pulses at 300 BPM / 16th notes")
