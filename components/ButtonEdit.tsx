import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Text, useWindowDimensions, ViewStyle } from 'react-native';

interface ButtonItem {
  id: string;
  icon?: any;
  label?: string;
  onPress: () => void;
}

interface ButtonEditProps {
  buttons: ButtonItem[];
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  gap?: number;
  containerStyle?: ViewStyle;
}

export default function ButtonEdit({ 
  buttons, 
  position = 'top-left',
  gap = 12,
  containerStyle
}: ButtonEditProps) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const getPositionStyle = () => {
    const basePosition = {
      position: 'absolute' as const,
    };

    switch (position) {
      case 'top-left':
        return { ...basePosition, top: 25, left: 24 };
      case 'top-right':
        return { ...basePosition, top: 25, right: 24 };
      case 'bottom-left':
        return { ...basePosition, bottom: 40, left: 24 };
      case 'bottom-right':
        return { ...basePosition, bottom: 40, right: 24 };
      default:
        return { ...basePosition, top: 25, left: 24 };
    }
  };

  return (
    <View 
      style={[
        styles.groupContainer,
        getPositionStyle(),
        {
          gap: gap,
          flexDirection: isLandscape ? 'row' : 'column',
        },
        containerStyle
      ]}
    >
      {buttons.map((button) => (
        <TouchableOpacity 
          key={button.id}
          style={styles.button} 
          onPress={button.onPress}
          activeOpacity={0.7}
        >
          {button.icon ? (
            <Image
              style={{ width: 35, height: 35 }}
              source={button.icon}
            />
          ) : (
            <Text style={styles.buttonText}>{button.label}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  groupContainer: {
    alignItems: 'center',
  },
  button: {
    padding: 5,
    borderRadius: 100,
    backgroundColor: 'rgba(244, 244, 244, 0.50)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
});
