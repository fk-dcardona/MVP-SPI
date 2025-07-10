'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Zap,
  Compass,
  Network,
  Sprout,
  Cpu,
  ChevronRight,
  ChevronLeft,
  Timer,
  Building2,
  Globe,
  TrendingUp,
  Package,
  AlertCircle,
  Target,
  Gauge,
  Users,
  FileText,
  Shield,
} from 'lucide-react';
import { usePersonaTracking } from '@/hooks/usePersonaTracking';
import { personaService } from '@/services/persona-service';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MobileOptimizedOnboarding, MobileQuestionCard, TouchRadioOption } from './MobileOptimizedOnboarding';
import type { UserPersona } from '@/types/persona';

// ASK Method Question Types
type QuestionType = 'deep-dive' | 'disqualify' | 'segmentation' | 'micro-commitment';

interface ASKQuestion {
  id: string;
  type: QuestionType;
  category: string;
  question: string;
  subtext?: string;
  answers: {
    value: string;
    label: string;
    subtext?: string;
    personaWeights: {
      streamliner: number;
      navigator: number;
      hub: number;
      spring: number;
      processor: number;
    };
    disqualifies?: boolean;
  }[];
  skipLogic?: (answers: Record<string, any>) => boolean;
}

// Deep Dive Questions - Uncover hidden pain points and desires
const DEEP_DIVE_QUESTIONS: ASKQuestion[] = [
  {
    id: 'biggest-frustration',
    type: 'deep-dive',
    category: 'Pain Points',
    question: "What's your single biggest frustration with managing trade finance operations today?",
    subtext: "Be specific - we're listening",
    answers: [
      {
        value: 'speed',
        label: 'Everything takes too long - time kills deals',
        subtext: 'Hours turn into days, days into weeks',
        personaWeights: { streamliner: 10, navigator: 2, hub: 3, spring: 1, processor: 2 }
      },
      {
        value: 'visibility',
        label: "I never know what's really happening until it's too late",
        subtext: 'Surprises are expensive in this business',
        personaWeights: { streamliner: 2, navigator: 10, hub: 3, spring: 2, processor: 4 }
      },
      {
        value: 'coordination',
        label: 'Managing multiple entities/partners is chaos',
        subtext: "Left hand doesn't know what right hand is doing",
        personaWeights: { streamliner: 2, navigator: 3, hub: 10, spring: 1, processor: 2 }
      },
      {
        value: 'complexity',
        label: "I don't even know where to start sometimes",
        subtext: 'Trade finance feels like a black box',
        personaWeights: { streamliner: 1, navigator: 2, hub: 1, spring: 10, processor: 1 }
      },
      {
        value: 'reliability',
        label: 'Systems fail when I need them most',
        subtext: 'Downtime and errors cost us money',
        personaWeights: { streamliner: 2, navigator: 3, hub: 2, spring: 1, processor: 10 }
      }
    ]
  },
  {
    id: 'dream-outcome',
    type: 'deep-dive',
    category: 'Aspirations',
    question: "If you could wave a magic wand and fix ONE thing about your trade operations, what would it be?",
    answers: [
      {
        value: 'instant',
        label: 'Make everything instant - like consumer apps',
        personaWeights: { streamliner: 10, navigator: 1, hub: 2, spring: 1, processor: 1 }
      },
      {
        value: 'predictive',
        label: 'Know problems before they happen',
        personaWeights: { streamliner: 1, navigator: 10, hub: 2, spring: 1, processor: 3 }
      },
      {
        value: 'unified',
        label: 'One view of everything, everywhere',
        personaWeights: { streamliner: 2, navigator: 3, hub: 10, spring: 1, processor: 2 }
      },
      {
        value: 'simple',
        label: 'Make it so easy my intern could do it',
        personaWeights: { streamliner: 3, navigator: 1, hub: 1, spring: 10, processor: 1 }
      },
      {
        value: 'bulletproof',
        label: 'Systems that never fail, ever',
        personaWeights: { streamliner: 1, navigator: 2, hub: 2, spring: 1, processor: 10 }
      }
    ]
  }
];

