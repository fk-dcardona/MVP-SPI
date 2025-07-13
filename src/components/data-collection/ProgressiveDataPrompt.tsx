'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign,
  FileSpreadsheet,
  Sparkles,
  ChevronRight,
  Trophy,
  Target,
  Zap,
  Star,
  Lock,
  CheckCircle2
} from 'lucide-react'

interface DataLevel {
  level: number
  name: string
  icon: React.ReactNode
  description: string
  dataTypes: string[]
  unlockedFeatures: string[]
  requiredData: string[]
  estimatedTime: string
  valueScore: number
}

interface UserDataStatus {
  hasInventory: boolean
  hasSales: boolean
  hasSuppliers: boolean
  hasFinancials: boolean
  hasCustomers: boolean
  completionPercentage: number
  currentLevel: number
  unlockedInsights: number
  potentialInsights: number
}

const DATA_LEVELS: DataLevel[] = [
  {
    level: 1,
    name: 'Basic Insights',
    icon: <TrendingUp className="h-5 w-5" />,
    description: 'Stock analysis and ROI calculations',
    dataTypes: ['Inventory', 'Sales'],
    unlockedFeatures: [
      'Stock vs Sales Analysis',
      'Product ROI Rankings', 
      'Low Stock Alerts',
      'Inventory Turnover'
    ],
    requiredData: ['inventory.csv', 'sales.csv'],
    estimatedTime: '2 minutes',
    valueScore: 3
  },
  {
    level: 2,
    name: 'Supplier Intelligence',
    icon: <Users className="h-5 w-5" />,
    description: 'Lead time optimization and supplier scorecards',
    dataTypes: ['Suppliers', 'Purchase Orders'],
    unlockedFeatures: [
      'Supplier Scorecards',
      'Lead Time Analysis',
      'Reorder Point Optimization',
      'Price Trend Analysis'
    ],
    requiredData: ['suppliers.csv', 'purchase_orders.csv'],
    estimatedTime: '5 minutes',
    valueScore: 4
  },
  {
    level: 3,
    name: 'Financial Mastery',
    icon: <DollarSign className="h-5 w-5" />,
    description: 'Cash flow predictions and working capital optimization',
    dataTypes: ['Payments', 'Banking'],
    unlockedFeatures: [
      'Cash Flow Forecasting',
      'Working Capital Dashboard',
      'Payment Scheduling',
      'Currency Risk Analysis'
    ],
    requiredData: ['payments.csv', 'bank_statements.csv'],
    estimatedTime: '10 minutes',
    valueScore: 5
  },
  {
    level: 4,
    name: 'Predictive Analytics',
    icon: <Sparkles className="h-5 w-5" />,
    description: 'AI-powered forecasting and optimization',
    dataTypes: ['Customers', 'Historical Data'],
    unlockedFeatures: [
      'Demand Forecasting',
      'Customer Lifetime Value',
      'Seasonal Planning',
      'Network Optimization'
    ],
    requiredData: ['customers.csv', '12_months_history.csv'],
    estimatedTime: '15 minutes',
    valueScore: 5
  }
]

const ACHIEVEMENTS = [
  { id: 'first_insight', name: 'First Insight', icon: '🏆', description: 'Upload your first dataset' },
  { id: 'optimizer', name: 'Optimizer', icon: '🎯', description: 'Reduce overstock by 20%' },
  { id: 'fast_mover', name: 'Fast Mover', icon: '🚀', description: 'Identify 5 fast-moving SKUs' },
  { id: 'premium', name: 'Premium Analyst', icon: '💎', description: 'Reach Level 3' },
  { id: 'pioneer', name: 'Network Pioneer', icon: '🌟', description: 'Share 10 insights' }
]

interface ProgressiveDataPromptProps {
  userDataStatus: UserDataStatus
  onDataTypeClick: (dataType: string) => void
}

