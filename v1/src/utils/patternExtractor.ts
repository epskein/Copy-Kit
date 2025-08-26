export interface ExtractedPattern {
  snippets: Array<{ text: string; count: number }>;
  blocks: Array<{ text: string; count: number; placeholders: string[] }>;
  prompts: Array<{ text: string; order: number }>;
}

export class PatternExtractor {
  private static extractUserPrompts(content: string): string[] {
    const lines = content.split('\n');
    const prompts: string[] = [];
    let currentPrompt = '';
    let isUserTurn = true;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and metadata
      if (!trimmedLine || trimmedLine.match(/^\*\*\*.*\*\*\*$/)) continue;
      if (trimmedLine.match(/^\[.*\]$/)) continue; // Skip timestamps
      if (trimmedLine.match(/^\d{4}-\d{2}-\d{2}/)) continue; // Skip dates
      
      // Check for explicit user prefixes
      const userMatch = trimmedLine.match(/^(User|You|Human|Me):\s*(.+)/i);
      if (userMatch) {
        if (currentPrompt) {
          prompts.push(this.cleanPrompt(currentPrompt));
        }
        currentPrompt = userMatch[2];
        isUserTurn = true;
        continue;
      }
      
      // Check for assistant prefixes
      const assistantMatch = trimmedLine.match(/^(Assistant|AI|Bot|Claude|GPT):\s*(.+)/i);
      if (assistantMatch) {
        if (currentPrompt && isUserTurn) {
          prompts.push(this.cleanPrompt(currentPrompt));
          currentPrompt = '';
        }
        isUserTurn = false;
        continue;
      }
      
      // Handle markdown-style user indicators
      if (trimmedLine.match(/^\*\*User\*\*:\s*(.+)/i)) {
        if (currentPrompt) {
          prompts.push(this.cleanPrompt(currentPrompt));
        }
        currentPrompt = trimmedLine.replace(/^\*\*User\*\*:\s*/i, '');
        isUserTurn = true;
        continue;
      }
      
      if (trimmedLine.match(/^\*\*Assistant\*\*:\s*(.+)/i)) {
        if (currentPrompt && isUserTurn) {
          prompts.push(this.cleanPrompt(currentPrompt));
          currentPrompt = '';
        }
        isUserTurn = false;
        continue;
      }
      
      // Handle content continuation
      if (isUserTurn) {
        if (currentPrompt || trimmedLine.length > 10) { // Only add substantial content
          currentPrompt += (currentPrompt ? ' ' : '') + trimmedLine;
        }
      } else {
        // We're in assistant mode, so if we have accumulated user content, save it
        if (currentPrompt) {
          prompts.push(this.cleanPrompt(currentPrompt));
          currentPrompt = '';
          isUserTurn = true; // Switch back to user for next turn
        }
      }
    }
    
    // Add final prompt if exists and is from user
    if (currentPrompt && isUserTurn && currentPrompt.trim().length > 5) {
      prompts.push(this.cleanPrompt(currentPrompt));
    }
    
