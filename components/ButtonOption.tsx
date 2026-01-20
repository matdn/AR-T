import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Text, useWindowDimensions, ViewStyle } from 'react-native';

interface ButtonItem {
  id: string;
  icon?: any;
  label?: string;
  onPress?: () => void;
}

interface ButtonOptionProps {
  buttons: ButtonItem[];
  gap?: number;
  containerStyle?: ViewStyle;
  activeId?: string;
}

export default function ButtonOption({
  buttons,
  gap = 12,
  containerStyle,
  activeId
}: ButtonOptionProps) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  return (
    <View
      style={[
        styles.groupContainer,
        {
          gap: gap,
          flexDirection: isLandscape ? 'row' : 'column',
        },
        containerStyle
      ]}
    >
      {buttons.map((button) => {
        const isActive = button.id === activeId;
        return (
        <TouchableOpacity
          key={button.id}
          style={[styles.button, isActive ? styles.buttonActive : styles.buttonInactive]}
          onPress={button.onPress}
          activeOpacity={0.7}
        >
          {button.icon ? (
            <Image
              style={{ width: 24, height: 24 }}
              source={button.icon}
            />
          ) : (
            <Text style={styles.buttonText}>{button.label}</Text>
          )}
        </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  groupContainer: {
    alignItems: 'center',
  },
  button: {
    width: 45,
    height: 45,
    padding: 12,
    borderRadius: 100,
    backgroundColor: 'rgba(9, 0, 255, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: '#0900FF'
  },
  buttonInactive: {
    backgroundColor: 'rgba(9, 0, 255, 0.25)',
  },
  buttonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
});
