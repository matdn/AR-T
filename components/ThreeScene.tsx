import React from 'react';
import { Canvas } from '@react-three/fiber';
import { View, StyleSheet } from 'react-native';
import RotatingCube from './RotatingCube';

const ThreeScene: React.FC = () => {
  return (
    <View style={styles.container}>
      <Canvas
        style={styles.canvas}
        camera={{ position: [0, 0, 6], fov: 75 }}
      >
        {/* Lumière ambiante pour éclairer la scène */}
        <ambientLight intensity={0.5} />
        {/* Lumière directionnelle pour les ombres */}
        <directionalLight position={[10, 10, 5]} intensity={1} />
        {/* Notre cube qui tourne */}
        <RotatingCube />
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  canvas: {
    flex: 1,
  },
});

export default ThreeScene;