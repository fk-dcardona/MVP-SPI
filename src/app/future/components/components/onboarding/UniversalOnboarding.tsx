'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Compass, 
  Network, 
  Sprout, 
  Cpu,
  ChevronRight,
  SkipForward,
  FastForward,
} from 'lucide-react';

interface OnboardingScript {
  question: string;
  answers: {
    value: string;
    label: string;
    weight: {
      streamliner: number;
      navigator: number;
      hub: number;
      spring: number;
      processor: number;
    };
  }[];
}

// Universal onboarding questions that reveal persona naturally
const ONBOARDING_SCRIPTS: OnboardingScript[] = [
  {
    question: "What brought you to supply chain analytics?",
    answers: [
      {
        value: "speed",
        label: "I need to move faster - time is money",
        weight: { streamliner: 10, navigator: 2, hub: 3, spring: 1, processor: 2 }
      },
      {
        value: "control",
        label: "I want complete visibility and control",
        weight: { streamliner: 2, navigator: 10, hub: 3, spring: 2, processor: 4 }
      },
      {
        value: "scale",
        label: "Managing multiple entities is complex",
        weight: { streamliner: 2, navigator: 3, hub: 10, spring: 1, processor: 2 }
      },
      {
        value: "learning",
        label: "I\'m exploring what\'s possible",
        weight: { streamliner: 1, navigator: 2, hub: 1, spring: 10, processor: 1 }
      },
      {
        value: "reliability",
        label: "I need rock-solid systems",
        weight: { streamliner: 2, navigator: 4, hub: 2, spring: 1, processor: 10 }
      }
    ]
  },
  {
    question: "How do you prefer to work with new tools?",
    answers: [
      {
        value: "dive-in",
        label: "Jump right in - I\'ll figure it out",
        weight: { streamliner: 8, navigator: 3, hub: 4, spring: 2, processor: 3 }
      },
      {
        value: "customize",
        label: "Set everything up exactly how I like it",
        weight: { streamliner: 2, navigator: 9, hub: 3, spring: 2, processor: 5 }
      },
      {
        value: "overview",
        label: "See the big picture first",
        weight: { streamliner: 3, navigator: 4, hub: 8, spring: 3, processor: 3 }
      },
      {
        value: "guided",
        label: "Follow a guided path step-by-step",
        weight: { streamliner: 1, navigator: 2, hub: 2, spring: 9, processor: 3 }
      },
      {
        value: "documentation",
        label: "Read all documentation first",
        weight: { streamliner: 1, navigator: 3, hub: 2, spring: 3, processor: 8 }
      }
    ]
  },
  {
    question: "What\'s your biggest challenge right now?",
    answers: [
      {
        value: "time",
        label: "Everything takes too long",
        weight: { streamliner: 9, navigator: 3, hub: 4, spring: 2, processor: 2 }
      },
      {
        value: "uncertainty",
        label: "Too many unknowns and surprises",
        weight: { streamliner: 2, navigator: 9, hub: 3, spring: 4, processor: 3 }
      },
      {
        value: "coordination",
        label: "Keeping all entities aligned",
        weight: { streamliner: 2, navigator: 3, hub: 9, spring: 2, processor: 3 }
      },
      {
        value: "knowledge",
        label: "Understanding what metrics matter",
        weight: { streamliner: 1, navigator: 3, hub: 2, spring: 9, processor: 2 }
      },
      {
        value: "stability",
        label: "System errors and downtime",
        weight: { streamliner: 2, navigator: 3, hub: 3, spring: 2, processor: 9 }
      }
    ]
  }
];

