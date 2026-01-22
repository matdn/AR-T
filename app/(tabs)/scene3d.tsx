import { GLView, type ExpoWebGLRenderingContext } from "expo-gl";
import { Renderer, TextureLoader } from "expo-three";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, GestureResponderEvent, Modal, TouchableOpacity, Text, Pressable } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { Asset } from 'expo-asset';
import * as ImageManipulator from 'expo-image-manipulator';
import * as THREE from "three";
import * as ScreenOrientation from 'expo-screen-orientation';
import { Audio } from "expo-av";
import { useFonts } from "expo-font";

import Joystick from "../../components/Joystick";
import ButtonMenu from "../../components/ButtonMenu";
import ButtonOption from "../../components/ButtonOption";
import ButtonEdit from "../../components/ButtonEdit";
import ButtonTime from "../../components/ButtonTime";
import ButtonWeather from "../../components/ButtonWeather";
import ButtonGrassColor from "../../components/ButtonGrassColor";
import ButtonFloor from "../../components/ButtonFloor";
import IconNone from "../../assets/icons/noneclean.svg";
import IconRain from "../../assets/icons/rainclean.svg";
import IconSnow from "../../assets/icons/snowclean.svg";
import IconButterfly from "../../assets/icons/butterflyclean.svg";
import IconMorning from "../../assets/icons/morningclean.svg";
import IconEvening from "../../assets/icons/eveningclean.svg";
import IconNight from "../../assets/icons/nightclean.svg";
import { ScreenTutorialGalerie, ScreenTutorialEdit } from "../../components/Tutorial";
import ResetButton from "../../components/ResetButton";
import FogControl, { initializeFog, updateFogDensity } from "../../components/FogControl";
import { useDeviceMotion } from "../../hooks/useDeviceMotion";
import { useTapDetector } from "../../hooks/useTapDetector";
import { setDeviceQuaternion } from "../../utils/quaternion";
import {
  createPlanet,
  addGridLinesToPlanet,
  createRandomRectangles,
  createRectangle,
  createGrassGrid,
  createInnerAtmosphere,
  createGridFloor,
} from "../../utils/sceneObjects";
import {
  rotatePlanetWithCamera,
  checkCollisions,
} from "../../utils/sceneHelpers";
import { updateGrassTime } from "../../utils/grassShader";
import { getGrassColorByMode, type GrassColorMode } from "../../utils/grassShader";
import { updateGrassWrapping, updateGrassShaderFog } from "../../utils/grassHelpers";
import {
  renderWithAtmosphere,
  type AtmosphereRenderData
} from "../../utils/atmosphereHelpers";
import {
  createAtmosphereMeshes,
  updateAtmosphereLUT, updateEnvironmentMaterial
} from "@/components/Atmosphere";
import { createWeatherSystem } from "@/components/Weather";
import {
  initializeButterflySystem,
  updateButterflyAnimation,
  disposeButterflySystem,
  type ButterflyData,
} from "../../components/Butterflies";



