/**
 * Swipe Gesture Hook
 * Handles swipe gestures for dose cards (left=taken, right=postpone, down=skip)
 */

import { useRef, useEffect, useState } from 'react';
import { isFeatureEnabled } from '../lib/featureFlags';

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isSwiping: boolean;
}

interface UseSwipeOptions {
  onSwipeLeft?: () => void; // Taken
  onSwipeRight?: () => void; // Postpone (+30m default)
  onSwipeDown?: () => void; // Skip
  threshold?: number; // Minimum distance in pixels (default: 50)
  enabled?: boolean;
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeDown,
  threshold = 50,
  enabled = true,
}: UseSwipeOptions) {
  const elementRef = useRef<HTMLElement | null>(null);
  const [swipeState, setSwipeState] = useState<SwipeState | null>(null);
  const swipeEnabled = enabled && isFeatureEnabled('swipeGestures');

  useEffect(() => {
    if (!swipeEnabled || !elementRef.current) return;

    const element = elementRef.current;
    let startX = 0;
    let startY = 0;
    let isSwiping = false;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      isSwiping = true;
      
      setSwipeState({
        startX,
        startY,
        currentX: startX,
        currentY: startY,
        isSwiping: true,
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping) return;
      
      const touch = e.touches[0];
      const currentX = touch.clientX;
      const currentY = touch.clientY;
      
      setSwipeState(prev => prev ? {
        ...prev,
        currentX,
        currentY,
      } : null);
    };

    const handleTouchEnd = () => {
      if (!isSwiping || !swipeState) return;
      
      const deltaX = swipeState.currentX - swipeState.startX;
      const deltaY = swipeState.currentY - swipeState.startY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      // Determine swipe direction
      if (absX > threshold && absX > absY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else if (absY > threshold && absY > absX) {
        // Vertical swipe (down only)
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        }
      }
      
      isSwiping = false;
      setSwipeState(null);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [swipeEnabled, onSwipeLeft, onSwipeRight, onSwipeDown, threshold, swipeState]);

  // Calculate transform for visual feedback
  const transform = swipeState ? {
    x: swipeState.currentX - swipeState.startX,
    y: swipeState.currentY - swipeState.startY,
  } : { x: 0, y: 0 };

  // Determine swipe direction for visual feedback
  const swipeDirection = swipeState ? (
    Math.abs(transform.x) > Math.abs(transform.y)
      ? (transform.x > 0 ? 'right' : 'left')
      : (transform.y > 0 ? 'down' : 'up')
  ) : null;

  return {
    ref: elementRef,
    transform,
    swipeDirection,
    isSwiping: swipeState?.isSwiping || false,
  };
}

