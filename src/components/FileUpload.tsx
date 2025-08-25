import React, { useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (files: FileList) => void;
  isProcessing?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isProcessing }) => {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileUpload(files);
    }
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files);
    }
  }, [onFileUpload]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isProcessing
            ? 'border-blue-300 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center space-y-4">
          {isProcessing ? (
            <div className="animate-spin">
              <FileText className="w-12 h-12 text-blue-500" />
            </div>
          ) : (
            <Upload className="w-12 h-12 text-gray-400" />
          )}
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isProcessing ? 'Processing files...' : 'Upload conversation files'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Drop your markdown or text files here, or click to browse
            </p>
            
            {!isProcessing && (
              <input
                type="file"
                multiple
                accept=".md,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
            )}
            
            {!isProcessing && (
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
              >
                Choose Files
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};