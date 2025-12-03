import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ResetButtonProps {
  onPress: () => void;
}

export default function ResetButton({ onPress }: ResetButtonProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>Recentrer la vue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});
