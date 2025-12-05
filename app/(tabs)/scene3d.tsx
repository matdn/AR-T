import { GLView, type ExpoWebGLRenderingContext } from "expo-gl";
import { Renderer } from "expo-three";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, GestureResponderEvent } from "react-native";
import * as THREE from "three";
import * as ScreenOrientation from 'expo-screen-orientation';

import Joystick from "../../components/Joystick";
import ResetButton from "../../components/ResetButton";
import OrientationToggle from "../../components/OrientationToggle";
import { createAtmosphereMeshes } from "../../components/Atmosphere";
import { useDeviceMotion } from "../../hooks/useDeviceMotion";
import { useTapDetector } from "../../hooks/useTapDetector";
import { setDeviceQuaternion } from "../../utils/quaternion";
import { 
  createPlanet, 
  addGridLinesToPlanet, 
  createSkySphere, 
  createRandomRectangles,
  createRectangle,
  createGrassGrid,
  createInnerAtmosphere
} from "../../utils/sceneObjects";
import { 
  rotatePlanetWithCamera, 
  checkCollisions,
  placeRectangleOnSurface 
} from "../../utils/sceneHelpers";
import { updateGrassTime } from "../../utils/grassShader";
import { updateGrassWrapping } from "../../utils/grassHelpers";
import { 
  renderWithAtmosphere, 
  type AtmosphereRenderData 
} from "../../utils/atmosphereHelpers";

