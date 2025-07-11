'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Target,
  Zap,
  Star,
  Lock,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Award,
  Sparkles,
  Flame,
  Gift,
  Users,
  BarChart3,
  Clock,
  ChevronRight,
  PartyPopper,
  Rocket,
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  points: number;
  progress: number;
  target: number;
  unlocked: boolean;
  unlockedAt?: Date;
  category: 'basics' | 'intermediate' | 'advanced' | 'special';
  rewards: string[];
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  modules: {
    id: string;
    title: string;
    duration: string;
    completed: boolean;
    locked: boolean;
  }[];
  progress: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  points: number;
  level: number;
  trend: 'up' | 'down' | 'same';
}

export function ProgressTracking() {
  const [userPoints, setUserPoints] = useState(2450);
  const [userLevel, setUserLevel] = useState(7);
  const [streak, setStreak] = useState(5);
  const [showCelebration, setShowCelebration] = useState(false);

  const achievements: Achievement[] = [
    {
      id: 'first-upload',
      title: 'First Steps',
      description: 'Upload your first CSV file',
      icon: Sparkles,
      points: 100,
      progress: 1,
      target: 1,
      unlocked: true,
      unlockedAt: new Date('2024-01-15'),
      category: 'basics',
      rewards: ['Quick Upload Button', '100 XP'],
    },
    {
      id: 'data-master',
      title: 'Data Master',
      description: 'Process 10,000 inventory records',
      icon: BarChart3,
      points: 500,
      progress: 7842,
      target: 10000,
      unlocked: false,
      category: 'intermediate',
      rewards: ['Advanced Analytics Access', '500 XP'],
    },
    {
      id: 'speed-demon',
      title: 'Speed Demon',
      description: 'Complete 10 tasks in under 5 minutes each',
      icon: Zap,
      points: 300,
      progress: 8,
      target: 10,
      unlocked: false,
      category: 'intermediate',
      rewards: ['Speed Mode Toggle', '300 XP'],
    },
    {
      id: 'team-player',
      title: 'Team Player',
      description: 'Invite 3 team members',
      icon: Users,
      points: 250,
      progress: 1,
      target: 3,
      unlocked: false,
      category: 'basics',
      rewards: ['Team Dashboard', '250 XP'],
    },
    {
      id: 'supply-chain-pro',
      title: 'Supply Chain Pro',
      description: 'Achieve 90%+ efficiency score',
      icon: Trophy,
      points: 1000,
      progress: 0,
      target: 1,
      unlocked: false,
      category: 'advanced',
      rewards: ['Pro Badge', 'Custom Reports', '1000 XP'],
    },
    {
      id: 'early-bird',
      title: 'Early Bird',
      description: 'Log in before 6 AM',
      icon: Clock,
      points: 150,
      progress: 1,
      target: 1,
      unlocked: true,
      unlockedAt: new Date('2024-01-20'),
      category: 'special',
      rewards: ['Morning Theme', '150 XP'],
    },
  ];

  const learningPaths: LearningPath[] = [
    {
      id: 'getting-started',
      title: 'Getting Started with Supply Chain Analytics',
      description: 'Learn the basics of inventory management and data analysis',
      progress: 75,
      modules: [
        { id: 'm1', title: 'Introduction to Dashboard', duration: '5 min', completed: true, locked: false },
        { id: 'm2', title: 'Uploading Your First CSV', duration: '10 min', completed: true, locked: false },
        { id: 'm3', title: 'Understanding Metrics', duration: '15 min', completed: true, locked: false },
        { id: 'm4', title: 'Creating Your First Report', duration: '20 min', completed: false, locked: false },
      ],
    },
    {
      id: 'advanced-analytics',
      title: 'Advanced Analytics Mastery',
      description: 'Deep dive into predictive analytics and optimization',
      progress: 30,
      modules: [
        { id: 'a1', title: 'Supply Chain Triangle Theory', duration: '25 min', completed: true, locked: false },
        { id: 'a2', title: 'Predictive Models', duration: '30 min', completed: false, locked: false },
        { id: 'a3', title: 'Cost Optimization', duration: '35 min', completed: false, locked: true },
        { id: 'a4', title: 'Advanced Reporting', duration: '40 min', completed: false, locked: true },
      ],
    },
  ];

  const leaderboard: LeaderboardEntry[] = [
    { rank: 1, name: 'Sarah Chen', avatar: '👩‍💼', points: 4580, level: 12, trend: 'same' },
    { rank: 2, name: 'Miguel Rodriguez', avatar: '👨‍💻', points: 3920, level: 10, trend: 'up' },
    { rank: 3, name: 'You', avatar: '🌟', points: 2450, level: 7, trend: 'up' },
    { rank: 4, name: 'Emma Wilson', avatar: '👩‍🔬', points: 2380, level: 7, trend: 'down' },
    { rank: 5, name: 'James Park', avatar: '👨‍💼', points: 2150, level: 6, trend: 'same' },
  ];

  const calculateLevelProgress = () => {
    const pointsInCurrentLevel = userPoints % 500;
    return (pointsInCurrentLevel / 500) * 100;
  };

  const unlockAchievement = (achievementId: string) => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
    // In real app, would update backend
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview Hero */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
              <Rocket className="h-6 w-6" />
              Your Learning Journey
            </h2>
            <p className="text-amber-700 mt-1">
              Track your progress, unlock achievements, and master supply chain analytics!
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-2">
              <div>
                <div className="text-3xl font-bold text-amber-900">Level {userLevel}</div>
                <div className="text-sm text-amber-700">{userPoints} XP</div>
              </div>
              <div className="text-4xl">{userLevel < 5 ? '🌱' : userLevel < 10 ? '🌿' : '🌳'}</div>
            </div>
            <Progress value={calculateLevelProgress()} className="mt-2 w-32" />
          </div>
        </div>

        {/* Streak Counter */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="font-semibold">{streak} day streak!</span>
          </div>
          <div className="text-sm text-amber-700">
            Keep it up! Next milestone at 7 days 🎯
          </div>
        </div>
      </div>

      <Tabs defaultValue="achievements" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="learning">Learning Paths</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="space-y-6">
          {/* Achievement Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl mb-1">🎯</div>
                <p className="font-semibold">Basics</p>
                <p className="text-sm text-gray-600">
                  {achievements.filter(a => a.category === 'basics' && a.unlocked).length}/
                  {achievements.filter(a => a.category === 'basics').length} Complete
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl mb-1">⚡</div>
                <p className="font-semibold">Intermediate</p>
                <p className="text-sm text-gray-600">
                  {achievements.filter(a => a.category === 'intermediate' && a.unlocked).length}/
                  {achievements.filter(a => a.category === 'intermediate').length} Complete
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl mb-1">🏆</div>
                <p className="font-semibold">Advanced</p>
                <p className="text-sm text-gray-600">
                  {achievements.filter(a => a.category === 'advanced' && a.unlocked).length}/
                  {achievements.filter(a => a.category === 'advanced').length} Complete
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl mb-1">✨</div>
                <p className="font-semibold">Special</p>
                <p className="text-sm text-gray-600">
                  {achievements.filter(a => a.category === 'special' && a.unlocked).length}/
                  {achievements.filter(a => a.category === 'special').length} Complete
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Achievement List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                whileHover={{ scale: 1.02 }}
                className={`${achievement.unlocked ? '' : 'opacity-75'}`}
              >
                <Card className={achievement.unlocked ? 'border-amber-200 bg-amber-50/50' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full ${
                        achievement.unlocked ? 'bg-amber-100' : 'bg-gray-100'
                      }`}>
                        {achievement.unlocked ? (
                          <achievement.icon className="h-6 w-6 text-amber-600" />
                        ) : (
                          <Lock className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold">{achievement.title}</h4>
                          <Badge variant={achievement.unlocked ? 'default' : 'secondary'}>
                            {achievement.points} XP
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                        
                        {!achievement.unlocked && (
                          <>
                            <Progress 
                              value={(achievement.progress / achievement.target) * 100} 
                              className="mb-2"
                            />
                            <p className="text-xs text-gray-500">
                              {achievement.progress}/{achievement.target} completed
                            </p>
                          </>
                        )}
                        
                        {achievement.unlocked && achievement.unlockedAt && (
                          <p className="text-xs text-amber-600">
                            ✅ Unlocked on {achievement.unlockedAt.toLocaleDateString()}
                          </p>
                        )}

                        {achievement.rewards.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {achievement.rewards.map((reward, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                🎁 {reward}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="learning" className="space-y-6">
          {learningPaths.map((path) => (
            <Card key={path.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{path.title}</CardTitle>
                    <CardDescription>{path.description}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-600">{path.progress}%</div>
                    <p className="text-sm text-gray-600">Complete</p>
                  </div>
                </div>
                <Progress value={path.progress} className="mt-4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {path.modules.map((module, idx) => (
                    <div
                      key={module.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        module.completed ? 'bg-green-50 border-green-200' :
                        module.locked ? 'bg-gray-50 border-gray-200' :
                        'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          module.completed ? 'bg-green-500 text-white' :
                          module.locked ? 'bg-gray-300' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {module.completed ? <CheckCircle className="h-4 w-4" /> :
                           module.locked ? <Lock className="h-4 w-4" /> :
                           idx + 1}
                        </div>
                        <div>
                          <p className={`font-medium ${module.locked ? 'text-gray-400' : ''}`}>
                            {module.title}
                          </p>
                          <p className="text-sm text-gray-600">{module.duration}</p>
                        </div>
                      </div>
                      {!module.locked && (
                        <Button
                          size="sm"
                          variant={module.completed ? 'outline' : 'default'}
                          disabled={module.locked}
                        >
                          {module.completed ? 'Review' : 'Start'}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">
                    🎓 Unlock Premium Courses
                  </h3>
                  <p className="text-sm text-blue-700">
                    Complete current paths to access advanced training materials
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Leaderboard</CardTitle>
              <CardDescription>
                Compete with your peers and climb the ranks!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      entry.name === 'You' ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-2xl font-bold ${
                        entry.rank === 1 ? 'text-yellow-500' :
                        entry.rank === 2 ? 'text-gray-400' :
                        entry.rank === 3 ? 'text-orange-600' :
                        'text-gray-600'
                      }`}>
                        #{entry.rank}
                      </div>
                      <div className="text-3xl">{entry.avatar}</div>
                      <div>
                        <p className="font-semibold">{entry.name}</p>
                        <p className="text-sm text-gray-600">Level {entry.level}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold">{entry.points.toLocaleString()} XP</p>
                        <div className="flex items-center justify-end text-sm">
                          {entry.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                          {entry.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                          {entry.trend === 'same' && <span className="text-gray-400">—</span>}
                        </div>
                      </div>
                      {entry.rank <= 3 && (
                        <div className="text-2xl">
                          {entry.rank === 1 && '🥇'}
                          {entry.rank === 2 && '🥈'}
                          {entry.rank === 3 && '🥉'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Pro tip:</strong> Complete daily tasks and maintain your streak to earn bonus XP!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="text-center">
              <CardContent className="p-6">
                <Gift className="h-12 w-12 mx-auto text-purple-600 mb-3" />
                <h4 className="font-semibold mb-2">Speed Mode Access</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Unlock keyboard shortcuts and quick actions
                </p>
                <Badge className="bg-purple-100 text-purple-800">Unlocked at Level 5</Badge>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Star className="h-12 w-12 mx-auto text-yellow-500 mb-3" />
                <h4 className="font-semibold mb-2">Custom Reports</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Create and save your own report templates
                </p>
                <Badge className="bg-yellow-100 text-yellow-800">Unlocked at Level 10</Badge>
              </CardContent>
            </Card>

            <Card className="text-center opacity-60">
              <CardContent className="p-6">
                <Award className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h4 className="font-semibold mb-2">API Access</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Integrate with external tools and automate workflows
                </p>
                <Badge variant="secondary">Requires Level 15</Badge>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-1">
                    Your Next Reward
                  </h3>
                  <p className="text-purple-100">
                    Reach Level 10 to unlock Custom Reports - only 3 levels to go!
                  </p>
                </div>
                <div className="text-5xl">🎯</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="text-6xl animate-bounce">
              <PartyPopper className="h-24 w-24 text-amber-500" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}