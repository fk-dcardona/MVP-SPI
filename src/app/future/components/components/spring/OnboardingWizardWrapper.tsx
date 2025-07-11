'use client';

import { UniversalOnboarding } from '@/components/onboarding/UniversalOnboarding';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

export function OnboardingWizard() {
  const router = useRouter();

  const handleComplete = (detectedPersona: string) => {
    // Store the detected persona
    localStorage.setItem('user-persona', detectedPersona);
    localStorage.setItem('spring-onboarding-complete', 'true');
    
    // Show persona-specific welcome message
    const messages = {
      streamliner: 'Lightning fast setup complete! Your speed dashboard is ready.',
      navigator: 'Control center configured! Your predictive analytics await.',
      hub: 'Network connections established! Your multi-entity view is ready.',
      spring: 'Learning journey begun! Your progress tracking is active.',
      processor: 'System initialized! Your monitoring dashboard is operational.',
    };

    toast({
      title: 'Welcome aboard! 🎉',
      description: messages[detectedPersona as keyof typeof messages] || 'Your personalized dashboard is ready.',
    });

    // Redirect to dashboard - the MainDashboard will use the stored persona
    router.push('/dashboard');
  };

  return <UniversalOnboarding onComplete={handleComplete} />;
}