import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PersonaReveal } from '../PersonaReveal';
import * as confetti from 'canvas-confetti';

// Mock dependencies
jest.mock('canvas-confetti');
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('PersonaReveal', () => {
  const mockOnContinue = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders streamliner persona correctly', async () => {
    render(
      <PersonaReveal 
        persona="streamliner" 
        confidence={0.92} 
        onContinue={mockOnContinue} 
      />
    );

    // Initial animation
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Icon

    // Wait for title reveal
    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      expect(screen.getByText('The Streamliner')).toBeInTheDocument();
      expect(screen.getByText('Speed is your superpower')).toBeInTheDocument();
    });

    // Wait for confidence badge
    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      expect(screen.getByText('92% Match Confidence')).toBeInTheDocument();
    });

    // Wait for details
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.getByText('Your Profile')).toBeInTheDocument();
      expect(screen.getByText(/You move fast and break bottlenecks/)).toBeInTheDocument();
    });
  });

  it('triggers confetti animation', async () => {
    render(
      <PersonaReveal 
        persona="navigator" 
        confidence={0.88} 
        onContinue={mockOnContinue} 
      />
    );

    jest.advanceTimersByTime(500);
    
    await waitFor(() => {
      expect(confetti).toHaveBeenCalledWith({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    });
  });

  it('displays persona-specific characteristics', async () => {
    render(
      <PersonaReveal 
        persona="hub" 
        confidence={0.95} 
        onContinue={mockOnContinue} 
      />
    );

    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.getByText('The Hub')).toBeInTheDocument();
      expect(screen.getByText('Connections are your strength')).toBeInTheDocument();
      expect(screen.getByText('Network orchestrator')).toBeInTheDocument();
      expect(screen.getByText('Multi-entity manager')).toBeInTheDocument();
    });
  });

  it('shows persona-specific features', async () => {
    render(
      <PersonaReveal 
        persona="spring" 
        confidence={0.78} 
        onContinue={mockOnContinue} 
      />
    );

    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.getByText('Learning Path')).toBeInTheDocument();
      expect(screen.getByText('Achievement System')).toBeInTheDocument();
      expect(screen.getByText('Expert Support')).toBeInTheDocument();
    });
  });

  it('displays performance preview stats', async () => {
    render(
      <PersonaReveal 
        persona="processor" 
        confidence={0.91} 
        onContinue={mockOnContinue} 
      />
    );

    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.getByText('99.97%')).toBeInTheDocument(); // Uptime
      expect(screen.getByText('0.03%')).toBeInTheDocument(); // Error rate
      expect(screen.getByText('100%')).toBeInTheDocument(); // Compliance
    });
  });

  it('calls onContinue when button clicked', async () => {
    render(
      <PersonaReveal 
        persona="streamliner" 
        confidence={0.85} 
        onContinue={mockOnContinue} 
      />
    );

    jest.advanceTimersByTime(3000);

    const continueButton = await waitFor(() => 
      screen.getByText('Enter Your Personalized Dashboard')
    );

    fireEvent.click(continueButton);
    expect(mockOnContinue).toHaveBeenCalled();
  });

  it('shows correct gradient colors for each persona', async () => {
    const personas = [
      { persona: 'streamliner' as const, gradient: 'from-blue-500' },
      { persona: 'navigator' as const, gradient: 'from-emerald-500' },
      { persona: 'hub' as const, gradient: 'from-purple-500' },
      { persona: 'spring' as const, gradient: 'from-amber-500' },
      { persona: 'processor' as const, gradient: 'from-gray-500' },
    ];

    for (const { persona, gradient } of personas) {
      const { container } = render(
        <PersonaReveal 
          persona={persona} 
          confidence={0.85} 
          onContinue={mockOnContinue} 
        />
      );

      const gradientElement = container.querySelector(`[class*="${gradient}"]`);
      expect(gradientElement).toBeInTheDocument();
    }
  });

  it('displays context-specific message at bottom', async () => {
    const personaMessages = [
      { persona: 'streamliner' as const, keyword: 'speed' },
      { persona: 'navigator' as const, keyword: 'control' },
      { persona: 'hub' as const, keyword: 'connectivity' },
      { persona: 'spring' as const, keyword: 'growth' },
      { persona: 'processor' as const, keyword: 'reliability' },
    ];

    for (const { persona, keyword } of personaMessages) {
      render(
        <PersonaReveal 
          persona={persona} 
          confidence={0.85} 
          onContinue={mockOnContinue} 
        />
      );

      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.getByText(new RegExp(`customized for maximum ${keyword}`))).toBeInTheDocument();
      });
    }
  });

  it('animates elements in correct sequence', async () => {
    const { container } = render(
      <PersonaReveal 
        persona="navigator" 
        confidence={0.90} 
        onContinue={mockOnContinue} 
      />
    );

    // Check initial state
    expect(container.querySelector('[class*="opacity-0"]')).toBeInTheDocument();

    // After first animation step
    jest.advanceTimersByTime(300);
    
    // After title reveal
    jest.advanceTimersByTime(700);
    await waitFor(() => {
      expect(screen.getByText('The Navigator')).toBeInTheDocument();
    });

    // After confidence badge
    jest.advanceTimersByTime(800);
    await waitFor(() => {
      expect(screen.getByText('90% Match Confidence')).toBeInTheDocument();
    });

    // After details reveal
    jest.advanceTimersByTime(700);
    await waitFor(() => {
      expect(screen.getByText('Your Profile')).toBeInTheDocument();
    });
  });
});