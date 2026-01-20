import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, useWindowDimensions, ViewStyle } from 'react-native';

interface ButtonItem {
  id: string;
  color: string;
  label?: string;
  onPress: () => void;
}

interface ButtonGrassColorProps {
  buttons: ButtonItem[];
  activeId: string;
  gap?: number;
  containerStyle?: ViewStyle;
}

export default function ButtonGrassColor({
  buttons,
  activeId,
  gap = 4,
  containerStyle
}: ButtonGrassColorProps) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;


  return (
    <View
      style={[
        styles.groupContainer,
        { gap, flexDirection: isLandscape ? 'row' : 'column' },
        containerStyle
      ]}
    >
      {buttons.map((button) => {
        const isActive = button.id === activeId;

        return (
          <TouchableOpacity
            key={button.id}
            style={[styles.button, {backgroundColor: button.color,}, isActive ? styles.buttonActive : styles.buttonInactive,]}
            onPress={button.onPress}
            activeOpacity={0.7}
          >
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  groupContainer: {
    position: 'absolute',
    top: 26,
    alignSelf: 'center',
    padding: 4,
    alignItems: 'center',
    backgroundColor: 'rgba(211, 216, 224, 0.40)',
    borderRadius: 100,
    height: 42,
  },
  button: {
    width: 32,
    height: 32,
    padding: 4,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    borderWidth: 0.5,
    borderColor: 'rgba(41, 45, 50, 0.80)',
  },
  buttonInactive: {
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
});
