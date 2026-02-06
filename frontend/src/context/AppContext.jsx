import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { runPipeline, getPipelineStatus } from '../services/api';
import { normalizeCustomerData } from '../utils/normalizeData';

const POLLING_INTERVAL = 5000; // 5 seconds
const MAX_POLLING_TIME = 30 * 60 * 1000; // 30 minutes maximum polling time

// Create the context
const AppContext = createContext(null);

/**
 * AppProvider component that manages all application state.
 * This state persists across route navigation, preventing data loss when navigating between pages.
 * 
 * State managed:
 * - File upload state (file, loading, error, taskId, status)
 * - API results (results, normalizedCustomers, filteredCustomers)
 * - UI state (activeFilter, searchQuery, sortType, expandedCardId)
 */
export function AppProvider({ children }) {
  // File upload and API state
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState(null);
  
  // Customer data state
  const [normalizedCustomers, setNormalizedCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  
  // UI state
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState('probability-desc');
  
  // New filter state
  const [planTypeFilter, setPlanTypeFilter] = useState('');
  const [contractTypeFilter, setContractTypeFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  
  // Drawer state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Refs for polling management
  const pollingIntervalRef = useRef(null);
  const pollingStartTimeRef = useRef(null);

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Polling logic: poll when taskId is set
  useEffect(() => {
    if (!taskId) {
      return;
    }

    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Reset polling start time
    pollingStartTimeRef.current = Date.now();

    // Poll immediately
    pollTaskStatus(taskId);

    // Set up polling interval
    pollingIntervalRef.current = setInterval(() => {
      // Check if we've exceeded maximum polling time
      if (Date.now() - pollingStartTimeRef.current > MAX_POLLING_TIME) {
        clearInterval(pollingIntervalRef.current);
        setError('Pipeline processing took too long. Please try again or contact support.');
        setLoading(false);
        setTaskId(null);
        return;
      }

      pollTaskStatus(taskId);
    }, POLLING_INTERVAL);

    // Cleanup function
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [taskId]);

  // Normalize customers when results change
  useEffect(() => {
    if (results && results.customer_churn) {
      // Ensure customer_churn is a valid array
      if (Array.isArray(results.customer_churn)) {
        const normalized = normalizeCustomerData(results);
        // Debug logging
        console.log('[DEBUG] Normalized customers:', {
          count: normalized.length,
          sample_ids: normalized.slice(0, 3).map(c => c.id)
        });
        setNormalizedCustomers(normalized);
        setFilteredCustomers(normalized);
      } else {
        // Invalid data format - clear everything
        setNormalizedCustomers([]);
        setFilteredCustomers([]);
      }
    } else {
      // Clear data when results is null or missing customer_churn
      setNormalizedCustomers([]);
      setFilteredCustomers([]);
    }
  }, [results]);

  // Apply filters, search, and sorting when dependencies change
  useEffect(() => {
    let filtered = [...normalizedCustomers];

    // Apply risk level filter
    if (activeFilter === 'critical') {
      filtered = filtered.filter((c) => c.risk_level === 'high' && c.churn_probability >= 90);
    } else if (activeFilter === 'high') {
      filtered = filtered.filter((c) => c.risk_level === 'high' && c.churn_probability >= 70 && c.churn_probability < 90);
    } else if (activeFilter === 'low') {
      filtered = filtered.filter((c) => c.risk_level === 'low');
    }

    // Apply plan type filter
    if (planTypeFilter) {
      filtered = filtered.filter((c) => {
        const planType = c.internet_service || c.feature_values?.InternetService || c.feature_values?.internet_service;
        return planType && planType.toLowerCase() === planTypeFilter.toLowerCase();
      });
    }

    // Apply contract type filter
    if (contractTypeFilter) {
      filtered = filtered.filter((c) => {
        const contractType = c.contract_type || c.feature_values?.Contract || c.feature_values?.contract;
        return contractType && contractType.toLowerCase() === contractTypeFilter.toLowerCase();
      });
    }

    // Apply region filter (if available)
    if (regionFilter) {
      filtered = filtered.filter((c) => {
        const region = c.feature_values?.Region || c.feature_values?.region;
        return region && region.toLowerCase() === regionFilter.toLowerCase();
      });
    }

    // Apply search - only match Customer ID
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((c) => 
        c.id.toLowerCase().includes(query)
      );
    }

    // Sort based on sortType
    if (sortType === 'probability-desc' || sortType === 'highest-risk') {
      filtered.sort((a, b) => b.churn_probability - a.churn_probability);
    } else if (sortType === 'lowest-risk') {
      filtered.sort((a, b) => a.churn_probability - b.churn_probability);
    } else if (sortType === 'id-asc') {
      filtered.sort((a, b) => {
        // Extract numeric part for natural sort (Customer11, Customer12, Customer2 → Customer2, Customer11, Customer12)
        const numA = parseInt(a.id.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.id.match(/\d+/)?.[0] || '0');
        if (numA !== numB) return numA - numB;
        return a.id.localeCompare(b.id); // Fallback to lexicographical
      });
    }

    setFilteredCustomers(filtered);
  }, [normalizedCustomers, activeFilter, searchQuery, sortType, planTypeFilter, contractTypeFilter, regionFilter]);

  /**
   * Poll the task status endpoint to check pipeline progress
   * @param {string} id - The task ID to poll
   */
  const pollTaskStatus = async (id) => {
    try {
      const statusData = await getPipelineStatus(id);
      setStatus(statusData.status);

      if (statusData.status === 'done') {
        // Task completed successfully
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        // Debug logging
        console.log('[DEBUG] Pipeline completed, result:', {
          customer_churn_length: statusData.result?.customer_churn?.length,
          first_customers: statusData.result?.customer_churn?.slice(0, 3)?.map(c => c.id)
        });
        setResults(statusData.result);
        setLoading(false);
        setTaskId(null);
      } else if (statusData.status === 'failed') {
        // Task failed
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setError(statusData.error || 'Pipeline processing failed.');
        setLoading(false);
        setTaskId(null);
      }
      // For 'pending' or 'processing', continue polling
    } catch (err) {
      // Handle polling errors
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setError(err.message || 'Error checking pipeline status.');
      setLoading(false);
      setTaskId(null);
    }
  };

  /**
   * Handle file selection and trigger pipeline execution
   * @param {File} selectedFile - The CSV file to upload
   */
  const handleFileSelect = async (selectedFile) => {
    setFile(selectedFile);
    setError(null);
    setResults(null);
    setStatus(null);
    setLoading(true);
    setTaskId(null);
    setNormalizedCustomers([]);
    setFilteredCustomers([]);
    setExpandedCardId(null);
    
    // Clear all filter states for clean slate
    setActiveFilter('all');
    setSearchQuery('');
    setPlanTypeFilter('');
    setContractTypeFilter('');
    setRegionFilter('');

    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    try {
      const data = await runPipeline(selectedFile);
      // Start polling with the task_id
      setTaskId(data.task_id);
    } catch (err) {
      setError(err.message || 'An error occurred while uploading the file.');
      setLoading(false);
    }
  };

  // Value provided by the context
  const value = {
    // File upload state
    file,
    setFile,
    loading,
    setLoading,
    error,
    setError,
    taskId,
    setTaskId,
    status,
    setStatus,
    
    // Customer data state
    results,
    setResults,
    normalizedCustomers,
    setNormalizedCustomers,
    filteredCustomers,
    setFilteredCustomers,
    
    // UI state
    activeFilter,
    setActiveFilter,
    expandedCardId,
    setExpandedCardId,
    searchQuery,
    setSearchQuery,
    sortType,
    setSortType,
    
    // Handlers
    handleFileSelect,
    
    // New filter state
    planTypeFilter,
    setPlanTypeFilter,
    contractTypeFilter,
    setContractTypeFilter,
    regionFilter,
    setRegionFilter,
    
    // Drawer state
    selectedCustomer,
    setSelectedCustomer,
    isDrawerOpen,
    setIsDrawerOpen,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Hook to access the App context
 * @returns {Object} Context value with all state and handlers
 */
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