// Disqualification Questions - Identify if we're the right fit
const DISQUALIFY_QUESTIONS: ASKQuestion[] = [
  {
    id: 'trade-volume',
    type: 'disqualify',
    category: 'Business Size',
    question: "What's your annual trade volume?",
    answers: [
      {
        value: 'micro',
        label: 'Under $100K USD',
        disqualifies: true,
        personaWeights: { streamliner: 0, navigator: 0, hub: 0, spring: 5, processor: 0 }
      },
      {
        value: 'small',
        label: '$100K - $1M USD',
        personaWeights: { streamliner: 3, navigator: 2, hub: 1, spring: 8, processor: 1 }
      },
      {
        value: 'medium',
        label: '$1M - $10M USD',
        personaWeights: { streamliner: 8, navigator: 5, hub: 3, spring: 3, processor: 2 }
      },
      {
        value: 'large',
        label: '$10M - $100M USD',
        personaWeights: { streamliner: 5, navigator: 8, hub: 7, spring: 1, processor: 4 }
      },
      {
        value: 'enterprise',
        label: 'Over $100M USD',
        personaWeights: { streamliner: 2, navigator: 7, hub: 10, spring: 0, processor: 8 }
      }
    ]
  }
];

// Segmentation Questions - Bucket users effectively
const SEGMENTATION_QUESTIONS: ASKQuestion[] = [
  {
    id: 'decision-style',
    type: 'segmentation',
    category: 'Behavior',
    question: "How do you typically make decisions about new tools?",
    answers: [
      {
        value: 'gut',
        label: "Trust my gut - if it feels fast, I'm in",
        personaWeights: { streamliner: 10, navigator: 1, hub: 3, spring: 2, processor: 1 }
      },
      {
        value: 'data',
        label: 'Analyze everything - I need proof',
        personaWeights: { streamliner: 1, navigator: 10, hub: 3, spring: 2, processor: 5 }
      },
      {
        value: 'consensus',
        label: 'Get buy-in from all stakeholders',
        personaWeights: { streamliner: 2, navigator: 3, hub: 10, spring: 2, processor: 3 }
      },
      {
        value: 'expert',
        label: 'Ask experts and follow best practices',
        personaWeights: { streamliner: 1, navigator: 3, hub: 2, spring: 10, processor: 4 }
      },
      {
        value: 'testing',
        label: 'Test exhaustively before committing',
        personaWeights: { streamliner: 1, navigator: 4, hub: 2, spring: 3, processor: 10 }
      }
    ]
  },
  {
    id: 'role-context',
    type: 'segmentation',
    category: 'Role',
    question: "Which best describes your role in trade operations?",
    answers: [
      {
        value: 'executor',
        label: "I'm in the trenches doing the work",
        personaWeights: { streamliner: 8, navigator: 2, hub: 1, spring: 5, processor: 3 }
      },
      {
        value: 'optimizer',
        label: 'I design and improve processes',
        personaWeights: { streamliner: 3, navigator: 8, hub: 2, spring: 2, processor: 5 }
      },
      {
        value: 'orchestrator',
        label: 'I coordinate across teams/entities',
        personaWeights: { streamliner: 2, navigator: 3, hub: 10, spring: 1, processor: 2 }
      },
      {
        value: 'learner',
        label: "I'm new and figuring things out",
        personaWeights: { streamliner: 2, navigator: 1, hub: 1, spring: 10, processor: 1 }
      },
      {
        value: 'guardian',
        label: 'I keep systems running smoothly',
        personaWeights: { streamliner: 1, navigator: 3, hub: 2, spring: 1, processor: 10 }
      }
    ]
  }
];

// Micro-commitment Questions - Small yes to build to big yes
const MICRO_COMMITMENT_QUESTIONS: ASKQuestion[] = [
  {
    id: 'time-to-value',
    type: 'micro-commitment',
    category: 'Expectations',
    question: "How quickly do you need to see results?",
    answers: [
      {
        value: 'today',
        label: 'Today - every minute counts',
        personaWeights: { streamliner: 10, navigator: 2, hub: 3, spring: 1, processor: 2 }
      },
      {
        value: 'week',
        label: 'This week - after proper setup',
        personaWeights: { streamliner: 3, navigator: 8, hub: 5, spring: 3, processor: 5 }
      },
      {
        value: 'month',
        label: 'This month - time to do it right',
        personaWeights: { streamliner: 1, navigator: 5, hub: 8, spring: 5, processor: 8 }
      },
      {
        value: 'learning',
        label: "I'm exploring - no rush",
        personaWeights: { streamliner: 1, navigator: 2, hub: 2, spring: 10, processor: 2 }
      }
    ]
  }
];

