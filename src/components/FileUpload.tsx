import React, { useCallback } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import type { FileData } from '../types';

interface FileUploadProps {
  onFilesUploaded: (files: FileData[]) => void;
  isAnalyzing: boolean;
}

export function FileUpload({ onFilesUploaded, isAnalyzing }: FileUploadProps) {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const filePromises = Array.from(files).map(file => {
      return new Promise<FileData>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          resolve({
            id: '', // Will be set in App.tsx
            name: file.name,
            content: content,
            topics: [],
            uploadedAt: new Date()
          });
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
    });

    Promise.all(filePromises)
      .then(fileData => {
        onFilesUploaded(fileData);
        // Reset the input
        event.target.value = '';
      })
      .catch(error => {
        console.error('Error reading files:', error);
      });
  }, [onFilesUploaded]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    
    const filePromises = Array.from(files).map(file => {
      return new Promise<FileData>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          resolve({
            id: '', // Will be set in App.tsx
            name: file.name,
            content: content,
            topics: [],
            uploadedAt: new Date()
          });
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
    });

    Promise.all(filePromises)
      .then(fileData => {
        onFilesUploaded(fileData);
      })
      .catch(error => {
        console.error('Error reading files:', error);
      });
  }, [onFilesUploaded]);

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-glass mb-6 flex items-center">
        <Upload className="mr-3 text-white/80" size={24} />
        Upload Files
      </h2>
      
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isAnalyzing 
            ? 'border-white/20 bg-white/5 opacity-60' 
            : 'border-white/30 hover:border-white/50 bg-white/10 hover:bg-white/15'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept=".txt,.md"
          onChange={handleFileChange}
          disabled={isAnalyzing}
          className="hidden"
          id="file-upload"
        />
        
        <label
          htmlFor="file-upload"
          className={`cursor-pointer block ${isAnalyzing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {isAnalyzing ? (
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin text-white/80 mr-3" size={32} />
              <span className="text-glass">Analyzing files...</span>
            </div>
          ) : (
            <>
              <FileText className="mx-auto text-white/70 mb-6" size={56} />
              <p className="text-glass mb-3 text-lg">
                Drop .txt or .md files here, or click to browse
              </p>
              <p className="text-glass-light">
                Supports chat logs, conversation exports, and markdown files
              </p>
            </>
          )}
        </label>
      </div>

      {/* No automatic topic assignment notice; files start in All Files */}
    </div>
  );
}
