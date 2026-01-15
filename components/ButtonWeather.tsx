import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, useWindowDimensions, ViewStyle } from 'react-native';
import type { SvgProps } from 'react-native-svg';

interface ButtonItem {
  id: string;
  Icon?: React.ComponentType<SvgProps>;
  label?: string;
  onPress: () => void;
}

interface ButtonWeatherProps {
  buttons: ButtonItem[];
  activeId: string;
  gap?: number;
  containerStyle?: ViewStyle;
}

export default function ButtonWeather({
  buttons,
  activeId,
  gap = 8,
  containerStyle
}: ButtonWeatherProps) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const ACTIVE = '#DBEBF0';
  const INACTIVE = '#0800FF25';

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
    backgroundColor: 'rgba(144, 159, 247, 0.50)',
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
    backgroundColor: '#0900FF',
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
