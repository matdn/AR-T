import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';

interface ButtonFloorProps {
  onPress?: () => void;
}

export default function ResetButton({ onPress }: ButtonFloorProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.buttonContainer}>
        <View style={styles.button}>
        </View>
      </View>
      <Text style={styles.buttonText}>Modification du sol</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    height: 36,
    bottom: 165,
    right: 115,
    alignSelf: 'center',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 244, 244, 0.80)',
    borderRadius: 100,
    padding: 4,
    paddingRight: 8,
    gap: 4,
  },
  buttonContainer: {
    width: 28,
    height: 28,
    padding: 6,
    alignSelf: 'center',
    borderRadius: 100,
    backgroundColor: '#0800FF25',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: 16,
    height: 16,
    borderRadius: 100,
    backgroundColor: '#0900FF',
  },
  buttonText: {
    color: '#0900FF',
    fontWeight: '300',
    fontFamily: 'Futura',
  },
});
