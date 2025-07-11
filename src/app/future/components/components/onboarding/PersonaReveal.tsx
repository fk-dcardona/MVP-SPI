'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Zap,
  Compass,
  Network,
  Sprout,
  Cpu,
  ChevronRight,
  Star,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Timer,
  Target,
  Users,
  Shield,
  Gauge,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { UserPersona } from '@/types/persona';

interface PersonaDetails {
  icon: any;
  title: string;
  tagline: string;
  description: string;
  characteristics: string[];
  features: {
    icon: any;
    title: string;
    description: string;
  }[];
  color: string;
  gradient: string;
  stats: {
    label: string;
    value: string;
    icon: any;
  }[];
}

const PERSONA_DETAILS: Record<UserPersona, PersonaDetails> = {
  streamliner: {
    icon: Zap,
    title: 'The Streamliner',
    tagline: 'Speed is your superpower',
    description: 'You move fast and break bottlenecks. Every second counts in your world.',
    characteristics: [
      'Lightning-fast decision maker',
      'Efficiency optimizer',
      'Time-value maximizer',
      'Rapid executor'
    ],
    features: [
      {
        icon: Gauge,
        title: 'Speed Dashboard',
        description: 'Real-time metrics at your fingertips'
      },
      {
        icon: Zap,
        title: 'Quick Actions',
        description: 'One-click operations for everything'
      },
      {
        icon: Timer,
        title: 'Time Tracking',
        description: 'Monitor and beat your best times'
      }
    ],
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    stats: [
      { label: 'Avg. Task Time', value: '2.3 min', icon: Timer },
      { label: 'Time Saved', value: '47%', icon: Target },
      { label: 'Speed Rank', value: '#2', icon: Star }
    ]
  },
  navigator: {
    icon: Compass,
    title: 'The Navigator',
    tagline: 'Control is your compass',
    description: 'You chart the course with precision. Predictability and control guide your decisions.',
    characteristics: [
      'Strategic planner',
      'Risk mitigator',
      'Data-driven leader',
      'Process architect'
    ],
    features: [
      {
        icon: Compass,
        title: 'Control Center',
        description: 'Customizable command dashboard'
      },
      {
        icon: Target,
        title: 'Predictive Analytics',
        description: 'See problems before they happen'
      },
      {
        icon: Shield,
        title: 'Risk Management',
        description: 'Complete visibility and control'
      }
    ],
    color: 'emerald',
    gradient: 'from-emerald-500 to-emerald-600',
    stats: [
      { label: 'Prediction Accuracy', value: '94%', icon: Target },
      { label: 'Risk Reduction', value: '67%', icon: Shield },
      { label: 'Control Score', value: '9.2/10', icon: Gauge }
    ]
  },
  hub: {
    icon: Network,
    title: 'The Hub',
    tagline: 'Connections are your strength',
    description: 'You orchestrate complex networks with ease. Multiple entities, one vision.',
    characteristics: [
      'Network orchestrator',
      'Multi-entity manager',
      'Relationship builder',
      'Ecosystem thinker'
    ],
    features: [
      {
        icon: Network,
        title: 'Network Map',
        description: 'Visualize all connections'
      },
      {
        icon: Users,
        title: 'Entity Switcher',
        description: 'Seamless multi-entity management'
      },
      {
        icon: Target,
        title: 'Consolidated View',
        description: 'One dashboard, all entities'
      }
    ],
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
    stats: [
      { label: 'Entities Managed', value: '12', icon: Network },
      { label: 'Network Efficiency', value: '+34%', icon: Target },
      { label: 'Sync Time', value: '<1s', icon: Timer }
    ]
  },
  spring: {
    icon: Sprout,
    title: 'The Spring',
    tagline: 'Growth is your journey',
    description: 'You learn, adapt, and grow. Every challenge is an opportunity to level up.',
    characteristics: [
      'Eager learner',
      'Adaptive thinker',
      'Growth mindset',
      'Knowledge seeker'
    ],
    features: [
      {
        icon: Sprout,
        title: 'Learning Path',
        description: 'Personalized growth journey'
      },
      {
        icon: Star,
        title: 'Achievement System',
        description: 'Track your progress'
      },
      {
        icon: Users,
        title: 'Expert Support',
        description: 'Help when you need it'
      }
    ],
    color: 'amber',
    gradient: 'from-amber-500 to-amber-600',
    stats: [
      { label: 'Skills Unlocked', value: '17', icon: Star },
      { label: 'Learning Streak', value: '12 days', icon: Timer },
      { label: 'Growth Rate', value: '+156%', icon: Target }
    ]
  },
  processor: {
    icon: Cpu,
    title: 'The Processor',
    tagline: 'Reliability is your foundation',
    description: 'You ensure systems run flawlessly. Stability and precision define your approach.',
    characteristics: [
      'System guardian',
      'Process perfectionist',
      'Reliability champion',
      'Quality enforcer'
    ],
    features: [
      {
        icon: Shield,
        title: 'System Health',
        description: 'Monitor everything, always'
      },
      {
        icon: Cpu,
        title: 'Process Control',
        description: 'Fine-tune every operation'
      },
      {
        icon: CheckCircle,
        title: 'Audit Trail',
        description: 'Complete compliance tracking'
      }
    ],
    color: 'gray',
    gradient: 'from-gray-500 to-gray-600',
    stats: [
      { label: 'System Uptime', value: '99.97%', icon: Shield },
      { label: 'Error Rate', value: '0.03%', icon: Target },
      { label: 'Compliance', value: '100%', icon: CheckCircle }
    ]
  }
};

