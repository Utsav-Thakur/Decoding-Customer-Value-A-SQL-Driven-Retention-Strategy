import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { engineerFeatures } from '../utils/featureEngineering';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [customers, setCustomers] = useState([]);
  const [isCustomData, setIsCustomData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load default dataset using React Query
  const { data: originalCustomers, isLoading, isError } = useQuery({
    queryKey: ['customersData'],
    queryFn: async () => {
      const response = await fetch('/data/customer_features.json');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    staleTime: Infinity, // keep in cache, don't auto refetch since we want in-memory manipulation
  });

  // Keep state synchronized with React Query when not customized
  useEffect(() => {
    if (originalCustomers && !isCustomData) {
      setCustomers(originalCustomers);
    }
  }, [originalCustomers, isCustomData]);

  // Add new rows (e.g. from manual entry or CSV upload)
  const addCustomers = (rawRows) => {
    // If we have custom or original, we merge the raw versions of current customers
    // with the new raw rows.
    // Our engineerFeatures is designed to read both camelCase properties and raw CSV names.
    const merged = [...customers, ...rawRows];
    const enriched = engineerFeatures(merged);
    setCustomers(enriched);
    setIsCustomData(true);
    setLastUpdated(new Date());
  };

  // Replace entire dataset
  const replaceCustomers = (rawRows) => {
    const enriched = engineerFeatures(rawRows);
    setCustomers(enriched);
    setIsCustomData(true);
    setLastUpdated(new Date());
  };

  // Reset back to original pre-loaded dataset
  const resetToOriginal = () => {
    if (originalCustomers) {
      setCustomers(originalCustomers);
      setIsCustomData(false);
      setLastUpdated(null);
    }
  };

  return (
    <DataContext.Provider value={{
      customers,
      isLoading: isLoading && !isCustomData,
      isError,
      isCustomData,
      lastUpdated,
      addCustomers,
      replaceCustomers,
      resetToOriginal
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
