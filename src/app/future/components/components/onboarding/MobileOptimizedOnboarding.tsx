'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  MoveHorizontal,
  Hand,
  Smartphone,
} from 'lucide-react';
import { useMobileGestures } from '@/hooks/useMobileGestures';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface MobileOptimizedOnboardingProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onPrevious?: () => void;
  onComplete?: () => void;
  showHint?: boolean;
}

export function MobileOptimizedOnboarding({
  children,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onComplete,
  showHint = true,
}: MobileOptimizedOnboardingProps) {
  const [showSwipeHint, setShowSwipeHint] = useState(showHint);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');

  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Mobile gestures
  const { isSwiping } = useMobileGestures({
    onSwipeLeft: () => {
      if (onNext && currentStep < totalSteps - 1) {
        setSwipeDirection('left');
        onNext();
      } else if (onComplete && currentStep === totalSteps - 1) {
        setSwipeDirection('left');
        onComplete();
      }
    },
    onSwipeRight: () => {
      if (onPrevious && currentStep > 0) {
        setSwipeDirection('right');
        onPrevious();
      }
    },
  });

  // Hide swipe hint after first interaction
  useEffect(() => {
    if (swipeDirection && showSwipeHint) {
      setShowSwipeHint(false);
      localStorage.setItem('onboarding-swipe-hint-shown', 'true');
    }
  }, [swipeDirection, showSwipeHint]);

  // Check if hint was already shown
  useEffect(() => {
    const hintShown = localStorage.getItem('onboarding-swipe-hint-shown');
    if (hintShown === 'true') {
      setShowSwipeHint(false);
    }
  }, []);

  // Pan gesture handling for more responsive feel
  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && onNext) {
      setSwipeDirection('left');
      onNext();
    } else if (info.offset.x > threshold && onPrevious && currentStep > 0) {
      setSwipeDirection('right');
      onPrevious();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 pb-20 md:pb-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar - Mobile Optimized */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {totalSteps}
            </span>
            {isMobile && (
              <Badge variant="secondary" className="text-xs">
                <Hand className="h-3 w-3 mr-1" />
                Swipe to navigate
              </Badge>
            )}
          </div>
          <Progress value={progress} className="h-2 md:h-3" />
        </div>

        {/* Swipe Hint Animation */}
        <AnimatePresence>
          {showSwipeHint && isMobile && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
            >
              <div className="flex items-center justify-center space-x-2">
                <MoveHorizontal className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-blue-800 font-medium">
                  Swipe left or right to navigate
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content - Swipeable */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            drag={isMobile ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            initial={{ 
              opacity: 0, 
              x: swipeDirection === 'left' ? 50 : swipeDirection === 'right' ? -50 : 0,
              scale: 0.95 
            }}
            animate={{ 
              opacity: 1, 
              x: 0,
              scale: 1 
            }}
            exit={{ 
              opacity: 0, 
              x: swipeDirection === 'left' ? -50 : swipeDirection === 'right' ? 50 : 0,
              scale: 0.95 
            }}
            transition={{ 
              duration: 0.3,
              ease: "easeInOut"
            }}
            className={`${isSwiping ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            {children}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls - Mobile Optimized */}
        {isMobile ? (
          // Mobile: Fixed bottom navigation
          <motion.div 
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="max-w-2xl mx-auto flex justify-between items-center">
              <Button
                variant="ghost"
                size="lg"
                onClick={onPrevious}
                disabled={currentStep === 0}
                className="touch-manipulation"
              >
                <ChevronLeft className="h-5 w-5" />
                Back
              </Button>

              <div className="flex space-x-1">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      index === currentStep 
                        ? 'bg-blue-600' 
                        : index < currentStep 
                        ? 'bg-blue-300' 
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="default"
                size="lg"
                onClick={() => {
                  if (currentStep === totalSteps - 1) {
                    onComplete?.();
                  } else {
                    onNext?.();
                  }
                }}
                className="touch-manipulation"
              >
                {currentStep === totalSteps - 1 ? 'Complete' : 'Next'}
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        ) : (
          // Desktop: Inline navigation
          <div className="mt-8 flex justify-between items-center">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex space-x-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-8 rounded-full transition-colors ${
                    index === currentStep 
                      ? 'bg-blue-600' 
                      : index < currentStep 
                      ? 'bg-blue-300' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <Button
              variant="default"
              onClick={() => {
                if (currentStep === totalSteps - 1) {
                  onComplete?.();
                } else {
                  onNext?.();
                }
              }}
            >
              {currentStep === totalSteps - 1 ? 'Complete' : 'Next'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Mobile optimization indicator */}
        {isTablet && !isMobile && (
          <div className="mt-4 text-center">
            <Badge variant="secondary" className="text-xs">
              <Smartphone className="h-3 w-3 mr-1" />
              Optimized for touch devices
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Question Card for Mobile
interface MobileQuestionCardProps {
  question: string;
  description?: string;
  children: React.ReactNode;
  badge?: string;
}

export function MobileQuestionCard({ 
  question, 
  description, 
  children, 
  badge 
}: MobileQuestionCardProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <Card className={`shadow-lg ${isMobile ? 'border-0' : ''}`}>
      <CardHeader className={isMobile ? 'pb-4' : ''}>
        {badge && (
          <Badge variant="secondary" className="mb-3 w-fit">
            {badge}
          </Badge>
        )}
        <CardTitle className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>
          {question}
        </CardTitle>
        {description && (
          <CardDescription className={`${isMobile ? 'text-sm mt-2' : 'text-base mt-3'}`}>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={isMobile ? 'pt-0' : ''}>
        {children}
      </CardContent>
    </Card>
  );
}

// Touch-optimized Radio Option
interface TouchRadioOptionProps {
  value: string;
  label: string;
  subtext?: string;
  selected: boolean;
  onSelect: (value: string) => void;
}

export function TouchRadioOption({ 
  value, 
  label, 
  subtext, 
  selected, 
  onSelect 
}: TouchRadioOptionProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(value)}
      className={`
        w-full text-left p-4 rounded-lg border-2 transition-all
        touch-manipulation
        ${selected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }
        ${isMobile ? 'active:scale-95' : ''}
      `}
    >
      <div className="flex items-start space-x-3">
        <div className={`
          w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5
          ${selected 
            ? 'border-blue-500 bg-blue-500' 
            : 'border-gray-400'
          }
        `}>
          {selected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-full h-full rounded-full bg-white scale-50"
            />
          )}
        </div>
        <div className="flex-1">
          <p className={`font-medium ${isMobile ? 'text-base' : 'text-lg'}`}>
            {label}
          </p>
          {subtext && (
            <p className={`text-gray-600 mt-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
              {subtext}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
}