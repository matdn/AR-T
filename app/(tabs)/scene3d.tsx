import { GLView, type ExpoWebGLRenderingContext } from "expo-gl";
import { Renderer } from "expo-three";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, GestureResponderEvent } from "react-native";
import * as THREE from "three";

import Joystick from "../../components/Joystick";
import ResetButton from "../../components/ResetButton";
import { useDeviceMotion } from "../../hooks/useDeviceMotion";
import { useTapDetector } from "../../hooks/useTapDetector";
import { setDeviceQuaternion } from "../../utils/quaternion";
import {
  createPlanet,
  addGridLinesToPlanet,
  createSkySphere,
  createRandomRectangles,
  createRectangle,
  createGrassGrid
} from "../../utils/sceneObjects";
import {
  rotatePlanetWithCamera,
  checkCollisions,
  placeRectangleOnSurface
} from "../../utils/sceneHelpers";
import { updateGrassTime } from "../../utils/grassShader";
import { updateGrassWrapping } from "../../utils/grassHelpers";
import { createWeatherSystem } from "../../components/Weather";

export default function SceneThree() {
  const animationFrameId = useRef<number | null>(null);
  const rotationRef = useDeviceMotion();

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);
  const planetRef = useRef<THREE.Mesh | null>(null);
  const wallsRef = useRef<THREE.Mesh[]>([]);
  const rendererRef = useRef<Renderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const [screenDimensions, setScreenDimensions] = useState({ width: 0, height: 0 });

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

  const handleScreenTap = (event: GestureResponderEvent) => {
    if (!cameraRef.current || !planetRef.current || !raycasterRef.current) return;

    const x = event.nativeEvent.locationX;
    const y = event.nativeEvent.locationY;

    const result = placeRectangleOnSurface(
      raycasterRef.current,
      cameraRef.current,
      planetRef.current,
      x,
      y,
      screenDimensions.width,
      screenDimensions.height
    );

    if (result && planetRef.current) {
      const rectangle = createRectangle(result.position, result.normal);
      planetRef.current.add(rectangle);
      wallsRef.current.push(rectangle);
    }
  };

  const tapResponder = useTapDetector({ onTap: handleScreenTap });

  const handleJoystickMove = (velocity: { x: number; z: number }) => {
    velocityRef.current = velocity;
    const maxDistance = 40;
    setJoystickPosition({
      x: velocity.x * maxDistance,
      y: -velocity.z * maxDistance,
    });
  };

  const handleJoystickRelease = () => {
    velocityRef.current = { x: 0, z: 0 };
    setJoystickPosition({ x: 0, y: 0 });
  };

  useEffect(() => {
    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
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
      setDeviceQuaternion(initialDeviceQuat, alpha, beta, gamma, 0);
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
    scene.add(planet);
    planetRef.current = planet;

    // Create random rectangles
    const rectangles = createRandomRectangles(20);
    rectangles.forEach(rect => planet.add(rect));
    wallsRef.current = rectangles;

    // Create sky sphere
    const sky = createSkySphere();
    scene.add(sky);

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

    const { rainGroup, rainSprites, updateRain } = createWeatherSystem(
      scene,
      {
        rainCount: 1000,
        spreadX: 60,
        spreadY: 40,
        minY: 15,
        maxY: 30,
        fallSpeed: 1.5,
        resetThreshold: -5,
      }
    );

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
      setDeviceQuaternion(deviceQuatRef.current, alpha, beta, gamma, 0);

      const targetQuat = new THREE.Quaternion()
        .copy(calibrationQuatRef.current)
        .multiply(deviceQuatRef.current);

      if (cameraRef.current) {
        cameraRef.current.quaternion.slerp(targetQuat, 0.2);
      }

      cube.rotation.y += 0.01;

      updateRain();

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

      renderer.render(scene, camera);
      gl.endFrameEXP();
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
    setDeviceQuaternion(currentDeviceQuat, alpha, beta, gamma, 0);

    const invDevice = currentDeviceQuat.clone().invert();
    calibrationQuatRef.current
      .copy(baseQuatRef.current)
      .multiply(invDevice);
  };

  return (
    <View style={styles.container}>
      <View style={styles.glView} {...tapResponder.panHandlers}>
        <GLView
          style={{ flex: 1 }}
          onContextCreate={onContextCreate}
        />
      </View>

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
