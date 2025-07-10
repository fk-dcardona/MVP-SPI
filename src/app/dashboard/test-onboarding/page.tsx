'use client';

import { OnboardingWizard } from '@/components/spring/OnboardingWizard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { CheckCircle, Circle, RefreshCw } from 'lucide-react';

export default function TestOnboardingPage() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState<any>({});
  
  const checkOnboardingData = () => {
    const complete = localStorage.getItem('spring-onboarding-complete');
    const answers = localStorage.getItem('spring-onboarding-answers');
    const steps = localStorage.getItem('spring-onboarding-steps');
    
    setOnboardingData({
      complete: complete === 'true',
      answers: answers ? JSON.parse(answers) : null,
      steps: steps ? JSON.parse(steps) : null,
    });
  };

  useEffect(() => {
    checkOnboardingData();
  }, []);

  const resetOnboarding = () => {
    localStorage.removeItem('spring-onboarding-complete');
    localStorage.removeItem('spring-onboarding-answers');
    localStorage.removeItem('spring-onboarding-steps');
    checkOnboardingData();
  };

  const steps = [
    { id: 'welcome', title: 'Welcome' },
    { id: 'role', title: 'Your Role' },
    { id: 'company', title: 'Company Setup' },
    { id: 'goals', title: 'Your Goals' },
    { id: 'first-upload', title: 'First Upload' },
    { id: 'complete', title: 'Complete' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Spring User Onboarding Test</CardTitle>
            <CardDescription>
              Test the guided onboarding wizard for new users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Test Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click &quot;Start Onboarding&quot; to begin the wizard</li>
                <li>Complete each step by providing information</li>
                <li>Test navigation between steps</li>
                <li>Check progress persistence in localStorage</li>
                <li>Verify completion tracking</li>
                <li>Test skipping optional steps</li>
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div>
                <h4 className="font-medium mb-2">Expected Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>6-step onboarding flow</li>
                  <li>Progress tracking with visual indicators</li>
                  <li>Form validation on required fields</li>
                  <li>Answers saved to localStorage</li>
                  <li>Resume from last incomplete step</li>
                  <li>Completion celebration</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Current Status:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={onboardingData.complete ? 'default' : 'secondary'}>
                      {onboardingData.complete ? 'Completed' : 'Not Completed'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    {steps.map(step => {
                      const isComplete = onboardingData.steps?.[step.id] || false;
                      return (
                        <div key={step.id} className="flex items-center gap-2 text-sm">
                          {isComplete ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className={isComplete ? 'font-medium' : 'text-gray-500'}>
                            {step.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => setShowOnboarding(true)}
                size="lg"
                className="flex-1"
              >
                Start Onboarding
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  resetOnboarding();
                  setShowOnboarding(true);
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset & Start
              </Button>
            </div>
          </CardContent>
        </Card>

        {onboardingData.answers && (
          <Card>
            <CardHeader>
              <CardTitle>Saved Answers</CardTitle>
              <CardDescription>
                User responses from the onboarding process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-gray-100 p-4 rounded-lg overflow-auto">
                {JSON.stringify(onboardingData.answers, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Onboarding Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1">1. Welcome</h4>
                <p className="text-sm text-blue-700">Introduction and overview of the setup process</p>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-1">2. Your Role</h4>
                <p className="text-sm text-green-700">Select from: Manager, Analyst, Executive, Operations, Other</p>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-1">3. Company Setup</h4>
                <p className="text-sm text-purple-700">Company size and industry selection</p>
              </div>
              
              <div className="p-3 bg-amber-50 rounded-lg">
                <h4 className="font-medium text-amber-900 mb-1">4. Your Goals</h4>
                <p className="text-sm text-amber-700">Select primary objectives for using the platform</p>
              </div>
              
              <div className="p-3 bg-indigo-50 rounded-lg">
                <h4 className="font-medium text-indigo-900 mb-1">5. First Upload</h4>
                <p className="text-sm text-indigo-700">Option to upload first data file or skip</p>
              </div>
              
              <div className="p-3 bg-pink-50 rounded-lg">
                <h4 className="font-medium text-pink-900 mb-1">6. Complete</h4>
                <p className="text-sm text-pink-700">Celebration and next steps guidance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showOnboarding && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <OnboardingWizard />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => {
                setShowOnboarding(false);
                checkOnboardingData();
              }}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}