import { GLView, type ExpoWebGLRenderingContext } from "expo-gl";
import type { EventSubscription } from "expo-modules-core";
import { DeviceMotion, type DeviceMotionMeasurement } from "expo-sensors";
import { Renderer, TextureLoader } from "expo-three";
import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as THREE from "three";


const zee = new THREE.Vector3(0, 0, 1);
const euler = new THREE.Euler();
const q0 = new THREE.Quaternion();
const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

function setDeviceQuaternion(
  quaternion: THREE.Quaternion,
  alpha: number,
  beta: number,
  gamma: number,
  orient: number
) {
  euler.set(beta, alpha, -gamma, "YXZ");
  quaternion.setFromEuler(euler);
  quaternion.multiply(q1);
  quaternion.multiply(q0.setFromAxisAngle(zee, -orient));
}

export default function SceneThree() {
  const animationFrameId = useRef<number | null>(null);

  const rotationRef = useRef<{ alpha: number; beta: number; gamma: number }>({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const baseQuatRef = useRef<THREE.Quaternion>(
    new THREE.Quaternion()
  );

  const deviceQuatRef = useRef<THREE.Quaternion>(
    new THREE.Quaternion()
  );

  const calibrationQuatRef = useRef<THREE.Quaternion>(
    new THREE.Quaternion() // identity au début
  );

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

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x25292e);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    cameraRef.current = camera;

    camera.position.set(0, 5, 3);
    camera.rotation.order = "YXZ";

    camera.lookAt(0, 5, 0);
    camera.updateMatrixWorld();

    baseQuatRef.current.copy(camera.quaternion);

    {
      const { alpha, beta, gamma } = rotationRef.current;
      const initialDeviceQuat = new THREE.Quaternion();
      setDeviceQuaternion(initialDeviceQuat, alpha, beta, gamma, 0);
      const invDevice = initialDeviceQuat.clone().invert();
      calibrationQuatRef.current.copy(baseQuatRef.current).multiply(invDevice);
    }

    // const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    // scene.add(ambientLight);

    // const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    // dirLight.position.set(3, 5, 2);
    // scene.add(dirLight);

    const spLight = new THREE.SpotLight(0xffffff, 1);
    spLight.position.set(0, 2, -5);
    scene.add(spLight);

    const grid = new THREE.GridHelper(10, 10, 0xffffff, 0x555555);
    scene.add(grid);

    const loader = new THREE.TextureLoader();

    const grassTex = new TextureLoader().load(require('../../assets/textures/grass_diffuse.jpg'))
    grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
    grassTex.repeat.set(20, 20);

    const grassNormal = new TextureLoader().load(require('../../assets/textures/normal_map.jpg'))
    grassNormal.wrapS = grassNormal.wrapT = THREE.RepeatWrapping;
    grassNormal.repeat.set(20, 20);

    const grassMaterial = new THREE.MeshStandardMaterial({
      map: grassTex,
      normalMap: grassNormal,
      roughness: 1.0,
      metalness: 0.0,
      normalScale: new THREE.Vector2(0.5, 0.5),
    });

    const grassPlane = new THREE.PlaneGeometry(100, 100, 1, 1);
    const grassMesh = new THREE.Mesh(grassPlane, grassMaterial);
    grassMesh.rotation.x = -Math.PI / 2;
    scene.add(grassMesh);


    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff5555 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0.5, 0);
    scene.add(cube);

    const renderLoop = () => {
      animationFrameId.current = requestAnimationFrame(renderLoop);

      const { alpha, beta, gamma } = rotationRef.current;
      setDeviceQuaternion(deviceQuatRef.current, alpha, beta, gamma, 0);

      const targetQuat = new THREE.Quaternion()
        .copy(calibrationQuatRef.current)
        .multiply(deviceQuatRef.current);

      if (cameraRef.current) {
        //cameraRef.current.quaternion.copy(targetQuat);

        cameraRef.current.quaternion.slerp(targetQuat, 0.2);
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

    cam.lookAt(0, 5, 0);
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
