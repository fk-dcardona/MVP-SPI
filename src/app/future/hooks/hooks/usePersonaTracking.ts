// Hook for persona tracking and adaptation
// Following the Merging Philosophy

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { personaService } from '@/services/persona-service';
import { BEHAVIOR_ACTIONS, type BehaviorAction } from '@/types/persona';

interface UsePersonaTrackingOptions {
  feature?: string;
  autoTrackMount?: boolean;
}

export function usePersonaTracking(options: UsePersonaTrackingOptions = {}) {
  const { user } = useAuth();
  const startTimeRef = useRef<number>(Date.now());
  const trackedRef = useRef<boolean>(false);
  
  // Initialize persona service with user ID
  useEffect(() => {
    if (user?.id && !trackedRef.current) {
      personaService.setUserId(user.id);
      trackedRef.current = true;
    }
  }, [user?.id]);
  
  // Track feature mount if requested
  useEffect(() => {
    if (options.autoTrackMount && options.feature && user?.id) {
      const startTime = Date.now();
      startTimeRef.current = startTime;
      
      // Track feature view
      personaService.trackBehavior(
        `${options.feature}_view` as BehaviorAction,
        { feature: options.feature }
      );
      
      // Track time spent on unmount
      return () => {
        const timeSpent = Date.now() - startTime;
        personaService.trackBehavior(
          `${options.feature}_exit` as BehaviorAction,
          { feature: options.feature, time_spent_ms: timeSpent },
          timeSpent
        );
      };
    }
  }, [options.autoTrackMount, options.feature, user?.id]);
  
  // Track any behavior
  const trackBehavior = useCallback(
    async (
      action: BehaviorAction,
      context?: Record<string, any>,
      completionTimeMs?: number
    ) => {
      if (!user?.id) return;
      
      await personaService.trackBehavior(action, context, completionTimeMs);
    },
    [user?.id]
  );
  
  // Track with timing
  const trackWithTiming = useCallback(
    async (action: BehaviorAction, context?: Record<string, any>) => {
      if (!user?.id) return;
      
      const completionTime = Date.now() - startTimeRef.current;
      await personaService.trackBehavior(action, context, completionTime);
    },
    [user?.id]
  );
  
  // Start timing for an action
  const startTiming = useCallback(() => {
    startTimeRef.current = Date.now();
  }, []);
  
  // Complete timing and track
  const completeTiming = useCallback(
    async (action: BehaviorAction, context?: Record<string, any>) => {
      const completionTime = Date.now() - startTimeRef.current;
      await trackBehavior(action, context, completionTime);
      return completionTime;
    },
    [trackBehavior]
  );
  
  // Specific tracking methods
  const trackQuickAction = useCallback(
    async (actionName: string) => {
      await trackBehavior(BEHAVIOR_ACTIONS.QUICK_UPLOAD, { action: actionName });
    },
    [trackBehavior]
  );
  
  const trackKeyboardShortcut = useCallback(
    async (shortcut: string) => {
      await trackBehavior(BEHAVIOR_ACTIONS.KEYBOARD_SHORTCUT, { shortcut });
    },
    [trackBehavior]
  );
  
  const trackDashboardView = useCallback(
    async (dashboardType: string) => {
      await personaService.trackDashboardView(dashboardType);
    },
    []
  );
  
  const trackEntitySwitch = useCallback(
    async (fromEntity: string, toEntity: string) => {
      await trackBehavior(BEHAVIOR_ACTIONS.SWITCH_ENTITY, {
        from_entity: fromEntity,
        to_entity: toEntity
      });
    },
    [trackBehavior]
  );
  
  const trackHelpAccess = useCallback(
    async (helpType: string, topic?: string) => {
      await trackBehavior(BEHAVIOR_ACTIONS.HELP_ACCESSED, {
        help_type: helpType,
        topic
      });
    },
    [trackBehavior]
  );
  
  const trackSystemAction = useCallback(
    async (action: 'view_logs' | 'config_change' | 'health_check', details?: any) => {
      const actionMap = {
        view_logs: BEHAVIOR_ACTIONS.VIEW_LOGS,
        config_change: BEHAVIOR_ACTIONS.SYSTEM_CONFIG,
        health_check: BEHAVIOR_ACTIONS.HEALTH_CHECK
      };
      
      await trackBehavior(actionMap[action], { details });
    },
    [trackBehavior]
  );
  
  return {
    trackBehavior,
    trackWithTiming,
    startTiming,
    completeTiming,
    trackQuickAction,
    trackKeyboardShortcut,
    trackDashboardView,
    trackEntitySwitch,
    trackHelpAccess,
    trackSystemAction
  };
}

