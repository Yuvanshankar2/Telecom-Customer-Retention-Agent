import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Start the churn analysis pipeline with an uploaded CSV file.
 * Returns a task_id for polling status.
 * 
 * @param {File} file - The CSV file to upload
 * @returns {Promise<Object>} Response containing task_id
 * @throws {Error} If the API call fails or returns an error
 */
export const runPipeline = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${API_BASE_URL}/run-pipeline`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 900000, // 15 minutes timeout for file upload
    });

    return response.data; // { task_id: "..." }
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.detail || error.response.data?.error || 'Unknown error occurred';
      throw new Error(errorMessage);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No response from server. Please check if the backend is running.');
    } else {
      // Error setting up the request
      throw new Error(`Error: ${error.message}`);
    }
  }
};

/**
 * Get the status and results of a pipeline task.
 * 
 * @param {string} taskId - The task ID returned from runPipeline
 * @returns {Promise<Object>} Response containing status and optional result/error
 * @throws {Error} If the API call fails or task is not found
 */
export const getPipelineStatus = async (taskId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/pipeline-status/${taskId}`, {
      timeout: 10000, // 10 seconds timeout for status check
    });

    return response.data; // { task_id, status, result?, error?, created_at, completed_at? }
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      if (error.response.status === 404) {
        throw new Error('Task not found. It may have expired or been cleaned up.');
      }
      const errorMessage = error.response.data?.detail || error.response.data?.error || 'Unknown error occurred';
      throw new Error(errorMessage);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No response from server. Please check if the backend is running.');
    } else {
      // Error setting up the request
      throw new Error(`Error: ${error.message}`);
    }
  }
};
