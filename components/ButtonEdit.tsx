import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Text, useWindowDimensions, ViewStyle } from 'react-native';

interface ButtonItem {
  id: string;
  icon?: any;
  label?: string;
  onPress?: () => void;
}

interface ButtonEditProps {
  buttons: ButtonItem[];
  gap?: number;
  containerStyle?: ViewStyle;
}

export default function ButtonEdit({ 
  buttons, 
  gap = 12,
  containerStyle
}: ButtonEditProps) {
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
    width: 45,
    height: 45,
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
