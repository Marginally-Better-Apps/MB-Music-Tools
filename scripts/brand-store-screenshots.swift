// Usage: swift scripts/brand-store-screenshots.swift RAW_DIRECTORY OUTPUT_DIRECTORY
// Captures stay intact; this only adds the store-page background and captions.
import AppKit

let input = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2])
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
let captions = [
  ("01-metronome-light", "Keep a steady tempo", "Tap or drag to find your pace."),
  ("02-rhythm-light", "Work through rhythms", "Choose your meter and click pattern."),
  ("07-tuner-bflat-dark", "Tune your instrument", "Concert, B-flat, E-flat, or F."),
  ("05-metronome-dark", "Practice in dark mode", "Use the appearance that suits you."),
  ("03-settings-light", "Free tools for practice", "No ads, subscriptions, or accounts."),
]

for (name, headline, subtitle) in captions {
  let source = input.appendingPathComponent("\(name).png")
  let bitmap = NSBitmapImageRep(data: try Data(contentsOf: source))!
  let size = NSSize(width: bitmap.pixelsWide, height: bitmap.pixelsHigh)
  let canvas = CGContext(
    data: nil, width: bitmap.pixelsWide, height: bitmap.pixelsHigh,
    bitsPerComponent: 8, bytesPerRow: bitmap.pixelsWide * 4,
    space: CGColorSpace(name: CGColorSpace.sRGB)!,
    bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
  )!
  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(cgContext: canvas, flipped: false)
  NSColor(srgbRed: 0.055, green: 0.075, blue: 0.15, alpha: 1).setFill()
  NSRect(origin: .zero, size: size).fill()
  let width = size.width
  let margin = width * 0.07
  func text(_ value: String, y: CGFloat, scale: CGFloat, weight: NSFont.Weight, color: NSColor) {
    (value as NSString).draw(in: NSRect(x: margin, y: y, width: width - 2 * margin, height: width * 0.1), withAttributes: [
      .font: NSFont.systemFont(ofSize: width * scale, weight: weight),
      .foregroundColor: color,
    ])
  }
  text("MB MUSIC TOOLS", y: size.height - width * 0.18, scale: 0.029, weight: .semibold,
       color: NSColor(srgbRed: 0.55, green: 0.65, blue: 1, alpha: 1))
  text(headline, y: size.height - width * 0.29, scale: 0.064, weight: .bold, color: .white)
  text(subtitle, y: size.height - width * 0.36, scale: 0.032, weight: .regular,
       color: NSColor(srgbRed: 0.75, green: 0.79, blue: 0.87, alpha: 1))
  // Use the same scale in both axes, preserving every control and the status bar.
  let scale: CGFloat = min(0.82, (size.height - width * 0.48) / size.height)
  let rect = NSRect(x: (width - width * scale) / 2, y: width * 0.055,
                    width: width * scale, height: size.height * scale)
  NSGraphicsContext.saveGraphicsState()
  let corner = width * (size.height / width > 1.8 ? 0.055 : 0.018)
  NSBezierPath(roundedRect: rect, xRadius: corner, yRadius: corner).addClip()
  let image = NSImage(size: size)
  image.addRepresentation(bitmap)
  image.draw(in: rect, from: NSRect(origin: .zero, size: size), operation: .sourceOver, fraction: 1)
  NSGraphicsContext.restoreGraphicsState()
  NSGraphicsContext.restoreGraphicsState()
  let result = NSBitmapImageRep(cgImage: canvas.makeImage()!)
  try result.representation(using: .png, properties: [:])!.write(to: output.appendingPathComponent("\(name).png"))
}
