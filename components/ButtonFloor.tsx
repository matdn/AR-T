import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ButtonFloorProps {
  onPress: () => void;
}

export default function ResetButton({ onPress }: ButtonFloorProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onPress}>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 46,
    height: 46,
    bottom: 100,
    right: 250,
    alignSelf: 'center',
    borderRadius: 100,
    backgroundColor: '#0800FF25',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',

  },
  button: {
    width:26,
    height:26,
    borderRadius: 100,
    backgroundColor: '#0900FF',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});
