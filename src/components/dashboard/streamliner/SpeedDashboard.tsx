'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Zap,
  Clock,
  TrendingUp,
  Target,
  Trophy,
  Timer,
  Gauge,
  ChevronUp,
  ChevronDown,
  Flame,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SpeedMetric {
  label: string;
  value: number;
  unit: string;
  change: number;
  target: number;
  icon: any;
  color: string;
}

interface SpeedAchievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  unlocked: boolean;
  progress: number;
  target: number;
}

export function SpeedDashboard() {
  const [timesSaved, setTimesSaved] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(7);
  const [speedRank, setSpeedRank] = useState(2);
  const [isAnimating, setIsAnimating] = useState(true);

  // Animate time saved counter
  useEffect(() => {
    const interval = setInterval(() => {
      setTimesSaved(prev => prev + Math.random() * 0.5);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const speedMetrics: SpeedMetric[] = [
    {
      label: 'Average Process Time',
      value: 47,
      unit: 'min',
      change: -23,
      target: 45,
      icon: Clock,
      color: 'blue',
    },
    {
      label: 'Tasks Completed Today',
      value: 24,
      unit: 'tasks',
      change: 12,
      target: 20,
      icon: Target,
      color: 'green',
    },
    {
      label: 'Speed Score',
      value: 92,
      unit: 'pts',
      change: 8,
      target: 90,
      icon: Gauge,
      color: 'purple',
    },
    {
      label: 'Time Saved This Week',
      value: 8.3,
      unit: 'hrs',
      change: 15,
      target: 6,
      icon: Timer,
      color: 'amber',
    },
  ];

  const achievements: SpeedAchievement[] = [
    {
      id: 'speed-demon',
      title: 'Speed Demon',
      description: 'Complete 50 tasks under 30 minutes',
      icon: Flame,
      unlocked: true,
      progress: 50,
      target: 50,
    },
    {
      id: 'lightning-fast',
      title: 'Lightning Fast',
      description: 'Maintain sub-1hr average for a week',
      icon: Lightning,
      unlocked: true,
      progress: 7,
      target: 7,
    },
    {
      id: 'time-traveler',
      title: 'Time Traveler',
      description: 'Save 100 hours total',
      icon: Clock,
      unlocked: false,
      progress: 73,
      target: 100,
    },
    {
      id: 'champion',
      title: 'Speed Champion',
      description: 'Reach #1 speed ranking',
      icon: Trophy,
      unlocked: false,
      progress: 2,
      target: 1,
    },
  ];

  const recentSpeedWins = [
    { task: 'CSV Upload', time: '2 min', improvement: '-85%', timestamp: '2 minutes ago' },
    { task: 'Inventory Update', time: '45 sec', improvement: '-92%', timestamp: '15 minutes ago' },
    { task: 'Report Generation', time: '3 min', improvement: '-78%', timestamp: '1 hour ago' },
    { task: 'Supplier Payment', time: '90 sec', improvement: '-88%', timestamp: '2 hours ago' },
  ];

  return (
    <div className="space-y-6">
      {/* Speed Hero Section */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Zap className="h-32 w-32" />
        </div>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Zap className="h-6 w-6 text-blue-600" />
                Your Speed Dashboard
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Time is money. Every second counts.
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {timesSaved.toFixed(1)} hrs
              </div>
              <p className="text-sm text-muted-foreground">saved this month</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/80 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Speed Rank</span>
                <Trophy className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold">#{speedRank}</div>
              <p className="text-xs text-muted-foreground">out of 1,247 users</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Current Streak</span>
                <Flame className="h-4 w-4 text-orange-500" />
              </div>
              <div className="text-2xl font-bold">{currentStreak} days</div>
              <p className="text-xs text-muted-foreground">beating targets</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Efficiency Gain</span>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold">+43%</div>
              <p className="text-xs text-muted-foreground">vs last month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Speed Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {speedMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold">{metric.value}</span>
                      <span className="text-sm text-muted-foreground">{metric.unit}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <div className={cn(
                        "flex items-center gap-1 text-xs font-medium",
                        metric.change > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {metric.change > 0 ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                        {Math.abs(metric.change)}%
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Target: {metric.target}
                      </span>
                    </div>
                  </div>
                  
                  <div className={cn(
                    "p-3 rounded-full",
                    metric.color === 'blue' && "bg-blue-100",
                    metric.color === 'green' && "bg-green-100",
                    metric.color === 'purple' && "bg-purple-100",
                    metric.color === 'amber' && "bg-amber-100"
                  )}>
                    <metric.icon className={cn(
                      "h-5 w-5",
                      metric.color === 'blue' && "text-blue-600",
                      metric.color === 'green' && "text-green-600",
                      metric.color === 'purple' && "text-purple-600",
                      metric.color === 'amber' && "text-amber-600"
                    )} />
                  </div>
                </div>
                
                <Progress 
                  value={(metric.value / metric.target) * 100} 
                  className="h-1 mt-4"
                />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Speed Wins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightning className="h-5 w-5 text-amber-500" />
              Recent Speed Wins
            </CardTitle>
            <CardDescription>
              Your fastest completions today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSpeedWins.map((win, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{win.task}</p>
                      <p className="text-xs text-muted-foreground">{win.timestamp}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{win.time}</p>
                    <p className="text-xs text-green-600">{win.improvement}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              Speed Achievements
            </CardTitle>
            <CardDescription>
              Unlock rewards by maintaining your speed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    achievement.unlocked
                      ? "bg-purple-50 border-purple-200"
                      : "bg-gray-50 border-gray-200 opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      achievement.unlocked
                        ? "bg-purple-100"
                        : "bg-gray-200"
                    )}>
                      <achievement.icon className={cn(
                        "h-5 w-5",
                        achievement.unlocked
                          ? "text-purple-600"
                          : "text-gray-500"
                      )} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{achievement.title}</p>
                        {achievement.unlocked && (
                          <Badge variant="secondary" className="text-xs">
                            Unlocked
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {achievement.description}
                      </p>
                      {!achievement.unlocked && (
                        <div className="mt-2">
                          <Progress
                            value={(achievement.progress / achievement.target) * 100}
                            className="h-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {achievement.progress}/{achievement.target}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Keep up the momentum!</h3>
              <p className="text-sm opacity-90 mt-1">
                You're 3 tasks away from beating your daily record
              </p>
            </div>
            <Button variant="secondary" className="gap-2">
              <Zap className="h-4 w-4" />
              Quick Upload
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}