export default function SceneThree() {
  const animationFrameId = useRef<number | null>(null);
  const rotationRef = useDeviceMotion();
  const [isLandscape, setIsLandscape] = useState(true);

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);
  const planetRef = useRef<THREE.Mesh | null>(null);
  const wallsRef = useRef<THREE.Mesh[]>([]);
  const hitProxiesRef = useRef<THREE.Mesh[]>([]);
  const rendererRef = useRef<Renderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const [screenDimensions, setScreenDimensions] = useState({ width: 0, height: 0 });
  const [sceneKey, setSceneKey] = useState(0); // Pour forcer le reload du GLView
  const [viewSize, setViewSize] = useState({ width: 0, height: 0 }); // Taille CSS du GLView
  const [tapYBiasNDC, setTapYBiasNDC] = useState(-1); // Petit biais vertical en NDC pour remonter le rayon

  const baseQuatRef = useRef<THREE.Quaternion>(new THREE.Quaternion());
  const deviceQuatRef = useRef<THREE.Quaternion>(new THREE.Quaternion());
  const calibrationQuatRef = useRef<THREE.Quaternion>(new THREE.Quaternion());

  const velocityRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });

  // Grass refs
  const grassGroupRef = useRef<THREE.Group | null>(null);
  const grassMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const grassParamsRef = useRef<{
    gridSize: number;
    step: number;
    halfWidth: number;
    wrapDistance: number;
  } | null>(null);
  const prevRotRef = useRef({ x: 0, z: 0 });
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  const atmosphereDataRef = useRef<AtmosphereRenderData | null>(null);
  const innerAtmosphereRef = useRef<THREE.Group | null>(null);

  const handleScreenTap = (event: GestureResponderEvent) => {
    if (!cameraRef.current || !planetRef.current || !raycasterRef.current) return;

    const x = event.nativeEvent.locationX;
    const y = event.nativeEvent.locationY;

    console.log('Touch détecté à:', x, y);

    // Créer un raycaster pour détecter les clics sur les rectangles
    const mouse = new THREE.Vector2();
    // Fallback robust pour éviter Infinity quand la vue n'est pas encore mesurée
    let w = viewSize.width;
    let h = viewSize.height;
    if (!w || !h) {
      const sizeVec = new THREE.Vector2();
      rendererRef.current?.getSize(sizeVec);
      w = sizeVec.x || screenDimensions.width;
      h = sizeVec.y || screenDimensions.height;
    }
    if (!w || !h) {
      console.log('View size indéterminée, annulation du raycast. w/h =', w, h);
      return;
    }
  mouse.x = (x / w) * 2 - 1;
  // Ajout d'un biais vertical pour compenser un raycast trop bas
  mouse.y = (-(y / h) * 2 + 1) + tapYBiasNDC;

    raycasterRef.current.setFromCamera(mouse, cameraRef.current);
    
  console.log('Mouse coords:', mouse.x, mouse.y, 'biasNDC=', tapYBiasNDC, ' (w,h)=', w, h);
    
  planetRef.current.updateMatrixWorld(true);
  planetRef.current.traverse(obj => obj.updateMatrixWorld(true));

  const rectangleIntersects = raycasterRef.current.intersectObjects(wallsRef.current, false);
  const proxyIntersects = raycasterRef.current.intersectObjects(hitProxiesRef.current, false);
    
  console.log('Direct rectangle intersects:', rectangleIntersects.length);
  console.log('Proxy intersects:', proxyIntersects.length);
    
  // Vérifier si on a cliqué sur un rectangle existant
  // Raycaster tous les enfants de la planète (qui incluent les rectangles)
  const intersects = raycasterRef.current.intersectObjects(planetRef.current.children, true);
    
  console.log('Rectangles intersectés (avec children):', intersects.length);

    
    // DEBUG: Trouver le rectangle le plus proche du rayon
    if (wallsRef.current.length > 0) {
      const ray = raycasterRef.current.ray;
      
      let closestDistance = Infinity;
      let closestIndex = -1;
      let closestWorldPos = new THREE.Vector3();
      let closestLocalPos = new THREE.Vector3();
      
      for (let i = 0; i < wallsRef.current.length; i++) {
        const rect = wallsRef.current[i];
        const worldPos = rect.getWorldPosition(new THREE.Vector3());
        const distance = ray.distanceToPoint(worldPos);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
          closestWorldPos.copy(worldPos);
          closestLocalPos.copy(rect.position);
        }
      }
      if (closestIndex !== -1) {
        const cam = cameraRef.current;
        const ray = raycasterRef.current.ray;
        const projected = closestWorldPos.clone();
        if (cam) {
          projected.project(cam);
        }
        const screenX = ((projected.x + 1) / 2) * w;
        const screenY = ((1 - projected.y) / 2) * h;

        const rectObj = wallsRef.current[closestIndex];
        const bbox = new THREE.Box3().setFromObject(rectObj);
        const bboxCenter = new THREE.Vector3();
        bbox.getCenter(bboxCenter);
        const distToBBoxCenter = ray.distanceToPoint(bboxCenter);

        console.log('=== RECTANGLE LE PLUS PROCHE ===');
        console.log('Index:', closestIndex, 'ID:', rectObj.userData?.id, 'Message:', rectObj.userData?.message);
        console.log('Rayon origine:', ray.origin, 'direction:', ray.direction);
        console.log('Position mondiale:', closestWorldPos, '| Position locale:', closestLocalPos);
        console.log('Distance au rayon (pivot):', closestDistance);
        console.log('Centre BBox monde:', bboxCenter, 'Distance au rayon (BBox):', distToBBoxCenter);
        console.log('Projection NDC:', projected.x, projected.y, '=> écran (px):', screenX, screenY, ' (w,h)=', w, h);
        console.log('================================');
      }
    }
    
    if (rectangleIntersects.length > 0) {
      const clickedRect = rectangleIntersects[0].object as THREE.Mesh;
      console.log('Rectangle cliqué (direct):', clickedRect.userData);
      
      // Changer la couleur en rouge
      if (clickedRect.material && 'color' in clickedRect.material) {
        (clickedRect.material as THREE.MeshStandardMaterial).color.setHex(0xff0000);
      }
      
      if (clickedRect.userData.message) {
        alert(clickedRect.userData.message);
      }
      return;
    }
    
  if (intersects.length > 0) {
      // Filtrer pour ne garder que les rectangles (pas les lignes de grille)
      const rectangleIntersect = intersects.find(intersect => 
        wallsRef.current.includes(intersect.object as THREE.Mesh)
      );
      
      if (rectangleIntersect) {
        // Clic sur un rectangle existant
        const clickedRect = rectangleIntersect.object as THREE.Mesh;
        console.log('Rectangle cliqué (children):', clickedRect.userData);
        
        // Changer la couleur en rouge
        if (clickedRect.material && 'color' in clickedRect.material) {
          (clickedRect.material as THREE.MeshStandardMaterial).color.setHex(0xff0000);
        }
        
        if (clickedRect.userData.message) {
          alert(clickedRect.userData.message);
        }
        return;
      }
    }
    
    // Essayer via proxy si aucun rectangle direct n'est touché
    if (proxyIntersects.length > 0) {
      const proxyObj = proxyIntersects[0].object as THREE.Mesh & { userData: any };
      const targetRect = proxyObj.userData?.target as THREE.Mesh | undefined;
      if (targetRect) {
        console.log('Sélection via proxy:', targetRect.userData);
        if (targetRect.material && 'color' in targetRect.material) {
          (targetRect.material as THREE.MeshStandardMaterial).color.setHex(0xff0000);
        }
        if (targetRect.userData?.message) {
          alert(targetRect.userData.message);
        }
        return;
      }
    }

    // Sinon, placer un nouveau rectangle
    const result = placeRectangleOnSurface(
      raycasterRef.current,
      cameraRef.current,
      planetRef.current,
      x,
      y,
      w,
      h
    );

    if (result && planetRef.current) {
      const rectangle = createRectangle(result.position, result.normal);
      
      // Ajouter les données pour l'animation et l'interaction
      const rectCount = wallsRef.current.length;
      rectangle.userData = {
        basePosition: result.position.clone(),
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed: 0.5 + Math.random() * 0.5,
        floatAmplitude: 0.1 + Math.random() * 0.15,
        id: rectCount,
        message: `Nouveau rectangle ${rectCount + 1}`
      };
      
      console.log('Nouveau rectangle créé:', rectangle.userData.message);
      
      planetRef.current.add(rectangle);
      wallsRef.current.push(rectangle);

      // Créer et attacher un proxy pour ce nouveau rectangle
      const proxyGeo = new THREE.SphereGeometry(1.5, 12, 12);
      const proxyMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false });
      const proxy = new THREE.Mesh(proxyGeo, proxyMat);
      proxy.userData = { target: rectangle };
      proxy.frustumCulled = false;
      rectangle.add(proxy);
      hitProxiesRef.current.push(proxy);
    }
  };

  const tapResponder = useTapDetector({ onTap: handleScreenTap });

  const handleJoystickMove = (velocity: { x: number; z: number }) => {
    velocityRef.current = velocity;
    const maxDistance = 40;
    setJoystickPosition({
      x: -velocity.x * maxDistance,  // Inversé pour correspondre au touch
      y: velocity.z * maxDistance,   // Inversé pour correspondre au touch
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
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
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

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
  }, []);

  // Cleanup resources when scene reloads
  useEffect(() => {
    return () => {
      // Cleanup animation frame
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      // Cleanup atmosphere resources
      if (atmosphereDataRef.current) {
        atmosphereDataRef.current.renderTarget?.dispose();
        atmosphereDataRef.current.postMaterial?.dispose();
        atmosphereDataRef.current = null;
      }
      
      // Cleanup grass material
      if (grassMaterialRef.current) {
        grassMaterialRef.current.dispose();
        grassMaterialRef.current = null;
      }
    };
  }, [sceneKey]); // Re-run cleanup when scene reloads

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    // Cleanup previous atmosphere if exists
    if (atmosphereDataRef.current) {
      atmosphereDataRef.current.renderTarget?.dispose();
      atmosphereDataRef.current.postMaterial?.dispose();
      atmosphereDataRef.current = null;
    }
    
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    setScreenDimensions({ width, height });

    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    cameraRef.current = camera;

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

    // Create planet with grid lines
    const planet = createPlanet();
    addGridLinesToPlanet(planet);
    planet.renderOrder = 1; // Rendre la planète après l'atmosphère
    scene.add(planet);
    planetRef.current = planet;

    // Create inner atmosphere wireframe
    const innerAtmo = createInnerAtmosphere();
    innerAtmo.renderOrder = 2; // Rendre par dessus la planète
    scene.add(innerAtmo);
    innerAtmosphereRef.current = innerAtmo;

    // Create random rectangles + proxies pour améliorer le hit au toucher
    const rectangles = createRandomRectangles(20);
    const proxies: THREE.Mesh[] = [];
    rectangles.forEach(rect => {
      planet.add(rect);
      const proxyGeo = new THREE.SphereGeometry(1.5, 12, 12);
      const proxyMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false });
      const proxy = new THREE.Mesh(proxyGeo, proxyMat);
      proxy.userData = { target: rect };
      proxy.frustumCulled = false;
      rect.add(proxy);
      proxies.push(proxy);
    });
    wallsRef.current = rectangles;
    hitProxiesRef.current = proxies;

    // Create atmosphere (remplace le sky sphere)
    const atmosphereData = createAtmosphereMeshes(scene, width, height, {
      planetPosition: new THREE.Vector3(0, -50, 0),
      envRadius: 100,
      enableLUT: true,
      lutIntensity: 0.6,
    });
    // S'assurer que l'atmosphère est rendue en premier
    if (atmosphereData.envMesh) {
      atmosphereData.envMesh.renderOrder = 0;
    }
    atmosphereDataRef.current = atmosphereData;

    // Create grass grid
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
    
    scene.add(grassData.group);
    grassGroupRef.current = grassData.group;
    grassMaterialRef.current = grassData.material;
    grassParamsRef.current = grassData.params;
    
    prevRotRef.current = {
      x: planet.rotation.x,
      z: planet.rotation.z,
    };


    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff5555 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0.5, 0);
    cubeRef.current = cube;

    const renderLoop = () => {
      animationFrameId.current = requestAnimationFrame(renderLoop);

      const { alpha, beta, gamma } = rotationRef.current;
      setDeviceQuaternion(deviceQuatRef.current, alpha, beta, gamma, 0, isLandscape);

      const targetQuat = new THREE.Quaternion()
        .copy(calibrationQuatRef.current)
        .multiply(deviceQuatRef.current);

      if (cameraRef.current) {
        cameraRef.current.quaternion.slerp(targetQuat, 0.2);
      }

      cube.rotation.y += 0.01;

      // Rotate inner atmosphere slowly
      if (innerAtmosphereRef.current) {
        innerAtmosphereRef.current.rotation.y += 0.0005; 
        innerAtmosphereRef.current.rotation.x += 0.0005; 
      }

      // Update grass shader time
      if (grassMaterialRef.current) {
        updateGrassTime(grassMaterialRef.current, clockRef.current.getElapsedTime());
      }

      if (planetRef.current && cameraRef.current) {
        const currentRotationX = planetRef.current.rotation.x;
        const currentRotationY = planetRef.current.rotation.y;

        // Apply rotation based on joystick input
        rotatePlanetWithCamera(
          planetRef.current,
          cameraRef.current,
          velocityRef.current
        );

        planetRef.current.updateMatrixWorld(true);

        // Check for collisions
        const hasCollision = checkCollisions(cameraRef.current, wallsRef.current);

        if (hasCollision) {
          planetRef.current.rotation.x = currentRotationX;
          planetRef.current.rotation.y = currentRotationY;
        }
      }

      // Update grass wrapping based on planet rotation
      if (grassGroupRef.current && planetRef.current && grassParamsRef.current) {
        prevRotRef.current = updateGrassWrapping(
          grassGroupRef.current,
          planetRef.current,
          prevRotRef.current,
          grassParamsRef.current
        );
      }

      // Animate floating rectangles
      const time = clockRef.current.getElapsedTime();
      wallsRef.current.forEach(rect => {
        if (rect.userData.basePosition) {
          const offset = Math.sin(time * rect.userData.floatSpeed + rect.userData.floatOffset) * rect.userData.floatAmplitude;
          const normal = rect.userData.basePosition.clone().normalize();
          rect.position.copy(rect.userData.basePosition).addScaledVector(normal, offset);
        }
      });

      // Render with atmosphere post-processing
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
          onContextCreate={onContextCreate}
        />
      </View>

      <OrientationToggle 
        isLandscape={isLandscape} 
        onToggle={handleOrientationToggle} 
      />

      <ResetButton onPress={handleResetView} />

      <Joystick
        position={joystickPosition}
        onMove={handleJoystickMove}
        onRelease={handleJoystickRelease}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
  },
  glView: {
    flex: 1,
  },
});