export default function SceneThree() {
  const animationFrameId = useRef<number | null>(null);
  const rotationRef = useDeviceMotion();
  const [isLandscape, setIsLandscape] = useState(true);
  const [motionControlEnabled, setMotionControlEnabled] = useState(false);
  const [grilleEnabled, setGrilleEnabled] = useState(false);

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);
  const planetRef = useRef<THREE.Mesh | null>(null);
  const wallsRef = useRef<THREE.Mesh[]>([]);
  const rendererRef = useRef<Renderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const [screenDimensions, setScreenDimensions] = useState({ width: 0, height: 0 });
  const [sceneKey, setSceneKey] = useState(0); // Pour forcer le reload du GLView
  const [viewSize, setViewSize] = useState({ width: 0, height: 0 });
  const [tapYBiasNDC] = useState(-1); // Petit biais vertical en NDC pour remonter le rayon

  const baseQuatRef = useRef<THREE.Quaternion>(new THREE.Quaternion());
  const deviceQuatRef = useRef<THREE.Quaternion>(new THREE.Quaternion());
  const calibrationQuatRef = useRef<THREE.Quaternion>(new THREE.Quaternion());

  const [loaded] = useFonts({
    "Futura": require("../../assets/fonts/fontbook2.otf"),
  });

  const velocityRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [lookJoystickPosition, setLookJoystickPosition] = useState({ x: 0, y: 0 });

  const grassGroupRef = useRef<THREE.Group | null>(null);
  const grassMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const grassParamsRef = useRef<{
    gridSize: number;
    step: number;
    halfWidth: number;
    wrapDistance: number;
  } | null>(null);

  const waterGroupRef = useRef<THREE.Group | null>(null);
  const waterMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const waterDudvRef = useRef<THREE.Texture | null>(null);

  const prevRotRef = useRef({ x: 0, z: 0 });
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  const atmosphereDataRef = useRef<AtmosphereRenderData | null>(null);
  const innerAtmosphereRef = useRef<THREE.Group | null>(null);
  const gridFloorRef = useRef<THREE.Group | null>(null);
  const grilleEnabledRef = useRef(false);

  const hdriTextureRef = useRef<THREE.Texture | null>(null);
  const hdriEnvRTRef = useRef<THREE.WebGLRenderTarget | null>(null);
  const pmremGenRef = useRef<THREE.PMREMGenerator | null>(null);

  // joystick look (quand gyro OFF)
  const lookInputRef = useRef({ x: 0, y: 0 }); // x=yaw, y=pitch ([-1..1] ou un range similaire)
  const manualLookQuatRef = useRef(new THREE.Quaternion());

  // limites pitch
  const pitchRef = useRef(0); // radians
  const yawRef = useRef(0);   // radians

  const ambienceSoundRef = useRef<Audio.Sound | null>(null);
  const ambienceKeyRef = useRef<string | null>(null);
  const ambienceTokenRef = useRef(0);

  const AMBIENCE_SOURCES = {
    rain: require("../../assets/audio/ambience/rain.mp3"),
    snow: require("../../assets/audio/ambience/wind.mp3"),
    butterflyDay: require("../../assets/audio/ambience/cicada.mp3"),
    butterflyNight: require("../../assets/audio/ambience/cricket.mp3"),
    day: require("../../assets/audio/ambience/bird.mp3"),
    night: require("../../assets/audio/ambience/owl.mp3"),
  } as const;

  type AmbienceKey = keyof typeof AMBIENCE_SOURCES;

  const getAmbienceKey = (
    weather: "rain" | "snow" | "butterfly" | "none",
    time: "morning" | "midday" | "evening" | "night"
  ): AmbienceKey => {
    if (weather === "rain") return "rain";
    if (weather === "snow") return "snow";
    if (weather === "butterfly") return time === "morning" || time === "midday" ? "butterflyDay" : "butterflyNight";
    // weather === "none"
    return time === "morning" || time === "midday" ? "day" : "night";
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const fadeVolume = async (sound: Audio.Sound, from: number, to: number, ms = 400, steps = 12) => {
    const dt = ms / steps;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const v = from + (to - from) * t;
      try {
        await sound.setVolumeAsync(Math.max(0, Math.min(1, v)));
      } catch {
        // ignore si le son a été unload entre temps
        return;
      }
      await sleep(dt);
    }
  };

  const stopAndUnloadAmbience = async () => {
    const s = ambienceSoundRef.current;
    ambienceSoundRef.current = null;
    ambienceKeyRef.current = null;
    if (!s) return;
    try {
      await s.stopAsync();
    } catch { }
    try {
      await s.unloadAsync();
    } catch { }
  };

  const playAmbienceForKey = async (key: AmbienceKey) => {
    const token = ++ambienceTokenRef.current;

    // si c'est déjà le bon son, ne fais rien
    if (ambienceKeyRef.current === key && ambienceSoundRef.current) return;

    // coupe l'ancien en fondu
    const prev = ambienceSoundRef.current;
    if (prev) {
      try {
        const status = await prev.getStatusAsync();
        const prevVol = (status as any)?.volume ?? 1;
        await fadeVolume(prev, prevVol, 0, 350);
      } catch { }
      try { await prev.stopAsync(); } catch { }
      try { await prev.unloadAsync(); } catch { }
    }

    // si un autre changement est intervenu pendant le fade, on abandonne
    if (token !== ambienceTokenRef.current) return;

    // charge le nouveau
    const source = AMBIENCE_SOURCES[key];
    const { sound } = await Audio.Sound.createAsync(
      source,
      {
        shouldPlay: true,
        isLooping: true,
        volume: 0, // on fade in
      }
    );

    // si un autre changement est intervenu pendant le load, on cleanup
    if (token !== ambienceTokenRef.current) {
      try { await sound.stopAsync(); } catch { }
      try { await sound.unloadAsync(); } catch { }
      return;
    }

    ambienceSoundRef.current = sound;
    ambienceKeyRef.current = key;

    // fade in
    await fadeVolume(sound, 0, 1, 450);
  };

  const handleLookJoystickMove = (v: { x: number; z: number }) => {
    lookInputRef.current = { x: v.x, y: v.z };

    const maxDistance = 40;
    setLookJoystickPosition({
      x: -v.x * maxDistance,
      y: v.z * maxDistance,
    });
  };

  const handleLookJoystickRelease = () => {
    lookInputRef.current = { x: 0, y: 0 };
    setLookJoystickPosition({ x: 0, y: 0 });
  };


  const weatherRef = useRef<{
    rain?: { group: THREE.Group; update: (dt?: number) => void; material: THREE.SpriteMaterial };
    snow?: { group: THREE.Group; update: (dt?: number) => void; material: THREE.SpriteMaterial };
  }>({});
  const [weatherMode, setWeatherMode] = useState<'rain' | 'snow' | 'butterfly' | 'none'>('none');

  const [timeMode, setTimeMode] = useState<'morning' | 'midday' | 'evening' | 'night'>('midday');

  const butterflyDataRef = useRef<ButterflyData | null>(null);

  const [fogDensity, setFogDensity] = useState(0);
  const fogDensityRef = useRef(0);

  const [isEditMode, setIsEditMode] = useState(false);

  const [tutorialGalerieCompleted, setTutorialGalerieCompleted] = useState(false);
  const [tutorialEditCompleted, setTutorialEditCompleted] = useState(false);

  const [isGrassColorMode, setIsGrassColorMode] = useState(false);

  const [grassColorMode, setGrassColorMode] = useState<'yellow_1' | 'orange' | 'pink' | 'blue' | 'green_1' | 'green_2' | 'yellow_2' | 'red'>('green_1');

  const [groundMode, setGroundMode] = useState<'grass' | 'water'>('grass');

  // Billboarding temps (évite des allocations par frame)
  const tmpRectWorldPosRef = useRef(new THREE.Vector3());
  const tmpCamWorldPosRef = useRef(new THREE.Vector3());
  const tmpPlanetWorldPosRef = useRef(new THREE.Vector3());
  const tmpUpNormalRef = useRef(new THREE.Vector3());
  const tmpToCamRef = useRef(new THREE.Vector3());
  const tmpForwardRef = useRef(new THREE.Vector3());
  const tmpRightRef = useRef(new THREE.Vector3());
  const tmpBasisMatrixRef = useRef(new THREE.Matrix4());
  const tmpWorldQuatRef = useRef(new THREE.Quaternion());
  const tmpParentWorldQuatRef = useRef(new THREE.Quaternion());
  const tmpInvParentWorldQuatRef = useRef(new THREE.Quaternion());

  const applyTextureToRect = async (rect: THREE.Mesh, uri: string) => {
    try {
      const asset = Asset.fromURI(uri);
      await asset.downloadAsync();
      // Déterminer la source locale de l'image
      const source = asset.localUri ?? asset.uri ?? uri;

      // Redimensionner pour éviter des textures trop grandes (prévenir pertes de contexte GL)
      const MAX_DIM = 1024; // Taille max pour éviter pertes de contexte GL sur mobile
      let processedUri = source;
      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          source,
          [{ resize: { width: MAX_DIM } }], // conserve le ratio
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
        );
        if (manipulated?.uri) processedUri = manipulated.uri;
      } catch (err) {
        console.warn('Redimensionnement image échoué, utilisation de la source originale', err);
      }

      // Charger la texture via expo-three TextureLoader
      const texture = await new TextureLoader().loadAsync(processedUri);
      // Paramètres sûrs pour NPOT
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.flipY = false;

      // Fix orientation (certaines images ressortent "à l'envers" sur les murs)
      texture.center.set(0.5, 0.5);
      texture.rotation = Math.PI;
      texture.needsUpdate = true;

      // Appliquer la texture uniquement sur les 2 grandes faces (indices 4 et 5 = front et back)
      const mat = rect.material;
      if (Array.isArray(mat)) {
        // Appliquer la texture uniquement aux faces front (4) et back (5) - les grandes faces 3x3
        for (let i = 4; i < Math.min(6, mat.length); i++) {
          const ms = mat[i] as any;
          // libérer l'ancienne map si présente
          const prevMap = (ms as any).map as THREE.Texture | undefined;
          if (prevMap && typeof prevMap.dispose === 'function') {
            try { prevMap.dispose(); } catch { }
          }
          (ms as any).map = texture;
          // Ne pas teinter la texture
          try { ms.color?.set?.(0xffffff as any); } catch { }
          // Ne pas impacter par fog/tonemapping
          try { ms.fog = false; } catch { }
          try { ms.toneMapped = false; } catch { }
          // Ne pas impacter par un envMap (si le matériau le supporte)
          try { (ms as any).envMapIntensity = 0; } catch { }
          ms.needsUpdate = true;
        }
        // Les autres faces (0-3) gardent leur couleur de bordure blanche (pas de texture)
      } else {
        // Fallback si ce n'est pas un tableau (ne devrait pas arriver avec les nouveaux rectangles)
        const ms = mat as any;
        const prevMap = (ms as any).map as THREE.Texture | undefined;
        if (prevMap && typeof prevMap.dispose === 'function') {
          try { prevMap.dispose(); } catch { }
        }
        (ms as any).map = texture;
        try { ms.color?.set?.(0xffffff as any); } catch { }
        try { ms.fog = false; } catch { }
        try { ms.toneMapped = false; } catch { }
        try { (ms as any).envMapIntensity = 0; } catch { }
        ms.needsUpdate = true;
      }
    } catch (e) {
      console.warn('Échec du chargement de la texture depuis l\'URI:', uri, e);
    }
  };

  const hdriLoadTokenRef = useRef(0);

  const loadHdriForMode = async (mode: 'morning' | 'midday' | 'evening' | 'night') => {
    const scene = sceneRef.current;
    const renderer = rendererRef.current;

    if (!scene || !renderer) return;

    const token = ++hdriLoadTokenRef.current;

    try {
      const skyByMode: Record<typeof mode, any> = {
        morning: require('../../assets/textures/envMapMatin.png'),
        midday: require('../../assets/textures/envMapMidday.png'),
        evening: require('../../assets/textures/envMapSoir.png'),
        night: require('../../assets/textures/envMapNuitV2.png'),
      };

      const skyModule = skyByMode[mode];
      const skyAsset = Asset.fromModule(skyModule);
      await skyAsset.downloadAsync();
      const skyUri = skyAsset.localUri ?? skyAsset.uri;

      // Si un autre clic a lancé un nouveau chargement entre temps, on annule celui-ci
      if (token !== hdriLoadTokenRef.current) return;

      const skyTexture = await new TextureLoader().loadAsync(skyUri);

      // (re-check token après chargement texture)
      if (token !== hdriLoadTokenRef.current) {
        try { skyTexture.dispose(); } catch { }
        return;
      }

      skyTexture.mapping = THREE.EquirectangularReflectionMapping;
      skyTexture.wrapS = THREE.ClampToEdgeWrapping;
      skyTexture.wrapT = THREE.ClampToEdgeWrapping;
      skyTexture.minFilter = THREE.LinearFilter;
      skyTexture.magFilter = THREE.LinearFilter;
      skyTexture.generateMipmaps = false;
      skyTexture.flipY = false;

      // cleanup ancien HDRI
      try { hdriEnvRTRef.current?.dispose?.(); } catch { }
      try { pmremGenRef.current?.dispose?.(); } catch { }
      try { hdriTextureRef.current?.dispose?.(); } catch { }

      const pmrem = new THREE.PMREMGenerator(renderer as any);
      pmrem.compileEquirectangularShader();
      const envRT = pmrem.fromEquirectangular(skyTexture);

      hdriTextureRef.current = skyTexture;
      pmremGenRef.current = pmrem;
      hdriEnvRTRef.current = envRT;

      scene.background = null;
      scene.environment = envRT.texture;
    } catch (e) {
      console.warn('[HDRI] Échec chargement HDRI:', e);
    }
  };


  const handleScreenTap = async (event: GestureResponderEvent) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[Tap] received', {
        x: event?.nativeEvent?.locationX,
        y: event?.nativeEvent?.locationY,
        isGrassColorMode,
        hasCamera: !!cameraRef.current,
        hasPlanet: !!planetRef.current,
        viewSize,
        screenDimensions,
      });
    }

    if (isGrassColorMode) {
      setIsGrassColorMode(false);
      return;
    }

    if (!cameraRef.current || !planetRef.current) {
      console.warn('[Tap] missing camera/planet');
      return;
    }
    try {
      if (!cameraRef.current || !planetRef.current) return;

      const x = event.nativeEvent.locationX;
      const y = event.nativeEvent.locationY;

      // --- Place wall in front of the camera (ignores tap position) ---
      const cam = cameraRef.current;
      const planet = planetRef.current;

      planet.updateMatrixWorld(true);
      cam.updateMatrixWorld(true);

      const sphereCenter = planet.getWorldPosition(new THREE.Vector3());
      const geom = planet.geometry as THREE.BufferGeometry;
      if (!geom.boundingSphere) geom.computeBoundingSphere();
      const radius = (geom.boundingSphere?.radius ?? 50) * (planet.scale?.x ?? 1);

      const camPos = cam.getWorldPosition(new THREE.Vector3());
      const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).normalize();

      // Point visé "devant" la caméra
      const spawnDistance = 15;
      const pointAhead = camPos.clone().addScaledVector(camForward, spawnDistance);

      let normalWorld = pointAhead.sub(sphereCenter);
      if (normalWorld.lengthSq() < 1e-6) {
        normalWorld = camPos.clone().sub(sphereCenter);
      }
      normalWorld.normalize();

      // Empêcher les murs trop bas: on force une latitude minimale
      const minNormalY = 0.25;
      if (normalWorld.y < minNormalY) {
        normalWorld.y = minNormalY;
        normalWorld.normalize();
      }

      const hitPointWorld = sphereCenter.clone().addScaledVector(normalWorld, radius);

        // IMPORTANT: on ajoute le rectangle en enfant de `planet`, donc on doit travailler en coordonnées LOCALES planète
        const hitPointLocal = planet.worldToLocal(hitPointWorld.clone());
        const normalLocal = hitPointLocal.clone().normalize();

        // Créer le rectangle + ouvrir directement la galerie
        // Offset plus haut pour éviter qu'il rentre dans la planète
        const rectangle = createRectangle(hitPointLocal, normalLocal, 2.5);
        rectangle.layers.set(1);

        // Base tangent (local): 2 axes "sur le sol" pour flotter latéralement
        const tangentX = new THREE.Vector3(0, 1, 0).cross(normalLocal);
        if (tangentX.lengthSq() < 1e-6) tangentX.set(1, 0, 0).cross(normalLocal);
        tangentX.normalize();
        const tangentY = new THREE.Vector3().crossVectors(normalLocal, tangentX).normalize();

        // Ajouter les données pour l'animation et l'interaction
        const rectCount = wallsRef.current.length;
        rectangle.userData = {
          // basePosition = position réelle du mesh (inclut déjà le heightAboveSurface)
          basePosition: rectangle.position.clone(),
          baseNormal: normalLocal.clone(),
          baseTangentX: tangentX.clone(),
          baseTangentY: tangentY.clone(),
          floatOffset: Math.random() * Math.PI * 2,
          floatSpeed: 0.5 + Math.random() * 0.5,
          floatAmplitude: 0.1 + Math.random() * 0.15,
          floatOffset2: Math.random() * Math.PI * 2,
          floatSpeed2: 0.35 + Math.random() * 0.35,
          floatAmplitude2: 0.06 + Math.random() * 0.08,
          floatOffset3: Math.random() * Math.PI * 2,
          floatSpeed3: 0.35 + Math.random() * 0.35,
          floatAmplitude3: 0.06 + Math.random() * 0.08,
          id: rectCount,
          message: `Nouveau rectangle ${rectCount + 1}`
        };

        console.log('Nouveau rectangle créé:', rectangle.userData.message);

        planet.add(rectangle);
        wallsRef.current.push(rectangle);

        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log('[Tap] wall created', {
            id: rectangle.userData?.id,
            localPos: hitPointLocal.toArray(),
            localNormal: normalLocal.toArray(),
            totalWalls: wallsRef.current.length,
          });
        }

      try {
          // Lancer le picker au tick suivant: plus fiable depuis un PanResponder
          await new Promise<void>(resolve => setTimeout(resolve, 0));

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Permission bibliothèque refusée');
          // Retirer le rectangle si on ne peut pas choisir d'image
          try { planet.remove(rectangle); } catch { }
          wallsRef.current = wallsRef.current.filter(r => r !== rectangle);
          try { (rectangle.geometry as any)?.dispose?.(); } catch { }
          try {
            const mat = rectangle.material as any;
            if (Array.isArray(mat)) mat.forEach(m => m?.dispose?.());
            else mat?.dispose?.();
          } catch { }
          return;
        }

        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log('[Tap] opening image picker');
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.log('[Tap] picked image', { uri: result.assets[0].uri });
          }
          await applyTextureToRect(rectangle, result.assets[0].uri);
        } else {
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.log('[Tap] picker canceled -> remove wall');
          }
          // Annulé: retirer le rectangle créé
          try { planet.remove(rectangle); } catch { }
          wallsRef.current = wallsRef.current.filter(r => r !== rectangle);
          try { (rectangle.geometry as any)?.dispose?.(); } catch { }
          try {
            const mat = rectangle.material as any;
            if (Array.isArray(mat)) mat.forEach(m => m?.dispose?.());
            else mat?.dispose?.();
          } catch { }
        }
      } catch (e) {
        console.warn('Erreur sélection image:', e);
      }
    } catch (e) {
      console.error('[handleScreenTap] erreur:', e);
    }
  };

  const tapResponder = useTapDetector({ onTap: handleScreenTap });

  const handleJoystickMove = (velocity: { x: number; z: number }) => {
    velocityRef.current = velocity;
    const maxDistance = 40;
    setJoystickPosition({
      x: -velocity.x * maxDistance,
      y: velocity.z * maxDistance,
    });
  };

  const handleJoystickRelease = () => {
    velocityRef.current = { x: 0, z: 0 };
    setJoystickPosition({ x: 0, y: 0 });
  };

  const handleOrientationToggle = async () => {
    const newIsLandscape = !isLandscape;

    try {
      if (isLandscape) {
        try {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } catch {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
        }
      } else {
        try {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
        } catch {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        }
      }

      setIsLandscape(newIsLandscape);

      setTimeout(() => {
        setSceneKey(prev => prev + 1);
      }, 1300);

    } catch (error) {
      console.error('Erreur lors du changement d\'orientation:', error);
    }
  };

  const handleFogDensityChange = (value: number) => {
    setFogDensity(value);
    fogDensityRef.current = value;

    updateFogDensity(sceneRef.current, value);
  };

  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true, // important sur iOS
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.warn("[AudioMode] error", e);
      }
    })();
  }, []);

  useEffect(() => {
    const key = getAmbienceKey(weatherMode, timeMode);
    playAmbienceForKey(key);
  }, [weatherMode, timeMode]);

  useEffect(() => {
    loadHdriForMode(timeMode);

    const envMesh = atmosphereDataRef.current?.envMesh;
    if (envMesh) {
      const mat = envMesh.material as THREE.MeshBasicMaterial;
      updateEnvironmentMaterial(mat, timeMode);
    }

    const grassColorMap: Record<typeof timeMode, GrassColorMode> = {
      morning: 'orange',
      midday: 'green_1',
      evening: 'pink',
      night: 'yellow_2',
    };

    setGrassColorMode(grassColorMap[timeMode]);

    // Rafraîchir l'eau pour qu'elle prenne bien le nouvel envMap (morning/midday/evening/night)
    if (waterMaterialRef.current) {
      waterMaterialRef.current.envMapIntensity = 3.0;
      waterMaterialRef.current.needsUpdate = true;
    }
  }, [timeMode]);



  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
  }, []);

  const motionControlEnabledRef = useRef(true);

  useEffect(() => {
    motionControlEnabledRef.current = motionControlEnabled;
  }, [motionControlEnabled]);

  useEffect(() => {
    grilleEnabledRef.current = grilleEnabled;
    if (gridFloorRef.current) {
      gridFloorRef.current.visible = grilleEnabled;
    }
  }, [grilleEnabled]);

  useEffect(() => {
    const v = getGrassColorByMode(grassColorMode);

    const grassMat = grassMaterialRef.current;
    if (grassMat?.uniforms?.uGrassColor?.value) {
      (grassMat.uniforms.uGrassColor.value as THREE.Vector3).copy(v);
    }

    const planet = planetRef.current;
    if (planet) {
      const mat = planet.material;
      if (!mat) return;

      if (Array.isArray(mat)) {
        mat.forEach((m) => {
          const anyM = m as any;
          if (anyM?.color?.setRGB) anyM.color.setRGB(v.x, v.y, v.z);
          anyM.needsUpdate = true;
        });
      } else {
        const m = mat as THREE.MeshStandardMaterial;
        m.color.setRGB(v.x, v.y, v.z);
        m.needsUpdate = true;
      }
    }
  }, [grassColorMode]);

  useEffect(() => {
    if (grassGroupRef.current) grassGroupRef.current.visible = (groundMode === 'grass');
    if (waterGroupRef.current) waterGroupRef.current.visible = (groundMode === 'water');
  }, [groundMode, sceneKey]);




  useEffect(() => {
    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }

      if (atmosphereDataRef.current) {
        atmosphereDataRef.current.renderTarget?.dispose();
        atmosphereDataRef.current.postMaterial?.dispose();
        atmosphereDataRef.current = null;
      }

      if (sceneRef.current) {
        try { (sceneRef.current as any).background = null; } catch { }
        try { (sceneRef.current as any).environment = null; } catch { }
      }
      try { hdriEnvRTRef.current?.dispose?.(); } catch { }
      try { pmremGenRef.current?.dispose?.(); } catch { }
      try { hdriTextureRef.current?.dispose?.(); } catch { }
      hdriEnvRTRef.current = null;
      pmremGenRef.current = null;
      hdriTextureRef.current = null;

      if (grassMaterialRef.current) {
        grassMaterialRef.current.dispose();
        grassMaterialRef.current = null;
      }

      const scene = sceneRef.current;
      const waterGroup = waterGroupRef.current;
      if (waterGroup) {
        try { waterGroup.parent?.remove(waterGroup); } catch { }
        waterGroup.traverse((obj) => {
          const anyObj = obj as any;
          if (anyObj?.geometry?.dispose) {
            try { anyObj.geometry.dispose(); } catch { }
          }
          if (anyObj?.material?.dispose) {
            try { anyObj.material.dispose(); } catch { }
          }
        });
      }

      if (waterMaterialRef.current) {
        try { waterMaterialRef.current.dispose(); } catch { }
        waterMaterialRef.current = null;
      }

      if (waterDudvRef.current) {
        try { waterDudvRef.current.dispose(); } catch { }
        waterDudvRef.current = null;
      }
      waterGroupRef.current = null;

      // NOTE: on redéclare `scene` plus haut maintenant
      if (scene) {
        if (weatherRef.current.rain) {
          scene.remove(weatherRef.current.rain.group);
          try { weatherRef.current.rain.material.map?.dispose?.(); } catch { }
          try { weatherRef.current.rain.material.dispose?.(); } catch { }
        }
        if (weatherRef.current.snow) {
          scene.remove(weatherRef.current.snow.group);
          try { weatherRef.current.snow.material.map?.dispose?.(); } catch { }
          try { weatherRef.current.snow.material.dispose?.(); } catch { }
        }
        weatherRef.current = {};
      }

      disposeButterflySystem(butterflyDataRef.current);
      butterflyDataRef.current = null;

      stopAndUnloadAmbience();
    };
  }, [sceneKey]);


  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    // Expo GL (EXGL) expose parfois renderbufferStorageMultisample() mais l'implémentation native n'existe pas.
    // Three.js peut l'appeler via des renderTargets WebGL2 => crash.
    // On force un fallback "sans MSAA" pour éviter l'exception.
    try {
      const anyGl = gl as any;
      anyGl.renderbufferStorageMultisample = (
        target: number,
        _samples: number,
        internalformat: number,
        width: number,
        height: number
      ) => anyGl.renderbufferStorage(target, internalformat, width, height);
    } catch { }

    if (atmosphereDataRef.current) {
      atmosphereDataRef.current.renderTarget?.dispose();
      atmosphereDataRef.current.postMaterial?.dispose();
      atmosphereDataRef.current = null;
    }

    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    setScreenDimensions({ width, height });

    const renderer = new Renderer({ gl, antialias: false });
    renderer.setSize(width, height);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xffffff);

    // Initialiser le fog via le composant FogControl
    initializeFog(scene, fogDensityRef.current, 0xFFFFFF);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    cameraRef.current = camera;

    // Les murs/écrans sont sur le layer 1
    camera.layers.enable(1);

    camera.position.set(0, 2, 3);
    camera.rotation.order = "YXZ";

    camera.lookAt(0, 2, 0);
    camera.updateMatrixWorld();

    baseQuatRef.current.copy(camera.quaternion);

    {
      const { alpha, beta, gamma } = rotationRef.current;
      const initialDeviceQuat = new THREE.Quaternion();
      setDeviceQuaternion(initialDeviceQuat, alpha, beta, gamma, 0, isLandscape);
      const invDevice = initialDeviceQuat.clone().invert();
      calibrationQuatRef.current.copy(baseQuatRef.current).multiply(invDevice);
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(3, 5, 2);
    scene.add(dirLight);

    const planet = createPlanet();
    addGridLinesToPlanet(planet);
    planet.renderOrder = 1; // Rendre la planète après l'atmosphère
    scene.add(planet);
    planetRef.current = planet;

    const innerAtmo = createInnerAtmosphere();
    innerAtmo.renderOrder = 2; // Rendre par dessus la planète
    scene.add(innerAtmo);
    innerAtmosphereRef.current = innerAtmo;

    const gridFloor = createGridFloor();
    gridFloor.renderOrder = 2; // Rendre par dessus la planète
    gridFloor.visible = false; // Masqué par défaut
    scene.add(gridFloor);
    gridFloorRef.current = gridFloor;

    // Démarrer sans murs: ils seront créés au tap + sélection d'image
    wallsRef.current = [];

    const atmosphereData = createAtmosphereMeshes(scene, width, height, {
      planetPosition: new THREE.Vector3(0, -50, 0),
      envRadius: 100,
      enableLUT: true,
      lutIntensity: 1,
      timeMode: timeMode,
    });

    // Remplacer la LUT par un HDRI (background + lighting)
    atmosphereDataRef.current = atmosphereData;
    loadHdriForMode(timeMode);

    const grassData = createGrassGrid({
      gridSize: 8,
      tileSize: 4,
      spacing: 0.01,
      instancesPerTile: 500,
      bladeWidth: 0.1,
      bladeHeight: 1,
      minHeight: 0.2,
      maxHeight: 0.6,
    });

    // Eau: coque sphérique collée à la planète (suit sa forme)
    const waterGroup = new THREE.Group();
    const waterRadius = 50.15;
    // Coque sphérique complète (recouvre toute la planète)
    const waterGeometry = new THREE.SphereGeometry(waterRadius, 64, 64);
    const waterMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x0b1a2b),
      roughness: 0.02,
      metalness: 0.0,
      transmission: 0.0,
      thickness: 0.0,
      transparent: true,
      opacity: 1,
      envMapIntensity: 3.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
    });

    // Évite les artefacts quand la coque est très proche de la planète
    waterMaterial.depthWrite = false;

    const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    waterMesh.frustumCulled = false;
    waterMesh.renderOrder = 1;

    waterGroup.add(waterMesh);
    waterMaterialRef.current = waterMaterial;

    // Charger la texture DUDV et l'utiliser comme normalMap animée
    (async () => {
      try {
        const dudvAsset = Asset.fromModule(require('../../assets/textures/waterudv.png'));
        await dudvAsset.downloadAsync();
        const dudvUri = dudvAsset.localUri ?? dudvAsset.uri;
        const tex = await new TextureLoader().loadAsync(dudvUri);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.flipY = false;
        tex.repeat.set(10, 10);
        tex.offset.set(0, 0);
        tex.needsUpdate = true;

        waterDudvRef.current = tex;

        // IMPORTANT: pour que l'eau reflète correctement l'envMap (HDRI),
        // on n'utilise pas la DUDV comme "map" (albedo) / roughnessMap.
        // On s'en sert uniquement comme normalMap animée.
        waterMaterial.normalMap = tex;
        // "waveStrength" (déformation) — plus haut = vagues plus fortes
        waterMaterial.normalScale.set(1.5, 1.5);
        (waterMaterial as any).reflectivity = 1.0;
        waterMaterial.needsUpdate = true;
      } catch (e) {
        console.warn('Water DUDV load failed', e);
      }
    })();

    const rainSystem = createWeatherSystem(scene, {
      rainCount: 1000,
      spreadX: 30,
      spreadY: 20,
      minY: 8,
      maxY: 15,
      fallSpeed: 5.0,
      resetThreshold: -2,
      type: 'rain',
    });

    const snowSystem = createWeatherSystem(scene, {
      rainCount: 750,
      spreadX: 30,
      spreadY: 20,
      minY: 8,
      maxY: 15,
      fallSpeed: 0.5,
      resetThreshold: -2,
      type: 'snow',
    });

    rainSystem.rainGroup.visible = false;
    snowSystem.rainGroup.visible = true;

    weatherRef.current = {
      rain: { group: rainSystem.rainGroup, update: rainSystem.updateRain, material: rainSystem.material as any },
      snow: { group: snowSystem.rainGroup, update: snowSystem.updateRain, material: snowSystem.material as any },
    };

    const applyWeatherVisibility = (mode: 'rain' | 'snow' | 'butterfly' | 'none') => {
      if (weatherRef.current.rain) weatherRef.current.rain.group.visible = (mode === 'rain');
      if (weatherRef.current.snow) weatherRef.current.snow.group.visible = (mode === 'snow');
      if (butterflyDataRef.current) {
        butterflyDataRef.current.sprites.forEach(sprite => {
          sprite.visible = (mode === 'butterfly');
        });
      }
    };
    applyWeatherVisibility(weatherMode);

    scene.add(grassData.group);
    grassGroupRef.current = grassData.group;
    grassMaterialRef.current = grassData.material;
    grassParamsRef.current = grassData.params;


    planet.add(waterGroup);
    waterGroupRef.current = waterGroup;

    grassData.group.visible = (groundMode === 'grass');
    waterGroup.visible = (groundMode === 'water');

    prevRotRef.current = {
      x: planet.rotation.x,
      z: planet.rotation.z,
    };


    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff5555 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0.5, 0);
    cubeRef.current = cube;


    (async () => {
      try {
        const butterflyData = await initializeButterflySystem(scene, 50);
        butterflyDataRef.current = butterflyData;
        butterflyData.sprites.forEach(sprite => {
          sprite.visible = false;
        });
      } catch (e) {
        console.warn('Erreur initialisation système papillon:', e);
      }
    })();

    const renderLoop = () => {
      animationFrameId.current = requestAnimationFrame(renderLoop);



      const cam = cameraRef.current;
      if (cam) {
        if (motionControlEnabledRef.current) {
          // --- GYRO ON ---
          const { alpha, beta, gamma } = rotationRef.current;
          setDeviceQuaternion(deviceQuatRef.current, alpha, beta, gamma, 0, isLandscape);

          const targetQuat = new THREE.Quaternion()
            .copy(calibrationQuatRef.current)
            .multiply(deviceQuatRef.current);

          cam.quaternion.slerp(targetQuat, 0.2);
        } else {
          // --- GYRO OFF : joystick look ---
          // dt simple
          const dt = clockRef.current.getDelta();
          const look = lookInputRef.current;

          // vitesses (à ajuster)
          const yawSpeed = 1.8;   // rad/s
          const pitchSpeed = 1.2; // rad/s

          yawRef.current += look.x * yawSpeed * dt;
          pitchRef.current += (-look.y) * pitchSpeed * dt;

          // clamp pitch (évite de retourner la caméra)
          const maxPitch = Math.PI / 2 - 0.15;
          pitchRef.current = Math.max(-maxPitch, Math.min(maxPitch, pitchRef.current));

          // construire quaternion yaw puis pitch
          const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawRef.current);
          const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchRef.current);

          manualLookQuatRef.current.copy(qYaw).multiply(qPitch);

          // on applique autour de ta base “recentrée”
          const targetQuat = new THREE.Quaternion()
            .copy(baseQuatRef.current)
            .multiply(manualLookQuatRef.current);

          cam.quaternion.slerp(targetQuat, 0.2);
        }
      }


      cube.rotation.y += 0.01;

      if (innerAtmosphereRef.current) {
        innerAtmosphereRef.current.rotation.y += 0.0005;
        innerAtmosphereRef.current.rotation.x += 0.0005;
      }

      // if (gridFloorRef.current) {
      //   gridFloorRef.current.rotation.x += 0.0005;
      // }

      if (grassMaterialRef.current && sceneRef.current) {
        updateGrassTime(grassMaterialRef.current, clockRef.current.getElapsedTime());
        // Synchroniser le fog du shader avec la scène
        updateGrassShaderFog(grassMaterialRef.current, sceneRef.current);
      }

      // Animation eau: faire défiler la normalMap (DUDV) pour simuler des vagues
      if (waterDudvRef.current) {
        const t = clockRef.current.getElapsedTime();
        // "waveSpeed" — très lent pour un mouvement plus doux
        waterDudvRef.current.offset.x = (t * 0.02) % 1;
        waterDudvRef.current.offset.y = (t * 0.015) % 1;
      }

      // Update weather (sans deltaTime comme dans grass.tsx)
      if (weatherRef.current.rain?.group.visible) {
        try {
          weatherRef.current.rain.update();
        } catch (e) {
          console.error('[Rain update error]', e);
        }
      }
      if (weatherRef.current.snow?.group.visible) {
        try {
          weatherRef.current.snow.update();
        } catch (e) {
          console.error('[Snow update error]', e);
        }
      }

      if (planetRef.current && cameraRef.current) {
        const currentRotationX = planetRef.current.rotation.x;
        const currentRotationY = planetRef.current.rotation.y;

        rotatePlanetWithCamera(
          planetRef.current,
          cameraRef.current,
          velocityRef.current
        );

        planetRef.current.updateMatrixWorld(true);

        const hasCollision = checkCollisions(cameraRef.current, wallsRef.current);

        if (hasCollision) {
          planetRef.current.rotation.x = currentRotationX;
          planetRef.current.rotation.y = currentRotationY;
        }

        if (gridFloorRef.current) {
          gridFloorRef.current.rotation.copy(planetRef.current.rotation);
        }
      }

      if (grassGroupRef.current && planetRef.current && grassParamsRef.current) {
        prevRotRef.current = updateGrassWrapping(
          grassGroupRef.current,
          planetRef.current,
          prevRotRef.current,
          grassParamsRef.current
        );
      }

      const time = clockRef.current.getElapsedTime();
      wallsRef.current.forEach(rect => {
        if (rect.userData.basePosition) {
          // Évite de "rentrer" dans la planète: offset toujours >= 0
          const phase = Math.sin(time * rect.userData.floatSpeed + rect.userData.floatOffset);
          const offset = (phase * 0.5 + 0.5) * rect.userData.floatAmplitude;

          const normal = (rect.userData.baseNormal ? rect.userData.baseNormal.clone() : rect.userData.basePosition.clone().normalize());

          // Flottement latéral dans 2 axes du plan tangent (peut aller +/-)
          const tx = rect.userData.baseTangentX ? rect.userData.baseTangentX.clone() : new THREE.Vector3(0, 1, 0).cross(normal).normalize();
          const ty = rect.userData.baseTangentY ? rect.userData.baseTangentY.clone() : new THREE.Vector3().crossVectors(normal, tx).normalize();

          const lateralX = Math.sin(time * (rect.userData.floatSpeed2 ?? 0.5) + (rect.userData.floatOffset2 ?? 0)) * (rect.userData.floatAmplitude2 ?? 0.08);
          const lateralY = Math.cos(time * (rect.userData.floatSpeed3 ?? 0.55) + (rect.userData.floatOffset3 ?? 0)) * (rect.userData.floatAmplitude3 ?? 0.08);

          rect.position
            .copy(rect.userData.basePosition)
            .addScaledVector(normal, offset)
            .addScaledVector(tx, lateralX)
            .addScaledVector(ty, lateralY);
        }
      });

      // Billboarding: murs "verticaux" sur la planète (up = normale), tournés vers la caméra
      // Ici "vertical" = perpendiculaire au sol local: l'axe Y du mur suit la normale radiale.
      if (cameraRef.current && planetRef.current) {
        cameraRef.current.getWorldPosition(tmpCamWorldPosRef.current);
        planetRef.current.getWorldPosition(tmpPlanetWorldPosRef.current);

        wallsRef.current.forEach((rect) => {
          rect.getWorldPosition(tmpRectWorldPosRef.current);

          // up = normale radiale au point du mur
          tmpUpNormalRef.current
            .copy(tmpRectWorldPosRef.current)
            .sub(tmpPlanetWorldPosRef.current)
            .normalize();

          // direction vers caméra, projetée sur le plan tangent (pour éviter de pencher vers le haut/bas)
          tmpToCamRef.current.copy(tmpCamWorldPosRef.current).sub(tmpRectWorldPosRef.current);
          const dot = tmpToCamRef.current.dot(tmpUpNormalRef.current);
          tmpForwardRef.current.copy(tmpToCamRef.current).addScaledVector(tmpUpNormalRef.current, -dot);
          const lenSq = tmpForwardRef.current.lengthSq();
          if (lenSq < 1e-8) return;
          tmpForwardRef.current.multiplyScalar(1 / Math.sqrt(lenSq));

          // base orthonormée
          tmpRightRef.current.crossVectors(tmpUpNormalRef.current, tmpForwardRef.current).normalize();
          tmpForwardRef.current.crossVectors(tmpRightRef.current, tmpUpNormalRef.current).normalize();

          tmpBasisMatrixRef.current.makeBasis(tmpRightRef.current, tmpUpNormalRef.current, tmpForwardRef.current);
          tmpWorldQuatRef.current.setFromRotationMatrix(tmpBasisMatrixRef.current);


          const parent = rect.parent;
          if (!parent) return;
          parent.getWorldQuaternion(tmpParentWorldQuatRef.current);
          tmpInvParentWorldQuatRef.current.copy(tmpParentWorldQuatRef.current).invert();
          rect.quaternion.copy(tmpInvParentWorldQuatRef.current).multiply(tmpWorldQuatRef.current);
        });
      }

      if (butterflyDataRef.current) {
        updateButterflyAnimation(
          butterflyDataRef.current.sprites,
          cameraRef.current,
          time
        );
      }

      renderWithAtmosphere(renderer, scene, camera, atmosphereDataRef.current, gl);
    };

    renderLoop();
  };

  const handleResetView = () => {
    const cam = cameraRef.current;
    if (!cam) return;

    cam.lookAt(0, 2, 0);
    cam.updateMatrixWorld();

    baseQuatRef.current.copy(cam.quaternion);

    const { alpha, beta, gamma } = rotationRef.current;
    const currentDeviceQuat = new THREE.Quaternion();
    setDeviceQuaternion(currentDeviceQuat, alpha, beta, gamma, 0, isLandscape);

    const invDevice = currentDeviceQuat.clone().invert();
    calibrationQuatRef.current
      .copy(baseQuatRef.current)
      .multiply(invDevice);
  };

  return (
    <View style={styles.container}>

      {!tutorialGalerieCompleted && (
        <ScreenTutorialGalerie
          onTutorialGalerieComplete={() => {
            setTutorialGalerieCompleted(true);
          }}
        />
      )}

      {isEditMode && !tutorialEditCompleted && (
        <ScreenTutorialEdit
          onTutorialEditComplete={() => {
            setTutorialEditCompleted(true);
          }}
        />
      )}

      <View
        style={styles.glView}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setViewSize({ width, height });
        }}
        {...tapResponder.panHandlers}
      >
        <GLView
          key={sceneKey}
          style={{ flex: 1 }}
          msaaSamples={0}
          onContextCreate={onContextCreate}
        />
      </View>

      {isGrassColorMode && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setIsGrassColorMode(false)}
        />
      )}

      <View style={styles.bottomLeftControls}>
        {!isEditMode && (
          <ButtonMenu
            gap={12}
            activeId={motionControlEnabled ? 'motion' : undefined}
            buttons={[
              {
                id: 'orientation',
                icon: require('../../assets/images/home.png'),
              },
              {
                id: 'profil',
                icon: require('../../assets/images/profil.png'),
              },
            ]}
          />
        )}
      </View>

      <View style={styles.bottomRightControls}>

        {!isEditMode && (
          <ButtonOption
            gap={12}
            activeId={[
              ...(grilleEnabled ? ['grille'] : []),
              ...(motionControlEnabled ? ['motion'] : []),
            ]}
            buttons={[
              {
                id: 'grille',
                icon: require('../../assets/images/grille.png'),
                onPress: () => setGrilleEnabled(v => !v),
              },
              {
                id: 'motion',
                icon: require('../../assets/images/gyro.png'),
                onPress: () => setMotionControlEnabled(v => !v),
              },
            ]}
          />
        )}

        {!isEditMode && !isGrassColorMode && (
          <ButtonEdit
            gap={12}
            buttons={[
              {
                id: 'edit',
                icon: require('../../assets/images/edit.png'),
                onPress: () => setIsEditMode(v => !v),
              },
            ]}
          />
        )}

        {isEditMode && !isGrassColorMode && (
          <ButtonEdit
            gap={12}
            buttons={[
              {
                id: 'edit',
                icon: require('../../assets/images/no_edit.png'),
                onPress: () => setIsEditMode(v => !v),
              },
            ]}
          />
        )}

      </View>


      {motionControlEnabled && <ResetButton onPress={handleResetView} />}

      <Joystick
        containerStyle={{ left: 75, bottom: 50 }}
        position={joystickPosition}
        onMove={handleJoystickMove}
        onRelease={handleJoystickRelease}
      />

      {!motionControlEnabled && (
        <Joystick
          containerStyle={{ right: 50, bottom: 50 }}
          position={lookJoystickPosition}
          onMove={handleLookJoystickMove}
          onRelease={handleLookJoystickRelease}
        />
      )}


      {/* Weather toggle */}
      {isEditMode && !isGrassColorMode && (

        <View style={styles.editParamsContainer}>
          <ButtonTime
            gap={8}
            activeId={timeMode}
            buttons={[
              {
                id: 'morning',
                Icon: IconMorning,
                onPress: () => {
                  setTimeMode('morning');
                  if (atmosphereDataRef.current?.postMaterial) {
                    updateAtmosphereLUT(atmosphereDataRef.current.postMaterial, 'morning');
                  }
                },
              },
              {
                id: 'midday',
                Icon: IconNone,
                onPress: () => {
                  setTimeMode('midday');
                  if (atmosphereDataRef.current?.postMaterial) {
                    updateAtmosphereLUT(atmosphereDataRef.current.postMaterial, 'midday');
                  }
                },
              },
              {
                id: 'evening',
                Icon: IconEvening,
                onPress: () => {
                  setTimeMode('evening');
                  if (atmosphereDataRef.current?.postMaterial) {
                    updateAtmosphereLUT(atmosphereDataRef.current.postMaterial, 'evening');
                  }
                },
              },
              {
                id: 'night',
                Icon: IconNight,
                onPress: () => {
                  setTimeMode('night');
                  if (atmosphereDataRef.current?.postMaterial) {
                    updateAtmosphereLUT(atmosphereDataRef.current.postMaterial, 'night');
                  }
                },
              },
            ]}
          />

          <ButtonWeather
            gap={8}
            activeId={weatherMode}
            buttons={[
              {
                id: 'none',
                Icon: IconNone,
                onPress: () => {
                  setWeatherMode('none');
                  if (weatherRef.current.rain) weatherRef.current.rain.group.visible = false;
                  if (weatherRef.current.snow) weatherRef.current.snow.group.visible = false;
                  if (butterflyDataRef.current) {
                    butterflyDataRef.current.sprites.forEach(sprite => {
                      sprite.visible = false;
                    });
                  }
                },
              },
              {
                id: 'rain',
                Icon: IconRain,
                onPress: () => {
                  setWeatherMode('rain');
                  if (weatherRef.current.rain) weatherRef.current.rain.group.visible = true;
                  if (weatherRef.current.snow) weatherRef.current.snow.group.visible = false;
                  if (butterflyDataRef.current) {
                    butterflyDataRef.current.sprites.forEach(sprite => {
                      sprite.visible = false;
                    });
                  }
                },
              },
              {
                id: 'snow',
                Icon: IconSnow,
                onPress: () => {
                  setWeatherMode('snow');
                  if (weatherRef.current.rain) weatherRef.current.rain.group.visible = false;
                  if (weatherRef.current.snow) weatherRef.current.snow.group.visible = true;
                  if (butterflyDataRef.current) {
                    butterflyDataRef.current.sprites.forEach(sprite => {
                      sprite.visible = false;
                    });
                  }
                },
              },
              {
                id: 'butterfly',
                Icon: IconButterfly,
                onPress: () => {
                  setWeatherMode('butterfly');
                  if (weatherRef.current.rain) weatherRef.current.rain.group.visible = false;
                  if (weatherRef.current.snow) weatherRef.current.snow.group.visible = false;
                  if (butterflyDataRef.current) {
                    butterflyDataRef.current.sprites.forEach(sprite => {
                      sprite.visible = true;
                    });
                  }
                },
              },
            ]}
          />

          {/* Fog density control */}
          <FogControl
            fogDensity={fogDensity}
            onFogDensityChange={handleFogDensityChange}
            minValue={0}
            maxValue={0.15}
            step={0.01}
          />

        </View>
      )}

      {isEditMode && !isGrassColorMode && (
        <ButtonFloor onPress={() => setIsGrassColorMode(v => !v)} />
      )}

      {isGrassColorMode && (
        <>
          <View style={styles.floorModeToggle}>
            <TouchableOpacity
              style={[styles.floorModeBtn, groundMode === 'grass' ? styles.floorModeBtnActive : null]}
              onPress={() => setGroundMode('grass')}
              activeOpacity={0.8}
            >
              <Text style={styles.floorModeText}>HERBE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.floorModeBtn, groundMode === 'water' ? styles.floorModeBtnActive : null]}
              onPress={() => setGroundMode('water')}
              activeOpacity={0.8}
            >
              <Text style={styles.floorModeText}>EAU</Text>
            </TouchableOpacity>
          </View>

          {groundMode === 'grass' && (
            <ButtonGrassColor
              gap={4}
              activeId={grassColorMode}
              buttons={[
                {
                  id: 'yellow_1',
                  color: '#F3D98F',
                  onPress: () => {
                    setGrassColorMode('yellow_1');
                  },
                },
                {
                  id: 'orange',
                  color: '#F18C22',
                  onPress: () => {
                    setGrassColorMode('orange');
                  },
                },
                {
                  id: 'pink',
                  color: '#F761DE',
                  onPress: () => {
                    setGrassColorMode('pink');
                  },
                },
                {
                  id: 'blue',
                  color: '#7298C7',
                  onPress: () => {
                    setGrassColorMode('blue');
                  },
                },
                {
                  id: 'green_1',
                  color: '#B4B535',
                  onPress: () => {
                    setGrassColorMode('green_1');
                  },
                },
                {
                  id: 'green_2',
                  color: '#2B885C',
                  onPress: () => {
                    setGrassColorMode('green_2');
                  },
                },
                {
                  id: 'yellow_2',
                  color: '#6859f2',
                  onPress: () => {
                    setGrassColorMode('yellow_2');
                  },
                },
                {
                  id: 'red',
                  color: '#F20712',
                  onPress: () => {
                    setGrassColorMode('red');
                  },
                },
              ]}
            />
          )}
        </>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
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
  glView: {
    flex: 1,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: 280,
    backgroundColor: '#1d1f24',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    color: 'white',
    fontWeight: '600',
    marginBottom: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#2f3440',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancel: {
    backgroundColor: '#3b404c',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  editParamsContainer: {
    position: 'absolute',
    top: 25,
    left: 25,
    display: 'flex',
    flexDirection: 'row',
    gap: 24,
  },
  bottomLeftControls: {
    position: 'absolute',
    top: 25,
    left: 24,
    display: 'flex',
    flexDirection: 'row',
  },
  bottomRightControls: {
    position: 'absolute',
    top: 25,
    right: 24,
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
  },

  floorModeToggle: {
    position: 'absolute',
    top: 76,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
    padding: 6,
    backgroundColor: 'rgba(211, 216, 224, 0.40)',
    borderRadius: 100,
    height: 42,
    alignItems: 'center',
  },
  floorModeBtn: {
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
  },
  floorModeBtnActive: {
    borderWidth: 0.5,
    borderColor: 'rgba(41, 45, 50, 0.80)',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  floorModeText: {
    color: 'rgba(41, 45, 50, 0.95)',
    fontWeight: '700',
    fontSize: 12,
  },
});
