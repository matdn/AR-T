import * as THREE from 'three';

interface GrassShaderOptions {
  sphereCenter?: THREE.Vector3;
  sphereRadius?: number;
  grassColor?: THREE.Vector3;
  windStrength?: number;
}

export function createGrassShaderMaterial(options: GrassShaderOptions = {}) {
  const { 
    sphereCenter = new THREE.Vector3(0, -50, 0), 
    sphereRadius = 50 - 0.1,
    grassColor = new THREE.Vector3(0.41, 1.0, 0.5),
    windStrength = 0.1,
  } = options;

  return new THREE.ShaderMaterial({
    uniforms: {
      uSphereCenter: { value: sphereCenter },
      uSphereRadius: { value: sphereRadius },
      uGrassColor: { value: grassColor },
      uWindStrength: { value: windStrength },
      time: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      uniform float time;
      uniform vec3 uSphereCenter;
      uniform float uSphereRadius;
      uniform float uWindStrength;

      void main() {
        vUv = uv;

        // Position locale du brin (dans le patch)
        vec4 mvPosition = vec4(position, 1.0);

        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif

        // Position monde AVANT courbure sur la sphère
        vec4 worldPos = modelMatrix * mvPosition;

        // --- VENT ---
        float dispPower = 1.0 - cos(uv.y * 3.14159265 / 2.0);
        float wind = sin(worldPos.x * 0.5 + time * 2.0) * uWindStrength * dispPower;

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
      uniform vec3 uGrassColor;

      void main() {
        float clarity = (vUv.y * 0.5) + 0.5;
        gl_FragColor = vec4(uGrassColor * clarity, 1.0);
      }
    `,
    side: THREE.DoubleSide,
    transparent: false,
  });
}

export function updateGrassTime(material: THREE.ShaderMaterial, time: number) {
  if (material.uniforms.time) {
    material.uniforms.time.value = time;
  }
}
