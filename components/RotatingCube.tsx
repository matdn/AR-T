import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RotatingCubeProps {
  position?: [number, number, number];
  color?: string;
}

const RotatingCube: React.FC<RotatingCubeProps> = ({ 
  position = [0, 0, 0], 
  color = '#ff6b6b' 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Animation frame hook pour faire tourner le cube
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      {/* Géométrie du cube */}
      <boxGeometry args={[2, 2, 2]} />
      {/* Matériau du cube avec la couleur spécifiée */}
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

export default RotatingCube;