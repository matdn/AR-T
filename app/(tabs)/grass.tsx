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

const GRASS_CONFIG = {
  bladeCount: 40000,
  patchRadius: 50,
  minHeight: 0.25,
  maxHeight: 0.5,
  bladeWidth: 0.08,
  color: 0x228833,
  amplitude: 0.25,
};

const CAMERA_CONFIG = {
  fov: 60,
  near: 0.1,
  far: 100,
  initialPos: { x: 0, y: 5, z: 3 },
};

const SCENE_CONFIG = {
  background: 0x25292e,
  groundSize: 100,
};

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

  const baseQuatRef = useRef<THREE.Quaternion>(new THREE.Quaternion());
  const deviceQuatRef = useRef<THREE.Quaternion>(new THREE.Quaternion());
  const calibrationQuatRef = useRef<THREE.Quaternion>(new THREE.Quaternion());

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

  const initializeCamera = (width: number, height: number) => {
    const camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.fov,
      width / height,
      CAMERA_CONFIG.near,
      CAMERA_CONFIG.far
    );

    camera.position.set(
      CAMERA_CONFIG.initialPos.x,
      CAMERA_CONFIG.initialPos.y,
      CAMERA_CONFIG.initialPos.z
    );
    camera.rotation.order = "YXZ";
    camera.lookAt(0, 5, 0);
    camera.updateMatrixWorld();

    cameraRef.current = camera;
    baseQuatRef.current.copy(camera.quaternion);

    return camera;
  };

  const initializeLighting = (scene: THREE.Scene) => {
    // const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    // scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff, 20);
    spotLight.position.set(0, 6, -5);
    scene.add(spotLight);
  };

  const createGrassMaterial = () => {
    const grassTex = new TextureLoader().load(
      require("../../assets/textures/grass_diffuse.jpg")
    );
    grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
    grassTex.repeat.set(20, 20);

    const grassNormal = new TextureLoader().load(
      require("../../assets/textures/normal_map.jpg")
    );
    grassNormal.wrapS = grassNormal.wrapT = THREE.RepeatWrapping;
    grassNormal.repeat.set(20, 20);

    return new THREE.MeshStandardMaterial({
      map: grassTex,
      normalMap: grassNormal,
      roughness: 1.0,
      metalness: 0.0,
      normalScale: new THREE.Vector2(0.5, 0.5),
    });
  };

  const generateGrassGeometry = () => {
    const { bladeCount, patchRadius, minHeight, maxHeight, bladeWidth } = GRASS_CONFIG;

    const positions: number[] = [];
    const tips: number[] = [];
    const offsets: number[] = [];
    const origins: number[] = [];

    for (let i = 0; i < bladeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * patchRadius;
      const baseX = Math.cos(angle) * radius;
      const baseZ = Math.sin(angle) * radius;
      const baseY = 0;

      const height = minHeight + Math.random() * (maxHeight - minHeight);

      const yaw = Math.random() * Math.PI * 2;
      const dx = Math.cos(yaw) * bladeWidth;
      const dz = Math.sin(yaw) * bladeWidth;

      positions.push(baseX - dx * 0.5, baseY, baseZ - dz * 0.5);
      tips.push(0.0);
      offsets.push(Math.random());
      origins.push(baseX, baseY, baseZ);

      positions.push(baseX + dx * 0.5, baseY, baseZ + dz * 0.5);
      tips.push(0.0);
      offsets.push(Math.random());
      origins.push(baseX, baseY, baseZ);

      positions.push(baseX, baseY + height, baseZ);
      tips.push(1.0);
      offsets.push(Math.random());
      origins.push(baseX, baseY, baseZ);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("aTip", new THREE.Float32BufferAttribute(tips, 1));
    geometry.setAttribute("aOffset", new THREE.Float32BufferAttribute(offsets, 1));
    geometry.setAttribute("aOrigin", new THREE.Float32BufferAttribute(origins, 3));

    return geometry;
  };

  const createGrassShaderMaterial = (uniforms: Record<string, any>) => {
    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
      precision highp float;

      attribute float aTip;
      attribute vec3 aOrigin;

      uniform float uPatchSize;
      uniform vec3 uPlayerPosition;
      uniform vec3 uSphereCenter;
      uniform float uSphereRadius;

      void main() {
        float halfPatchSize = uPatchSize * 0.5;
        vec3 origin = aOrigin;

        // Wrap autour de la caméra
        origin.x = mod(origin.x - uPlayerPosition.x + halfPatchSize, uPatchSize) - halfPatchSize;
        origin.z = mod(origin.z - uPlayerPosition.z + halfPatchSize, uPatchSize) - halfPatchSize;

        // Position locale du vertex (forme du brin)
        vec3 local = position - aOrigin;

        // Position "horizontale" du pied du brin
        vec3 flatPos = uPlayerPosition + origin;

        // Projection de ce point sur la sphère
        vec2 dXZ = flatPos.xz - uSphereCenter.xz;
        float r2 = uSphereRadius * uSphereRadius;
        float h = sqrt(max(r2 - dot(dXZ, dXZ), 0.0));

        // Point de base sur la sphère (surface)
        vec3 basePos = vec3(flatPos.x, uSphereCenter.y + h, flatPos.z);

        // Normale de la sphère au point de base
        vec3 normal = normalize(basePos - uSphereCenter);

        // Tangente arbitraire
        vec3 tangent1 = normalize(vec3(-normal.z, 0.0, normal.x));
        vec3 tangent2 = normalize(cross(normal, tangent1));

        // local.y = hauteur, local.x / local.z = petite largeur
        vec3 worldPos = basePos
        + tangent1 * local.x
        + normal   * local.y
        + tangent2 * local.z;


        vec4 mvPosition = viewMatrix * vec4(worldPos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
      fragmentShader: `
      precision mediump float;
      uniform vec3 uColor;

      void main() {
        gl_FragColor = vec4(uColor, 1.0);
      }
    `,
      side: THREE.DoubleSide,
    });
  };


  const initializeDeviceCalibration = () => {
    const { alpha, beta, gamma } = rotationRef.current;
    const initialDeviceQuat = new THREE.Quaternion();
    setDeviceQuaternion(initialDeviceQuat, alpha, beta, gamma, 0);
    const invDevice = initialDeviceQuat.clone().invert();
    calibrationQuatRef.current.copy(baseQuatRef.current).multiply(invDevice);
  };

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_CONFIG.background);

    const camera = initializeCamera(width, height);
    initializeDeviceCalibration();

    initializeLighting(scene);

    const groundMaterial = createGrassMaterial();
    // const groundPlane = new THREE.PlaneGeometry(
    //   SCENE_CONFIG.groundSize,
    //   SCENE_CONFIG.groundSize,
    //   1,
    //   1
    // );
    // const groundMesh = new THREE.Mesh(groundPlane, groundMaterial);
    // groundMesh.rotation.x = -Math.PI / 2;
    const groundPlane = new THREE.SphereGeometry(
      15, 50, 20
    );
    const groundMesh = new THREE.Mesh(groundPlane, groundMaterial);
    groundMesh.position.y = -15;
    scene.add(groundMesh);

    const grassGeometry = generateGrassGeometry();
    const patchSize = GRASS_CONFIG.patchRadius * 2;

    const grassUniforms = {
      uTime: { value: 0 },
      uAmplitude: { value: GRASS_CONFIG.amplitude },
      uColor: { value: new THREE.Color(GRASS_CONFIG.color) },
      uPatchSize: { value: patchSize },
      uPlayerPosition: { value: new THREE.Vector3(0, 0, 0) },

      // → nouveaux uniforms
      uSphereCenter: { value: new THREE.Vector3(0, -15, 0) },
      uSphereRadius: { value: 15 },
    };


    const grassBladesMaterial = createGrassShaderMaterial(grassUniforms);

    const grassBladesMesh = new THREE.Mesh(grassGeometry, grassBladesMaterial);
    grassBladesMesh.frustumCulled = false;
    scene.add(grassBladesMesh);

    const renderLoop = () => {
      animationFrameId.current = requestAnimationFrame(renderLoop);

      const { alpha, beta, gamma } = rotationRef.current;
      setDeviceQuaternion(deviceQuatRef.current, alpha, beta, gamma, 0);

      const targetQuat = new THREE.Quaternion()
        .copy(calibrationQuatRef.current)
        .multiply(deviceQuatRef.current);

      camera.quaternion.slerp(targetQuat, 0.2);

      const playerPos = grassUniforms.uPlayerPosition.value;
      playerPos.copy(camera.position);
      playerPos.y = 0;

      grassUniforms.uTime.value = Date.now() * 0.001;

      groundMesh.rotation.x += 0.001;

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
    calibrationQuatRef.current.copy(baseQuatRef.current).multiply(invDevice);
  };

  return (
    <View style={styles.container}>
      <GLView style={styles.glView} onContextCreate={onContextCreate} />

      {/* Reset view button overlay */}
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
