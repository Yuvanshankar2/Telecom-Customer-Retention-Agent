import React from 'react';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

/**
 * FileUpload component for uploading CSV files and triggering pipeline execution.
 * 
 * @param {Object} props
 * @param {File|null} props.file - Currently selected file
 * @param {boolean} props.loading - Whether pipeline is currently processing
 * @param {Function} props.onFileSelect - Callback when file is selected
 */
const FileUpload = ({ file, loading, onFileSelect }) => {
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith('.csv')) {
        alert('Please select a CSV file.');
        return;
      }
      onFileSelect(selectedFile);
    }
  };

  return (
    <button
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={loading}
      onClick={() => document.getElementById('csv-file-upload')?.click()}
    >
      <CloudUploadIcon className="w-[18px] h-[18px]" />
      <span className="hidden sm:inline">Upload Dataset</span>
      <span className="sm:hidden">Upload</span>
      <input
        accept=".csv"
        className="hidden"
        id="csv-file-upload"
        type="file"
        onChange={handleFileChange}
        disabled={loading}
      />
    </button>
  );
};

export default FileUpload;
