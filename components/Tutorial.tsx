import React, { useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Text } from 'react-native';
import { BlurView } from 'expo-blur';

interface ScreenTutorialProps {
  onPress?: () => void;
}

export default function ScreenTutorial({ onPress }: ScreenTutorialProps) {
  // 0 = rien sauf la flèche, 1 = home, 2 = profil, etc...
  const [step, setStep] = useState(0);

  const nextStep = () => {
    setStep((s) => {
      // total d'étapes à afficher (ajuste si tu ajoutes/enlèves des éléments)
      const max = 7;
      if (s >= max) {
        // option: terminer le tuto
        onPress?.();
        return s;
      }
      return s + 1;
    });
  };

  return (
    <BlurView intensity={10} style={styles.containerBlur}>
      {/* Arrow toujours visible + cliquable */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={nextStep}
        style={styles.containerArrow}
      >
        <Image
          style={styles.arrow}
          source={require('./../assets/icons/arrow2.png')}
        />

      </TouchableOpacity>

      {/* Étape 1 */}
      {step === 0 && (
        <View>
          <TouchableOpacity style={[styles.buttonMenu, styles.buttonHome]}>
            <Image
              style={{ width: 24, height: 24 }}
              source={require('./../assets/images/home.png')}
            />
          </TouchableOpacity>
        </View>
      )}

      {step === 0 && (
        <View style={[styles.containerTuto, {top: 58, left: 33}]}>
          <View style={styles.cercleTuto}>
            <View style={styles.cercle}>
            </View>
          </View>
          <Text style={styles.tutoTexte}>Retour à l'acceuil</Text>
        </View>
      )}

      {/* Étape 2 */}
      {step === 1 && (
        <View>
          <TouchableOpacity style={[styles.buttonMenu, styles.buttonProfil]}>
            <Image
              style={{ width: 24, height: 24 }}
              source={require('./../assets/images/profil.png')}
            />
          </TouchableOpacity>
        </View>
      )}

      {step === 1 && (
        <View style={[styles.containerTuto, {top: 58, left: 89}]}>
          <View style={styles.cercleTuto}>
            <View style={styles.cercle}>
            </View>
          </View>
          <Text style={styles.tutoTexte}>Remplissez votre fiche Artiste</Text>
        </View>
      )}

      {/* Étape 3 */}
      {step === 2 && (
        <View>
          <TouchableOpacity style={[styles.buttonOption, styles.buttonGrille]}>
            <Image
              style={{ width: 24, height: 24 }}
              source={require('./../assets/images/grille.png')}
            />
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && (
        <View style={[styles.containerTuto, {top: 58, right: 146}]}>
          <Text style={styles.tutoTexte}>Affichage grille</Text>
          <View style={styles.cercleTuto}>
            <View style={styles.cercle}>
            </View>
          </View>
        </View>
      )}

      {/* Étape 4 */}
      {step === 3 && (
        <View>
          <TouchableOpacity style={[styles.buttonOption, styles.buttonGyro]}>
            <Image
              style={{ width: 24, height: 24 }}
              source={require('./../assets/images/gyro.png')}
            />
          </TouchableOpacity>
        </View>
      )}

      {step === 3 && (
        <View style={[styles.containerTuto, {top: 58, right: 89}]}>
          <Text style={styles.tutoTexte}>Vision gyroscope</Text>
          <View style={styles.cercleTuto}>
            <View style={styles.cercle}>
            </View>
          </View>
        </View>
      )}

      {/* Étape 5 */}
      {step === 4 && (
        <View>
          <TouchableOpacity style={styles.buttonEdit}>
            <Image
              style={{ width: 35, height: 35 }}
              source={require('./../assets/images/edit.png')}
            />
          </TouchableOpacity>
        </View>
      )}

      {step === 4 && (
        <View style={[styles.containerTuto, {top: 58, right: 32}]}>
          <Text style={styles.tutoTexte}>Mode création</Text>
          <View style={styles.cercleTuto}>
            <View style={styles.cercle}>
            </View>
          </View>
        </View>
      )}

      {/* Étape 6 */}
      {step === 5 && (
        <View style={[styles.containerJoystick, { left: 75, bottom: 50 }]}>
          <View style={styles.baseJoystick}>
            <View style={styles.stickJoystick} />
          </View>
        </View>
      )}

      {step === 5 && (
        <View style={[styles.containerJoystick, { right: 50, bottom: 50 }]}>
          <View style={styles.baseJoystick}>
            <View style={styles.stickJoystick} />
          </View>
        </View>
      )}

      {step === 5 && (
        <View style={[styles.containerTuto, {bottom: 92}]}>
          <View style={styles.cercleTuto}>
            <View style={styles.cercle}>
            </View>
          </View>
          <Text style={styles.tutoTexte}>Joystick</Text>
        </View>
      )}

      {step === 5 && (
        <View style={[styles.containerTuto, {bottom: 35, right: 88}]}>
          <Text style={styles.tutoTexte}>Vision</Text>
        </View>
      )}

      {step === 5 && (
        <View style={[styles.containerTuto, {bottom: 35, left: 70}]}>
          <Text style={styles.tutoTexte}>Déplacement</Text>
        </View>
      )}

    </BlurView>
  );
}

const styles = StyleSheet.create({
  containerBlur: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 999,
    backgroundColor: 'rgba(179, 184, 194, 0.60)',
  },
  containerArrow: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    // important: pour capter le clic sur toute la zone
    zIndex: 1000,
  },
  containerTuto: {
    position: 'absolute',
    height: 36,
    alignSelf: 'center',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  cercleTuto: {
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
  cercle: {
    width: 16,
    height: 16,
    borderRadius: 100,
    backgroundColor: '#0900FF',
  },
  tutoTexte: {
    color: '#0900FF',
    fontWeight: '600',
  },
  arrow: {
    position: 'absolute',
    right: 24,
    width: 80,
    height: 80,
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
  buttonGyro: {
    top: 25,
    right: 80,
  },
  buttonEdit: {
    position: 'absolute',
    top: 25,
    right: 24,
    width: 45,
    height: 45,
    padding: 5,
    borderRadius: 100,
    backgroundColor: 'rgba(244, 244, 244, 0.50)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerJoystick: {
    position: 'absolute',
    width: 100,
    height: 100,
    shadowColor: 'rgba(56, 55, 94, 0.5)',
    shadowOffset: { width: 0, height: 4 },
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
