import React, { useState } from 'react';
import { Trash2, FileText, FolderOpen, Folder, X, AlertTriangle } from 'lucide-react';
import type { FileData, Topic } from '../types';

interface FileManagerProps {
  files: FileData[];
  topics: Topic[];
  onFileDelete: (fileId: string) => void;
  onFileMove: (fileId: string, newTopic: string | undefined) => void;
  onTopicDelete: (topicId: string) => void;
  frameless?: boolean;
}

interface DragData {
  fileId: string;
  fileName: string;
}

export function FileManager({ files, topics, onFileDelete, onFileMove, onTopicDelete, frameless }: FileManagerProps) {
  const [draggedFile, setDraggedFile] = useState<DragData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'file' | 'topic'; id: string } | null>(null);

  // Group files by topic
  const filesByTopic = files.reduce((acc, file) => {
    const topicName = file.topic || 'Unassigned';
    if (!acc[topicName]) {
      acc[topicName] = [];
    }
    acc[topicName].push(file);
    return acc;
  }, {} as Record<string, FileData[]>);

  const handleDragStart = (e: React.DragEvent, file: FileData) => {
    const dragData: DragData = { fileId: file.id, fileName: file.name };
    setDraggedFile(dragData);
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedFile(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTopic: string | undefined) => {
    e.preventDefault();
    try {
      const dragData: DragData = JSON.parse(e.dataTransfer.getData('application/json'));
      if (dragData.fileId && draggedFile) {
        const file = files.find(f => f.id === dragData.fileId);
        if (file && file.topic !== targetTopic) {
          onFileMove(dragData.fileId, targetTopic);
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
    setDraggedFile(null);
  };

  const handleDeleteConfirm = (type: 'file' | 'topic', id: string) => {
    if (type === 'file') {
      onFileDelete(id);
    } else {
      onTopicDelete(id);
    }
    setDeleteConfirm(null);
  };

  const getTopicFileCount = (topicName: string) => {
    return files.filter(file => file.topic === topicName).length;
  };

  return (
    <div className={frameless ? '' : 'glass-card rounded-2xl p-6'}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-glass flex items-center">
          <FileText className="mr-3 text-white/80" size={24} />
          File Manager
        </h2>
        <div className="text-sm text-glass-muted">
          {files.length} file{files.length !== 1 ? 's' : ''} total
        </div>
      </div>

      <div className="space-y-6">
        {/* Unassigned Files */}
        {filesByTopic['Unassigned'] && (
          <div
            className={`border-2 border-dashed rounded-xl p-4 transition-all ${
              draggedFile ? 'border-white/50 bg-white/10' : 'border-white/20'
            }`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, undefined)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FolderOpen className="mr-2 text-white/60" size={18} />
                <span className="font-medium text-glass">Unassigned Files</span>
                <span className="ml-2 text-xs bg-white/20 text-white px-2 py-1 rounded-full">
                  {filesByTopic['Unassigned'].length}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              {filesByTopic['Unassigned'].map((file) => (
                <div
                  key={file.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, file)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between p-3 glass-input rounded-lg cursor-move transition-all hover:bg-white/20 ${
                    draggedFile?.fileId === file.id ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center min-w-0 flex-1">
                    <FileText className="mr-3 text-white/60 flex-shrink-0" size={16} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-glass truncate">{file.name}</div>
                      <div className="text-xs text-glass-light">
                        Uploaded {file.uploadedAt.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteConfirm({ type: 'file', id: file.id })}
                    className="ml-3 p-1 text-red-400 hover:text-red-300 hover:bg-red-400/20 rounded transition-all flex-shrink-0"
                    title="Delete file"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topic Folders */}
        {topics.map((topic) => {
          const topicFiles = filesByTopic[topic.name] || [];
          return (
            <div
              key={topic.id}
              className={`border-2 border-dashed rounded-xl p-4 transition-all ${
                draggedFile ? 'border-white/50 bg-white/10' : 'border-white/20'
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, topic.name)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Folder className="mr-2 text-white/60" size={18} />
                  <span className="font-medium text-glass">{topic.name}</span>
                  <span className="ml-2 text-xs bg-white/20 text-white px-2 py-1 rounded-full">
                    {topicFiles.length}
                  </span>
                </div>
                <button
                  onClick={() => setDeleteConfirm({ type: 'topic', id: topic.id })}
                  className="p-1 text-red-400 hover:text-red-300 hover:bg-red-400/20 rounded transition-all"
                  title="Delete topic (files will become unassigned)"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {topic.description && (
                <p className="text-xs text-glass-light mb-3">{topic.description}</p>
              )}

              {topicFiles.length === 0 ? (
                <div className="text-center py-4 text-glass-muted text-sm">
                  Drop files here to assign to this topic
                </div>
              ) : (
                <div className="space-y-2">
                  {topicFiles.map((file) => (
                    <div
                      key={file.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, file)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center justify-between p-3 glass-input rounded-lg cursor-move transition-all hover:bg-white/20 ${
                        draggedFile?.fileId === file.id ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center min-w-0 flex-1">
                        <FileText className="mr-3 text-white/60 flex-shrink-0" size={16} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-glass truncate">{file.name}</div>
                          <div className="text-xs text-glass-light">
                            Uploaded {file.uploadedAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'file', id: file.id })}
                        className="ml-3 p-1 text-red-400 hover:text-red-300 hover:bg-red-400/20 rounded transition-all flex-shrink-0"
                        title="Delete file"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {files.length === 0 && (
          <div className="text-center py-12 glass-input rounded-xl">
            <FileText className="mx-auto mb-4 text-white/40" size={48} />
            <p className="text-glass-muted mb-2">No files uploaded yet</p>
            <p className="text-sm text-glass-light">Upload files to start organizing them</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="text-yellow-400 mr-3" size={24} />
              <h3 className="text-lg font-semibold text-glass">
                Confirm {deleteConfirm.type === 'file' ? 'File' : 'Topic'} Deletion
              </h3>
            </div>
            
            <p className="text-glass-muted mb-6">
              {deleteConfirm.type === 'file' 
                ? 'Are you sure you want to delete this file? This action cannot be undone.'
                : 'Are you sure you want to delete this topic? Files in this topic will become unassigned. This action cannot be undone.'
              }
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 glass-button rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(deleteConfirm.type, deleteConfirm.id)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
