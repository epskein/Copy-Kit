import React, { useState } from 'react';
import { Copy, Search, Filter, Star, FileText, Hash, MessageCircle } from 'lucide-react';
import type { ExtractedPattern, Topic } from '../types';

interface PatternDisplayProps {
  results: ExtractedPattern | null;
  isAnalyzing: boolean;
  selectedTopic: Topic | null;
}

export function PatternDisplay({ results, isAnalyzing, selectedTopic }: PatternDisplayProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'prompts' | 'phrases' | 'conversation'>('prompts');
  const [minFrequency, setMinFrequency] = useState(1);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const filteredPrompts = results?.prompts.filter(prompt => 
    prompt.frequency >= minFrequency &&
    prompt.text.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredPhrases = results?.phrases.filter(phrase => 
    phrase.frequency >= minFrequency &&
    phrase.text.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredConversation = results?.conversation.filter(prompt =>
    prompt.text.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isAnalyzing) {
    return (
      <div className="glass-card rounded-2xl p-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white/80"></div>
          <span className="ml-6 text-glass text-xl">Analyzing patterns...</span>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <FileText className="mx-auto text-white/60 mb-6" size={80} />
        <h3 className="text-2xl font-semibold text-glass mb-4">
          No Analysis Yet
        </h3>
        <p className="text-glass-muted text-lg">
          Upload some conversation files to start extracting prompt patterns
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/20 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-semibold text-glass">Pattern Analysis Results</h2>
          <div className="flex items-center space-x-6">
            <div className="text-glass-muted">
              {results.prompts.length} prompts • {results.phrases.length} phrases • {results.conversation?.length || 0} conversation
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-6">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" size={20} />
              <input
                type="text"
                placeholder="Search patterns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 glass-input rounded-xl text-lg"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Filter className="text-white/60" size={20} />
            <label className="text-glass-muted">Min frequency:</label>
            <select
              value={minFrequency}
              onChange={(e) => setMinFrequency(Number(e.target.value))}
              className="glass-input rounded-lg px-3 py-2"
            >
              <option value={1}>1+</option>
              <option value={2}>2+</option>
              <option value={3}>3+</option>
              <option value={5}>5+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/20">
        <nav className="flex space-x-12 px-8">
          <button
            onClick={() => setActiveTab('prompts')}
            className={`py-6 px-2 border-b-2 font-medium transition-all ${
              activeTab === 'prompts'
                ? 'border-white text-white'
                : 'border-transparent text-glass-muted hover:text-glass'
            }`}
          >
            <FileText className="inline mr-3" size={18} />
            Full Prompts ({filteredPrompts.length})
          </button>
          <button
            onClick={() => setActiveTab('phrases')}
            className={`py-6 px-2 border-b-2 font-medium transition-all ${
              activeTab === 'phrases'
                ? 'border-white text-white'
                : 'border-transparent text-glass-muted hover:text-glass'
            }`}
          >
            <Hash className="inline mr-3" size={18} />
            Common Phrases ({filteredPhrases.length})
          </button>
          <button
            onClick={() => setActiveTab('conversation')}
            className={`py-6 px-2 border-b-2 font-medium transition-all ${
              activeTab === 'conversation'
                ? 'border-white text-white'
                : 'border-transparent text-glass-muted hover:text-glass'
            }`}
          >
            <MessageCircle className="inline mr-3" size={18} />
            Conversation ({filteredConversation.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-8">
        {activeTab === 'prompts' && (
          <div className="space-y-6">
            {filteredPrompts.length === 0 ? (
              <p className="text-glass-muted text-center py-12 text-lg">
                No prompts match your current filters
              </p>
            ) : (
              filteredPrompts.map((prompt, index) => (
                <div
                  key={index}
                  className="glass-input rounded-xl p-6 hover:bg-white/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full">
                        Used {prompt.frequency}x
                      </span>
                      {prompt.frequency >= 5 && (
                        <Star className="text-yellow-300" size={20} />
                      )}
                    </div>
                    <button
                      onClick={() => copyToClipboard(prompt.text)}
                      className="glass-button rounded-lg p-2 hover:bg-white/30"
                      title="Copy to clipboard"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                  <p className="text-glass leading-relaxed text-lg">{prompt.text}</p>
                  <div className="mt-3 text-sm text-glass-light">
                    Source: {prompt.sourceFile}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'phrases' && (
          <div className="space-y-4">
            {filteredPhrases.length === 0 ? (
              <p className="text-glass-muted text-center py-12 text-lg">
                No phrases match your current filters
              </p>
            ) : (
              filteredPhrases.map((phrase, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-5 glass-input rounded-xl hover:bg-white/20 transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <span className="bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full">
                      {phrase.frequency}x
                    </span>
                    <span className="text-glass text-lg">{phrase.text}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-glass-light">
                      {phrase.sourceFiles.length} file(s)
                    </span>
                    <button
                      onClick={() => copyToClipboard(phrase.text)}
                      className="glass-button rounded-lg p-2 hover:bg-white/30"
                      title="Copy to clipboard"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'conversation' && (
          <div className="space-y-6">
            {filteredConversation.length === 0 ? (
              <p className="text-glass-muted text-center py-12 text-lg">
                No conversation prompts match your current filters
              </p>
            ) : (
              filteredConversation.map((prompt, index) => (
                <div
                  key={index}
                  className="glass-input rounded-xl p-6 hover:bg-white/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full">
                        #{prompt.order + 1}
                      </span>
                      {prompt.timestamp && (
                        <span className="text-glass-light text-sm">
                          {prompt.timestamp}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => copyToClipboard(prompt.text)}
                      className="glass-button rounded-lg p-2 hover:bg-white/30"
                      title="Copy to clipboard"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                  <p className="text-glass leading-relaxed text-lg mb-3">
                    {prompt.text}
                  </p>
                  <div className="text-sm text-glass-light">
                    Source: {prompt.sourceFile}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
