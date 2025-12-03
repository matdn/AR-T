import * as THREE from 'three';

export function rotatePlanetWithCamera(
  planet: THREE.Mesh,
  camera: THREE.PerspectiveCamera,
  velocity: { x: number; z: number },
  rotationSpeed: number = 0.01
): void {
  const isMoving = velocity.x !== 0 || velocity.z !== 0;
  
  if (!isMoving) return;
  
  const forward = new THREE.Vector3(0, 0, -1);
  const right = new THREE.Vector3(1, 0, 0);
  
  forward.applyQuaternion(camera.quaternion);
  right.applyQuaternion(camera.quaternion);
  
  forward.y = 0;
  right.y = 0;
  forward.normalize();
  right.normalize();
  
  const rotationAxis = new THREE.Vector3();
  rotationAxis.addScaledVector(right, -velocity.z);
  rotationAxis.addScaledVector(forward, velocity.x);
  
  if (rotationAxis.length() > 0) {
    rotationAxis.normalize();
    const rotationAngle = rotationSpeed * Math.sqrt(
      velocity.x * velocity.x + 
      velocity.z * velocity.z
    );
    
    const rotationQuaternion = new THREE.Quaternion();
    rotationQuaternion.setFromAxisAngle(rotationAxis, rotationAngle);
    
    const currentQuat = new THREE.Quaternion();
    currentQuat.setFromEuler(planet.rotation);
    currentQuat.premultiply(rotationQuaternion);
    
    planet.rotation.setFromQuaternion(currentQuat);
  }
}

export function checkCollisions(
  camera: THREE.PerspectiveCamera,
  rectangles: THREE.Mesh[],
  minDistance: number = 1
): boolean {
  const cameraPosition = camera.position;
  
  for (const rectangle of rectangles) {
    const wallWorldPosition = new THREE.Vector3();
    rectangle.getWorldPosition(wallWorldPosition);
    
    const distance = cameraPosition.distanceTo(wallWorldPosition);
    
    if (distance < minDistance) {
      return true;
    }
  }
  
  return false;
}

export function placeRectangleOnSurface(
  raycaster: THREE.Raycaster,
  camera: THREE.PerspectiveCamera,
  planet: THREE.Mesh,
  screenX: number,
  screenY: number,
  screenWidth: number,
  screenHeight: number
): { position: THREE.Vector3; normal: THREE.Vector3 } | null {
  const mouse = new THREE.Vector2();
  mouse.x = (screenX / screenWidth) * 2 - 1;
  mouse.y = -(screenY / screenHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(planet, false);

  if (intersects.length > 0) {
    const intersect = intersects[0];
    const point = intersect.point;
    const normal = intersect.face?.normal;

    if (normal) {
      const worldNormal = normal.clone();
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(planet.matrixWorld);
      worldNormal.applyMatrix3(normalMatrix).normalize();
      
      return {
        position: point.clone(),
        normal: worldNormal
      };
    }
  }
  
  return null;
}
