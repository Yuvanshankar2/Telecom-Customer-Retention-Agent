import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { VariableSizeList as List } from 'react-window';
import CustomerCard from './CustomerCard';

/**
 * VirtualizedCustomerGrid component that efficiently renders only visible customer cards.
 * Uses react-window VariableSizeList with multi-column layout support.
 * 
 * Features:
 * - Responsive column count based on window width (1-4 columns)
 * - Only renders visible rows (~12-16 cards at once)
 * - Each row contains multiple CustomerCard components
 * - Dynamic row heights based on expansion state (prevents overlap)
 * - Smooth 60fps scrolling performance
 */
function VirtualizedCustomerGrid({
  customers,
  expandedCardId,
  onCardToggle,
  onViewStrategy,
  containerHeight = 'calc(100vh - 500px)',
}) {
  const containerRef = useRef(null);
  // Calculate column count based on window width (responsive breakpoints)
  const [columnCount, setColumnCount] = useState(4);
  const [containerWidth, setContainerWidth] = useState(1400);

  // Debounce resize handler to avoid excessive recalculations
  useEffect(() => {
    const calculateColumns = () => {
      const width = window.innerWidth;
      // Container max-width is max-w-7xl = 1280px, but actual width is constrained
      // Account for padding: px-6 = 24px each side = 48px total
      const maxContainerWidth = Math.min(width, 1280);
      const actualWidth = maxContainerWidth - 48;
      setContainerWidth(actualWidth);
      
      // Tailwind breakpoints: sm:640px, md:768px, lg:1024px, xl:1280px
      if (width < 640) {
        setColumnCount(1);
      } else if (width < 768) {
        setColumnCount(1);
      } else if (width < 1024) {
        setColumnCount(2);
      } else if (width < 1280) {
        setColumnCount(3);
      } else {
        setColumnCount(4);
      }
    };

    // Calculate on mount
    calculateColumns();

    // Debounce resize handler
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(calculateColumns, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Calculate grid dimensions
  const gridHeight = useMemo(() => {
    // Convert containerHeight string to number (handle calc() strings)
    if (typeof containerHeight === 'string' && containerHeight.includes('calc')) {
      // Approximate height from calc(100vh - 500px)
      return Math.max(400, window.innerHeight - 500);
    }
    return typeof containerHeight === 'number' ? containerHeight : 600;
  }, [containerHeight]);

  // Calculate number of rows (itemCount for FixedSizeList)
  const rowCount = useMemo(() => {
    return Math.ceil(customers.length / columnCount);
  }, [customers.length, columnCount]);

  // Calculate column width with gap (gap-6 = 1.5rem = 24px)
  const columnWidth = useMemo(() => {
    // Grid gap: gap-6 = 24px between columns
    // Total gap space: (columnCount - 1) * 24
    const availableWidth = containerWidth - (columnCount - 1) * 24;
    return availableWidth / columnCount;
  }, [containerWidth, columnCount]);

  // Base row height constants - matching real DOM heights with conditional rendering
  const BASE_ROW_HEIGHT = 420;
  const EXPANDED_ROW_HEIGHT = 790;

  // Ref to store list instance for resetAfterIndex calls
  const listRef = useRef(null);

  // Dynamic row height calculation - checks if any card in the row is expanded
  // Memoized to prevent recalculation on every render
  const getItemSize = useCallback((index) => {
    // Calculate customer indices for this row
    const startIndex = index * columnCount;
    const endIndex = Math.min(startIndex + columnCount, customers.length);
    
    // Check if any customer in this row is expanded
    for (let i = startIndex; i < endIndex; i++) {
      if (customers[i] && customers[i].id === expandedCardId) {
        return EXPANDED_ROW_HEIGHT;
      }
    }
    
    return BASE_ROW_HEIGHT;
  }, [expandedCardId, customers, columnCount]);

  // Reset list when expansion changes to recalculate row heights
  useEffect(() => {
    if (listRef.current) {
      if (expandedCardId) {
        const expandedCardIndex = customers.findIndex(customer => customer.id === expandedCardId);
        if (expandedCardIndex !== -1) {
          const rowPosition = Math.floor(expandedCardIndex / columnCount);
          listRef.current.resetAfterIndex(rowPosition,true);
        }
        else{
          listRef.current.resetAfterIndex(0,true);
        }
      }
      else{
        listRef.current.resetAfterIndex(0,true);
      }
    }
  }, [expandedCardId, customers, columnCount]);

  // Row renderer for FixedSizeList
  // Each row contains multiple CustomerCard components based on columnCount
  const Row = useCallback(({ index: rowIndex, style }) => {
    const cards = [];
    
    // Render all cards in this row
    for (let colIndex = 0; colIndex < columnCount; colIndex++) {
      const customerIndex = rowIndex * columnCount + colIndex;
      
      // Skip if out of bounds
      if (customerIndex >= customers.length) {
        break;
      }

      const customer = customers[customerIndex];
      const isExpanded = expandedCardId === customer.id;

      cards.push(
        <div
          key={customer.id}
          style={{
            width: columnWidth,
            marginRight: colIndex < columnCount - 1 ? 24 : 0, // 24px gap between columns
          }}
        >
          <CustomerCard
            customer={customer}
            isExpanded={isExpanded}
            onToggle={() => onCardToggle(customer.id)}
            onViewStrategy={() => onViewStrategy(customer)}
          />
        </div>
      );
    }

    return (
      <div
        style={{
          ...style,
          display: 'flex',
          paddingBottom: rowIndex < rowCount - 1 ? 24 : 0, // 24px gap between rows
        }}
      >
        {cards}
      </div>
    );
  }, [customers, columnCount, columnWidth, expandedCardId, onCardToggle, onViewStrategy, rowCount]);

  // Don't render if no customers
  if (customers.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="w-full">
      <List
        ref={listRef}
        height={gridHeight}
        itemCount={rowCount}
        itemSize={getItemSize}
        width={containerWidth}
        style={{ overflowX: 'hidden' }}
      >
        {Row}
      </List>
    </div>
  );
}

export default VirtualizedCustomerGrid;
