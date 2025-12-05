import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface OrientationToggleProps {
  isLandscape: boolean;
  onToggle: () => void;
}

export default function OrientationToggle({ isLandscape, onToggle }: OrientationToggleProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onToggle}>
        <Text style={styles.icon}>
          {isLandscape ? '' : '🔄'}
        </Text>
        <Text style={styles.text}>
          {isLandscape ? 'Portrait' : 'Paysage'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 18,
  },
  text: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
});