export function ProgressiveDataPrompt({ 
  userDataStatus, 
  onDataTypeClick 
}: ProgressiveDataPromptProps) {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null)
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(['first_insight'])
  
  const currentLevel = DATA_LEVELS[userDataStatus.currentLevel - 1]
  const nextLevel = DATA_LEVELS[userDataStatus.currentLevel] || null

  // Calculate value preview
  const potentialValue = nextLevel 
    ? userDataStatus.unlockedInsights * (nextLevel.valueScore / currentLevel.valueScore)
    : userDataStatus.unlockedInsights

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Your Data Journey</h3>
              <p className="text-sm text-muted-foreground">
                Level {userDataStatus.currentLevel} of 4 - {currentLevel.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{userDataStatus.unlockedInsights}</p>
              <p className="text-sm text-muted-foreground">Insights unlocked</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{userDataStatus.completionPercentage}%</span>
            </div>
            <Progress value={userDataStatus.completionPercentage} className="h-2" />
          </div>

          {/* Achievements */}
          <div className="flex gap-2 flex-wrap">
            {ACHIEVEMENTS.map(achievement => (
              <div
                key={achievement.id}
                className={`text-2xl ${
                  unlockedAchievements.includes(achievement.id) 
                    ? 'opacity-100' 
                    : 'opacity-20 grayscale'
                }`}
                title={achievement.description}
              >
                {achievement.icon}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Next Level Prompt */}
      {nextLevel && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                {nextLevel.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Unlock {nextLevel.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {nextLevel.description}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <Badge variant="secondary" className="text-xs">
                    {nextLevel.estimatedTime} to setup
                  </Badge>
                  <span className="text-sm text-green-600 font-medium">
                    +{Math.round(potentialValue - userDataStatus.unlockedInsights)} new insights
                  </span>
                </div>
              </div>
              <Button onClick={() => setExpandedLevel(nextLevel.level)}>
                Get Started
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Value Preview */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {nextLevel.unlockedFeatures.slice(0, 2).map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Data Levels */}
      <div className="space-y-3">
        {DATA_LEVELS.map((level) => {
          const isUnlocked = level.level <= userDataStatus.currentLevel
          const isNext = level.level === userDataStatus.currentLevel + 1
          const isExpanded = expandedLevel === level.level

          return (
            <Card 
              key={level.level}
              className={`p-4 transition-all cursor-pointer ${
                isNext ? 'ring-2 ring-primary' : ''
              } ${!isUnlocked && !isNext ? 'opacity-50' : ''}`}
              onClick={() => setExpandedLevel(isExpanded ? null : level.level)}
            >
              <div className="space-y-3">
                {/* Level Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isUnlocked ? 'bg-primary/10' : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      {isUnlocked ? level.icon : <Lock className="h-5 w-5 text-gray-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">Level {level.level}: {level.name}</h4>
                        {isUnlocked && <Badge variant="secondary" className="text-xs">Unlocked</Badge>}
                        {isNext && <Badge className="text-xs">Recommended</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{level.description}</p>
                    </div>
                  </div>
                  <ChevronRight className={`h-5 w-5 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`} />
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="space-y-3 pt-3 border-t">
                    {/* Required Data */}
                    <div>
                      <p className="text-sm font-medium mb-2">Required Data:</p>
                      <div className="flex gap-2 flex-wrap">
                        {level.dataTypes.map(dataType => (
                          <Button
                            key={dataType}
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDataTypeClick(dataType)
                            }}
                            className="text-xs"
                          >
                            <FileSpreadsheet className="h-3 w-3 mr-1" />
                            {dataType}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Unlocked Features */}
                    <div>
                      <p className="text-sm font-medium mb-2">What you'll unlock:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {level.unlockedFeatures.map((feature, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Value Indicators */}
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-1">
                        <Zap className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">Setup: {level.estimatedTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Value Score: {level.valueScore}/5</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Call to Action */}
      <Card className="p-6 text-center bg-gradient-to-r from-primary/5 to-primary/10">
        <Trophy className="h-8 w-8 mx-auto mb-3 text-primary" />
        <h3 className="font-semibold mb-2">
          {userDataStatus.currentLevel < 4 
            ? `You're ${100 - userDataStatus.completionPercentage}% away from full insights!`
            : 'Congratulations! You\'ve unlocked all insights!'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {userDataStatus.currentLevel < 4
            ? 'Each data type you add multiplies the value you get from the platform'
            : 'Keep your data updated to maintain accurate insights'}
        </p>
        <Button onClick={() => onDataTypeClick('next')}>
          {userDataStatus.currentLevel < 4 ? 'Continue Journey' : 'Explore Insights'}
        </Button>
      </Card>
    </div>
  )
}