#!/usr/bin/env swift

import AppKit
import CoreText
import Foundation

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let outputURL = root.appendingPathComponent("assets/images/note-rhythms", isDirectory: true)
let fontURL = root.appendingPathComponent("scripts/vendor/bravura/Bravura.otf")

guard FileManager.default.fileExists(atPath: fontURL.path) else {
  fatalError("Missing Bravura at \(fontURL.path)")
}

var registrationError: Unmanaged<CFError>?
if !CTFontManagerRegisterFontsForURL(fontURL as CFURL, .process, &registrationError),
   NSFont(name: "Bravura", size: 72) == nil
{
  let detail = registrationError?.takeRetainedValue().localizedDescription ?? "unknown error"
  fatalError("Could not register Bravura: \(detail)")
}

try FileManager.default.createDirectory(at: outputURL, withIntermediateDirectories: true)

let glyphs: [(name: String, codePoint: UniChar)] = [
  ("whole", 0xE1D2),
  ("half", 0xE1D3),
  ("quarter", 0xE1D5),
  ("eighth", 0xE1D7),
  ("triplet", 0xE1D7),
  ("sixteenth", 0xE1D9),
]

let palettes: [(name: String, color: NSColor)] = [
  ("light", NSColor(calibratedWhite: 0.08, alpha: 1)),
  ("dark", NSColor(calibratedWhite: 0.94, alpha: 1)),
]

let canvasSize = NSSize(width: 96, height: 120)
let musicFont = CTFontCreateWithName("Bravura" as CFString, 72, nil)

func path(for codePoint: UniChar) -> CGPath {
  var character = codePoint
  var glyph = CGGlyph()
  guard CTFontGetGlyphsForCharacters(musicFont, &character, &glyph, 1),
        let path = CTFontCreatePathForGlyph(musicFont, glyph, nil)
  else {
    fatalError(String(format: "Bravura has no glyph for U+%04X", codePoint))
  }
  return path
}

func drawMusicGlyph(_ codePoint: UniChar, triplet: Bool, color: NSColor) {
  let glyphPath = path(for: codePoint)
  let bounds = glyphPath.boundingBoxOfPath
  let centerX: CGFloat = triplet ? 45 : 48
  let centerY: CGFloat = codePoint == 0xE1D2 ? 56 : 55
  let context = NSGraphicsContext.current!.cgContext

  context.saveGState()
  context.translateBy(x: centerX - bounds.midX, y: centerY - bounds.midY)
  context.addPath(glyphPath)
  context.setFillColor(color.cgColor)
  context.fillPath()
  context.restoreGState()

  guard triplet else { return }

  let mark = NSAttributedString(
    string: "3",
    attributes: [
      .font: NSFont.systemFont(ofSize: 19, weight: .semibold),
      .foregroundColor: color,
    ]
  )
  mark.draw(at: NSPoint(x: 29, y: 77))
}

for glyph in glyphs {
  for palette in palettes {
    let image = NSImage(size: canvasSize)
    image.lockFocus()
    NSColor.clear.setFill()
    NSRect(origin: .zero, size: canvasSize).fill()
    drawMusicGlyph(glyph.codePoint, triplet: glyph.name == "triplet", color: palette.color)
    image.unlockFocus()

    guard
      let tiff = image.tiffRepresentation,
      let bitmap = NSBitmapImageRep(data: tiff),
      let png = bitmap.representation(using: .png, properties: [:])
    else {
      fatalError("Could not encode \(glyph.name)-\(palette.name)")
    }

    let destination = outputURL.appendingPathComponent("\(glyph.name)-\(palette.name).png")
    try png.write(to: destination, options: .atomic)
  }
}
