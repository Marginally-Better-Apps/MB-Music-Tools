#!/usr/bin/env swift

import AppKit
import CoreText
import Foundation

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let fontURL = root.appendingPathComponent("assets/fonts/BravuraText.otf")
let outputURL = root.appendingPathComponent("assets/images/note-rhythms", isDirectory: true)

var registrationError: Unmanaged<CFError>?
guard CTFontManagerRegisterFontsForURL(fontURL as CFURL, .process, &registrationError) else {
  let message = registrationError?.takeRetainedValue().localizedDescription ?? "unknown error"
  fatalError("Could not register Bravura Text: \(message)")
}

try FileManager.default.createDirectory(at: outputURL, withIntermediateDirectories: true)

let notes: [(name: String, glyph: String)] = [
  ("whole", "\u{ECA2}"),
  ("half", "\u{ECA3}"),
  ("quarter", "\u{ECA5}"),
  ("eighth", "\u{ECA7}"),
  ("triplet", "\u{ECA7}"),
  ("sixteenth", "\u{ECA9}"),
]

let palettes: [(name: String, color: NSColor)] = [
  ("light", NSColor(calibratedWhite: 0.08, alpha: 1)),
  ("dark", NSColor(calibratedWhite: 0.94, alpha: 1)),
]

let canvasSize = NSSize(width: 96, height: 120)
let noteFont = NSFont(name: "BravuraText", size: 84)!
let tripletFont = NSFont.systemFont(ofSize: 38, weight: .semibold)

func centeredOrigin(for text: NSAttributedString, in size: NSSize) -> NSPoint {
  let bounds = text.boundingRect(
    with: size,
    options: [.usesLineFragmentOrigin, .usesFontLeading]
  )
  return NSPoint(
    x: ((size.width - bounds.width) / 2) - bounds.minX,
    y: ((size.height - bounds.height) / 2) - bounds.minY
  )
}

for note in notes {
  for palette in palettes {
    let image = NSImage(size: canvasSize)
    image.lockFocus()
    NSColor.clear.setFill()
    NSRect(origin: .zero, size: canvasSize).fill()

    let glyph = NSAttributedString(
      string: note.glyph,
      attributes: [
        .font: noteFont,
        .foregroundColor: palette.color,
      ]
    )
    var glyphOrigin = centeredOrigin(for: glyph, in: canvasSize)
    if note.name == "triplet" {
      glyphOrigin.x += 8
    }
    glyph.draw(at: glyphOrigin)

    if note.name == "triplet" {
      let numeral = NSAttributedString(
        string: "3",
        attributes: [
          .font: tripletFont,
          .foregroundColor: palette.color,
        ]
      )
      numeral.draw(at: NSPoint(x: 9, y: 70))
    }

    image.unlockFocus()

    guard
      let tiff = image.tiffRepresentation,
      let bitmap = NSBitmapImageRep(data: tiff),
      let png = bitmap.representation(using: .png, properties: [:])
    else {
      fatalError("Could not encode \(note.name)-\(palette.name)")
    }

    let destination = outputURL.appendingPathComponent("\(note.name)-\(palette.name).png")
    try png.write(to: destination, options: .atomic)
  }
}
