import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Bot, Zap } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { TopicSidebar } from './components/TopicSidebar';
import { SuggestionPanel } from './components/SuggestionPanel';
import { GroupDialog } from './components/GroupDialog';
import { TopicGroup, Topic } from './types';
import { extractTopicFromFilename } from './utils/textAnalysis';
import { PatternExtractor } from './utils/patternExtractor';
import { LandingPage } from './components/LandingPage';

function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [groups, setGroups] = useState<TopicGroup[]>([
    {
      id: 'default',
      name: 'Uploaded Topics',
      topics: []
    }
  ]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | undefined>();
  const [selectedFile, setSelectedFile] = useState<{ topicId: string; fileName: string } | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [hasUploaded, setHasUploaded] = useState(false);

  const handleFileUpload = useCallback(async (files: FileList) => {
    setIsProcessing(true);
    
    try {
      const topicMap: Record<string, {contents: string[], files: File[]}> = {};
      
      // Group files by topic
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const content = await file.text();
        const topicName = extractTopicFromFilename(file.name);
        
        if (!topicMap[topicName]) {
          topicMap[topicName] = { contents: [], files: [] };
        }
        topicMap[topicName].contents.push(content);
        topicMap[topicName].files.push(file);
      }

      const newTopics: Topic[] = [];
      
      // Process each topic with merged content
      for (const [topicName, {contents, files}] of Object.entries(topicMap)) {
        const mergedContent = contents.join('\n\n');
        const patterns = PatternExtractor.extractPatterns(mergedContent);
        
        newTopics.push({
          id: `topic-${Date.now()}-${topicName}`,
          name: topicName,
          groupId: 'default',
          snippets: patterns.snippets,
          blocks: patterns.blocks,
          prompts: patterns.prompts,
          sourceFiles: files.map(f => f.name)
        });
      }

      // Update state
      setGroups(prev => prev.map(group => 
        group.id === 'default' 
          ? { ...group, topics: [...group.topics, ...newTopics] }
          : group
      ));

      if (newTopics.length > 0) {
        setSelectedTopic(newTopics[0]);
      }
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleCreateGroup = useCallback((name: string) => {
    const newGroup: TopicGroup = {
      id: `group-${Date.now()}`,
      name,
      topics: []
    };
    setGroups(prev => [...prev, newGroup]);
  }, []);

  const handleRenameTopic = (topicId: string, newName: string) => {
    setGroups(prevGroups => prevGroups.map(group => ({
      ...group,
      topics: group.topics.map(topic =>
        topic.id === topicId ? { ...topic, name: newName } : topic
      )
    })));
  };

  const handleRenameGroup = (groupId: string, newName: string) => {
    setGroups(prevGroups => prevGroups.map(group =>
      group.id === groupId ? { ...group, name: newName } : group
    ));
  };

  const handleSuggestionCopy = useCallback((text: string) => {
    // Could add toast notification or other feedback here
    console.log('Copied:', text);
  }, []);

  const handleFileMove = async (fileName: string, fromTopicId: string, toTopicId: string) => {
    setGroups(prevGroups => prevGroups.map(group => {
      const fromTopic = group.topics.find(t => t.id === fromTopicId);
      const toTopic = group.topics.find(t => t.id === toTopicId);
      if (!fromTopic || !toTopic) return group;
      // Remove file from fromTopic
      const fileIdx = fromTopic.sourceFiles.indexOf(fileName);
      if (fileIdx === -1) return group;
      const [movedFile] = fromTopic.sourceFiles.splice(fileIdx, 1);
      toTopic.sourceFiles.push(movedFile);
      // Re-extract patterns for both topics (pseudo, needs file content access)
      // fromTopic = reExtractPatterns(fromTopic)
      // toTopic = reExtractPatterns(toTopic)
      return { ...group };
    }));
  };

  const handleAddFilesToTopic = async (topicId: string, files: FileList) => {
    setGroups(async prevGroups => {
      return await Promise.all(prevGroups.map(async group => {
        const topic = group.topics.find(t => t.id === topicId);
        if (!topic) return group;
        // Filter out files already present
        const newFiles = Array.from(files).filter(f => !topic.sourceFiles.includes(f.name));
        if (newFiles.length === 0) return group;
        // Read new file contents
        const newContents = await Promise.all(newFiles.map(f => f.text()));
        // Merge with existing content
        const allContents = [...(topic.sourceFilesContent || []), ...newContents];
        // Re-extract patterns from ALL files in the topic
        const mergedContent = allContents.join('\n\n');
        const patterns = PatternExtractor.extractPatterns(mergedContent);
        // Update topic
        return {
          ...group,
          topics: group.topics.map(t =>
            t.id === topicId
              ? {
                  ...t,
                  sourceFiles: [...t.sourceFiles, ...newFiles.map(f => f.name)],
                  sourceFilesContent: allContents,
                  snippets: patterns.snippets,
                  blocks: patterns.blocks,
                  prompts: patterns.prompts
                }
              : t
          )
        };
      }));
    });
  };

  const handleFileSelect = (topicId: string, fileName: string) => {
    setSelectedTopic(groups.flatMap(g => g.topics).find(t => t.id === topicId));
    setSelectedFile({ topicId, fileName });
  };

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedTopic(undefined);
    setSelectedFile(null);
  };

  const handleGlobalFileDrop = async (files: FileList) => {
    // Same logic as initial upload: group files by topic, merge, extract patterns, update state
    const topicMap: Record<string, {contents: string[], files: File[]}> = {};
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const content = await file.text();
      const topicName = extractTopicFromFilename(file.name);
      if (!topicMap[topicName]) {
        topicMap[topicName] = { contents: [], files: [] };
      }
      topicMap[topicName].contents.push(content);
      topicMap[topicName].files.push(file);
    }
    setGroups(prev => prev.map(group => {
      if (group.id !== 'default') return group;
      const newTopics: Topic[] = [];
      for (const [topicName, {contents, files}] of Object.entries(topicMap)) {
        // If topic exists, append files and merge content
        const existing = group.topics.find(t => t.name === topicName);
        if (existing) {
          const newFileNames = files.map(f => f.name).filter(f => !existing.sourceFiles.includes(f));
          const newContents = files.filter(f => !existing.sourceFiles.includes(f.name)).map(f => contents[files.indexOf(f)]);
          const allContents = [...(existing.sourceFilesContent || []), ...newContents];
          const mergedContent = allContents.join('\n\n');
          const patterns = PatternExtractor.extractPatterns(mergedContent);
          existing.sourceFiles = [...existing.sourceFiles, ...newFileNames];
          existing.sourceFilesContent = allContents;
          existing.snippets = patterns.snippets;
          existing.blocks = patterns.blocks;
          existing.prompts = patterns.prompts;
        } else {
          const mergedContent = contents.join('\n\n');
          const patterns = PatternExtractor.extractPatterns(mergedContent);
          newTopics.push({
            id: `topic-${Date.now()}-${topicName}`,
            name: topicName,
            groupId: 'default',
            snippets: patterns.snippets,
            blocks: patterns.blocks,
            prompts: patterns.prompts,
            sourceFiles: files.map(f => f.name),
            sourceFilesContent: contents
          });
        }
      }
      return {
        ...group,
        topics: [...group.topics, ...newTopics]
      };
    }));
  };

  const handleLandingUpload = async (files: FileList) => {
    await handleFileUpload(files);
    setHasUploaded(true);
  };

  // After groups change, auto-select the first topic if none is selected
  useEffect(() => {
    const allTopics = groups.flatMap(g => g.topics);
    if (allTopics.length > 0 && !selectedTopic) {
      setSelectedTopic(allTopics[0]);
      setSelectedFile(null);
    }
  }, [groups, selectedTopic]);

  if (!hasUploaded) {
    return <LandingPage onFilesUpload={handleLandingUpload} isProcessing={isProcessing} />;
  }

  const hasTopics = groups.some(group => group.topics.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Bot className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">PROMPTER</h1>
            </div>
            <div className="hidden sm:flex items-center space-x-1 text-sm text-gray-500">
              <Zap className="w-4 h-4" />
              <span>AI Prompt Builder</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {hasTopics ? (
          <>
            <TopicSidebar
              groups={groups}
              selectedGroupId={selectedGroupId}
              selectedTopicId={selectedTopic?.id}
              selectedFile={selectedFile}
              onGroupSelect={handleGroupSelect}
              onTopicSelect={topic => { setSelectedTopic(topic); setSelectedGroupId(null); setSelectedFile(null); }}
              onFileSelect={(topicId, fileName) => { setSelectedFile({ topicId, fileName }); setSelectedGroupId(null); }}
              onCreateGroup={() => setShowGroupDialog(true)}
              onRenameTopic={handleRenameTopic}
              onRenameGroup={handleRenameGroup}
              onFileMove={handleFileMove}
              onAddFilesToTopic={handleAddFilesToTopic}
              onGlobalFileDrop={handleGlobalFileDrop}
              openFileDialog={() => inputRef.current?.click()}
              inputRef={inputRef}
            />
            <SuggestionPanel
              selectedGroupId={selectedGroupId}
              selectedGroup={groups.find(g => g.id === selectedGroupId)}
              selectedTopic={selectedTopic}
              selectedFile={selectedFile}
              onSuggestionCopy={handleSuggestionCopy}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-3xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Upload Your Conversation Files
                </h2>
                <p className="text-lg text-gray-600">
                  Analyze your AI conversations to build a repository of reusable prompts and phrases
                </p>
              </div>
              
              <FileUpload
                onFileUpload={handleFileUpload}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        )}
      </div>

      <GroupDialog
        isOpen={showGroupDialog}
        onClose={() => setShowGroupDialog(false)}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
}

export default App;