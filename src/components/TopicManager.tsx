import React, { useState } from 'react';
import { Plus, Folder, FolderOpen, X, Trash2, AlertTriangle } from 'lucide-react';
import type { Topic } from '../types';

interface TopicManagerProps {
  topics: Topic[];
  selectedTopic: Topic | null;
  onTopicCreated: (topic: Topic) => void;
  onTopicSelected: (topic: Topic | null) => void;
  onTopicDelete: (topicId: string) => void;
  frameless?: boolean;
}

export function TopicManager({ topics, selectedTopic, onTopicCreated, onTopicSelected, onTopicDelete, frameless }: TopicManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleCreateTopic = () => {
    if (!newTopicName.trim()) return;

    const newTopic: Topic = {
      id: Date.now().toString(),
      name: newTopicName.trim(),
      description: newTopicDescription.trim() || undefined,
      createdAt: new Date(),
    };

    onTopicCreated(newTopic);
    setNewTopicName('');
    setNewTopicDescription('');
    setIsCreating(false);
  };

  const handleCancelCreate = () => {
    setNewTopicName('');
    setNewTopicDescription('');
    setIsCreating(false);
  };

  const handleDeleteTopic = (topicId: string) => {
    onTopicDelete(topicId);
    setDeleteConfirm(null);
  };

  return (
    <div className={frameless ? '' : 'glass-card rounded-2xl p-6'}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-glass flex items-center">
          <Folder className="mr-3 text-white/80" size={24} />
          Topics
        </h2>
        <button
          onClick={() => setIsCreating(true)}
          disabled={isCreating}
          className="glass-button rounded-lg p-2 disabled:opacity-50"
          title="Create new topic"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Create New Topic Form */}
      {isCreating && (
        <div className="mb-6 glass-input rounded-xl p-5">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Topic name"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              className="w-full glass-input rounded-lg px-4 py-3"
              autoFocus
            />
            <textarea
              placeholder="Description (optional)"
              value={newTopicDescription}
              onChange={(e) => setNewTopicDescription(e.target.value)}
              className="w-full glass-input rounded-lg px-4 py-3 resize-none"
              rows={2}
            />
            <div className="flex space-x-3">
              <button
                onClick={handleCreateTopic}
                disabled={!newTopicName.trim()}
                className="glass-button px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
              <button
                onClick={handleCancelCreate}
                className="glass-button px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Topic List */}
      <div className="space-y-3">
        {/* "All Topics" option */}
        <button
          onClick={() => onTopicSelected(null)}
          className={`w-full text-left p-4 rounded-xl transition-all ${
            selectedTopic === null
              ? 'glass-input border-white/40'
              : 'glass-button hover:bg-white/20'
          }`}
        >
          <div className="flex items-center">
            <FolderOpen className="mr-3 text-white/70" size={18} />
            <span className="font-medium text-glass">All Topics</span>
          </div>
        </button>

        {topics.map((topic) => (
          <div
            key={topic.id}
            className={`relative group rounded-xl transition-all ${
              selectedTopic?.id === topic.id
                ? 'glass-input border-white/40'
                : 'glass-button hover:bg-white/20'
            }`}
          >
            <button
              onClick={() => onTopicSelected(topic)}
              className="w-full text-left p-4"
            >
              <div className="flex items-start">
                <Folder className="mr-3 text-white/70 mt-1" size={18} />
                <div className="flex-1 min-w-0 pr-8">
                  <div className="font-medium text-glass truncate">
                    {topic.name}
                  </div>
                  {topic.description && (
                    <div className="text-sm text-glass-muted truncate mt-1">
                      {topic.description}
                    </div>
                  )}
                  <div className="text-xs text-glass-light mt-2">
                    Created {topic.createdAt.toLocaleDateString()}
                  </div>
                </div>
              </div>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm(topic.id);
              }}
              className="absolute top-3 right-3 p-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-400/20 rounded transition-all"
              title="Delete topic"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {topics.length === 0 && !isCreating && (
          <div className="text-center py-12 glass-input rounded-xl">
            <Folder className="mx-auto mb-4 text-white/40" size={48} />
            <p className="text-glass-muted mb-2">No topics yet</p>
            <p className="text-sm text-glass-light">Create a topic to organize your prompts</p>
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
                Confirm Topic Deletion
              </h3>
            </div>
            
            <p className="text-glass-muted mb-6">
              Are you sure you want to delete this topic? Files in this topic will become unassigned. This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 glass-button rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTopic(deleteConfirm)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Delete Topic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
