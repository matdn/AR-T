import React from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';

interface JoystickProps {
  position: { x: number; y: number };
  onMove: (velocity: { x: number; z: number }) => void;
  onRelease: () => void;
}

export default function Joystick({ position, onMove, onRelease }: JoystickProps) {
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: () => {},
      
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        const maxDistance = 40;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        let finalX = dx;
        let finalY = dy;
        
        if (distance > maxDistance) {
          const angle = Math.atan2(dy, dx);
          finalX = Math.cos(angle) * maxDistance;
          finalY = Math.sin(angle) * maxDistance;
        }
        
        onMove({
          x: -finalX / maxDistance,  // Inversé : droite devient négatif
          z: finalY / maxDistance,    // Inversé : haut devient positif
        });
      },
      
      onPanResponderRelease: () => {
        onRelease();
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.base} {...panResponder.panHandlers}>
        <View 
          style={[
            styles.stick,
            {
              transform: [
                { translateX: position.x },
                { translateY: position.y },
              ],
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    width: 100,
    height: 100,
  },
  base: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stick: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});
