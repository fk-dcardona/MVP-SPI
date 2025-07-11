import { renderHook, act } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { useMobileGestures, usePinchGesture, useLongPress } from '../useMobileGestures';

describe('useMobileGestures', () => {
  let mockHandlers: any;

  beforeEach(() => {
    mockHandlers = {
      onSwipeLeft: jest.fn(),
      onSwipeRight: jest.fn(),
      onSwipeUp: jest.fn(),
      onSwipeDown: jest.fn(),
    };
  });

  const createTouchEvent = (type: string, touches: Array<{ clientX: number; clientY: number }>) => {
    return new TouchEvent(type, {
      touches: touches.map(touch => ({
        identifier: 0,
        target: document.body,
        clientX: touch.clientX,
        clientY: touch.clientY,
        pageX: touch.clientX,
        pageY: touch.clientY,
        screenX: touch.clientX,
        screenY: touch.clientY,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 1,
      } as Touch)),
      targetTouches: touches.map(touch => ({
        identifier: 0,
        target: document.body,
        clientX: touch.clientX,
        clientY: touch.clientY,
        pageX: touch.clientX,
        pageY: touch.clientY,
        screenX: touch.clientX,
        screenY: touch.clientY,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 1,
      } as Touch)),
      changedTouches: [],
      bubbles: true,
      cancelable: true,
    });
  };

  describe('swipe detection', () => {
    it('detects left swipe', () => {
      const { result } = renderHook(() => useMobileGestures(mockHandlers));

      act(() => {
        // Start touch
        fireEvent(document.body, createTouchEvent('touchstart', [{ clientX: 200, clientY: 100 }]));
        
        // Move left
        fireEvent(document.body, createTouchEvent('touchmove', [{ clientX: 100, clientY: 100 }]));
        
        // End touch
        fireEvent.touchEnd(document.body);
      });

      expect(mockHandlers.onSwipeLeft).toHaveBeenCalled();
      expect(mockHandlers.onSwipeRight).not.toHaveBeenCalled();
    });

    it('detects right swipe', () => {
      const { result } = renderHook(() => useMobileGestures(mockHandlers));

      act(() => {
        fireEvent(document.body, createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
        fireEvent(document.body, createTouchEvent('touchmove', [{ clientX: 200, clientY: 100 }]));
        fireEvent.touchEnd(document.body);
      });

      expect(mockHandlers.onSwipeRight).toHaveBeenCalled();
      expect(mockHandlers.onSwipeLeft).not.toHaveBeenCalled();
    });

    it('detects up swipe', () => {
      const { result } = renderHook(() => useMobileGestures(mockHandlers));

      act(() => {
        fireEvent(document.body, createTouchEvent('touchstart', [{ clientX: 100, clientY: 200 }]));
        fireEvent(document.body, createTouchEvent('touchmove', [{ clientX: 100, clientY: 100 }]));
        fireEvent.touchEnd(document.body);
      });

      expect(mockHandlers.onSwipeUp).toHaveBeenCalled();
      expect(mockHandlers.onSwipeDown).not.toHaveBeenCalled();
    });

    it('detects down swipe', () => {
      const { result } = renderHook(() => useMobileGestures(mockHandlers));

      act(() => {
        fireEvent(document.body, createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
        fireEvent(document.body, createTouchEvent('touchmove', [{ clientX: 100, clientY: 200 }]));
        fireEvent.touchEnd(document.body);
      });

      expect(mockHandlers.onSwipeDown).toHaveBeenCalled();
      expect(mockHandlers.onSwipeUp).not.toHaveBeenCalled();
    });

    it('ignores swipes below minimum distance', () => {
      const { result } = renderHook(() => useMobileGestures(mockHandlers));

      act(() => {
        fireEvent(document.body, createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
        fireEvent(document.body, createTouchEvent('touchmove', [{ clientX: 120, clientY: 100 }])); // Only 20px
        fireEvent.touchEnd(document.body);
      });

      expect(mockHandlers.onSwipeLeft).not.toHaveBeenCalled();
      expect(mockHandlers.onSwipeRight).not.toHaveBeenCalled();
    });

    it('ignores slow swipes', async () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useMobileGestures(mockHandlers));

      act(() => {
        fireEvent(document.body, createTouchEvent('touchstart', [{ clientX: 200, clientY: 100 }]));
      });

      // Wait longer than MAX_SWIPE_TIME
      act(() => {
        jest.advanceTimersByTime(400);
      });

      act(() => {
        fireEvent(document.body, createTouchEvent('touchmove', [{ clientX: 100, clientY: 100 }]));
        fireEvent.touchEnd(document.body);
      });

      expect(mockHandlers.onSwipeLeft).not.toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('updates isSwiping state correctly', () => {
      const { result } = renderHook(() => useMobileGestures(mockHandlers));

      expect(result.current.isSwiping).toBe(false);

      act(() => {
        fireEvent(document.body, createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
      });

      expect(result.current.isSwiping).toBe(true);

      act(() => {
        fireEvent.touchEnd(document.body);
      });

      expect(result.current.isSwiping).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('removes event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document.body, 'removeEventListener');
      const { unmount } = renderHook(() => useMobileGestures(mockHandlers));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
    });
  });
});

describe('usePinchGesture', () => {
  const mockOnPinch = jest.fn();

  const createMultiTouchEvent = (
    type: string,
    touches: Array<{ clientX: number; clientY: number }>
  ) => {
    return new TouchEvent(type, {
      touches: touches.map((touch, index) => ({
        identifier: index,
        target: document.body,
        clientX: touch.clientX,
        clientY: touch.clientY,
        pageX: touch.clientX,
        pageY: touch.clientY,
        screenX: touch.clientX,
        screenY: touch.clientY,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 1,
      } as Touch)),
      targetTouches: [],
      changedTouches: [],
      bubbles: true,
      cancelable: true,
    });
  };

  it('detects pinch gesture', () => {
    const { result } = renderHook(() => usePinchGesture(mockOnPinch));

    act(() => {
      // Start with two fingers 100px apart
      fireEvent(
        document.body,
        createMultiTouchEvent('touchstart', [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 100 },
        ])
      );
    });

    expect(result.current.isPinching).toBe(true);

    act(() => {
      // Move fingers closer (50px apart) - pinch in
      fireEvent(
        document.body,
        createMultiTouchEvent('touchmove', [
          { clientX: 125, clientY: 100 },
          { clientX: 175, clientY: 100 },
        ])
      );
    });

    expect(mockOnPinch).toHaveBeenCalledWith(0.5); // 50/100 = 0.5 scale

    act(() => {
      fireEvent.touchEnd(document.body);
    });

    expect(result.current.isPinching).toBe(false);
  });

  it('calculates pinch out correctly', () => {
    const { result } = renderHook(() => usePinchGesture(mockOnPinch));

    act(() => {
      // Start with two fingers 100px apart
      fireEvent(
        document.body,
        createMultiTouchEvent('touchstart', [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 100 },
        ])
      );

      // Move fingers further apart (200px) - pinch out
      fireEvent(
        document.body,
        createMultiTouchEvent('touchmove', [
          { clientX: 50, clientY: 100 },
          { clientX: 250, clientY: 100 },
        ])
      );
    });

    expect(mockOnPinch).toHaveBeenCalledWith(2); // 200/100 = 2 scale
  });

  it('ignores single touch', () => {
    const { result } = renderHook(() => usePinchGesture(mockOnPinch));

    act(() => {
      fireEvent(
        document.body,
        createMultiTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }])
      );
    });

    expect(result.current.isPinching).toBe(false);
    expect(mockOnPinch).not.toHaveBeenCalled();
  });
});

