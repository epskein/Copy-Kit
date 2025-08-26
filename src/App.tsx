import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { PatternDisplay } from './components/PatternDisplay';
import { TopicManager } from './components/TopicManager';
import { FileManager } from './components/FileManager';
import { PatternAnalyzer } from './lib/pattern-analyzer';
import type { FileData, Topic, ExtractedPattern } from './types';
import './App.css';

function App() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [analysisResults, setAnalysisResults] = useState<ExtractedPattern | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFilesUploaded = async (newFiles: FileData[]) => {
    setIsAnalyzing(true);
    try {
      // Add topic assignment and generate IDs for new files
      const filesWithTopic = newFiles.map(file => ({
        ...file,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        topic: selectedTopic?.name,
        uploadedAt: new Date()
      }));

      setFiles(prevFiles => [...prevFiles, ...filesWithTopic]);

      // Analyze the files
      const results = filesWithTopic.map(file => 
        PatternAnalyzer.analyzeFile(file.content, file.name)
      );

      const mergedResults = PatternAnalyzer.mergeAnalysisResults(results);
      
      // Convert to the expected format
      const patternResults: ExtractedPattern = {
        prompts: mergedResults.prompts,
        phrases: mergedResults.phrases,
        conversation: mergedResults.conversation
      };

      setAnalysisResults(patternResults);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTopicCreated = (topic: Topic) => {
    setTopics(prevTopics => [...prevTopics, topic]);
  };

  const handleTopicSelected = (topic: Topic | null) => {
    setSelectedTopic(topic);
  };

  const handleFileDelete = (fileId: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
    // Re-analyze remaining files
    const remainingFiles = files.filter(file => file.id !== fileId);
    if (remainingFiles.length > 0) {
      const results = remainingFiles.map(file => 
        PatternAnalyzer.analyzeFile(file.content, file.name)
      );
      const mergedResults = PatternAnalyzer.mergeAnalysisResults(results);
      const patternResults: ExtractedPattern = {
        prompts: mergedResults.prompts,
        phrases: mergedResults.phrases,
        conversation: mergedResults.conversation
      };
      setAnalysisResults(patternResults);
    } else {
      setAnalysisResults(null);
    }
  };

  const handleFileMove = (fileId: string, newTopic: string | undefined) => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === fileId 
          ? { ...file, topic: newTopic }
          : file
      )
    );
  };

  const handleTopicDelete = (topicId: string) => {
    // Remove topic from topics list
    setTopics(prevTopics => prevTopics.filter(topic => topic.id !== topicId));
    
    // Find the topic name to unassign files
    const topicToDelete = topics.find(topic => topic.id === topicId);
    if (topicToDelete) {
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.topic === topicToDelete.name 
            ? { ...file, topic: undefined }
            : file
        )
      );
    }
    
    // If the deleted topic was selected, clear selection
    if (selectedTopic?.id === topicId) {
      setSelectedTopic(null);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Floating background shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="floating-shape absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-sm"></div>
        <div className="floating-shape absolute top-40 right-20 w-24 h-24 bg-white/8 rounded-full blur-sm"></div>
        <div className="floating-shape absolute bottom-32 left-1/4 w-40 h-40 bg-white/6 rounded-full blur-sm"></div>
        <div className="floating-shape absolute bottom-20 right-1/3 w-28 h-28 bg-white/12 rounded-full blur-sm"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <header className="text-center mb-8">
          <h1 className="text-6xl font-bold text-glass mb-4 drop-shadow-lg font-kugile">
            Copy-Kit
          </h1>
          <p className="text-xl text-glass-muted mb-2">
            Prompt Pattern Analyzer
          </p>
          <p className="text-glass-light">
            Extract and analyze user prompts from conversation files
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - File Upload & Topic Management */}
          <div className="lg:col-span-1 space-y-6">
            <TopicManager
              topics={topics}
              selectedTopic={selectedTopic}
              onTopicCreated={handleTopicCreated}
              onTopicSelected={handleTopicSelected}
              onTopicDelete={handleTopicDelete}
            />
            
            <FileUpload
              onFilesUploaded={handleFilesUploaded}
              selectedTopic={selectedTopic}
              isAnalyzing={isAnalyzing}
            />

            <FileManager
              files={files}
              topics={topics}
              onFileDelete={handleFileDelete}
              onFileMove={handleFileMove}
              onTopicDelete={handleTopicDelete}
            />
          </div>

          {/* Right Column - Analysis Results */}
          <div className="lg:col-span-2">
            <PatternDisplay
              results={analysisResults}
              isAnalyzing={isAnalyzing}
              selectedTopic={selectedTopic}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
