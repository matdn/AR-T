import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ResetButtonProps {
  onPress: () => void;
}

export default function ResetButton({ onPress }: ResetButtonProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>Recentrer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#0900FF',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});
