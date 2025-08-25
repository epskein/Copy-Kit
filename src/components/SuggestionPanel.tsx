import React, { useState } from 'react';
import { Copy, Search, Hash, FileText as FileTextIcon, Zap, MessageSquare } from 'lucide-react';
import { Topic, Snippet, Block } from '../types';

interface SuggestionPanelProps {
  selectedGroupId?: string | null;
  selectedGroup?: TopicGroup;
  selectedTopic?: Topic;
  selectedFile: { topicId: string; fileName: string } | null;
  onSuggestionCopy: (text: string) => void;
}

const fileColors = [
  'bg-[#2c2f31]', // default
  'bg-[#263238]',
  'bg-[#1e293b]',
  'bg-[#232526]',
  'bg-[#2d3748]',
  'bg-[#374151]',
  'bg-[#3b4252]',
  'bg-[#22223b]'
];

export const SuggestionPanel: React.FC<SuggestionPanelProps> = ({
  selectedGroupId,
  selectedGroup,
  selectedTopic,
  onSuggestionCopy,
  selectedFile
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'snippets' | 'blocks' | 'prompts'>('prompts');

  let mergedSnippets: Snippet[] = [];
  let mergedBlocks: Block[] = [];
  let mergedPrompts: { text: string; order: number }[] = [];

  if (selectedGroupId && selectedGroup) {
    // Gather all items with file and topic info for each tab
    let allPrompts: Array<{ text: string; fileName: string; topicName: string; colorIdx: number }> = [];
    let allSnippets: Array<{ text: string; fileName: string; topicName: string; colorIdx: number }> = [];
    let allBlocks: Array<{ text: string; fileName: string; topicName: string; colorIdx: number }> = [];
    let colorCounter = 0;
    selectedGroup.topics.forEach(topic => {
      if (Array.isArray(topic.sourceFiles) && Array.isArray(topic.sourceFilesContent)) {
        topic.sourceFiles.forEach((fileName, fIdx) => {
          if (!topic.sourceFilesContent[fIdx]) return; // skip if no content
          const fileContent = topic.sourceFilesContent[fIdx];
          const filePatterns = fileContent ? PatternExtractor.extractPatterns(fileContent) : { prompts: [], snippets: [], blocks: [] };
          filePatterns.prompts?.forEach(prompt => {
            allPrompts.push({
              text: prompt.text,
              fileName,
              topicName: topic.name,
              colorIdx: colorCounter % fileColors.length
            });
          });
          filePatterns.snippets?.forEach(snippet => {
            allSnippets.push({
              text: snippet.text,
              fileName,
              topicName: topic.name,
              colorIdx: colorCounter % fileColors.length
            });
          });
          filePatterns.blocks?.forEach(block => {
            allBlocks.push({
              text: block.text,
              fileName,
              topicName: topic.name,
              colorIdx: colorCounter % fileColors.length
            });
          });
          colorCounter++;
        });
      }
    });
    // Filter by search
    const filteredPrompts = allPrompts.filter(p => p.text.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredSnippets = allSnippets.filter(s => s.text.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredBlocks = allBlocks.filter(b => b.text.toLowerCase().includes(searchQuery.toLowerCase()));
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">{selectedGroup.name} (Collection View)</h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patterns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('snippets')}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'snippets'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Hash className="w-4 h-4" />
              <span>Snippets</span>
              <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {filteredSnippets.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('blocks')}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'blocks'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Blocks</span>
              <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {filteredBlocks.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('prompts')}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'prompts'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Prompts</span>
              <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {filteredPrompts.length}
              </span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {activeTab === 'prompts' && filteredPrompts.length === 0 && (
            <div className="text-center text-gray-400">No prompts found in this group.</div>
          )}
          {activeTab === 'snippets' && filteredSnippets.length === 0 && (
            <div className="text-center text-gray-400">No snippets found in this group.</div>
          )}
          {activeTab === 'blocks' && filteredBlocks.length === 0 && (
            <div className="text-center text-gray-400">No blocks found in this group.</div>
          )}
          {activeTab === 'prompts' && filteredPrompts.map((prompt, i) => (
            <div
              key={i}
              className={`rounded-lg p-3 border-l-4 ${fileColors[prompt.colorIdx]} mb-2 flex items-center`}
              style={{ borderLeftWidth: 6 }}
            >
              <div className="flex-1 text-white text-sm">{prompt.text}</div>
              <div className="ml-4 text-xs text-gray-400 whitespace-nowrap">{prompt.topicName} / {prompt.fileName}</div>
            </div>
          ))}
          {activeTab === 'snippets' && filteredSnippets.map((snippet, i) => (
            <div
              key={i}
              className={`rounded-lg p-3 border-l-4 ${fileColors[snippet.colorIdx]} mb-2 flex items-center`}
              style={{ borderLeftWidth: 6 }}
            >
              <div className="flex-1 text-blue-100 text-sm">{snippet.text}</div>
              <div className="ml-4 text-xs text-gray-400 whitespace-nowrap">{snippet.topicName} / {snippet.fileName}</div>
            </div>
          ))}
          {activeTab === 'blocks' && filteredBlocks.map((block, i) => (
            <div
              key={i}
              className={`rounded-lg p-3 border-l-4 ${fileColors[block.colorIdx]} mb-2 flex items-center`}
              style={{ borderLeftWidth: 6 }}
            >
              <div className="flex-1 text-purple-100 text-sm">{block.text}</div>
              <div className="ml-4 text-xs text-gray-400 whitespace-nowrap">{block.topicName} / {block.fileName}</div>
            </div>
          ))}
        </div>
      </div>
    );
  } else if (selectedTopic && !selectedFile) {
    mergedSnippets = selectedTopic.snippets;
    mergedBlocks = selectedTopic.blocks;
    mergedPrompts = selectedTopic.prompts;
  } else if (selectedTopic && selectedFile) {
    // Find the file content and extract patterns on the fly
    const fileIdx = selectedTopic.sourceFiles.findIndex(f => f === selectedFile.fileName);
    if (fileIdx !== -1 && selectedTopic.sourceFilesContent && selectedTopic.sourceFilesContent[fileIdx]) {
      const filePatterns = PatternExtractor.extractPatterns(selectedTopic.sourceFilesContent[fileIdx]);
      mergedSnippets = filePatterns.snippets;
      mergedBlocks = filePatterns.blocks;
      mergedPrompts = filePatterns.prompts;
    }
  }

  const filteredSnippets = mergedSnippets.filter(snippet =>
        snippet.text.toLowerCase().includes(searchQuery.toLowerCase())
      ) || [];

  const filteredBlocks = mergedBlocks.filter(block =>
        block.text.toLowerCase().includes(searchQuery.toLowerCase())
      ) || [];

  const filteredPrompts = mergedPrompts.filter(prompt =>
        prompt.text.toLowerCase().includes(searchQuery.toLowerCase())
      ) || [];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    onSuggestionCopy(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (!selectedTopic) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FileTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">No topic selected</h3>
          <p className="text-sm text-gray-400">
            Upload files and select a topic to see patterns
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{selectedTopic.name}</h2>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search patterns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('snippets')}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'snippets'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Hash className="w-4 h-4" />
            <span>Snippets</span>
            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              {mergedSnippets.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('blocks')}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'blocks'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Blocks</span>
            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              {mergedBlocks.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('prompts')}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'prompts'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Prompts</span>
            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              {mergedPrompts.length}
            </span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'snippets' && (
          <div className="space-y-3">
            {filteredSnippets.map((snippet, index) => (
              <div
                key={index}
                className="group bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-200 transition-all cursor-pointer transform hover:scale-[1.02]"
                onClick={() => handleCopy(snippet.text)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-medium text-gray-800 mb-1">{snippet.text}</p>
                    <div className="flex items-center space-x-2">
                      <Hash className="w-3 h-3 text-blue-500" />
                      <span className="text-xs text-blue-600">Snippet</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-blue-700 bg-blue-200 px-2 py-1 rounded-full font-medium">
                      {snippet.count}x
                    </span>
                    <button
                      className={`p-2 rounded-full transition-all ${
                        copiedText === snippet.text
                          ? 'text-green-600 bg-green-100'
                          : 'text-blue-500 group-hover:text-blue-700 group-hover:bg-blue-100'
                      }`}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'blocks' && (
          <div className="space-y-3">
            {filteredBlocks.map((block, index) => (
              <div
                key={index}
                className="group bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-lg p-4 hover:from-purple-100 hover:to-pink-100 hover:border-purple-200 transition-all cursor-pointer transform hover:scale-[1.02]"
                onClick={() => handleCopy(block.text)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-medium text-gray-800 mb-2">{block.text}</p>
                    <div className="flex items-center space-x-2">
                      <Zap className="w-3 h-3 text-purple-500" />
                      <span className="text-xs text-purple-600">Template Block</span>
                      {block.placeholders.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-600">
                            {block.placeholders.length} placeholder{block.placeholders.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                    {block.placeholders.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {block.placeholders.slice(0, 3).map((placeholder, i) => (
                          <span
                            key={i}
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full"
                          >
                            {placeholder}
                          </span>
                        ))}
                        {block.placeholders.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{block.placeholders.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-purple-700 bg-purple-200 px-2 py-1 rounded-full font-medium">
                      {block.count}x
                    </span>
                    <button
                      className={`p-2 rounded-full transition-all ${
                        copiedText === block.text
                          ? 'text-green-600 bg-green-100'
                          : 'text-purple-500 group-hover:text-purple-700 group-hover:bg-purple-100'
                      }`}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'prompts' && (
          <div className="space-y-3">
            {filteredPrompts.map((prompt, index) => (
              <div
                key={index}
                className="group bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-lg p-4 hover:from-green-100 hover:to-emerald-100 hover:border-green-200 transition-all cursor-pointer transform hover:scale-[1.02]"
                onClick={() => handleCopy(prompt.text)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-medium text-gray-800 mb-2">{prompt.text}</p>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600">Full Prompt</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-600">
                        #{prompt.order + 1} in sequence
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-green-700 bg-green-200 px-2 py-1 rounded-full font-medium">
                      #{prompt.order + 1}
                    </span>
                    <button
                      className={`p-2 rounded-full transition-all ${
                        copiedText === prompt.text
                          ? 'text-green-600 bg-green-100'
                          : 'text-green-500 group-hover:text-green-700 group-hover:bg-green-100'
                      }`}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {((activeTab === 'snippets' && filteredSnippets.length === 0) || 
          (activeTab === 'blocks' && filteredBlocks.length === 0) ||
          (activeTab === 'prompts' && filteredPrompts.length === 0)) && searchQuery && (
          <div className="text-center py-8">
            <p className="text-gray-500">No {activeTab} match your search</p>
          </div>
        )}

        {((activeTab === 'snippets' && filteredSnippets.length === 0) || 
          (activeTab === 'blocks' && filteredBlocks.length === 0) ||
          (activeTab === 'prompts' && filteredPrompts.length === 0)) && !searchQuery && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              {activeTab === 'snippets' && <Hash className="w-8 h-8 mx-auto" />}
              {activeTab === 'blocks' && <Zap className="w-8 h-8 mx-auto" />}
              {activeTab === 'prompts' && <MessageSquare className="w-8 h-8 mx-auto" />}
            </div>
            <p className="text-gray-500">
              No {activeTab} found for this topic
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === 'snippets' && 'Upload more conversation files to extract common phrases'}
              {activeTab === 'blocks' && 'Upload files with repeated prompt templates to see blocks'}
              {activeTab === 'prompts' && 'Upload conversation files to see your full prompts in order'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};