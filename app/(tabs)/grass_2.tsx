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

const SPHERE_RADIUS = 15;

const CAMERA_CONFIG = {
  fov: 60,
  near: 0.1,
  far: 100,
  initialPos: { x: 0, y: 5, z: 0 },
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

  const prevRotRef = useRef({ x: 0, z: 0 });


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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // const spotLight = new THREE.SpotLight(0xffffff, 20);
    // spotLight.position.set(0, 6, -5);
    // scene.add(spotLight);
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

  const initializeDeviceCalibration = () => {
    const { alpha, beta, gamma } = rotationRef.current;
    const initialDeviceQuat = new THREE.Quaternion();
    setDeviceQuaternion(initialDeviceQuat, alpha, beta, gamma, 0);
    const invDevice = initialDeviceQuat.clone().invert();
    calibrationQuatRef.current.copy(baseQuatRef.current).multiply(invDevice);
  };

  const createGrassShaderMaterial = () => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uSphereCenter: { value: new THREE.Vector3(0, -SPHERE_RADIUS, 0) },
        uSphereRadius: { value: SPHERE_RADIUS - 0.1 },
        time: { value: 0 },
      },
      vertexShader: `
      varying vec2 vUv;
      uniform float time;
      uniform vec3 uSphereCenter;
      uniform float uSphereRadius;

      void main() {
        vUv = uv;

        // Position locale du brin (dans le patch)
        vec4 mvPosition = vec4(position, 1.0);

        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif

        // Position monde AVANT courbure sur la sphère
        vec4 worldPos = modelMatrix * mvPosition;

        // --- VENT (inspiré de ton exemple) ---
        float dispPower = 1.0 - cos(uv.y * 3.14159265 / 2.0);
        float wind = sin(worldPos.x * 0.5 + time * 2.0) * 0.1 * dispPower;

        // Direction radiale depuis le centre de la sphère
        vec3 dir = normalize(worldPos.xyz - uSphereCenter);

        // Vector latéral pour le vent (perpendiculaire à dir)
        vec3 side = normalize(cross(dir, vec3(0.0, 1.0, 0.0)));
        if (length(side) < 0.001) {
          side = normalize(cross(dir, vec3(1.0, 0.0, 0.0)));
        }

        // Hauteur du brin selon vUv.y (0 = base, 1 = tip)
        float height = uv.y * 0.5;

        // Base du brin collée à la sphère
        vec3 basePos = uSphereCenter + dir * uSphereRadius;

        // Position finale : base + hauteur radiale + vent latéral
        vec3 finalPos = basePos + dir * height + side * wind;

        vec4 viewPos = viewMatrix * vec4(finalPos, 1.0);
        gl_Position = projectionMatrix * viewPos;
      }
    `,
      fragmentShader: `
      varying vec2 vUv;

      void main() {
        vec3 baseColor = vec3(0.41, 1.0, 0.5);
        float clarity = (vUv.y * 0.5) + 0.5;
        gl_FragColor = vec4(baseColor * clarity, 1.0);
      }
    `,
      side: THREE.DoubleSide,
      transparent: false,
    });
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
    const groundPlane = new THREE.SphereGeometry(
      SPHERE_RADIUS, 50, 20
    );
    const groundMesh = new THREE.Mesh(groundPlane, groundMaterial);
    groundMesh.position.y = -15;
    scene.add(groundMesh);

    prevRotRef.current = {
      x: groundMesh.rotation.x,
      z: groundMesh.rotation.z,
    };

    const clock = new THREE.Clock();

    // 🌿 shader d'herbe
    const grassMaterial = createGrassShaderMaterial();

    // 🌿🌿🌿 GRILLE 5x5 DE PATCHES D'HERBE 🌿🌿🌿
    const gridGroup = new THREE.Group();
    const gridSize = 8;
    const tileSize = 4;
    const spacing = 0.01;
    const step = tileSize + spacing;
    const halfWidth = (gridSize * step) / 2;
    const wrapDistance = gridSize * step;

    // géométrie d'un brin
    const bladeGeo = new THREE.PlaneGeometry(0.1, 1, 1, 4);
    // on remonte la géo pour que la base soit à y = 0
    bladeGeo.translate(0, 0.5, 0);

    const INSTANCES_PER_TILE = 500;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        // patch d'herbe pour ce tile
        const grassPatch = new THREE.InstancedMesh(
          bladeGeo,
          grassMaterial,
          INSTANCES_PER_TILE
        );

        // position du patch (centre du tile)
        grassPatch.position.set(
          i * step - (gridSize - 1) * step * 0.5,
          0,
          j * step - (gridSize - 1) * step * 0.5
        );

        // distribuer les brins dans la zone [ -tileSize/2 ; tileSize/2 ]
        for (let k = 0; k < INSTANCES_PER_TILE; k++) {
          dummy.position.set(
            (Math.random() - 0.5) * tileSize,
            0,
            (Math.random() - 0.5) * tileSize
          );

          const minH = 0.2;
          const maxH = 0.6;
          const randomHeight = minH + Math.random() * (maxH - minH);

          dummy.scale.set(0.5, randomHeight, 1.0);

          dummy.rotation.y = Math.random() * Math.PI * 2;

          dummy.updateMatrix();
          grassPatch.setMatrixAt(k, dummy.matrix);
        }

        grassPatch.instanceMatrix.needsUpdate = true;

        gridGroup.add(grassPatch);
      }
    }

    gridGroup.position.y = 0;
    scene.add(gridGroup);
    // 🔴🔴🔴 FIN DE LA GRILLE 🔴🔴🔴

    const renderLoop = () => {
      animationFrameId.current = requestAnimationFrame(renderLoop);

      const { alpha, beta, gamma } = rotationRef.current;
      setDeviceQuaternion(deviceQuatRef.current, alpha, beta, gamma, 0);

      const targetQuat = new THREE.Quaternion()
        .copy(calibrationQuatRef.current)
        .multiply(deviceQuatRef.current);

      camera.quaternion.slerp(targetQuat, 0.2);

      groundMesh.rotation.x += 0.001;
      groundMesh.rotation.z += 0.0; // par ex. rotation diagonale

      // update du temps pour le shader d'herbe
      grassMaterial.uniforms.time.value = clock.getElapsedTime();

      // === SCROLL 2D DE LA GRILLE EN FONCTION DE LA ROTATION DE LA SPHÈRE ===
      const currentRotX = groundMesh.rotation.x;
      const currentRotZ = groundMesh.rotation.z;

      const deltaRotX = currentRotX - prevRotRef.current.x;
      const deltaRotZ = currentRotZ - prevRotRef.current.z;

      prevRotRef.current.x = currentRotX;
      prevRotRef.current.z = currentRotZ;

      // facteur pour convertir la rotation en déplacement (à ajuster à l’œil)
      const scrollFactor = SPHERE_RADIUS;

      // On mappe :
      // - rotation.x -> mouvement sur Z (avant / arrière)
      // - rotation.z -> mouvement sur X (gauche / droite)
      const deltaScrollZ = deltaRotX * scrollFactor;
      const deltaScrollX = -deltaRotZ * scrollFactor;

      gridGroup.children.forEach((child) => {
        if (!(child instanceof THREE.Mesh)) return;

        // On applique le déplacement en X/Z
        child.position.x += deltaScrollX;
        child.position.z += deltaScrollZ;

        // --- WRAP 2D INDIVIDUEL ---

        // X
        if (child.position.x > halfWidth) {
          child.position.x -= wrapDistance;
        } else if (child.position.x < -halfWidth) {
          child.position.x += wrapDistance;
        }

        // Z
        if (child.position.z > halfWidth) {
          child.position.z -= wrapDistance;
        } else if (child.position.z < -halfWidth) {
          child.position.z += wrapDistance;
        }
      });
      // === FIN DU SCROLL INFINI 2D ===

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
