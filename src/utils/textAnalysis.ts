import { PatternExtractor } from './patternExtractor';

export function extractPhrasesFromText(text: string): Array<{ text: string; frequency: number; order: number }> {
  // Use the new pattern extractor
  const patterns = PatternExtractor.extractPatterns(text);
  
  // Convert to the expected format for backward compatibility
  const allPatterns = [
    ...patterns.snippets.map(s => ({ text: s.text, frequency: s.count, order: 0 })),
    ...patterns.blocks.map(b => ({ text: b.text, frequency: b.count, order: 0 }))
  ];
  
  return allPatterns
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 50);
}

export function extractTopicFromFilename(filename: string): string {
  return filename
    .replace(/\.(md|txt)$/i, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}