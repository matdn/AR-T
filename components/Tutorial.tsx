import React from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import ButtonMenu from "./ButtonMenu";
import ButtonOption from "./ButtonOption";
import ButtonEdit from "./ButtonEdit";

interface ScreenTutorialProps {
  onPress?: () => void;
}

export default function ScreenTutorial({ onPress }: ScreenTutorialProps) {
  return (

    <BlurView intensity={10} style={styles.containerBlur}>
      <View >
        <TouchableOpacity style={[styles.buttonMenu, styles.buttonHome]}>
          <Image
            style={{ width: 24, height: 24 }}
            source={require('./../assets/images/home.png')}
          />
        </TouchableOpacity>
      </View>

      <View >
        <TouchableOpacity style={[styles.buttonMenu, styles.buttonProfil]}>
          <Image
            style={{ width: 24, height: 24 }}
            source={require('./../assets/images/profil.png')}
          />
        </TouchableOpacity>
      </View>

      <View >
        <TouchableOpacity style={[styles.buttonOption, styles.buttonGrille]}>
          <Image
            style={{ width: 24, height: 24 }}
            source={require('./../assets/images/grille.png')}
          />
        </TouchableOpacity>
      </View>

      <View >
        <TouchableOpacity style={[styles.buttonOption, styles.buttonGrille]}>
          <Image
            style={{ width: 24, height: 24 }}
            source={require('./../assets/images/gyro.png')}
          />
        </TouchableOpacity>
      </View>

      <View style={[styles.containerJoystick, { right: 50, bottom: 50 }]}>
        <View style={styles.baseJoystick}>
          <View
            style={[styles.stickJoystick]}
          />
        </View>
      </View>

      <View style={[styles.containerJoystick, { left: 75, bottom: 50 }]}>
        <View style={styles.baseJoystick}>
          <View
            style={[styles.stickJoystick]}
          />
        </View>
      </View>

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
  buttonMenu: {
    width: 45,
    height: 45,
    position: 'absolute',
    padding: 12,
    borderRadius: 100,
    backgroundColor: '#909FF7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonHome: {
    top: 25,
    left: 24,
  },
  buttonProfil: {
    top: 25,
    left: 80,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  buttonOption: {
    width: 45,
    height: 45,
    position: 'absolute',
    padding: 12,
    borderRadius: 100,
    backgroundColor: 'rgba(9, 0, 255, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonGrille: {
    top: 25,
    right: 138,
  },
  containerJoystick: {
    position: 'absolute',

    width: 100,
    height: 100,
    shadowColor: 'rgba(56, 55, 94, 0.5)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  baseJoystick: {
    width: 78,
    height: 78,
    borderRadius: 78,
    backgroundColor: 'rgba(244, 244, 244, 0.50)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickJoystick: {
    width: 48,
    height: 48,
    borderRadius: 48,
    backgroundColor: 'rgba(244, 244, 244, 0.75)',
  },
});
