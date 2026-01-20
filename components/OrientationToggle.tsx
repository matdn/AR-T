import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';

interface OrientationToggleProps {
  isLandscape: boolean;
  onToggle: () => void;
}

export default function OrientationToggle({ isLandscape, onToggle }: OrientationToggleProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onToggle}>
        <Image
          style={{ width: 24, height: 24 }}
          source={require('../assets/images/home.png')}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 25,
    left: 24,
  },
  button: {
    padding: 12,
    borderRadius: 100,
    backgroundColor: 'rgba(9, 0, 255, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
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
