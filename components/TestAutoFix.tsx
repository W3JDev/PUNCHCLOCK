import React from 'react';

// This component has DELIBERATE ERRORS to test auto-healing:
// 1. Invalid JSX > symbol
// 2. Invalid style prop

interface TestProps {
  name: string;
}

const TestComponent: React.FC<TestProps> = ({ name }) => {
  return (
    <div>
      <h1>> TESTING AUTO-FIX</h1>
      <p>Hello {name}</p>
      <div 
        className="test"
        style={{ color: 'red' }}
      >
        This will be auto-fixed!
      </div>
    </div>
  );
};

export default TestComponent;
