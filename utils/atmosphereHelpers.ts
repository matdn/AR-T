import * as THREE from 'three';
import { Renderer } from 'expo-three';

export interface AtmosphereRenderData {
  renderTarget: THREE.WebGLRenderTarget;
  postScene: THREE.Scene;
  postCamera: THREE.OrthographicCamera;
  postMaterial: THREE.ShaderMaterial;
  envMesh: THREE.Mesh;
  enableLUT: boolean;
}

export function renderWithAtmosphere(
  renderer: Renderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  atmosphereData: AtmosphereRenderData | null,
  gl: any
): void {
  if (!atmosphereData || !atmosphereData.enableLUT || !atmosphereData.renderTarget || !atmosphereData.postScene || !atmosphereData.postCamera || !atmosphereData.postMaterial) {
    // Rendu simple sans post-processing
    renderer.render(scene, camera);
    gl.endFrameEXP();
    return;
  }

  const { renderTarget, postScene, postCamera, postMaterial } = atmosphereData;

  // Vérifier que le renderTarget et la texture sont valides
  if (!renderTarget.texture) {
    renderer.render(scene, camera);
    gl.endFrameEXP();
    return;
  }

  // 1. Rendu de la scène dans le render target
  renderer.setRenderTarget(renderTarget);
  renderer.render(scene, camera);

  // 2. Application du LUT en post-processing
  renderer.setRenderTarget(null);
  postMaterial.uniforms.tDiffuse.value = renderTarget.texture;
  renderer.render(postScene, postCamera);

  gl.endFrameEXP();
}

export function updateAtmospherePosition(
  atmosphereData: AtmosphereRenderData | null,
  position: THREE.Vector3
): void {
  if (atmosphereData && atmosphereData.envMesh) {
    atmosphereData.envMesh.position.copy(position);
  }
}

export function updateAtmosphereIntensity(
  atmosphereData: AtmosphereRenderData | null,
  intensity: number
): void {
  if (atmosphereData && atmosphereData.postMaterial) {
    atmosphereData.postMaterial.uniforms.uIntensity.value = Math.max(0, Math.min(1, intensity));
  }
}

export function toggleAtmosphereLUT(
  atmosphereData: AtmosphereRenderData | null,
  enabled: boolean
): void {
  if (atmosphereData) {
    atmosphereData.enableLUT = enabled;
  }
}
