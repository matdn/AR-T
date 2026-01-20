import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import ButtonMenu from "./ButtonMenu";

interface ScreenTutorialProps {
  onPress?: () => void;
}

export default function ScreenTutorial({ onPress }: ScreenTutorialProps) {
  return (

    <BlurView intensity={10} style={styles.containerBlur}>
      <ButtonMenu
        position="top-left"
        gap={12}
        buttons={[
          {
            id: 'orientation',
            icon: require('./../assets/images/home.png'),
          },
          {
            id: 'grille',
            icon: require('./../assets/images/grille.png'),
          },
          {
            id: 'motion',
            icon: require('./../assets/images/gyro.png'),
          },
        ]}
      />
    </BlurView>

  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
  },
  containerBlur: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 999,
    backgroundColor: 'rgba(179, 184, 194, 0.60)',
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
