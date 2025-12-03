import { useRef } from 'react';
import { PanResponder, GestureResponderEvent } from 'react-native';

interface UseTapDetectorProps {
  onTap: (event: GestureResponderEvent) => void;
}

export function useTapDetector({ onTap }: UseTapDetectorProps) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const tapResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false,
      
      onPanResponderGrant: (event) => {
        touchStartRef.current = {
          x: event.nativeEvent.locationX,
          y: event.nativeEvent.locationY,
          time: Date.now()
        };
      },
      
      onPanResponderRelease: (event) => {
        if (!touchStartRef.current) return;
        
        const touchEnd = {
          x: event.nativeEvent.locationX,
          y: event.nativeEvent.locationY,
          time: Date.now()
        };
        
        const deltaX = Math.abs(touchEnd.x - touchStartRef.current.x);
        const deltaY = Math.abs(touchEnd.y - touchStartRef.current.y);
        const deltaTime = touchEnd.time - touchStartRef.current.time;
        
        if (deltaX < 10 && deltaY < 10 && deltaTime < 300) {
          onTap(event);
        }
        
        touchStartRef.current = null;
      },
    })
  ).current;

  return tapResponder;
}
