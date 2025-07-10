'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ASKMethodOnboarding } from '@/components/onboarding/ASKMethodOnboarding';
import { PersonaReveal } from '@/components/onboarding/PersonaReveal';
import { UniversalOnboarding } from '@/components/onboarding/UniversalOnboarding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { personaService } from '@/services/persona-service';
import { useAuth } from '@/hooks/useAuth';
import type { UserPersona } from '@/types/persona';
import {
  Zap,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Timer,
  Target,
} from 'lucide-react';

type OnboardingMode = 'selection' | 'ask-method' | 'universal' | 'reveal' | 'complete';

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mode, setMode] = useState<OnboardingMode>('selection');
  const [detectedPersona, setDetectedPersona] = useState<UserPersona | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const handleASKComplete = async (persona: UserPersona, askAnswers: Record<string, any>) => {
    setDetectedPersona(persona);
    setAnswers(askAnswers);
    
    // Calculate confidence based on answer consistency
    const result = await personaService.calculatePersona();
    if (result) {
      setConfidence(result.confidence);
    } else {
      setConfidence(0.85); // Default high confidence for ASK method
    }
    
    setMode('reveal');
  };

  const handleUniversalComplete = (persona: string) => {
    setDetectedPersona(persona as UserPersona);
    setConfidence(0.75); // Slightly lower confidence for quick method
    setMode('reveal');
  };

  const handlePersonaRevealContinue = async () => {
    if (!user || !detectedPersona) return;

    // Update user preferences based on persona
    await personaService.updateUserPreferences({
      onboarding_completed: true,
      dashboard_layout: {
        persona: detectedPersona,
        customized: true
      }
    });

    // Update system health preferences
    await personaService.updateSystemHealthPreferences(detectedPersona);

    // Set localStorage to avoid redirect loop
    localStorage.setItem('onboarding-completed', 'true');
    localStorage.setItem('user-persona', detectedPersona);

    // Show success message
    toast({
      title: 'Welcome aboard! 🎉',
      description: `Your ${detectedPersona} dashboard is ready.`,
    });

    // Redirect to personalized dashboard
    router.push('/dashboard');
  };

  if (mode === 'selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="max-w-4xl mx-auto pt-20">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Welcome to Finkargo</h1>
            <p className="text-xl text-gray-600">
              Let's personalize your trade finance experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* ASK Method Card */}
            <Card className="hover:shadow-xl transition-shadow cursor-pointer" 
                  onClick={() => setMode('ask-method')}>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <MessageSquare className="h-12 w-12 text-blue-500" />
                  <Badge variant="secondary">Recommended</Badge>
                </div>
                <CardTitle className="text-2xl">Guided Setup</CardTitle>
                <CardDescription>
                  Answer strategic questions to reveal your perfect workflow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Timer className="h-4 w-4 mr-2" />
                    5-7 minutes
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Target className="h-4 w-4 mr-2" />
                    95% accuracy
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Deep personalization
                  </div>
                  <Button className="w-full" variant="default">
                    Start Guided Setup
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Setup Card */}
            <Card className="hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => setMode('universal')}>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Zap className="h-12 w-12 text-amber-500" />
                  <Badge variant="outline">Quick</Badge>
                </div>
                <CardTitle className="text-2xl">Express Setup</CardTitle>
                <CardDescription>
                  Jump right in with our adaptive quick-start experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Timer className="h-4 w-4 mr-2" />
                    2-3 minutes
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Target className="h-4 w-4 mr-2" />
                    Smart defaults
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Instant access
                  </div>
                  <Button className="w-full" variant="outline">
                    Quick Start
                    <Zap className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button
              variant="ghost"
              onClick={() => {
                localStorage.setItem('onboarding-skipped', 'true');
                router.push('/dashboard');
              }}
            >
              Skip for now
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              You can always personalize later from settings
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'ask-method') {
    return <ASKMethodOnboarding onComplete={handleASKComplete} />;
  }

  if (mode === 'universal') {
    return <UniversalOnboarding onComplete={handleUniversalComplete} />;
  }

  if (mode === 'reveal' && detectedPersona) {
    return (
      <PersonaReveal
        persona={detectedPersona}
        confidence={confidence}
        onContinue={handlePersonaRevealContinue}
      />
    );
  }

  return <div>Loading...</div>;
}