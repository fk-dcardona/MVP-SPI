import { useEffect, useRef, useState } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export function useMobileGestures(handlers: SwipeHandlers) {
  const touchStart = useRef<TouchPoint | null>(null);
  const touchEnd = useRef<TouchPoint | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  // Minimum distance for swipe (in pixels)
  const MIN_SWIPE_DISTANCE = 75;
  
  // Maximum time for swipe (in milliseconds)
  const MAX_SWIPE_TIME = 300;
  
  // Velocity threshold (pixels per millisecond)
  const MIN_VELOCITY = 0.5;

  const handleTouchStart = (e: TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now()
    };
    setIsSwiping(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;

    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;
    const deltaTime = touchEnd.current.time - touchStart.current.time;
    
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Calculate velocity
    const velocityX = absDeltaX / deltaTime;
    const velocityY = absDeltaY / deltaTime;
    
    // Check if it's a valid swipe
    if (deltaTime > MAX_SWIPE_TIME) {
      setIsSwiping(false);
      return;
    }

    // Horizontal swipe
    if (absDeltaX > absDeltaY && absDeltaX > MIN_SWIPE_DISTANCE && velocityX > MIN_VELOCITY) {
      if (deltaX > 0) {
        handlers.onSwipeRight?.();
      } else {
        handlers.onSwipeLeft?.();
      }
    }
    
    // Vertical swipe
    if (absDeltaY > absDeltaX && absDeltaY > MIN_SWIPE_DISTANCE && velocityY > MIN_VELOCITY) {
      if (deltaY > 0) {
        handlers.onSwipeDown?.();
      } else {
        handlers.onSwipeUp?.();
      }
    }

    setIsSwiping(false);
  };

  useEffect(() => {
    const element = document.body;
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlers]);

  return { isSwiping };
}

// Hook for pinch gestures (useful for charts)
export function usePinchGesture(onPinch: (scale: number) => void) {
  const initialDistance = useRef<number | null>(null);
  const [isPinching, setIsPinching] = useState(false);

  const getDistance = (touches: TouchList): number => {
    const [touch1, touch2] = [touches[0], touches[1]];
    const deltaX = touch2.clientX - touch1.clientX;
    const deltaY = touch2.clientY - touch1.clientY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistance.current = getDistance(e.touches);
      setIsPinching(true);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && initialDistance.current) {
      const currentDistance = getDistance(e.touches);
      const scale = currentDistance / initialDistance.current;
      onPinch(scale);
    }
  };

  const handleTouchEnd = () => {
    initialDistance.current = null;
    setIsPinching(false);
  };

  useEffect(() => {
    const element = document.body;
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onPinch]);

  return { isPinching };
}

// Hook for long press (useful for tooltips on mobile)
export function useLongPress(callback: () => void, delay = 500) {
  const [isLongPressing, setIsLongPressing] = useState(false);
  const timeout = useRef<NodeJS.Timeout | null>(null);

  const start = () => {
    timeout.current = setTimeout(() => {
      callback();
      setIsLongPressing(true);
    }, delay);
  };

  const clear = () => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
    setIsLongPressing(false);
  };

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    isLongPressing
  };
}