export interface ExtractedPrompt {
  text: string;
  frequency: number;
  sourceFile: string;
}

export interface ExtractedPhrase {
  text: string;
  frequency: number;
  sourceFiles: string[];
}

export interface AnalysisResult {
  prompts: ExtractedPrompt[];
  phrases: ExtractedPhrase[];
}

export interface ExtractedPattern {
  snippets: Array<{ text: string; count: number }>;
  blocks: Array<{ text: string; count: number; placeholders: string[] }>;
  prompts: Array<{ text: string; order: number }>;
}

export class PatternExtractor {
  /**
   * Analyzes a conversation file and extracts user prompts and common phrases
   */
  static analyzeFile(content: string, fileName: string): AnalysisResult {
    const userPrompts = this.extractUserPrompts(content);
    
    // Clean and deduplicate prompts
    const cleanedPrompts = userPrompts.map(prompt => this.cleanPrompt(prompt));
    const promptFrequency = new Map<string, number>();
    
    cleanedPrompts.forEach(prompt => {
      if (prompt.length >= 20) { // Only consider substantial prompts
        promptFrequency.set(prompt, (promptFrequency.get(prompt) || 0) + 1);
      }
    });
    
    // Extract n-grams for phrases
    const phraseFrequency = new Map<string, number>();
    cleanedPrompts.forEach(prompt => {
      const nGrams = this.extractNGrams(prompt, 2, 6);
      nGrams.forEach(gram => {
        phraseFrequency.set(gram, (phraseFrequency.get(gram) || 0) + 1);
      });
    });
    
    // Filter phrases that appear at least 2 times
    const significantPhrases = Array.from(phraseFrequency.entries())
      .filter(([phrase, freq]) => freq >= 2)
      .sort(([,a], [,b]) => b - a);
    
    const prompts = Array.from(promptFrequency.entries())
      .map(([text, frequency]) => ({
        text: this.detectPlaceholders(text),
        frequency,
        sourceFile: fileName,
      }))
      .sort((a, b) => b.frequency - a.frequency);
    
    const phrases = significantPhrases.map(([text, frequency]) => ({
      text,
      frequency,
      sourceFiles: [fileName],
    }));
    
    return { prompts, phrases };
  }

  /**
   * Extracts user prompts from various conversation formats
   */
  private static extractUserPrompts(content: string): string[] {
    const userPrompts: string[] = [];
    
    // Split content into lines for processing
    const lines = content.split(/\r?\n/);
    
    // Try different parsing strategies based on content format
    if (this.isMarkdownChatFormat(content)) {
      userPrompts.push(...this.parseMarkdownChat(content));
    } else if (this.isPrefixedFormat(content)) {
      userPrompts.push(...this.parsePrefixedFormat(lines));
    } else {
      // Fallback to turn-based detection
      userPrompts.push(...this.parseTurnBasedFormat(lines));
    }
    
    return userPrompts.filter(prompt => prompt.trim().length > 10);
  }

  /**
   * Detects if content is in markdown chat format (with headers like **User**, ## User, etc.)
   */
  private static isMarkdownChatFormat(content: string): boolean {
    return /(\*\*User\*\*|##\s*User|###\s*User|#\s*User|>\s*User)/i.test(content);
  }

  /**
   * Detects if content uses prefixed format (User:, You:, etc.)
   */
  private static isPrefixedFormat(content: string): boolean {
    return /^(user|you|human|me|prompt):\s*/im.test(content);
  }

  /**
   * Parses markdown chat format with sections
   */
  private static parseMarkdownChat(content: string): string[] {
    const userPrompts: string[] = [];
    
    // Match various user section formats
    const userSectionPatterns = [
      /\*\*User\*\*[\r\n]+([\s\S]*?)(?=\n\*\*(?:Assistant|AI|Bot|Claude|GPT|Cursor)|$)/gi,
      /##\s*User[\r\n]+([\s\S]*?)(?=\n##\s*(?:Assistant|AI|Bot|Claude|GPT|Cursor)|$)/gi,
      /###\s*User[\r\n]+([\s\S]*?)(?=\n###\s*(?:Assistant|AI|Bot|Claude|GPT|Cursor)|$)/gi,
      /#\s*User[\r\n]+([\s\S]*?)(?=\n#\s*(?:Assistant|AI|Bot|Claude|GPT|Cursor)|$)/gi,
      />\s*User[\r\n]+([\s\S]*?)(?=\n>\s*(?:Assistant|AI|Bot|Claude|GPT|Cursor)|$)/gi,
    ];
    
    for (const pattern of userSectionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const userContent = match[1].trim();
        if (userContent) {
          // Split multi-line user content and add each substantial part
          const contentLines = userContent.split(/\r?\n/).filter(line => line.trim());
          for (const line of contentLines) {
            const cleaned = line.trim();
            if (cleaned && !this.isLikelyAIResponse(cleaned)) {
              userPrompts.push(cleaned);
            }
          }
        }
      }
    }
    
    return userPrompts;
  }

  /**
   * Parses content with prefixes like "User:", "You:", etc.
   */
  private static parsePrefixedFormat(lines: string[]): string[] {
    const userPrompts: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Match user prefixes
      const userPrefixMatch = trimmed.match(/^(user|you|human|me|prompt):\s*(.+)/i);
      if (userPrefixMatch && userPrefixMatch[2]) {
        const prompt = userPrefixMatch[2].trim();
        if (!this.isLikelyAIResponse(prompt)) {
          userPrompts.push(prompt);
        }
      }
    }
    
