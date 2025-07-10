import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { personaService } from '@/services/persona-service';
import OnboardingPage from '@/app/onboarding/page';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/hooks/useAuth');
jest.mock('@/services/persona-service');
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));
jest.mock('canvas-confetti');
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('Complete Onboarding Flow E2E', () => {
  const mockPush = jest.fn();
  const mockUser = { id: 'test-user', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (personaService.calculatePersona as jest.Mock).mockResolvedValue({
      persona: 'streamliner',
      confidence: 0.85,
    });
    (personaService.updateUserPreferences as jest.Mock).mockResolvedValue({});
    (personaService.updateSystemHealthPreferences as jest.Mock).mockResolvedValue({});
    
    // Clear localStorage
    global.localStorage.clear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initial Onboarding Selection', () => {
    it('renders both onboarding options', () => {
      render(<OnboardingPage />);
      
      expect(screen.getByText('Welcome to Finkargo')).toBeInTheDocument();
      expect(screen.getByText('Guided Setup')).toBeInTheDocument();
      expect(screen.getByText('Express Setup')).toBeInTheDocument();
    });

    it('shows recommended badge on ASK Method', () => {
      render(<OnboardingPage />);
      
      const guidedSetupCard = screen.getByText('Guided Setup').closest('.cursor-pointer');
      expect(guidedSetupCard).toContainHTML('Recommended');
    });

    it('displays time estimates for both methods', () => {
      render(<OnboardingPage />);
      
      expect(screen.getByText('5-7 minutes')).toBeInTheDocument();
      expect(screen.getByText('2-3 minutes')).toBeInTheDocument();
    });
  });

  describe('ASK Method Flow', () => {
    it('completes full ASK Method journey to dashboard', async () => {
      render(<OnboardingPage />);
      
      // Click Guided Setup
      const guidedSetupCard = screen.getByText('Guided Setup').closest('.cursor-pointer');
      fireEvent.click(guidedSetupCard!);

      // Should show ASK Method onboarding
      await waitFor(() => {
        expect(screen.getByText(/What's your single biggest frustration/)).toBeInTheDocument();
      });

      // Answer all ASK Method questions for streamliner
      const askAnswers = [
        'Everything takes too long - time kills deals',
        'Make everything instant - like consumer apps',
        '$1M - $10M USD',
        'Trust my gut - if it feels fast, I\'m in',
        'I\'m in the trenches doing the work',
        'Today - every minute counts'
      ];

      for (const answer of askAnswers) {
        const option = screen.getByLabelText(new RegExp(answer));
        fireEvent.click(option);
        await waitFor(() => {
          expect(screen.queryByLabelText(new RegExp(answer))).not.toBeInTheDocument();
        });
      }

      // Should trigger persona reveal
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.getByText('The Streamliner')).toBeInTheDocument();
        expect(screen.getByText('Speed is your superpower')).toBeInTheDocument();
      });

      // Click continue to dashboard
      const continueButton = screen.getByText('Enter Your Personalized Dashboard');
      fireEvent.click(continueButton);

      // Verify preferences were updated
      await waitFor(() => {
        expect(personaService.updateUserPreferences).toHaveBeenCalledWith({
          onboarding_completed: true,
          dashboard_layout: {
            persona: 'streamliner',
            customized: true
          }
        });
        expect(personaService.updateSystemHealthPreferences).toHaveBeenCalledWith('streamliner');
      });

      // Verify localStorage was set
      expect(localStorage.getItem('onboarding-completed')).toBe('true');
      expect(localStorage.getItem('user-persona')).toBe('streamliner');

      // Verify redirect to dashboard
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('handles early completion with high confidence', async () => {
      render(<OnboardingPage />);
      
      // Start ASK Method
      fireEvent.click(screen.getByText('Start Guided Setup'));

      // Answer consistently for navigator
      const navigatorAnswers = [
        /never know what's really happening/,
        /Know problems before they happen/,
        /\$10M - \$100M USD/,
        /Analyze everything/,
        /design and improve processes/
      ];

      for (const answer of navigatorAnswers) {
        const option = screen.getByLabelText(answer);
        fireEvent.click(option);
        await waitFor(() => {
          expect(screen.queryByLabelText(answer)).not.toBeInTheDocument();
        });
      }

      // Should show early completion option
      await waitFor(() => {
        const completeButton = screen.getByText('Complete Setup');
        expect(completeButton).toBeInTheDocument();
        fireEvent.click(completeButton);
      });

      // Should go to persona reveal
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.getByText('The Navigator')).toBeInTheDocument();
      });
    });
  });

  describe('Quick Setup Flow', () => {
    it('completes quick setup journey to dashboard', async () => {
      render(<OnboardingPage />);
      
      // Click Express Setup
      const expressSetupCard = screen.getByText('Express Setup').closest('.cursor-pointer');
      fireEvent.click(expressSetupCard!);

      // Should show Universal onboarding
      await waitFor(() => {
        expect(screen.getByText('What brought you to supply chain analytics?')).toBeInTheDocument();
      });

      // Answer questions for hub persona
      fireEvent.click(screen.getByText('Managing multiple entities is complex'));
      await waitFor(() => screen.getByText('How do you prefer to work with new tools?'));
      
      fireEvent.click(screen.getByText('See the big picture first'));
      await waitFor(() => screen.getByText("What's your biggest challenge right now?"));
      
      fireEvent.click(screen.getByText('Keeping all entities aligned'));

      // Should show hub result
      await waitFor(() => {
        expect(screen.getByText('Welcome, Hub!')).toBeInTheDocument();
      });

      // Complete onboarding
      fireEvent.click(screen.getByText('Start My Journey'));

      // Should trigger persona reveal
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.getByText('The Hub')).toBeInTheDocument();
        expect(screen.getByText('Connections are your strength')).toBeInTheDocument();
      });

      // Continue to dashboard
      fireEvent.click(screen.getByText('Enter Your Personalized Dashboard'));

      // Verify completion
      await waitFor(() => {
        expect(localStorage.getItem('user-persona')).toBe('hub');
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('handles fast-track option correctly', async () => {
      render(<OnboardingPage />);
      
      // Click Express Setup
      fireEvent.click(screen.getByText('Quick Start'));

      // Use fast-track button
      await waitFor(() => {
        const fastTrackButton = screen.getByText('I know what I want - take me to the dashboard');
        fireEvent.click(fastTrackButton);
      });

      // Should complete as streamliner
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.getByText('The Streamliner')).toBeInTheDocument();
      });
    });
  });

  describe('Skip Options', () => {
    it('allows skipping from initial screen', async () => {
      render(<OnboardingPage />);
      
      const skipButton = screen.getByText('Skip for now');
      fireEvent.click(skipButton);

      // Should set skip flag and redirect
      expect(localStorage.getItem('onboarding-skipped')).toBe('true');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('shows skip message', () => {
      render(<OnboardingPage />);
      
      expect(screen.getByText('You can always personalize later from settings')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles persona calculation errors gracefully', async () => {
      (personaService.calculatePersona as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      render(<OnboardingPage />);
      
      // Complete ASK Method
      fireEvent.click(screen.getByText('Start Guided Setup'));
      
      // Answer all questions quickly
      const quickAnswers = [
        'Everything takes too long - time kills deals',
        'Make everything instant - like consumer apps',
        '$1M - $10M USD',
        'Trust my gut - if it feels fast, I\'m in',
        'I\'m in the trenches doing the work',
        'Today - every minute counts'
      ];

      for (const answer of quickAnswers) {
        const option = screen.getByLabelText(new RegExp(answer));
        fireEvent.click(option);
        await waitFor(() => {
          expect(screen.queryByLabelText(new RegExp(answer))).not.toBeInTheDocument();
        });
      }

      // Should still show persona reveal with default confidence
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.getByText('The Streamliner')).toBeInTheDocument();
        expect(screen.getByText('85% Match Confidence')).toBeInTheDocument();
      });
    });

    it('handles missing user context', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null });
      
      render(<OnboardingPage />);
      
      // Try to complete onboarding
      fireEvent.click(screen.getByText('Quick Start'));
      
      // Answer questions
      fireEvent.click(screen.getByText('I need to move faster - time is money'));
      await waitFor(() => screen.getByText('How do you prefer to work with new tools?'));
      
      fireEvent.click(screen.getByText("Jump right in - I'll figure it out"));
      await waitFor(() => screen.getByText("What's your biggest challenge right now?"));
      
      fireEvent.click(screen.getByText('Everything takes too long'));

      // Complete journey
      await waitFor(() => screen.getByText('Start My Journey'));
      fireEvent.click(screen.getByText('Start My Journey'));

      // Should handle missing user gracefully
      jest.advanceTimersByTime(3000);
      
      const continueButton = await waitFor(() => screen.getByText('Enter Your Personalized Dashboard'));
      fireEvent.click(continueButton);

      // Should still redirect
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Persona Detection Accuracy', () => {
    const personaTests = [
      {
        persona: 'spring',
        answers: {
          ask: [
            /don't even know where to start/,
            /Make it so easy my intern could do it/,
            /\$100K - \$1M USD/,
            /Ask experts and follow best practices/,
            /I'm new and figuring things out/,
            /I'm exploring - no rush/
          ],
          quick: [
            "I'm exploring what's possible",
            'Follow a guided path step-by-step',
            'Understanding what metrics matter'
          ]
        }
      },
      {
        persona: 'processor',
        answers: {
          ask: [
            /Systems fail when I need them most/,
            /Systems that never fail, ever/,
            /Over \$100M USD/,
            /Test exhaustively before committing/,
            /I keep systems running smoothly/,
            /This month - time to do it right/
          ],
          quick: [
            'I need rock-solid systems',
            'Read all documentation first',
            'System errors and downtime'
          ]
        }
      }
    ];

    personaTests.forEach(({ persona, answers }) => {
      it(`correctly detects ${persona} persona through ASK Method`, async () => {
        render(<OnboardingPage />);
        
        fireEvent.click(screen.getByText('Start Guided Setup'));

        for (const answer of answers.ask) {
          await waitFor(() => {
            const option = screen.getByLabelText(answer);
            fireEvent.click(option);
          });
        }

        jest.advanceTimersByTime(3000);

        await waitFor(() => {
          expect(screen.getByText(new RegExp(`The ${persona}`, 'i'))).toBeInTheDocument();
        });
      });

      it(`correctly detects ${persona} persona through Quick Setup`, async () => {
        render(<OnboardingPage />);
        
        fireEvent.click(screen.getByText('Quick Start'));

        for (const answer of answers.quick) {
          await waitFor(() => {
            fireEvent.click(screen.getByText(answer));
          });
        }

        await waitFor(() => {
          expect(screen.getByText(new RegExp(`Welcome, ${persona}`, 'i'))).toBeInTheDocument();
        });
      });
    });
  });
});