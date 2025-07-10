'use client';

import { useEffect, useRef, useState } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface TouchGestureOptions {
  threshold?: number;
  preventScroll?: boolean;
}

export function useTouchGestures(
  handlers: SwipeHandlers,
  options: TouchGestureOptions = {}
) {
  const { threshold = 50, preventScroll = false } = options;
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe && Math.abs(distanceX) > threshold) {
      if (distanceX > 0 && handlers.onSwipeLeft) {
        handlers.onSwipeLeft();
      } else if (distanceX < 0 && handlers.onSwipeRight) {
        handlers.onSwipeRight();
      }
    } else if (!isHorizontalSwipe && Math.abs(distanceY) > threshold) {
      if (distanceY > 0 && handlers.onSwipeUp) {
        handlers.onSwipeUp();
      } else if (distanceY < 0 && handlers.onSwipeDown) {
        handlers.onSwipeDown();
      }
    }
  }, [touchEnd, touchStart, threshold, handlers]);

  const onTouchStart = (e: TouchEvent) => {
    if (preventScroll) {
      e.preventDefault();
    }
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e: TouchEvent) => {
    if (preventScroll) {
      e.preventDefault();
    }
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    // Reset after processing
    setTimeout(() => {
      setTouchStart(null);
      setTouchEnd(null);
    }, 0);
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', onTouchStart, { passive: !preventScroll });
    element.addEventListener('touchmove', onTouchMove, { passive: !preventScroll });
    element.addEventListener('touchend', onTouchEnd);

    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
    };
  }, [preventScroll, touchStart, touchEnd]);

  return elementRef;
}

// Hook for pinch-to-zoom gestures
export function usePinchZoom(
  onZoomIn?: () => void,
  onZoomOut?: () => void,
  threshold: number = 0.2
) {
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const elementRef = useRef<HTMLElement>(null);

  const getDistance = (touches: TouchList): number => {
    const [touch1, touch2] = Array.from(touches);
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      setInitialDistance(getDistance(e.touches));
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && initialDistance) {
      const currentDistance = getDistance(e.touches);
      const scale = currentDistance / initialDistance;

      if (scale > 1 + threshold && onZoomIn) {
        onZoomIn();
        setInitialDistance(currentDistance);
      } else if (scale < 1 - threshold && onZoomOut) {
        onZoomOut();
        setInitialDistance(currentDistance);
      }
    }
  };

  const onTouchEnd = () => {
    setInitialDistance(null);
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', onTouchStart);
    element.addEventListener('touchmove', onTouchMove);
    element.addEventListener('touchend', onTouchEnd);

    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
    };
  }, [initialDistance, onZoomIn, onZoomOut, threshold]);

  return elementRef;
}

// Hook for long press gestures
export function useLongPress(
  callback: () => void,
  duration: number = 500
) {
  const [startTime, setStartTime] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const elementRef = useRef<HTMLElement>(null);

  const onTouchStart = () => {
    setStartTime(Date.now());
    timerRef.current = setTimeout(() => {
      callback();
    }, duration);
  };

  const onTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setStartTime(null);
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', onTouchStart);
    element.addEventListener('touchend', onTouchEnd);
    element.addEventListener('touchcancel', onTouchEnd);

    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchend', onTouchEnd);
      element.removeEventListener('touchcancel', onTouchEnd);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [callback, duration]);

  return elementRef;
}