    return userPrompts;
  }

  /**
   * Parses content using turn-based detection (alternating user/AI)
   */
  private static parseTurnBasedFormat(lines: string[]): string[] {
    const userPrompts: string[] = [];
    let isUserTurn = true; // Assume first message is from user
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Check if this line indicates a speaker change or is substantial content
      if (this.isLikelyAIResponse(trimmed)) {
        isUserTurn = false;
        continue;
      }
      
      // If it looks like a new conversation turn
      if (this.isNewTurnIndicator(trimmed)) {
        isUserTurn = !isUserTurn;
      }
      
      // If we think this is a user turn and it's substantial
      if (isUserTurn && trimmed.length > 10 && !this.isMetadata(trimmed)) {
        userPrompts.push(trimmed);
        isUserTurn = false; // Next turn should be AI
      }
    }
    
    return userPrompts;
  }

  /**
   * Checks if text looks like an AI/assistant response
   */
  private static isLikelyAIResponse(text: string): boolean {
    const aiPatterns = [
      /^(here|I'll|I can|I would|I will|Let me|Sure|Of course|Certainly|I understand|As an AI|I'm|I am)/i,
      /^(Based on|According to|It seems|It appears|You can|You should|You might|To help|I'd be happy)/i,
      /^(I apologize|Sorry|I don't|I cannot|I can't|Thank you|You're welcome|Great question)/i,
      /^(That's|This is|These are|It looks like|It sounds like|I see|I notice)/i,
      /^(The|A|An)\s+\w+\s+(is|are|will|would|can|could)/i, // Explanatory statements
    ];
    
    return aiPatterns.some(pattern => pattern.test(text.trim()));
  }

  /**
   * Checks if line indicates a new conversation turn
   */
  private static isNewTurnIndicator(text: string): boolean {
    return /^(---|===|___|\d+\.|•|-)/.test(text.trim());
  }

  /**
   * Checks if line is metadata (timestamps, usernames, etc.)
   */
  private static isMetadata(text: string): boolean {
    return /^(\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2}|@\w+|#\w+)/.test(text.trim());
  }
  
  /**
   * Cleans prompt text by removing markdown formatting
   */
  private static cleanPrompt(prompt: string): string {
    return prompt
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]*`/g, '') // Remove inline code
      .replace(/^>\s*/gm, '') // Remove blockquotes
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
      .trim();
  }
  
  /**
   * Extracts n-grams (word sequences) from text
   */
  private static extractNGrams(text: string, minN: number, maxN: number): string[] {
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const nGrams: string[] = [];
    
    for (let n = minN; n <= maxN; n++) {
      for (let i = 0; i <= words.length - n; i++) {
        const gram = words.slice(i, i + n).join(' ');
        if (gram.length >= 6) { // Minimum phrase length
          nGrams.push(gram);
        }
      }
    }
    
    return nGrams;
  }
  
  /**
   * Detects common variable patterns and replaces them with placeholders
   */
  private static detectPlaceholders(text: string): string {
    return text
      // Numbers with percentage
      .replace(/\b\d+(\.\d+)?%\b/g, '{percentage}%')
      // Standalone numbers (amounts, quantities)
      .replace(/\b\d+(\.\d+)?\b/g, '{number}')
      // Years (4 digits)
      .replace(/\b(19|20)\d{2}\b/g, '{year}')
      // Currency amounts
      .replace(/\$\d+(\.\d{2})?/g, '{currency}')
      // Single capital letters (often department names, grades, etc.)
      .replace(/\b[A-Z]\b/g, '{letter}')
      // Dates in various formats
      .replace(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g, '{date}')
      // Times
      .replace(/\b\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM)?\b/gi, '{time}')
      // Common variable words that change between similar prompts
      .replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '{day}')
      .replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi, '{month}')
      // File extensions
      .replace(/\.\w{2,4}\b/g, '.{extension}')
      // Email addresses
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '{email}')
      // URLs
      .replace(/https?:\/\/[^\s]+/g, '{url}');
  }

  // Legacy method for backward compatibility
  public static extractPatterns(content: string): ExtractedPattern {
    const result = this.analyzeFile(content, 'default');
    
    return {
      snippets: result.phrases.map(p => ({ text: p.text, count: p.frequency })),
      blocks: result.prompts.filter(p => p.text.split(/\s+/).length >= 20).map(p => ({ 
        text: p.text, 
        count: p.frequency, 
        placeholders: this.extractPlaceholdersFromText(p.text) 
      })),
      prompts: result.prompts.map((p, index) => ({ text: p.text, order: index }))
    };
  }

  private static extractPlaceholdersFromText(text: string): string[] {
    const placeholders = [];
    const matches = text.match(/\{[^}]+\}/g);
    if (matches) {
      placeholders.push(...matches);
    }
    return placeholders;
  }

  /**
   * Merges analysis results from multiple files
   */
  static mergeAnalysisResults(results: AnalysisResult[]): AnalysisResult {
    const promptMap = new Map<string, ExtractedPrompt>();
    const phraseMap = new Map<string, ExtractedPhrase>();
    
    results.forEach(result => {
      // Merge prompts
      result.prompts.forEach(prompt => {
        const existing = promptMap.get(prompt.text);
        if (existing) {
          existing.frequency += prompt.frequency;
        } else {
          promptMap.set(prompt.text, { ...prompt });
        }
      });
      
      // Merge phrases
      result.phrases.forEach(phrase => {
        const existing = phraseMap.get(phrase.text);
        if (existing) {
          existing.frequency += phrase.frequency;
          existing.sourceFiles = Array.from(new Set([...existing.sourceFiles, ...phrase.sourceFiles]));
        } else {
          phraseMap.set(phrase.text, { ...phrase });
        }
      });
    });
    
    return {
      prompts: Array.from(promptMap.values()).sort((a, b) => b.frequency - a.frequency),
      phrases: Array.from(phraseMap.values()).sort((a, b) => b.frequency - a.frequency),
    };
  }
}