export function UniversalOnboarding({ onComplete }: { onComplete: (persona: string) => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [personaScores, setPersonaScores] = useState({
    streamliner: 0,
    navigator: 0,
    hub: 0,
    spring: 0,
    processor: 0,
  });
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    // Update persona scores based on answer weights
    const selectedAnswer = ONBOARDING_SCRIPTS[currentStep].answers.find(a => a.value === answer);
    if (selectedAnswer) {
      setPersonaScores(prev => ({
        streamliner: prev.streamliner + selectedAnswer.weight.streamliner,
        navigator: prev.navigator + selectedAnswer.weight.navigator,
        hub: prev.hub + selectedAnswer.weight.hub,
        spring: prev.spring + selectedAnswer.weight.spring,
        processor: prev.processor + selectedAnswer.weight.processor,
      }));
    }

    if (currentStep < ONBOARDING_SCRIPTS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Determine primary persona
      setShowResult(true);
    }
  };

  const getDetectedPersona = () => {
    const entries = Object.entries(personaScores);
    const [persona] = entries.reduce((a, b) => a[1] > b[1] ? a : b);
    return persona;
  };

  const getPersonaInfo = (persona: string) => {
    const info = {
      streamliner: {
        icon: Zap,
        title: "Streamliner",
        description: "You value speed and efficiency above all. Let\'s get you moving fast.",
        color: "blue",
      },
      navigator: {
        icon: Compass,
        title: "Navigator",
        description: "You need control and predictability. Let\'s set up your command center.",
        color: "emerald",
      },
      hub: {
        icon: Network,
        title: "Hub",
        description: "You\'re managing complexity at scale. Let\'s connect your network.",
        color: "purple",
      },
      spring: {
        icon: Sprout,
        title: "Spring",
        description: "You\'re growing and learning. Let\'s build your foundation.",
        color: "amber",
      },
      processor: {
        icon: Cpu,
        title: "Processor",
        description: "You need reliability and precision. Let\'s ensure system stability.",
        color: "gray",
      },
    };
    return info[persona as keyof typeof info];
  };

  const skipOnboarding = () => {
    // Quick detection based on interaction pattern
    onComplete('streamliner'); // Fast skip = streamliner behavior
  };

  if (showResult) {
    const detectedPersona = getDetectedPersona();
    const personaInfo = getPersonaInfo(detectedPersona);
    const Icon = personaInfo.icon;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      >
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className={`w-20 h-20 mx-auto rounded-full bg-${personaInfo.color}-100 flex items-center justify-center mb-4`}
            >
              <Icon className={`h-10 w-10 text-${personaInfo.color}-600`} />
            </motion.div>
            <CardTitle className="text-2xl">Welcome, {personaInfo.title}!</CardTitle>
            <CardDescription className="text-base mt-2">
              {personaInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Your personalized experience includes:</h4>
                <ul className="space-y-1 text-sm">
                  {detectedPersona === 'streamliner' && (
                    <>
                      <li>⚡ Speed dashboard with real-time metrics</li>
                      <li>⌨️ Keyboard shortcuts for everything</li>
                      <li>🏃 Quick action toolbar</li>
                    </>
                  )}
                  {detectedPersona === 'navigator' && (
                    <>
                      <li>🎛️ Customizable control panels</li>
                      <li>📊 Predictive analytics dashboard</li>
                      <li>🔍 Advanced filtering and search</li>
                    </>
                  )}
                  {detectedPersona === 'hub' && (
                    <>
                      <li>🌐 Network visualization map</li>
                      <li>🏢 Multi-entity switcher</li>
                      <li>📈 Consolidated reporting</li>
                    </>
                  )}
                  {detectedPersona === 'spring' && (
                    <>
                      <li>🎯 Guided learning paths</li>
                      <li>🏆 Achievement system</li>
                      <li>💡 Contextual help everywhere</li>
                    </>
                  )}
                  {detectedPersona === 'processor' && (
                    <>
                      <li>🛡️ System health monitoring</li>
                      <li>📋 Detailed audit logs</li>
                      <li>⚙️ Advanced configuration</li>
                    </>
                  )}
                </ul>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={() => onComplete(detectedPersona)}
              >
                Start My Journey
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Quick Setup</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipOnboarding}
              className="text-gray-500"
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Skip
            </Button>
          </div>
          <Progress value={(currentStep + 1) / ONBOARDING_SCRIPTS.length * 100} />
          <CardDescription className="mt-4 text-base">
            Question {currentStep + 1} of {ONBOARDING_SCRIPTS.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold mb-4">
                {ONBOARDING_SCRIPTS[currentStep].question}
              </h3>
              
              <div className="space-y-2">
                {ONBOARDING_SCRIPTS[currentStep].answers.map((answer) => (
                  <Button
                    key={answer.value}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3 px-4"
                    onClick={() => handleAnswer(answer.value)}
                  >
                    {answer.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Fast-track for Streamliners */}
          {currentStep === 0 && (
            <div className="mt-6 text-center">
              <Button
                variant="link"
                size="sm"
                onClick={() => onComplete('streamliner')}
                className="text-gray-500"
              >
                <FastForward className="h-4 w-4 mr-1" />
                I know what I want - take me to the dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}