interface ASKMethodOnboardingProps {
  onComplete: (persona: UserPersona, answers: Record<string, any>) => void;
}

export function ASKMethodOnboarding({ onComplete }: ASKMethodOnboardingProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [personaScores, setPersonaScores] = useState({
    streamliner: 0,
    navigator: 0,
    hub: 0,
    spring: 0,
    processor: 0,
  });
  const [showPersonaHint, setShowPersonaHint] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const { trackBehavior } = usePersonaTracking();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Combine all questions in ASK Method order
  const allQuestions = [
    ...DEEP_DIVE_QUESTIONS,
    ...DISQUALIFY_QUESTIONS,
    ...SEGMENTATION_QUESTIONS,
    ...MICRO_COMMITMENT_QUESTIONS,
  ];

  // Filter questions based on skip logic
  const activeQuestions = allQuestions.filter(q => 
    !q.skipLogic || !q.skipLogic(answers)
  );

  const currentQuestion = activeQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / activeQuestions.length) * 100;

  // Calculate emerging persona
  const getEmergingPersona = (): UserPersona => {
    const entries = Object.entries(personaScores);
    const [persona] = entries.reduce((a, b) => a[1] > b[1] ? a : b);
    return persona as UserPersona;
  };

  // Update scores based on answer
  const handleAnswer = async (value: string) => {
    const answer = currentQuestion.answers.find(a => a.value === value);
    if (!answer) return;

    // Track behavior
    await trackBehavior('onboarding_answer', {
      question_id: currentQuestion.id,
      answer: value,
      question_type: currentQuestion.type,
      device: isMobile ? 'mobile' : 'desktop'
    });

    // Check for disqualification
    if (answer.disqualifies) {
      // Handle disqualification gracefully
      alert('Thank you for your interest. Based on your responses, we recommend exploring our self-service options.');
      return;
    }

    // Update answers
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    // Update persona scores
    const newScores = { ...personaScores };
    Object.keys(answer.personaWeights).forEach(persona => {
      newScores[persona as UserPersona] += answer.personaWeights[persona as UserPersona];
    });
    setPersonaScores(newScores);

    // Calculate confidence
    const totalScore = Object.values(newScores).reduce((a, b) => a + b, 0);
    const maxScore = Math.max(...Object.values(newScores));
    const newConfidence = totalScore > 0 ? maxScore / totalScore : 0;
    setConfidence(newConfidence);

    // Show hint if confidence is high enough
    if (newConfidence > 0.4 && currentQuestionIndex > 2) {
      setShowPersonaHint(true);
    }

    // Clear selected value for next question
    setSelectedValue('');
  };

  const handleNext = async () => {
    if (selectedValue) {
      await handleAnswer(selectedValue);
      
      // Move to next question or complete
      if (currentQuestionIndex < activeQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Complete onboarding
        const finalPersona = getEmergingPersona();
        await personaService.calculatePersona();
        onComplete(finalPersona, answers);
      }
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Get persona-specific styling
  const getPersonaStyle = () => {
    const persona = getEmergingPersona();
    const styles = {
      streamliner: 'from-blue-500 to-blue-600',
      navigator: 'from-emerald-500 to-emerald-600',
      hub: 'from-purple-500 to-purple-600',
      spring: 'from-amber-500 to-amber-600',
      processor: 'from-gray-500 to-gray-600',
    };
    return styles[persona];
  };

  if (!currentQuestion) {
    return <div>Loading...</div>;
  }

  // Mobile-optimized render
  if (isMobile) {
    return (
      <MobileOptimizedOnboarding
        currentStep={currentQuestionIndex}
        totalSteps={activeQuestions.length}
        onNext={handleNext}
        onPrevious={handleBack}
        onComplete={async () => {
          const finalPersona = getEmergingPersona();
          await personaService.calculatePersona();
          onComplete(finalPersona, answers);
        }}
      >
        <MobileQuestionCard
          question={currentQuestion.question}
          description={currentQuestion.subtext}
          badge={currentQuestion.category}
        >
          <div className="space-y-3">
            {currentQuestion.answers.map((answer) => (
              <TouchRadioOption
                key={answer.value}
                value={answer.value}
                label={answer.label}
                subtext={answer.subtext}
                selected={selectedValue === answer.value}
                onSelect={setSelectedValue}
              />
            ))}
          </div>

          {/* Persona Hint */}
          {showPersonaHint && confidence > 0.4 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 p-4 rounded-lg bg-gradient-to-r ${getPersonaStyle()} text-white`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">We're learning about you...</p>
                  <p className="text-xs opacity-90">
                    Your responses suggest a {getEmergingPersona()} profile
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {Math.round(confidence * 100)}%
                  </p>
                  <p className="text-xs">confidence</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Early completion option */}
          {confidence > 0.8 && currentQuestionIndex > activeQuestions.length * 0.6 && (
            <div className="mt-6 text-center">
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={async () => {
                  const finalPersona = getEmergingPersona();
                  await personaService.calculatePersona();
                  onComplete(finalPersona, answers);
                }}
              >
                Complete Setup Early
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </MobileQuestionCard>
      </MobileOptimizedOnboarding>
    );
  }

  // Desktop render (original)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {activeQuestions.length}
            </span>
            {confidence > 0.4 && (
              <Badge variant="secondary" className="animate-pulse">
                <Timer className="h-3 w-3 mr-1" />
                ~{Math.ceil((activeQuestions.length - currentQuestionIndex) * 0.5)} min remaining
              </Badge>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline">
                    {currentQuestion.category}
                  </Badge>
                  {currentQuestion.type === 'deep-dive' && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500">
                      Deep Dive
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl">
                  {currentQuestion.question}
                </CardTitle>
                {currentQuestion.subtext && (
                  <CardDescription className="text-base mt-2">
                    {currentQuestion.subtext}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={selectedValue || answers[currentQuestion.id]}
                  onValueChange={setSelectedValue}
                >
                  {currentQuestion.answers.map((answer, index) => (
                    <motion.div
                      key={answer.value}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Label
                        htmlFor={answer.value}
                        className="flex flex-col p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem value={answer.value} id={answer.value} />
                          <div className="flex-1">
                            <p className="font-medium">{answer.label}</p>
                            {answer.subtext && (
                              <p className="text-sm text-gray-600 mt-1">
                                {answer.subtext}
                              </p>
                            )}
                          </div>
                        </div>
                      </Label>
                    </motion.div>
                  ))}
                </RadioGroup>

                {/* Persona Hint */}
                {showPersonaHint && confidence > 0.4 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg bg-gradient-to-r ${getPersonaStyle()} text-white`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">We're learning about you...</p>
                        <p className="text-xs opacity-90">
                          Your responses suggest a {getEmergingPersona()} profile
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {Math.round(confidence * 100)}%
                        </p>
                        <p className="text-xs">confidence</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  
                  <div className="flex gap-2">
                    {confidence > 0.8 && currentQuestionIndex > activeQuestions.length * 0.6 && (
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          const finalPersona = getEmergingPersona();
                          await personaService.calculatePersona();
                          onComplete(finalPersona, answers);
                        }}
                      >
                        Complete Early
                      </Button>
                    )}
                    <Button
                      variant="default"
                      onClick={handleNext}
                      disabled={!selectedValue}
                    >
                      {currentQuestionIndex === activeQuestions.length - 1 ? 'Complete' : 'Next'}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Question Type Indicator */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center">
              <Target className="h-4 w-4 mr-1" />
              {activeQuestions.filter(q => q.type === 'deep-dive').length} Deep Dive
            </span>
            <span className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {activeQuestions.filter(q => q.type === 'disqualify').length} Qualifying
            </span>
            <span className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {activeQuestions.filter(q => q.type === 'segmentation').length} Segmentation
            </span>
            <span className="flex items-center">
              <Gauge className="h-4 w-4 mr-1" />
              {activeQuestions.filter(q => q.type === 'micro-commitment').length} Commitment
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}