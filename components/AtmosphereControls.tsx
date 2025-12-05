import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface AtmosphereControlsProps {
  intensity: number;
  lutEnabled: boolean;
  onIntensityChange: (value: number) => void;
  onToggleLUT: () => void;
}

export default function AtmosphereControls({
  intensity,
  lutEnabled,
  onIntensityChange,
  onToggleLUT,
}: AtmosphereControlsProps) {
  const intensitySteps = [0, 0.25, 0.5, 0.75, 1.0];
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Atmosphère</Text>
      
      <View style={styles.control}>
        <Text style={styles.label}>LUT Color Grading</Text>
        <TouchableOpacity 
          style={[styles.toggle, lutEnabled && styles.toggleActive]} 
          onPress={onToggleLUT}
        >
          <Text style={styles.toggleText}>{lutEnabled ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.control}>
        <Text style={styles.label}>Intensité: {intensity.toFixed(2)}</Text>
        <View style={styles.buttonRow}>
          {intensitySteps.map((step) => (
            <TouchableOpacity
              key={step}
              style={[
                styles.intensityButton,
                Math.abs(intensity - step) < 0.01 && styles.intensityButtonActive
              ]}
              onPress={() => onIntensityChange(step)}
            >
              <Text style={styles.intensityButtonText}>{step.toFixed(2)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
    minWidth: 200,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  control: {
    marginBottom: 15,
  },
  label: {
    color: 'white',
    fontSize: 12,
    marginBottom: 5,
  },
  toggle: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  toggleText: {
    color: 'white',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
  },
  intensityButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  intensityButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  intensityButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
});
