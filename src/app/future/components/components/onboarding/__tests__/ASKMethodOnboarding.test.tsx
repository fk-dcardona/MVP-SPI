import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ASKMethodOnboarding } from '../ASKMethodOnboarding';
import { personaService } from '@/services/persona-service';
import { usePersonaTracking } from '@/hooks/usePersonaTracking';
import type { UserPersona } from '@/types/persona';

// Mock dependencies
jest.mock('@/services/persona-service');
jest.mock('@/hooks/usePersonaTracking');
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ASKMethodOnboarding', () => {
  const mockOnComplete = jest.fn();
  const mockTrackBehavior = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePersonaTracking as jest.Mock).mockReturnValue({
      trackBehavior: mockTrackBehavior,
    });
    (personaService.calculatePersona as jest.Mock).mockResolvedValue({
      persona: 'streamliner',
      confidence: 0.85,
    });
  });

  it('renders the first question correctly', () => {
    render(<ASKMethodOnboarding onComplete={mockOnComplete} />);
    
    expect(screen.getByText(/What's your single biggest frustration/)).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 6')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '17');
  });

  it('navigates between questions', async () => {
    render(<ASKMethodOnboarding onComplete={mockOnComplete} />);
    
    // Answer first question
    const speedOption = screen.getByLabelText(/Everything takes too long/);
    fireEvent.click(speedOption);

    // Should move to second question
    await waitFor(() => {
      expect(screen.getByText(/wave a magic wand/)).toBeInTheDocument();
    });

    // Go back
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    // Should return to first question
    await waitFor(() => {
      expect(screen.getByText(/biggest frustration/)).toBeInTheDocument();
    });
  });

  it('tracks behavior for each answer', async () => {
    render(<ASKMethodOnboarding onComplete={mockOnComplete} />);
    
    const speedOption = screen.getByLabelText(/Everything takes too long/);
    fireEvent.click(speedOption);

    await waitFor(() => {
      expect(mockTrackBehavior).toHaveBeenCalledWith('onboarding_answer', {
        question_id: 'biggest-frustration',
        answer: 'speed',
        question_type: 'deep-dive',
      });
    });
  });

  it('shows persona hint when confidence is high', async () => {
    render(<ASKMethodOnboarding onComplete={mockOnComplete} />);
    
    // Answer multiple questions consistently
    const answers = [
      /Everything takes too long/, // Streamliner +10
      /Make everything instant/, // Streamliner +10
      /\$1M - \$10M USD/, // Streamliner +8
      /Trust my gut/, // Streamliner +10
    ];

    for (const answer of answers) {
      const option = screen.getByLabelText(answer);
      fireEvent.click(option);
      await waitFor(() => {
        expect(mockTrackBehavior).toHaveBeenCalled();
      });
    }

    // Should show persona hint
    await waitFor(() => {
      expect(screen.getByText(/We're learning about you/)).toBeInTheDocument();
      expect(screen.getByText(/streamliner profile/)).toBeInTheDocument();
    });
  });

  it('completes onboarding when all questions answered', async () => {
    render(<ASKMethodOnboarding onComplete={mockOnComplete} />);
    
    // Answer all questions
    const questionAnswers = [
      'speed', // frustration
      'instant', // magic wand
      'medium', // trade volume
      'gut', // decision style
      'executor', // role
      'today', // time to value
    ];

    for (const answer of questionAnswers) {
      const option = screen.getByRole('radio', { name: new RegExp(answer, 'i') }).closest('label');
      if (option) fireEvent.click(option);
      
      await waitFor(() => {
        expect(mockTrackBehavior).toHaveBeenCalled();
      });
    }

    // Should call onComplete with detected persona
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith('streamliner', expect.any(Object));
    });
  });

  it('handles disqualification gracefully', async () => {
    render(<ASKMethodOnboarding onComplete={mockOnComplete} />);
    window.alert = jest.fn();
    
    // Answer questions to reach disqualification
    fireEvent.click(screen.getByLabelText(/Everything takes too long/));
    await waitFor(() => expect(screen.getByText(/wave a magic wand/)).toBeInTheDocument());
    
    fireEvent.click(screen.getByLabelText(/Make everything instant/));
    await waitFor(() => expect(screen.getByText(/annual trade volume/)).toBeInTheDocument());
    
    // Select disqualifying answer
    fireEvent.click(screen.getByLabelText(/Under \$100K USD/));
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('self-service options')
      );
    });
  });

  it('allows early completion with high confidence', async () => {
    render(<ASKMethodOnboarding onComplete={mockOnComplete} />);
    
    // Answer questions very consistently for streamliner
    const streamlinerAnswers = [
      /Everything takes too long/,
      /Make everything instant/,
      /\$1M - \$10M USD/,
      /Trust my gut/,
      /I'm in the trenches/,
    ];

    for (const answer of streamlinerAnswers) {
      const option = screen.getByLabelText(answer);
      fireEvent.click(option);
      await waitFor(() => expect(mockTrackBehavior).toHaveBeenCalled());
    }

    // Should show early completion button
    await waitFor(() => {
      const completeButton = screen.getByText('Complete Setup');
      expect(completeButton).toBeInTheDocument();
      
      fireEvent.click(completeButton);
    });

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith('streamliner', expect.any(Object));
    });
  });

  it('calculates persona weights correctly', async () => {
    render(<ASKMethodOnboarding onComplete={mockOnComplete} />);
    
    // Answer for navigator persona
    const navigatorAnswers = [
      /never know what's really happening/, // Navigator +10
      /Know problems before they happen/, // Navigator +10
      /\$10M - \$100M USD/, // Navigator +8
      /Analyze everything/, // Navigator +10
      /design and improve processes/, // Navigator +8
    ];

    for (const answer of navigatorAnswers) {
      const option = screen.getByLabelText(answer);
      fireEvent.click(option);
      await waitFor(() => expect(mockTrackBehavior).toHaveBeenCalled());
    }

    // Complete the remaining question
    fireEvent.click(screen.getByLabelText(/This week/));

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith('navigator', expect.any(Object));
    });
  });

  it('displays question type indicators', () => {
    render(<ASKMethodOnboarding onComplete={mockOnComplete} />);
    
    expect(screen.getByText('2 Deep Dive')).toBeInTheDocument();
    expect(screen.getByText('1 Qualifying')).toBeInTheDocument();
    expect(screen.getByText('2 Segmentation')).toBeInTheDocument();
    expect(screen.getByText('1 Commitment')).toBeInTheDocument();
  });

  it('shows remaining time estimate', async () => {
    render(<ASKMethodOnboarding onComplete={mockOnComplete} />);
    
    // Answer enough questions to build confidence
    const answers = [
      /Everything takes too long/,
      /Make everything instant/,
      /\$1M - \$10M USD/,
    ];

    for (const answer of answers) {
      const option = screen.getByLabelText(answer);
      fireEvent.click(option);
      await waitFor(() => expect(mockTrackBehavior).toHaveBeenCalled());
    }

    // Should show time estimate
    await waitFor(() => {
      expect(screen.getByText(/min remaining/)).toBeInTheDocument();
    });
  });
});