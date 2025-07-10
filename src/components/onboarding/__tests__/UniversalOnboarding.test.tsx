import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UniversalOnboarding } from '../UniversalOnboarding';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('UniversalOnboarding', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the first question correctly', () => {
    render(<UniversalOnboarding onComplete={mockOnComplete} />);
    
    expect(screen.getByText('Quick Setup')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('What brought you to supply chain analytics?')).toBeInTheDocument();
  });

  it('displays all answer options for first question', () => {
    render(<UniversalOnboarding onComplete={mockOnComplete} />);
    
    const expectedAnswers = [
      'I need to move faster - time is money',
      'I want complete visibility and control',
      'Managing multiple entities is complex',
      "I'm exploring what's possible",
      'I need rock-solid systems'
    ];

    expectedAnswers.forEach(answer => {
      expect(screen.getByText(answer)).toBeInTheDocument();
    });
  });

  it('progresses through questions when answers are clicked', async () => {
    render(<UniversalOnboarding onComplete={mockOnComplete} />);
    
    // Answer first question
    fireEvent.click(screen.getByText('I need to move faster - time is money'));

    // Should show second question
    await waitFor(() => {
      expect(screen.getByText('How do you prefer to work with new tools?')).toBeInTheDocument();
      expect(screen.getByText('Question 2 of 3')).toBeInTheDocument();
    });

    // Answer second question
    fireEvent.click(screen.getByText("Jump right in - I'll figure it out"));

    // Should show third question
    await waitFor(() => {
      expect(screen.getByText("What's your biggest challenge right now?")).toBeInTheDocument();
      expect(screen.getByText('Question 3 of 3')).toBeInTheDocument();
    });
  });

  it('shows result screen after all questions answered', async () => {
    render(<UniversalOnboarding onComplete={mockOnComplete} />);
    
    // Answer all questions for streamliner persona
    fireEvent.click(screen.getByText('I need to move faster - time is money'));
    await waitFor(() => screen.getByText('How do you prefer to work with new tools?'));
    
    fireEvent.click(screen.getByText("Jump right in - I'll figure it out"));
    await waitFor(() => screen.getByText("What's your biggest challenge right now?"));
    
    fireEvent.click(screen.getByText('Everything takes too long'));

    // Should show streamliner result
    await waitFor(() => {
      expect(screen.getByText('Welcome, Streamliner!')).toBeInTheDocument();
      expect(screen.getByText(/You value speed and efficiency/)).toBeInTheDocument();
    });
  });

  it('detects navigator persona correctly', async () => {
    render(<UniversalOnboarding onComplete={mockOnComplete} />);
    
    // Answer for navigator persona
    fireEvent.click(screen.getByText('I want complete visibility and control'));
    await waitFor(() => screen.getByText('How do you prefer to work with new tools?'));
    
    fireEvent.click(screen.getByText('Set everything up exactly how I like it'));
    await waitFor(() => screen.getByText("What's your biggest challenge right now?"));
    
    fireEvent.click(screen.getByText('Too many unknowns and surprises'));

    // Should show navigator result
    await waitFor(() => {
      expect(screen.getByText('Welcome, Navigator!')).toBeInTheDocument();
      expect(screen.getByText(/You need control and predictability/)).toBeInTheDocument();
    });
  });

  it('shows persona-specific features in result', async () => {
    render(<UniversalOnboarding onComplete={mockOnComplete} />);
    
    // Answer for hub persona
    fireEvent.click(screen.getByText('Managing multiple entities is complex'));
    await waitFor(() => screen.getByText('How do you prefer to work with new tools?'));
    
    fireEvent.click(screen.getByText('See the big picture first'));
    await waitFor(() => screen.getByText("What's your biggest challenge right now?"));
    
    fireEvent.click(screen.getByText('Keeping all entities aligned'));

    // Should show hub features
    await waitFor(() => {
      expect(screen.getByText('Welcome, Hub!')).toBeInTheDocument();
      expect(screen.getByText(/Network visualization map/)).toBeInTheDocument();
      expect(screen.getByText(/Multi-entity switcher/)).toBeInTheDocument();
      expect(screen.getByText(/Consolidated reporting/)).toBeInTheDocument();
    });
  });

  it('handles skip button correctly', () => {
    render(<UniversalOnboarding onComplete={mockOnComplete} />);
    
    const skipButton = screen.getByRole('button', { name: /Skip/i });
    fireEvent.click(skipButton);

    expect(mockOnComplete).toHaveBeenCalledWith('streamliner');
  });

  it('provides fast-track option for streamliners', () => {
    render(<UniversalOnboarding onComplete={mockOnComplete} />);
    
    const fastTrackButton = screen.getByText('I know what I want - take me to the dashboard');
    fireEvent.click(fastTrackButton);

    expect(mockOnComplete).toHaveBeenCalledWith('streamliner');
  });

  it('completes onboarding when Start My Journey is clicked', async () => {
    render(<UniversalOnboarding onComplete={mockOnComplete} />);
    
    // Answer all questions
    fireEvent.click(screen.getByText("I'm exploring what's possible"));
    await waitFor(() => screen.getByText('How do you prefer to work with new tools?'));
    
    fireEvent.click(screen.getByText('Follow a guided path step-by-step'));
    await waitFor(() => screen.getByText("What's your biggest challenge right now?"));
    
    fireEvent.click(screen.getByText('Understanding what metrics matter'));

    // Should show spring result
    await waitFor(() => {
      expect(screen.getByText('Welcome, Spring!')).toBeInTheDocument();
    });

    // Click Start My Journey
    const startButton = screen.getByText('Start My Journey');
    fireEvent.click(startButton);

    expect(mockOnComplete).toHaveBeenCalledWith('spring');
  });

  it('updates progress bar correctly', async () => {
    const { container } = render(<UniversalOnboarding onComplete={mockOnComplete} />);
    
    // Check initial progress (33%)
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveAttribute('aria-valuenow', '33');

    // Answer first question
    fireEvent.click(screen.getByText('I need rock-solid systems'));

    // Progress should be 66%
    await waitFor(() => {
      expect(progressBar).toHaveAttribute('aria-valuenow', '67');
    });

    // Answer second question
    fireEvent.click(screen.getByText('Read all documentation first'));

    // Progress should be 100%
    await waitFor(() => {
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  it('shows processor features when processor persona detected', async () => {
    render(<UniversalOnboarding onComplete={mockOnComplete} />);
    
    // Answer for processor persona
    fireEvent.click(screen.getByText('I need rock-solid systems'));
    await waitFor(() => screen.getByText('How do you prefer to work with new tools?'));
    
    fireEvent.click(screen.getByText('Read all documentation first'));
    await waitFor(() => screen.getByText("What's your biggest challenge right now?"));
    
    fireEvent.click(screen.getByText('System errors and downtime'));

    // Should show processor features
    await waitFor(() => {
      expect(screen.getByText('Welcome, Processor!')).toBeInTheDocument();
      expect(screen.getByText(/System health monitoring/)).toBeInTheDocument();
      expect(screen.getByText(/Detailed audit logs/)).toBeInTheDocument();
      expect(screen.getByText(/Advanced configuration/)).toBeInTheDocument();
    });
  });
});