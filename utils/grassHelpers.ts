import * as THREE from 'three';

interface GrassWrapperParams {
  gridSize: number;
  step: number;
  halfWidth: number;
  wrapDistance: number;
}

export function updateGrassWrapping(
  grassGroup: THREE.Group,
  planet: THREE.Mesh,
  prevRotation: { x: number; z: number },
  params: GrassWrapperParams,
  sphereRadius: number = 50
): { x: number; z: number } {
  const currentRotX = planet.rotation.x;
  const currentRotZ = planet.rotation.z;

  const deltaRotX = currentRotX - prevRotation.x;
  const deltaRotZ = currentRotZ - prevRotation.z;

  const scrollFactor = sphereRadius;

  const deltaScrollZ = deltaRotX * scrollFactor;
  const deltaScrollX = -deltaRotZ * scrollFactor;

  grassGroup.children.forEach((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.position.x += deltaScrollX;
    child.position.z += deltaScrollZ;

    // Wrapping horizontal
    if (child.position.x > params.halfWidth) {
      child.position.x -= params.wrapDistance;
    } else if (child.position.x < -params.halfWidth) {
      child.position.x += params.wrapDistance;
    }

    // Wrapping vertical
    if (child.position.z > params.halfWidth) {
      child.position.z -= params.wrapDistance;
    } else if (child.position.z < -params.halfWidth) {
      child.position.z += params.wrapDistance;
    }
  });

  return {
    x: currentRotX,
    z: currentRotZ,
  };
}

export function updateGrassShaderFog(
  grassMaterial: THREE.ShaderMaterial | null,
  scene: THREE.Scene
): void {
  if (!grassMaterial || !scene.fog) return;

  if (scene.fog instanceof THREE.FogExp2) {
    grassMaterial.uniforms.fogDensity.value = scene.fog.density;
  } else if (scene.fog instanceof THREE.Fog) {
    // Pour un fog linéaire, on approxime avec une densité exponentielle
    // Plus la distance est grande, plus la densité est petite
    const range = scene.fog.far - scene.fog.near;
    grassMaterial.uniforms.fogDensity.value = 1.0 / (range * range);
  }

  if (grassMaterial.uniforms.fogColor) {
    grassMaterial.uniforms.fogColor.value.copy(scene.fog.color);
  }
}