    return prompts.filter(p => p.length > 5); // Filter very short prompts
  }
  
  private static extractOrderedPrompts(content: string): Array<{ text: string; order: number }> {
    const lines = content.split('\n');
    const prompts: Array<{ text: string; order: number }> = [];
    let currentPrompt = '';
    let isUserTurn = true;
    let promptOrder = 0;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and metadata
      if (!trimmedLine || trimmedLine.match(/^\*\*\*.*\*\*\*$/)) continue;
      if (trimmedLine.match(/^\[.*\]$/)) continue; // Skip timestamps
      if (trimmedLine.match(/^\d{4}-\d{2}-\d{2}/)) continue; // Skip dates
      
      // Check for explicit user prefixes
      const userMatch = trimmedLine.match(/^(User|You|Human|Me):\s*(.+)/i);
      if (userMatch) {
        if (currentPrompt) {
          prompts.push({ text: this.cleanPrompt(currentPrompt), order: promptOrder++ });
        }
        currentPrompt = userMatch[2];
        isUserTurn = true;
        continue;
      }
      
      // Check for assistant prefixes
      const assistantMatch = trimmedLine.match(/^(Assistant|AI|Bot|Claude|GPT):\s*(.+)/i);
      if (assistantMatch) {
        if (currentPrompt && isUserTurn) {
          prompts.push({ text: this.cleanPrompt(currentPrompt), order: promptOrder++ });
          currentPrompt = '';
        }
        isUserTurn = false;
        continue;
      }
      
      // Handle markdown-style user indicators
      if (trimmedLine.match(/^\*\*User\*\*:\s*(.+)/i)) {
        if (currentPrompt) {
          prompts.push({ text: this.cleanPrompt(currentPrompt), order: promptOrder++ });
        }
        currentPrompt = trimmedLine.replace(/^\*\*User\*\*:\s*/i, '');
        isUserTurn = true;
        continue;
      }
      
      if (trimmedLine.match(/^\*\*Assistant\*\*:\s*(.+)/i)) {
        if (currentPrompt && isUserTurn) {
          prompts.push({ text: this.cleanPrompt(currentPrompt), order: promptOrder++ });
          currentPrompt = '';
        }
        isUserTurn = false;
        continue;
      }
      
      // Handle content continuation
      if (isUserTurn) {
        if (currentPrompt || trimmedLine.length > 10) { // Only add substantial content
          currentPrompt += (currentPrompt ? ' ' : '') + trimmedLine;
        }
      } else {
        // We're in assistant mode, so if we have accumulated user content, save it
        if (currentPrompt) {
          prompts.push({ text: this.cleanPrompt(currentPrompt), order: promptOrder++ });
          currentPrompt = '';
          isUserTurn = true; // Switch back to user for next turn
        }
      }
    }
    
    // Add final prompt if exists and is from user
    if (currentPrompt && isUserTurn && currentPrompt.trim().length > 5) {
      prompts.push({ text: this.cleanPrompt(currentPrompt), order: promptOrder++ });
    }
    
    return prompts.filter(p => p.text.length > 5); // Filter very short prompts
  }
  
  private static cleanPrompt(prompt: string): string {
    // Remove timestamps like [10:30:00] or [2024-01-15]
    prompt = prompt.replace(/\[\d{1,2}:\d{2}:\d{2}\]/g, '');
    prompt = prompt.replace(/\[\d{4}-\d{2}-\d{2}\]/g, '');
    
    // Remove markdown formatting
    prompt = prompt.replace(/\*\*|__|~~|`/g, '');
    
    // Remove code blocks
    prompt = prompt.replace(/```[\s\S]*?```/g, '');
    
    // Remove user/assistant prefixes
    prompt = prompt.replace(/^(User|You|Human|Me):\s*/i, '');
    prompt = prompt.replace(/^(Assistant|AI|Bot|GPT):\s*/i, '');
    
    // Remove any remaining bracketed content
    prompt = prompt.replace(/\[[^\]]+\]/g, '');
    
    // Trim whitespace
    return prompt.trim();
  }
  
  private static extractNGrams(text: string, n: number): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const ngrams: string[] = [];
    
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.push(words.slice(i, i + n).join(' '));
    }
    
    return ngrams;
  }
  
  private static detectPlaceholders(prompts: string[]): Array<{ text: string; count: number; placeholders: string[] }> {
    const patterns: Map<string, { count: number; variations: string[]; placeholders: Set<string> }> = new Map();
    
    // Group similar prompts
    for (const prompt of prompts) {
      const words = prompt.split(/\s+/);
      
      // Try different placeholder patterns
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        
        // Skip common words
        if (word.length < 3 || /^(the|and|or|but|in|on|at|to|for|of|with|by)$/i.test(word)) {
          continue;
        }
        
        // Create pattern with placeholder
        const pattern = [...words];
        pattern[i] = '{placeholder}';
        const patternText = pattern.join(' ');
        
        if (!patterns.has(patternText)) {
          patterns.set(patternText, { count: 0, variations: [], placeholders: new Set() });
        }
        
        const entry = patterns.get(patternText)!;
        if (!entry.variations.includes(prompt)) {
          entry.variations.push(prompt);
          entry.count++;
          entry.placeholders.add(word);
        }
      }
    }
    
    // Filter patterns that appear multiple times
    return Array.from(patterns.entries())
      .filter(([_, data]) => data.count >= 2)
      .map(([pattern, data]) => ({
        text: pattern,
        count: data.count,
        placeholders: Array.from(data.placeholders)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Limit to top 20 patterns
  }
  
  // Improved extraction: section-based using **User** and **Cursor**
  public static extractPatterns(content: string): ExtractedPattern {
    // 1. Extract user prompts by section
    const userPrompts = this.extractUserPromptsBySection(content);
    const orderedPrompts = userPrompts.map((text, order) => ({ text, order }));

    // 2. Full prompt deduplication and frequency
    const promptCounts = new Map<string, number>();
    userPrompts.forEach(prompt => {
      promptCounts.set(prompt, (promptCounts.get(prompt) || 0) + 1);
    });

    // 3. Long blocks (≥20 words, ≥2 occurrences)
    const longBlocks = Array.from(promptCounts.entries())
      .filter(([prompt, count]) => prompt.split(/\s+/).length >= 20 && count >= 2)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([text, count]) => ({
        text,
        count,
        placeholders: this.detectPlaceholders([text])
      }));

    // 4. Improved snippet extraction: full sentences/phrases (5+ words)
    const sentenceCounts = new Map<string, number>();
    userPrompts.forEach(prompt => {
      // Replace file references with {file}
      const promptWithPlaceholders = prompt.replace(/@[\w\-\.]+/g, '{file}');
      // Split into sentences using punctuation
      const sentences = promptWithPlaceholders.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean);
      sentences.forEach(sentence => {
        if (sentence.split(/\s+/).length >= 5) {
          sentenceCounts.set(sentence, (sentenceCounts.get(sentence) || 0) + 1);
        }
      });
    });
    const snippets = Array.from(sentenceCounts.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([text, count]) => ({ text, count }));

    return {
      snippets,
      blocks: longBlocks,
      prompts: orderedPrompts
    };
  }

  // Section-based extraction using **User** and **Cursor**
  private static extractUserPromptsBySection(content: string): string[] {
    // Split on **User** (case-insensitive, allow colons/whitespace)
    const userSections = content.split(/\*\*\s*User\s*:?\s*\*\*/i).slice(1);
    const prompts: string[] = [];
    for (const section of userSections) {
      // End at the next **Cursor** or end of section
      const [prompt] = section.split(/\*\*\s*Cursor\s*:?\s*\*\*/i);
      if (prompt) {
        const cleaned = this.cleanPrompt(prompt);
        if (cleaned.length > 5) prompts.push(cleaned);
      }
    }
    return prompts;
  }

  // N-gram extraction helper
  private static extractNGrams(text: string, n: number): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const ngrams: string[] = [];
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.push(words.slice(i, i + n).join(' '));
    }
    return ngrams;
  }

  async extractPatterns(files: FileData[]): Promise<Record<string, ExtractedPattern>> {
    const patternsByTopic: Record<string, ExtractedPattern> = {};
    
    // Group files by topic
    const filesByTopic: Record<string, FileData[]> = {};
    for (const file of files) {
      const topic = this.extractTopicFromFilename(file.name);
      if (!filesByTopic[topic]) {
        filesByTopic[topic] = [];
      }
      filesByTopic[topic].push(file);
    }
    
    // Process each topic's files together
    for (const [topic, topicFiles] of Object.entries(filesByTopic)) {
      // Merge all content from files in this topic
      const allContent = topicFiles.map(file => file.content).join('\n\n');
      
      // Extract patterns from merged content
      const userPrompts = this.extractUserPrompts(allContent);
      const snippets = this.extractSnippets(userPrompts);
      const blocks = this.extractBlocks(userPrompts);
      
      patternsByTopic[topic] = {
        topic,
        snippets,
        blocks,
        prompts: userPrompts.map((text, index) => ({ text, order: index }))
      };
    }
    
    return patternsByTopic;
  }
}