import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, useWindowDimensions, ViewStyle } from 'react-native';
import type { SvgProps } from 'react-native-svg';

interface ButtonItem {
  id: string;
  Icon?: React.ComponentType<SvgProps>;
  label?: string;
  selected?: boolean;
  onPress?: () => void;
}

interface ButtonTimeProps {
  buttons: ButtonItem[];
  activeId?: string;
  gap?: number;
  containerStyle?: ViewStyle;
}

export default function ButtonTime({
  buttons,
  activeId,
  gap = 8,
  containerStyle
}: ButtonTimeProps) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const ACTIVE = '#0900FF';
  const INACTIVE = '#f0dbdb50';

  return (
    <View
      style={[
        styles.groupContainer,
        { gap, flexDirection: isLandscape ? 'row' : 'column' },
        containerStyle
      ]}
    >
      {buttons.map((button) => {
        let isActive = button.id === activeId;
        const isSelected = button.selected;
        if (isSelected) {
          isActive = isSelected
        }
        const color = isActive ? ACTIVE : INACTIVE;
        const Icon = button.Icon;

        return (
          <TouchableOpacity
            key={button.id}
            style={[styles.button, isActive ? styles.buttonActive : styles.buttonInactive,]}
            onPress={button.onPress}
            activeOpacity={0.7}
          >
            {Icon ? (
              <Icon width={19} height={19} color={color} />
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
    padding: 4,
    alignItems: 'center',
    backgroundColor: '#0900FF',
    borderRadius: 100,
    height: 35,
  },
  button: {
    padding: 4,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: '#FFFFFF',
  },
  buttonInactive: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
});