describe('useLongPress', () => {
  const mockCallback = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    mockCallback.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('triggers callback after delay', () => {
    const { result } = renderHook(() => useLongPress(mockCallback, 500));
    const element = document.createElement('div');

    act(() => {
      result.current.onTouchStart();
    });

    // Not called immediately
    expect(mockCallback).not.toHaveBeenCalled();

    // Called after delay
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockCallback).toHaveBeenCalled();
    expect(result.current.isLongPressing).toBe(true);
  });

  it('cancels on touch end before delay', () => {
    const { result } = renderHook(() => useLongPress(mockCallback, 500));

    act(() => {
      result.current.onTouchStart();
      jest.advanceTimersByTime(300);
      result.current.onTouchEnd();
      jest.advanceTimersByTime(300);
    });

    expect(mockCallback).not.toHaveBeenCalled();
    expect(result.current.isLongPressing).toBe(false);
  });

  it('cancels on touch move', () => {
    const { result } = renderHook(() => useLongPress(mockCallback, 500));

    act(() => {
      result.current.onTouchStart();
      jest.advanceTimersByTime(300);
      result.current.onTouchMove();
      jest.advanceTimersByTime(300);
    });

    expect(mockCallback).not.toHaveBeenCalled();
    expect(result.current.isLongPressing).toBe(false);
  });

  it('works with mouse events', () => {
    const { result } = renderHook(() => useLongPress(mockCallback, 500));

    act(() => {
      result.current.onMouseDown();
      jest.advanceTimersByTime(500);
    });

    expect(mockCallback).toHaveBeenCalled();

    act(() => {
      result.current.onMouseUp();
    });

    expect(result.current.isLongPressing).toBe(false);
  });

  it('uses custom delay', () => {
    const { result } = renderHook(() => useLongPress(mockCallback, 1000));

    act(() => {
      result.current.onTouchStart();
      jest.advanceTimersByTime(999);
    });

    expect(mockCallback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(mockCallback).toHaveBeenCalled();
  });
});