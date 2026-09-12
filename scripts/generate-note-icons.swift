#!/usr/bin/env swift

import AppKit
import Foundation

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let outputURL = root.appendingPathComponent("assets/images/note-rhythms", isDirectory: true)

try FileManager.default.createDirectory(at: outputURL, withIntermediateDirectories: true)

let notes = [
  "whole",
  "half",
  "quarter",
  "eighth",
  "triplet",
  "sixteenth",
]

let palettes: [(name: String, color: NSColor)] = [
  ("light", NSColor(calibratedWhite: 0.08, alpha: 1)),
  ("dark", NSColor(calibratedWhite: 0.94, alpha: 1)),
]

let canvasSize = NSSize(width: 96, height: 120)
let noteHeadSize = NSSize(width: 31, height: 21)
let stemWidth: CGFloat = 4

func drawNoteHead(center: NSPoint, hollow: Bool, color: NSColor) {
  NSGraphicsContext.saveGraphicsState()
  let transform = NSAffineTransform()
  transform.translateX(by: center.x, yBy: center.y)
  transform.rotate(byDegrees: -14)
  transform.concat()

  let outerRect = NSRect(
    x: -noteHeadSize.width / 2,
    y: -noteHeadSize.height / 2,
    width: noteHeadSize.width,
    height: noteHeadSize.height
  )
  let head = NSBezierPath(ovalIn: outerRect)
  if hollow {
    head.appendOval(in: NSRect(x: -9.5, y: -4.5, width: 19, height: 9))
    head.windingRule = .evenOdd
  }
  color.setFill()
  head.fill()
  NSGraphicsContext.restoreGraphicsState()
}

func drawStem(x: CGFloat, from bottom: CGFloat, to top: CGFloat, color: NSColor) {
  color.setFill()
  NSRect(x: x, y: bottom, width: stemWidth, height: top - bottom).fill()
}

func drawFlag(stemX: CGFloat, top: CGFloat, color: NSColor) {
  let flag = NSBezierPath()
  flag.move(to: NSPoint(x: stemX + stemWidth - 0.5, y: top - 1))
  flag.curve(
    to: NSPoint(x: stemX + 19, y: top - 31),
    controlPoint1: NSPoint(x: stemX + 18, y: top - 9),
    controlPoint2: NSPoint(x: stemX + 22, y: top - 21)
  )
  flag.lineWidth = 4
  flag.lineCapStyle = .round
  color.setStroke()
  flag.stroke()
}

func drawTripletMark(color: NSColor) {
  let font = NSFont.systemFont(ofSize: 24, weight: .semibold)
  let mark = NSAttributedString(
    string: "3",
    attributes: [
      .font: font,
      .foregroundColor: color,
    ]
  )
  let bounds = mark.boundingRect(with: canvasSize, options: [.usesFontLeading])
  mark.draw(at: NSPoint(x: 27 - (bounds.width / 2), y: 78))
}

for note in notes {
  for palette in palettes {
    let image = NSImage(size: canvasSize)
    image.lockFocus()
    NSColor.clear.setFill()
    NSRect(origin: .zero, size: canvasSize).fill()

    if note == "whole" {
      drawNoteHead(
        center: NSPoint(x: canvasSize.width / 2, y: canvasSize.height / 2),
        hollow: true,
        color: palette.color
      )
    } else {
      let flagCount = note == "sixteenth" ? 2 : (note == "eighth" || note == "triplet" ? 1 : 0)
      let centerX: CGFloat = flagCount > 0 ? 38 : 46
      let center = NSPoint(x: centerX, y: 37)
      let stemX = centerX + 12
      let stemTop: CGFloat = 91

      drawNoteHead(center: center, hollow: note == "half", color: palette.color)
      drawStem(x: stemX, from: center.y, to: stemTop, color: palette.color)

      if flagCount > 0 {
        drawFlag(stemX: stemX, top: stemTop, color: palette.color)
      }
      if flagCount == 2 {
        drawFlag(stemX: stemX, top: stemTop - 17, color: palette.color)
      }
      if note == "triplet" {
        drawTripletMark(color: palette.color)
      }
    }

    image.unlockFocus()

    guard
      let tiff = image.tiffRepresentation,
      let bitmap = NSBitmapImageRep(data: tiff),
      let png = bitmap.representation(using: .png, properties: [:])
    else {
      fatalError("Could not encode \(note)-\(palette.name)")
    }

    let destination = outputURL.appendingPathComponent("\(note)-\(palette.name).png")
    try png.write(to: destination, options: .atomic)
  }
}
