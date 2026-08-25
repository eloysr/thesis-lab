/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * ------------------------
 * Opentype.js – Font class 
 * ------------------------
 *
 * This file is the implementation of the Font class, which manages the font data
 * and provides access to glyph metrics and properties.
 * 
 * What this file does:
 * - Defines the Font class that encapsulates the logic for managing font data and 
 *   glyph metrics.
 * - Provides access to glyph properties such as stem thickness, cap height, 
 *   descender, and spacing.
 * - The Font class is used in the main sketch to retrieve and manipulate font 
 *   information for rendering and interaction.
*/


class Font {
  constructor(data) {
    this.data = data;
    this.name = this.data.names.fontFamily.en;
    this.glyphs = Object.values(this.data.glyphs.glyphs);
    this.stemThickness = this.data.charToGlyph("I").getMetrics().xMax - this.data.charToGlyph("I").getMetrics().xMin;
    this.capHeight = this.data.charToGlyph("H").getMetrics().yMax;
    this.descender = this.data.descender;
    this.spacing = this.data.charToGlyph(" ").advanceWidth;
    this.notdef = this.glyphs.find(glyph => glyph.name === ".notdef");
  }
}