// Hook for tracking speed-focused actions
export function useStreamlinerTracking() {
  const tracking = usePersonaTracking({ feature: 'streamliner' });
  
  const trackSpeedWin = useCallback(
    async (taskType: string, completionTime: number, previousBest?: number) => {
      await tracking.trackBehavior(BEHAVIOR_ACTIONS.QUICK_UPLOAD, {
        task_type: taskType,
        completion_time: completionTime,
        previous_best: previousBest,
        improvement: previousBest ? ((previousBest - completionTime) / previousBest * 100) : 0
      }, completionTime);
    },
    [tracking]
  );
  
  return {
    ...tracking,
    trackSpeedWin
  };
}

// Hook for tracking control-focused actions
export function useNavigatorTracking() {
  const tracking = usePersonaTracking({ feature: 'navigator' });
  
  const trackViewSave = useCallback(
    async (viewName: string, config: any) => {
      await tracking.trackBehavior(BEHAVIOR_ACTIONS.SAVE_VIEW, {
        view_name: viewName,
        config_complexity: Object.keys(config).length
      });
    },
    [tracking]
  );
  
  const trackThresholdSet = useCallback(
    async (metric: string, threshold: number) => {
      await tracking.trackBehavior(BEHAVIOR_ACTIONS.SET_THRESHOLD, {
        metric,
        threshold
      });
    },
    [tracking]
  );
  
  return {
    ...tracking,
    trackViewSave,
    trackThresholdSet
  };
}

// Hook for tracking network-focused actions
export function useHubTracking() {
  const tracking = usePersonaTracking({ feature: 'hub' });
  
  const trackConsolidatedReport = useCallback(
    async (reportType: string, entityCount: number) => {
      await tracking.trackBehavior(BEHAVIOR_ACTIONS.CONSOLIDATED_REPORT, {
        report_type: reportType,
        entity_count: entityCount
      });
    },
    [tracking]
  );
  
  return {
    ...tracking,
    trackConsolidatedReport
  };
}

// Hook for tracking learning-focused actions
export function useSpringTracking() {
  const tracking = usePersonaTracking({ feature: 'spring' });
  
  const trackTutorialProgress = useCallback(
    async (tutorialId: string, step: number, completed: boolean) => {
      await tracking.trackBehavior(BEHAVIOR_ACTIONS.TUTORIAL_START, {
        tutorial_id: tutorialId,
        step,
        completed
      });
    },
    [tracking]
  );
  
  const trackPracticeMode = useCallback(
    async (exerciseType: string, success: boolean) => {
      await tracking.trackBehavior(BEHAVIOR_ACTIONS.PRACTICE_MODE, {
        exercise_type: exerciseType,
        success
      });
    },
    [tracking]
  );
  
  return {
    ...tracking,
    trackTutorialProgress,
    trackPracticeMode
  };
}

// Hook for tracking system-focused actions
export function useProcessorTracking() {
  const tracking = usePersonaTracking({ feature: 'processor' });
  
  const trackAuditView = useCallback(
    async (logType: string, timeRange: string) => {
      await tracking.trackBehavior(BEHAVIOR_ACTIONS.AUDIT_TRAIL_VIEW, {
        log_type: logType,
        time_range: timeRange
      });
    },
    [tracking]
  );
  
  return {
    ...tracking,
    trackAuditView
  };
}