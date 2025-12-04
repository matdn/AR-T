import { TextureLoader } from "expo-three";
import * as THREE from "three";

export const createEnvironmentMaterial = () => {
  const envTexture = new TextureLoader().load(
    require("../assets/textures/puresky.png")
  );

  envTexture.flipY = false;
  envTexture.wrapS = envTexture.wrapT = THREE.ClampToEdgeWrapping;
  envTexture.rotation = Math.PI;
  envTexture.center.set(0.5, 0.5);

  return new THREE.MeshBasicMaterial({
    map: envTexture,
    side: THREE.BackSide,
    depthWrite: false,
  });
};

export const createLUTPostMaterial = () => {
  const lutTexture = new TextureLoader().load(
    require("../assets/textures/lut_test_night2.png")
  );
  lutTexture.minFilter = THREE.LinearFilter;
  lutTexture.magFilter = THREE.LinearFilter;
  lutTexture.wrapS = THREE.ClampToEdgeWrapping;
  lutTexture.wrapT = THREE.ClampToEdgeWrapping;

  const lutSize = 64.0;
  const lutTiles = 8.0;

  return new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: null },
      tLUT: { value: lutTexture },
      uLUTSize: { value: lutSize },
      uLUTTiles: { value: lutTiles },
      uIntensity: { value: 0.8 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform sampler2D tDiffuse;
      uniform sampler2D tLUT;
      uniform float uLUTSize;
      uniform float uLUTTiles;
      uniform float uIntensity;

      varying vec2 vUv;

      vec3 sampleLUT(vec3 color) {
        float size  = uLUTSize;
        float tiles = uLUTTiles;
        float texSize = size * tiles; // 512

        float rIndex = floor(color.r * (size - 1.0) + 0.5);
        float gIndex = floor(color.g * (size - 1.0) + 0.5);
        float bIndex = floor(color.b * (size - 1.0) + 0.5);

        float tileX = mod(bIndex, tiles);
        float tileY = floor(bIndex / tiles);

        float x = tileX * size + rIndex + 0.5;
        float y = tileY * size + gIndex + 0.5;

        vec2 lutUV = vec2(x / texSize, y / texSize);

        return texture2D(tLUT, lutUV).rgb;
      }

      void main() {
        vec4 src = texture2D(tDiffuse, vUv);
        vec3 graded = sampleLUT(src.rgb);

        // Mix image originale / LUT
        vec3 finalColor = mix(src.rgb, graded, uIntensity);

        gl_FragColor = vec4(finalColor, src.a);
      }
    `,
  });
};

export interface AtmosphereConfig {
  envMesh?: THREE.Mesh;
  postScene?: THREE.Scene;
  renderTarget?: THREE.WebGLRenderTarget;
}

export const createAtmosphereMeshes = (
  scene: THREE.Scene,
  width: number,
  height: number
) => {
  const renderTarget = new THREE.WebGLRenderTarget(width, height, {
    depthBuffer: true,
    stencilBuffer: false,
  });

  const postScene = new THREE.Scene();
  const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const postMaterial = createLUTPostMaterial();
  const postQuad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    postMaterial
  );
  postScene.add(postQuad);

  const envMaterial = createEnvironmentMaterial();
  const envGeo = new THREE.SphereGeometry(100, 64, 32);
  const envMesh = new THREE.Mesh(envGeo, envMaterial);
  envMesh.position.set(0, 0, 0);
  scene.add(envMesh);

  return {
    renderTarget,
    postScene,
    postCamera,
    postMaterial,
    envMesh,
  };
};
