import * as THREE from 'three';

interface GrassShaderOptions {
  sphereCenter?: THREE.Vector3;
  sphereRadius?: number;
  grassColor?: THREE.Vector3;
  windStrength?: number;
}

export type GrassColorMode =
  | 'yellow_1'
  | 'orange'
  | 'pink'
  | 'blue'
  | 'green_1'
  | 'green_2'
  | 'yellow_2'
  | 'red';

const GRASS_COLORS: Record<GrassColorMode, THREE.Vector3> = {
  yellow_1: new THREE.Vector3(0.953, 0.851, 0.561),
  orange:   new THREE.Vector3(0.945, 0.549, 0.133),
  pink:     new THREE.Vector3(0.890, 0.407, 0.529),
  blue:     new THREE.Vector3(0.447, 0.596, 0.780),
  green_1:  new THREE.Vector3(0.705, 0.709, 0.207),
  green_2:  new THREE.Vector3(0.168, 0.533, 0.360),
  yellow_2: new THREE.Vector3(0.980, 0.815, 0.384),
  red:      new THREE.Vector3(0.949, 0.027, 0.070),
};

export const getGrassColorByMode = (mode: GrassColorMode = 'green_1') =>
  GRASS_COLORS[mode];

export function createGrassShaderMaterial(options: GrassShaderOptions = {}) {
  const {
    sphereCenter = new THREE.Vector3(0, -50, 0),
    sphereRadius = 50 - 0.1,
    grassColor = new THREE.Vector3(0.705, 0.709, 0.207),
    windStrength = 0.1,
  } = options;

  return new THREE.ShaderMaterial({
    uniforms: {
      uSphereCenter: { value: sphereCenter },
      uSphereRadius: { value: sphereRadius },
      uGrassColor: { value: grassColor },
      uWindStrength: { value: windStrength },
      time: { value: 0 },
      fogColor: { value: new THREE.Color(0xa0d8ff) },
      fogDensity: { value: 0.02 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
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
        vWorldPos = worldPos.xyz;

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
      varying vec3 vWorldPos;
      uniform vec3 uGrassColor;
      uniform vec3 fogColor;
      uniform float fogDensity;

      void main() {
        float clarity = (vUv.y * 0.5) + 0.5;
        vec3 grassFinal = uGrassColor * clarity;
        
        // Appliquer le fog exponentiel
        float dist = length(vWorldPos);
        float fogFactor = exp(-fogDensity * fogDensity * dist * dist);
        vec3 finalColor = mix(fogColor, grassFinal, fogFactor);
        
        gl_FragColor = vec4(finalColor, 1.0);
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
