import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import CustomerListPage from './pages/CustomerListPage';
import RetentionStrategyPage from './pages/RetentionStrategyPage';

/**
 * Main App component.
 * AppProvider wraps the entire app to persist state across route navigation.
 * This prevents data loss when navigating between CustomerListPage and RetentionStrategyPage.
 */
function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CustomerListPage />} />
          <Route path="/customers/:customerId/retention" element={<RetentionStrategyPage />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
