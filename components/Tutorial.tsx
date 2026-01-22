import React, { useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import ButtonTime from "./../components/ButtonTime";
import ButtonWeather from "./../components/ButtonWeather";
import IconNone from "./../assets/icons/noneclean.svg";
import IconRain from "./../assets/icons/rainclean.svg";
import IconSnow from "./../assets/icons/snowclean.svg";
import IconButterfly from "./../assets/icons/butterflyclean.svg";
import IconMorning from "./../assets/icons/morningclean.svg";
import IconEvening from "./../assets/icons/eveningclean.svg";
import IconNight from "./../assets/icons/nightclean.svg";
import ButtonFloor from "./../components/ButtonFloor";
import FogControl, { initializeFog, updateFogDensity } from "./../components/FogControl";

interface ScreenTutorialGalerieProps {
  onPress?: () => void;
  onTutorialGalerieComplete?: () => void;
}

interface ScreenTutorialEditProps {
  onPress?: () => void;
  onTutorialEditComplete?: () => void;
}

export function ScreenTutorialGalerie({ onPress, onTutorialGalerieComplete }: ScreenTutorialGalerieProps) {
  const [step, setStep] = useState(0);

  const nextStep = () => {
    setStep((s) => {
      const max = 6;
      if (s >= max) {
        onPress?.();
        onTutorialGalerieComplete?.();
        return s;
      }
      return s + 1;
    });
  };

  return (
    <View style={styles.container}>
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
          <View style={[styles.containerTuto, { top: 58, left: 35 }]}>
            <View style={styles.cercleTuto}>
              <View style={styles.cercle}>
              </View>
            </View>
            <Text style={styles.tutoTexte}>Acceuil</Text>
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
          <View style={[styles.containerTuto, { top: 58, left: 92 }]}>
            <View style={styles.cercleTuto}>
              <View style={styles.cercle}>
              </View>
            </View>
            <Text style={styles.tutoTexte}>Fiche artiste</Text>
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
          <View style={[styles.containerTuto, { top: 58, right: 155 }]}>
            <Text style={styles.tutoTexte}>Grille</Text>
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
          <View style={[styles.containerTuto, { top: 58, right: 100 }]}>
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
          <View style={[styles.containerTuto, { top: 58, right: 45 }]}>
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
          <View style={[styles.containerTuto, { bottom: 92 }]}>
            <View style={styles.cercleTuto}>
              <View style={styles.cercle}>
              </View>
            </View>
            <Text style={styles.tutoTexte}>Joystick</Text>
          </View>
        )}

        {step === 5 && (
          <View style={[styles.containerTuto, { bottom: 35, right: 88 }]}>
            <Text style={styles.tutoTexte}>Vision</Text>
          </View>
        )}

        {step === 5 && (
          <View style={[styles.containerTuto, { bottom: 35, left: 70 }]}>
            <Text style={styles.tutoTexte}>Déplacement</Text>
          </View>
        )}

        {step === 5 && (
          <View style={[styles.containerTuto, { bottom: 92, right: 165 }]}>
            <Image
              style={{width: 200, height: 1 }}
              source={require('./../assets/images/line.png')}
            />
          </View>
        )}

        {step === 5 && (
          <View style={[styles.containerTuto, { bottom: 92, left: 165 }]}>
            <Image
              style={{width: 200, height: 1 }}
              source={require('./../assets/images/line.png')}
            />
          </View>
        )}

        {/* Étape 7 */}
        {step === 6 && (
          <View style={styles.wall}>
          </View>
        )}

        {step === 6 && (
          <View style={[styles.containerTuto, { top: '50%', left: '50%', transform: [{ translateX: 86 }, { translateY: -15 }] }]}>
            <View style={styles.cercleTuto}>
              <View style={styles.cercle}>
              </View>
            </View>
            <Text style={styles.tutoTexte}>Ajouter une oeuvre</Text>
          </View>
        )}

      </BlurView>
      <View style={styles.wall}>
      </View>

    </View>
  );
}

export function ScreenTutorialEdit({ onPress, onTutorialEditComplete }: ScreenTutorialEditProps) {
  const [step, setStep] = useState(0);

  const nextStep = () => {
    setStep((s) => {
      const max = 3;
      if (s >= max) {
        onPress?.();
        onTutorialEditComplete?.();
        return s;
      }
      return s + 1;
    });
  };

  return (
    <View style={styles.container}>
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
          <View style={[styles.containerTuto, { left: 25, top: 24 }]}>
            <ButtonTime
              gap={8}
              buttons={[
                {
                  id: 'morning',
                  Icon: IconMorning,
                },
                {
                  id: 'midday',
                  Icon: IconNone,
                  selected: true,
                },
                {
                  id: 'evening',
                  Icon: IconEvening,
                },
                {
                  id: 'night',
                  Icon: IconNight,
                },
              ]}
            />
          </View>
        )}

        {step === 0 && (
          <View style={[styles.containerTuto, { top: 45, left: 145 }]}>
            <View style={styles.cercleTuto}>
              <View style={styles.cercle}>
              </View>
            </View>
            <Text style={styles.tutoTexte}>Moment de la journée</Text>
          </View>
        )}

        {/* Étape 2 */}
        {step === 1 && (
          <View style={[styles.containerTuto, { left: 189, top: 24 }]}>
            <ButtonWeather
              gap={8}
              buttons={[
                {
                  id: 'none',
                  Icon: IconNone,
                  selected: true,
                },
                {
                  id: 'rain',
                  Icon: IconRain,
                },
                {
                  id: 'snow',
                  Icon: IconSnow,
                },
                {
                  id: 'butterfly',
                  Icon: IconButterfly,
                },
              ]}
            />
          </View>
        )}

        {step === 1 && (
          <View style={[styles.containerTuto, { top: 45, left: 275 }]}>
            <View style={styles.cercleTuto}>
              <View style={styles.cercle}>
              </View>
            </View>
            <Text style={styles.tutoTexte}>Météo</Text>
          </View>
        )}

        {/* Étape 3 */}
        {step === 2 && (
          <View style={[styles.containerTuto, { left: 354, top: 24 }]}>
            <FogControl
              minValue={0}
              maxValue={0.3}
              step={0.01}
            />
          </View>
        )}

        {step === 2 && (
          <View style={[styles.containerTuto, { top: 45, left: 510 }]}>
            <View style={styles.cercleTuto}>
              <View style={styles.cercle}>
              </View>
            </View>
            <Text style={styles.tutoTexte}>Brouillard</Text>
          </View>
        )}

        {/* Étape 4 */}
        {step === 3 && (
          <View>
            <TouchableOpacity style={styles.buttonEdit}>
              <Image
                style={{ width: 35, height: 35 }}
                source={require('./../assets/images/no_edit.png')}
              />
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View style={[styles.containerTuto, { top: 52, right: 45 }]}>
            <Text style={styles.tutoTexte}>Mode galerie</Text>
            <View style={styles.cercleTuto}>
              <View style={styles.cercle}>
              </View>
            </View>
          </View>
        )}

      </BlurView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 999,
  },
  wall: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -150 }],
    width: 200,
    height: 300,
    backgroundColor: '#ffffff',
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
  containerArrow: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '300',
    fontFamily: 'Futura',
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
  line: {
    position: 'absolute',
  },
  containerFloor: {
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
  buttonContainerFloor: {
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
  buttonFloor: {
    width: 16,
    height: 16,
    borderRadius: 100,
    backgroundColor: '#0900FF',
  },
  buttonTextFloor: {
    color: '#0900FF',
    fontWeight: '600',
  },
});
