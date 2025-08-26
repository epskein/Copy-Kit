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

export interface ConversationPrompt {
  text: string;
  order: number;
  sourceFile: string;
  timestamp?: string;
}

export interface AnalysisResult {
  prompts: ExtractedPrompt[];
  phrases: ExtractedPhrase[];
  conversation: ConversationPrompt[];
}

export class PatternAnalyzer {
  /**
   * Analyzes a conversation file and extracts user prompts and common phrases
   */
  static analyzeFile(content: string, fileName: string): AnalysisResult {
    const userPrompts = this.extractUserPrompts(content);
    const conversationPrompts = this.extractConversationOrder(content, fileName);
    
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
    
    return { prompts, phrases, conversation: conversationPrompts };
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
   * Extracts user prompts in chronological order as they appeared in the conversation
   */
  private static extractConversationOrder(content: string, fileName: string): ConversationPrompt[] {
    const conversationPrompts: ConversationPrompt[] = [];
    const lines = content.split(/\r?\n/);
    let promptOrder = 0;
    let currentPrompt = '';
    let isUserTurn = true;
    let timestamp: string | undefined;

    // Try different parsing strategies based on content format
    if (this.isMarkdownChatFormat(content)) {
      return this.parseMarkdownChatConversation(content, fileName);
    } else if (this.isPrefixedFormat(content)) {
      return this.parsePrefixedFormatConversation(lines, fileName);
    } else {
      return this.parseTurnBasedFormatConversation(lines, fileName);
    }
  }

  /**
   * Parse markdown chat format for conversation order
   */
  private static parseMarkdownChatConversation(content: string, fileName: string): ConversationPrompt[] {
    const conversationPrompts: ConversationPrompt[] = [];
    const userSectionPatterns = [
      /\*\*User\*\*[\r\n]+([\s\S]*?)(?=\n\*\*(?:Assistant|AI|Bot|Claude|GPT|Cursor)|$)/gi,
      /##\s*User[\r\n]+([\s\S]*?)(?=\n##\s*(?:Assistant|AI|Bot|Claude|GPT|Cursor)|$)/gi,
      /###\s*User[\r\n]+([\s\S]*?)(?=\n###\s*(?:Assistant|AI|Bot|Claude|GPT|Cursor)|$)/gi,
      /#\s*User[\r\n]+([\s\S]*?)(?=\n#\s*(?:Assistant|AI|Bot|Claude|GPT|Cursor)|$)/gi,
      />\s*User[\r\n]+([\s\S]*?)(?=\n>\s*(?:Assistant|AI|Bot|Claude|GPT|Cursor)|$)/gi,
    ];

    let order = 0;
    for (const pattern of userSectionPatterns) {
      let match;
      pattern.lastIndex = 0; // Reset regex
      while ((match = pattern.exec(content)) !== null) {
        const userContent = match[1].trim();
        if (userContent && !this.isLikelyAIResponse(userContent)) {
          const cleanedPrompt = this.cleanPrompt(userContent);
          if (cleanedPrompt.length > 10) {
            conversationPrompts.push({
              text: cleanedPrompt,
              order: order++,
              sourceFile: fileName,
              timestamp: this.extractTimestamp(userContent)
            });
          }
        }
      }
    }

    return conversationPrompts.sort((a, b) => a.order - b.order);
  }

  /**
   * Parse prefixed format for conversation order
   */
  private static parsePrefixedFormatConversation(lines: string[], fileName: string): ConversationPrompt[] {
    const conversationPrompts: ConversationPrompt[] = [];
    let order = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const userPrefixMatch = trimmed.match(/^(user|you|human|me|prompt):\s*(.+)/i);
      if (userPrefixMatch && userPrefixMatch[2]) {
        const prompt = userPrefixMatch[2].trim();
        if (!this.isLikelyAIResponse(prompt)) {
          const cleanedPrompt = this.cleanPrompt(prompt);
          if (cleanedPrompt.length > 10) {
            conversationPrompts.push({
              text: cleanedPrompt,
              order: order++,
              sourceFile: fileName,
              timestamp: this.extractTimestamp(trimmed)
            });
          }
        }
      }
    }

    return conversationPrompts;
  }

  /**
   * Parse turn-based format for conversation order
   */
  private static parseTurnBasedFormatConversation(lines: string[], fileName: string): ConversationPrompt[] {
    const conversationPrompts: ConversationPrompt[] = [];
    let order = 0;
    let isUserTurn = true;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (this.isLikelyAIResponse(trimmed)) {
        isUserTurn = false;
        continue;
      }

      if (this.isNewTurnIndicator(trimmed)) {
        isUserTurn = !isUserTurn;
        continue;
      }

      if (isUserTurn && trimmed.length > 10 && !this.isMetadata(trimmed)) {
        const cleanedPrompt = this.cleanPrompt(trimmed);
        if (cleanedPrompt.length > 10) {
          conversationPrompts.push({
            text: cleanedPrompt,
            order: order++,
            sourceFile: fileName,
            timestamp: this.extractTimestamp(trimmed)
          });
        }
        isUserTurn = false;
      }
    }

    return conversationPrompts;
  }

  /**
   * Extract timestamp from text if present
   */
  private static extractTimestamp(text: string): string | undefined {
    const timestampMatch = text.match(/(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?|\d{4}-\d{2}-\d{2})/i);
    return timestampMatch ? timestampMatch[1] : undefined;
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

  /**
   * Merges analysis results from multiple files
   */
  static mergeAnalysisResults(results: AnalysisResult[]): AnalysisResult {
    const promptMap = new Map<string, ExtractedPrompt>();
    const phraseMap = new Map<string, ExtractedPhrase>();
    const allConversationPrompts: ConversationPrompt[] = [];
    
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

      // Merge conversation prompts (maintain chronological order within each file)
      if (result.conversation) {
        allConversationPrompts.push(...result.conversation);
      }
    });

    // Sort conversation prompts by source file and then by order
    allConversationPrompts.sort((a, b) => {
      if (a.sourceFile !== b.sourceFile) {
        return a.sourceFile.localeCompare(b.sourceFile);
      }
      return a.order - b.order;
    });
    
    return {
      prompts: Array.from(promptMap.values()).sort((a, b) => b.frequency - a.frequency),
      phrases: Array.from(phraseMap.values()).sort((a, b) => b.frequency - a.frequency),
      conversation: allConversationPrompts,
    };
  }
}
