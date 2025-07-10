'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  Users,
  Shield,
  Settings,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Zap,
  Target,
  HelpCircle,
  Play,
  FileUp,
  Building,
  User,
  Package,
  TrendingUp,
  BarChart3,
  FileText,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  content: React.ReactNode;
  isComplete?: boolean;
}

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showWizard, setShowWizard] = useState(true);

  // Check if user has completed onboarding
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('spring-onboarding-complete');
    if (hasCompletedOnboarding === 'true') {
      setShowWizard(false);
    }
  }, []);

  const handleAnswer = (key: string, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const markStepComplete = (stepId: string) => {
    setCompletedSteps(prev => [...prev, stepId]);
  };

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Finkargo Analytics!',
      description: 'Let\'s get you started on your supply chain journey',
      icon: Sparkles,
      content: (
        <div className="space-y-6">
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Welcome aboard! 🎉</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We're excited to help you transform your supply chain data into strategic insights. 
              This quick setup will personalize your experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="pt-6 text-center">
                <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="font-medium">Personalized Setup</p>
                <p className="text-sm text-muted-foreground">Tailored to your needs</p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-6 text-center">
                <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-medium">5 Minutes</p>
                <p className="text-sm text-muted-foreground">Quick and easy</p>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="pt-6 text-center">
                <BookOpen className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="font-medium">Learning Path</p>
                <p className="text-sm text-muted-foreground">Resources included</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      id: 'role',
      title: 'Your Role',
      description: 'Help us understand your position',
      icon: User,
      content: (
        <div className="space-y-6">
          <RadioGroup
            value={answers.role}
            onValueChange={(value) => handleAnswer('role', value)}
          >
            <div className="space-y-3">
              <Label
                htmlFor="analyst"
                className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
              >
                <RadioGroupItem value="analyst" id="analyst" />
                <div className="flex-1">
                  <p className="font-medium">Data Analyst</p>
                  <p className="text-sm text-muted-foreground">I analyze data and create reports</p>
                </div>
              </Label>
              
              <Label
                htmlFor="manager"
                className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
              >
                <RadioGroupItem value="manager" id="manager" />
                <div className="flex-1">
                  <p className="font-medium">Supply Chain Manager</p>
                  <p className="text-sm text-muted-foreground">I oversee operations and make decisions</p>
                </div>
              </Label>
              
              <Label
                htmlFor="executive"
                className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
              >
                <RadioGroupItem value="executive" id="executive" />
                <div className="flex-1">
                  <p className="font-medium">Executive</p>
                  <p className="text-sm text-muted-foreground">I need high-level insights and KPIs</p>
                </div>
              </Label>
              
              <Label
                htmlFor="other"
                className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
              >
                <RadioGroupItem value="other" id="other" />
                <div className="flex-1">
                  <p className="font-medium">Other</p>
                  <p className="text-sm text-muted-foreground">I have a different role</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
          
          {answers.role === 'other' && (
            <Input
              placeholder="Please specify your role"
              value={answers.customRole || ''}
              onChange={(e) => handleAnswer('customRole', e.target.value)}
            />
          )}
        </div>
      ),
    },
    {
      id: 'company',
      title: 'Company Setup',
      description: 'Tell us about your organization',
      icon: Building,
      content: (
        <div className="space-y-6">
          <div>
            <Label htmlFor="company-size">Company Size</Label>
            <RadioGroup
              value={answers.companySize}
              onValueChange={(value) => handleAnswer('companySize', value)}
              className="mt-2"
            >
              <div className="grid grid-cols-2 gap-3">
                <Label
                  htmlFor="small"
                  className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                >
                  <RadioGroupItem value="small" id="small" />
                  <span>1-50 employees</span>
                </Label>
                <Label
                  htmlFor="medium"
                  className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                >
                  <RadioGroupItem value="medium" id="medium" />
                  <span>51-200 employees</span>
                </Label>
                <Label
                  htmlFor="large"
                  className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                >
                  <RadioGroupItem value="large" id="large" />
                  <span>201-1000 employees</span>
                </Label>
                <Label
                  htmlFor="enterprise"
                  className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                >
                  <RadioGroupItem value="enterprise" id="enterprise" />
                  <span>1000+ employees</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div>
            <Label htmlFor="industry">Industry</Label>
            <RadioGroup
              value={answers.industry}
              onValueChange={(value) => handleAnswer('industry', value)}
              className="mt-2"
            >
              <div className="space-y-2">
                <Label
                  htmlFor="retail"
                  className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                >
                  <RadioGroupItem value="retail" id="retail" />
                  <span>Retail & E-commerce</span>
                </Label>
                <Label
                  htmlFor="manufacturing"
                  className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                >
                  <RadioGroupItem value="manufacturing" id="manufacturing" />
                  <span>Manufacturing</span>
                </Label>
                <Label
                  htmlFor="distribution"
                  className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                >
                  <RadioGroupItem value="distribution" id="distribution" />
                  <span>Distribution & Logistics</span>
                </Label>
                <Label
                  htmlFor="other-industry"
                  className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                >
                  <RadioGroupItem value="other-industry" id="other-industry" />
                  <span>Other</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      ),
    },
    {
      id: 'goals',
      title: 'Your Goals',
      description: 'What would you like to achieve?',
      icon: Target,
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">Select all that apply to personalize your experience:</p>
          
          <div className="space-y-3">
            {[
              { id: 'inventory', label: 'Optimize inventory levels', icon: Package },
              { id: 'costs', label: 'Reduce operational costs', icon: TrendingUp },
              { id: 'visibility', label: 'Improve supply chain visibility', icon: Shield },
              { id: 'forecasting', label: 'Better demand forecasting', icon: BarChart3 },
              { id: 'compliance', label: 'Ensure compliance and reporting', icon: FileText },
              { id: 'automation', label: 'Automate manual processes', icon: Zap },
            ].map((goal) => (
              <Label
                key={goal.id}
                className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  checked={answers.goals?.[goal.id] || false}
                  onChange={(e) => handleAnswer('goals', {
                    ...answers.goals,
                    [goal.id]: e.target.checked,
                  })}
                  className="w-4 h-4"
                />
                <goal.icon className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1">{goal.label}</span>
              </Label>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'first-upload',
      title: 'Your First Data Upload',
      description: 'Let\'s import your data to get started',
      icon: FileUp,
      content: (
        <div className="space-y-6">
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Upload className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ready to upload your first file?</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Upload your inventory or sales data in CSV format. We'll help you map the columns and validate the data.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-32 flex-col gap-2"
              onClick={() => {
                markStepComplete('first-upload');
                router.push('/dashboard/upload?type=inventory&onboarding=true');
              }}
            >
              <Package className="h-8 w-8" />
              <span>Upload Inventory Data</span>
              <span className="text-xs text-muted-foreground">Stock levels, SKUs, locations</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-32 flex-col gap-2"
              onClick={() => {
                markStepComplete('first-upload');
                router.push('/dashboard/upload?type=sales&onboarding=true');
              }}
            >
              <TrendingUp className="h-8 w-8" />
              <span>Upload Sales Data</span>
              <span className="text-xs text-muted-foreground">Transactions, orders, revenue</span>
            </Button>
          </div>
          
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => {
                markStepComplete('first-upload');
                setCurrentStep(currentStep + 1);
              }}
            >
              I'll upload later
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Your personalized dashboard is ready',
      icon: CheckCircle2,
      content: (
        <div className="space-y-6">
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Welcome to Finkargo Analytics! 🎊</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your dashboard has been personalized based on your preferences. 
              Here are some resources to help you get the most out of the platform:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.open('/docs/getting-started', '_blank')}>
              <CardContent className="pt-6">
                <BookOpen className="h-8 w-8 text-blue-600 mb-2" />
                <h4 className="font-medium mb-1">Getting Started Guide</h4>
                <p className="text-sm text-muted-foreground">Learn the basics in 10 minutes</p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.open('/docs/video-tutorials', '_blank')}>
              <CardContent className="pt-6">
                <Play className="h-8 w-8 text-purple-600 mb-2" />
                <h4 className="font-medium mb-1">Video Tutorials</h4>
                <p className="text-sm text-muted-foreground">Watch step-by-step walkthroughs</p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => toast({ title: 'Opening support chat...', description: 'A team member will assist you shortly.' })}>
              <CardContent className="pt-6">
                <HelpCircle className="h-8 w-8 text-green-600 mb-2" />
                <h4 className="font-medium mb-1">Live Support</h4>
                <p className="text-sm text-muted-foreground">Chat with our experts</p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/settings')}>
              <CardContent className="pt-6">
                <Settings className="h-8 w-8 text-amber-600 mb-2" />
                <h4 className="font-medium mb-1">Customize Settings</h4>
                <p className="text-sm text-muted-foreground">Fine-tune your experience</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Pro Tip:</strong> Press <kbd className="px-2 py-1 bg-white rounded text-xs">⌘K</kbd> anytime to use the command palette for quick navigation!
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      markStepComplete(steps[currentStep].id);
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      localStorage.setItem('spring-onboarding-complete', 'true');
      localStorage.setItem('spring-onboarding-answers', JSON.stringify(answers));
      toast({
        title: 'Onboarding Complete!',
        description: 'Your personalized dashboard is ready.',
      });
      router.push('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('spring-onboarding-complete', 'true');
    toast({
      title: 'Onboarding Skipped',
      description: 'You can always access help from the menu.',
    });
    router.push('/dashboard');
  };

  if (!showWizard) {
    return null;
  }

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary">Step {currentStep + 1} of {steps.length}</Badge>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip Onboarding
            </Button>
          </div>
          <Progress value={progress} className="mb-4" />
          <div className="flex items-center gap-3">
            <currentStepData.icon className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>{currentStepData.title}</CardTitle>
              <CardDescription>{currentStepData.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {currentStepData.content}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <Button onClick={handleNext}>
            {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}