import React, { useState } from 'react';
import { Folder, FileText, Plus } from 'lucide-react';
import { TopicGroup, Topic } from '../types';

interface TopicSidebarProps {
  groups: TopicGroup[];
  selectedGroupId?: string | null;
  selectedTopicId?: string;
  selectedFile: { topicId: string; fileName: string } | null;
  onGroupSelect: (groupId: string) => void;
  onTopicSelect: (topic: Topic) => void;
  onCreateGroup: () => void;
  onRenameTopic: (topicId: string, newName: string) => void;
  onFileMove: (fileName: string, fromTopicId: string, toTopicId: string) => void;
  onAddFilesToTopic: (topicId: string, files: FileList) => void;
  onRenameGroup: (groupId: string, newName: string) => void;
  onFileSelect: (topicId: string, fileName: string) => void;
  onGlobalFileDrop: (files: FileList) => void;
  openFileDialog: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export const TopicSidebar: React.FC<TopicSidebarProps> = ({
  groups,
  selectedGroupId,
  selectedTopicId,
  selectedFile,
  onGroupSelect,
  onTopicSelect,
  onCreateGroup,
  onRenameTopic,
  onFileMove,
  onAddFilesToTopic,
  onRenameGroup,
  onFileSelect,
  onGlobalFileDrop,
  openFileDialog,
  inputRef
}) => {
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [renameGroupValue, setRenameGroupValue] = useState('');

  const handleRename = (topicId: string, currentName: string) => {
    setEditingTopicId(topicId);
    setRenameValue(currentName);
  };

  const handleRenameSubmit = (topicId: string) => {
    if (renameValue.trim()) {
      onRenameTopic(topicId, renameValue.trim());
    }
    setEditingTopicId(null);
    setRenameValue('');
  };

  const handleGroupRename = (groupId: string, currentName: string) => {
    setEditingGroupId(groupId);
    setRenameGroupValue(currentName);
  };

  const handleGroupRenameSubmit = (groupId: string) => {
    if (renameGroupValue.trim()) {
      onRenameGroup(groupId, renameGroupValue.trim());
    }
    setEditingGroupId(null);
    setRenameGroupValue('');
  };

  const handleGlobalDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      onGlobalFileDrop(e.dataTransfer.files);
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Topics</h2>
          <button
            onClick={onCreateGroup}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Create new group"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {groups.map((group) => {
          const isGroupSelected = selectedGroupId === group.id;
          return (
            <div key={group.id} className="space-y-2">
              {/* Group button/header */}
              <button
                onClick={() => onGroupSelect(group.id)}
                className={`flex items-center space-x-2 w-full px-3 py-2 rounded-md text-left text-base font-semibold transition-colors ${
                  isGroupSelected ? 'bg-blue-950 border border-blue-400 text-white' : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Folder className="w-5 h-5" />
                <span className="truncate">{group.name}</span>
              </button>
              {/* Always show topics and files under group */}
              <div className="ml-6 space-y-1">
                {group.topics.map((topic) => {
                  const isTopicSelected = selectedTopicId === topic.id && !selectedFile;
                  return (
                    <div key={topic.id} className="flex flex-col">
                      {/* Topic button */}
                      <button
                        onClick={() => onTopicSelect(topic)}
                        className={`w-full flex items-center space-x-2 px-3 py-2 text-left text-sm rounded-md transition-colors ${
                          isTopicSelected ? 'bg-blue-900 border border-blue-400 text-white' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="truncate">{topic.name}</span>
                        <span className="ml-auto text-xs text-gray-400">
                          {topic.snippets.length + topic.blocks.length + topic.prompts.length}
                        </span>
                      </button>
                      {/* File buttons under topic */}
                      {topic.sourceFiles && topic.sourceFiles.map((fileName) => {
                        const isFileSelected = selectedTopicId === topic.id && selectedFile && selectedFile.fileName === fileName;
                        return (
                          <button
                            key={fileName}
                            onClick={() => onFileSelect(topic.id, fileName)}
                            className={`ml-6 w-[90%] flex items-center space-x-2 px-3 py-1 text-left text-xs rounded-md transition-colors ${
                              isFileSelected ? 'bg-blue-700 border border-blue-300 text-white' : 'text-gray-400 hover:bg-gray-800'
                            }`}
                          >
                            <FileText className="w-3 h-3" />
                            <span className="truncate">{fileName}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* At the top or bottom of the sidebar, render a dropzone or button: */}
      {/* <div onDrop={handleGlobalDrop} onDragOver={e => e.preventDefault()}> */}
      {/*   Drag & drop files here or <button onClick={openFileDialog}>Upload</button> */}
      {/*   <input type="file" multiple style={{ display: 'none' }} ref={inputRef} onChange={e => onGlobalFileDrop(e.target.files)} /> */}
      {/* </div> */}
      {/* Under the topics button/section: */}
      <div className="mt-4 mb-2 px-2">
        <div
          className="bg-[#232526] border-2 border-dashed border-[#444] rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition"
          onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length) onGlobalFileDrop(e.dataTransfer.files); }}
          onDragOver={e => e.preventDefault()}
          style={{ minHeight: 80 }}
        >
          <input type="file" multiple className="hidden" ref={inputRef} onChange={e => onGlobalFileDrop(e.target.files)} />
          <button className="text-sm text-blue-400 font-semibold mb-2" onClick={() => inputRef.current.click()}>Upload Files</button>
          <span className="text-xs text-gray-400">Drag & drop or click to add files</span>
        </div>
      </div>
    </div>
  );
};