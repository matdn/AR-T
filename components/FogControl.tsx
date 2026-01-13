import React from 'react';
import { StyleSheet, View, Image, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import * as THREE from 'three';

interface FogControlProps {
  fogDensity: number;
  onFogDensityChange: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
}

// Fonction pour initialiser le fog dans une scène Three.js
export function initializeFog(
  scene: THREE.Scene,
  density: number = 0.1,
  color: number = 0xFFFFFF
): THREE.FogExp2 {
  const fog = new THREE.FogExp2(color, density);
  scene.fog = fog;
  return fog;
}

// Fonction pour mettre à jour la densité du fog
export function updateFogDensity(
  scene: THREE.Scene | null,
  density: number
): void {
  if (scene && scene.fog instanceof THREE.FogExp2) {
    (scene.fog as THREE.FogExp2).density = density;
  }
}

// Fonction pour mettre à jour la couleur du fog
export function updateFogColor(
  scene: THREE.Scene | null,
  color: number
): void {
  if (scene && scene.fog) {
    scene.fog.color.setHex(color);
  }
}

export default function FogControl({
  fogDensity,
  onFogDensityChange,
  minValue = 0,
  maxValue = 0.3,
  step = 0.01,
}: FogControlProps) {
  return (
    <View style={styles.fogContainer}>
      {/* <Text style={styles.fogLabel}>Fog: {fogDensity.toFixed(2)}</Text> */}
      <Image
        style={{ width: 19, height: 20 }}
        source={require('../assets/images/fog.png')}
      />
      <Slider
        style={styles.fogSlider}
        minimumValue={minValue}
        maximumValue={maxValue}
        step={step}
        value={fogDensity}
        onValueChange={onFogDensityChange}
        minimumTrackTintColor="#0900ff"
        maximumTrackTintColor="#ffffff"
        thumbTintColor="#0900ff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fogContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(244, 244, 244, 0.50)',
    borderRadius: 100,
    padding: 12,
    width: 177,
    height: 35,
  },
  fogLabel: {
    color: 'white',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  fogSlider: {
    width: 120,
    height: '100%',
  },
});
