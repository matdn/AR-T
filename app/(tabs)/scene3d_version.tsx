
import { GLView, type ExpoWebGLRenderingContext } from "expo-gl";
import { Renderer } from "expo-three";
import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as THREE from "three";

import type { EventSubscription } from "expo-modules-core";
import { DeviceMotion, type DeviceMotionMeasurement } from "expo-sensors";

export default function SceneThree() {
  const animationFrameId = useRef<number | null>(null);

  const rotationRef = useRef<{ alpha: number; beta: number; gamma: number }>({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const baseRotationRef = useRef<{ yaw: number; pitch: number }>({
    yaw: 0,
    pitch: 0,
  });

  const calibrationRef = useRef<{ yaw: number; pitch: number }>({
    yaw: 0,
    pitch: 0,
  });

  useEffect(() => {
    let subscription: EventSubscription | null = null;

    DeviceMotion.setUpdateInterval(16);

    DeviceMotion.isAvailableAsync().then((available) => {
      if (!available) return;

      subscription = DeviceMotion.addListener(
        (event: DeviceMotionMeasurement) => {
          if (event.rotation) {
            const { alpha = 0, beta = 0, gamma = 0 } = event.rotation;
            rotationRef.current = { alpha, beta, gamma };
          }
        }
      );
    });

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
      subscription?.remove();
    };
  }, []);

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x25292e);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    cameraRef.current = camera;

    camera.position.set(0, 1.6, 3);
    camera.rotation.order = "YXZ";
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    baseRotationRef.current = {
      yaw: camera.rotation.y,
      pitch: camera.rotation.x,
    };

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(3, 5, 2);
    scene.add(dirLight);

    const grid = new THREE.GridHelper(10, 10, 0xffffff, 0x555555);
    scene.add(grid);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff5555 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0.5, 0);
    scene.add(cube);

    const renderLoop = () => {
      animationFrameId.current = requestAnimationFrame(renderLoop);

      const { alpha, beta } = rotationRef.current;
      const rawYaw = alpha || 0;
      const rawPitch = beta || 0;

      let yaw =
        rawYaw - calibrationRef.current.yaw + baseRotationRef.current.yaw;
      let pitch =
        rawPitch - calibrationRef.current.pitch + baseRotationRef.current.pitch;

      const clampedPitch = Math.max(
        -Math.PI / 2 + 0.1,
        Math.min(Math.PI / 2 - 0.1, pitch)
      );

      if (cameraRef.current) {
        cameraRef.current.rotation.y = yaw;
        cameraRef.current.rotation.x = clampedPitch;
      }

      cube.rotation.y += 0.01;

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    renderLoop();
  };

  const handleResetView = () => {
    const cam = cameraRef.current;
    if (!cam) return;

    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld();

    baseRotationRef.current = {
      yaw: cam.rotation.y,
      pitch: cam.rotation.x,
    };

    const { alpha, beta } = rotationRef.current;
    calibrationRef.current = {
      yaw: alpha || 0,
      pitch: beta || 0,
    };
  };

  return (
    <View style={styles.container}>
      <GLView style={styles.glView} onContextCreate={onContextCreate} />

      {/* Bouton overlay pour recadrer la vue */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleResetView}>
          <Text style={styles.buttonText}>Recentrer la vue</Text>
        </TouchableOpacity>
      </View>
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
  buttonContainer: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});