interface PersonaRevealProps {
  persona: UserPersona;
  confidence: number;
  onContinue: () => void;
}

export function PersonaReveal({ persona, confidence, onContinue }: PersonaRevealProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const details = PERSONA_DETAILS[persona];
  const Icon = details.icon;

  useEffect(() => {
    // Trigger confetti
    const timer = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }, 500);

    // Animation sequence
    const steps = [
      setTimeout(() => setAnimationStep(1), 300),
      setTimeout(() => setAnimationStep(2), 1000),
      setTimeout(() => setAnimationStep(3), 1800),
      setTimeout(() => setShowDetails(true), 2500)
    ];

    return () => {
      clearTimeout(timer);
      steps.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Persona Reveal Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="text-center mb-12"
        >
          {/* Icon Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="inline-block mb-6"
          >
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${details.gradient} p-1`}>
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <Icon className="h-16 w-16 text-gray-700" />
              </div>
            </div>
          </motion.div>

          {/* Title Reveal */}
          <AnimatePresence>
            {animationStep >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <h1 className="text-4xl font-bold mb-2">{details.title}</h1>
                <p className="text-xl text-gray-600">{details.tagline}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confidence Badge */}
          <AnimatePresence>
            {animationStep >= 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-block"
              >
                <Badge className={`bg-gradient-to-r ${details.gradient} text-white px-6 py-2`}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {Math.round(confidence * 100)}% Match Confidence
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Detailed Information */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Description Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Profile</CardTitle>
                  <CardDescription className="text-base">
                    {details.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {details.characteristics.map((char, index) => (
                      <motion.div
                        key={char}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-2"
                      >
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{char}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {details.features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <feature.icon className={`h-12 w-12 mb-4 text-${details.color}-500`} />
                        <h3 className="font-semibold mb-2">{feature.title}</h3>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Stats Preview */}
              <Card className={`border-2 border-${details.color}-200`}>
                <CardHeader>
                  <CardTitle>Your Performance Preview</CardTitle>
                  <CardDescription>
                    Based on similar {details.title} users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-6">
                    {details.stats.map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="text-center"
                      >
                        <stat.icon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* CTA Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center"
              >
                <Button
                  size="lg"
                  className={`bg-gradient-to-r ${details.gradient} text-white hover:opacity-90`}
                  onClick={onContinue}
                >
                  Enter Your Personalized Dashboard
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <p className="text-sm text-gray-600 mt-4">
                  Your experience has been customized for maximum {
                    persona === 'streamliner' ? 'speed' :
                    persona === 'navigator' ? 'control' :
                    persona === 'hub' ? 'connectivity' :
                    persona === 'spring' ? 'growth' :
                    'reliability'
                  }
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}