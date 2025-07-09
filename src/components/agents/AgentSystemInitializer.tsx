'use client';

import { useEffect } from 'react';

export function AgentSystemInitializer() {
  useEffect(() => {
    // Initialize agent system on app startup
    const initializeAgents = async () => {
      try {
        const response = await fetch('/api/agents/initialize', {
          method: 'POST',
        });
        
        if (!response.ok) {
          console.warn('Failed to initialize agent system');
        }
      } catch (error) {
        console.warn('Error initializing agent system:', error);
      }
    };

    initializeAgents();
  }, []);

  return null; // This component doesn't render anything
} 