import { useEffect, useRef } from 'react';
import { DeviceMotion, type DeviceMotionMeasurement } from 'expo-sensors';
import type { EventSubscription } from 'expo-modules-core';

interface DeviceRotation {
  alpha: number;
  beta: number;
  gamma: number;
}

export function useDeviceMotion() {
  const rotationRef = useRef<DeviceRotation>({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });

  useEffect(() => {
    let subscription: EventSubscription | null = null;

    DeviceMotion.setUpdateInterval(16);

    DeviceMotion.isAvailableAsync().then((available) => {
      if (!available) return;

      subscription = DeviceMotion.addListener(
        (event: DeviceMotionMeasurement) => {
          if (event.rotation) {
            const { alpha = 0, beta = 0, gamma = 0 } = event.rotation;
            rotationRef.current = { alpha, beta, gamma };
          }
        }
      );
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return rotationRef;
}
