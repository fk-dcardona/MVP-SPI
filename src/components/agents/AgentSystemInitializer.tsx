'use client';

import { useEffect } from 'react';

export function AgentSystemInitializer() {
  useEffect(() => {
    // Initialize agent system on client side
    const initializeAgents = async () => {
      try {
        // Call the initialization API endpoint
        const response = await fetch('/api/agents/initialize', {
          method: 'POST',
        });
        
        if (response.ok) {
          console.log('Agent system initialized successfully');
        } else {
          console.warn('Failed to initialize agent system');
        }
      } catch (error) {
        console.error('Error initializing agent system:', error);
      }
    };

    // Only initialize if we're in the browser and on a dashboard page
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard')) {
      initializeAgents();
    }
  }, []);

  // This component doesn't render anything
  return null;
} 