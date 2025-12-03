import * as THREE from 'three';

export function createPlanet(): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(50, 64, 64);
  const material = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    roughness: 0.8,
    metalness: 0.2
  });
  const planet = new THREE.Mesh(geometry, material);
  planet.position.set(0, -50, 0);
  
  return planet;
}

export function addGridLinesToPlanet(planet: THREE.Mesh) {
  const gridLineMaterial = new THREE.LineBasicMaterial({ 
    color: 0xcccccc,
    transparent: true,
    opacity: 0.6
  });
  
  const gridSegments = 40;
  const gridRadius = 50.02;
  
  // Latitude lines
  for (let i = 0; i <= gridSegments; i++) {
    const phi = (Math.PI * i) / gridSegments;
    const points = [];
    
    for (let j = 0; j <= 64; j++) {
      const theta = (2 * Math.PI * j) / 64;
      const x = gridRadius * Math.sin(phi) * Math.cos(theta);
      const y = gridRadius * Math.cos(phi);
      const z = gridRadius * Math.sin(phi) * Math.sin(theta);
      points.push(new THREE.Vector3(x, y, z));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, gridLineMaterial);
    planet.add(line);
  }
  
  // Longitude lines
  for (let i = 0; i < gridSegments; i++) {
    const theta = (2 * Math.PI * i) / gridSegments;
    const points = [];
    
    for (let j = 0; j <= 64; j++) {
      const phi = (Math.PI * j) / 64;
      const x = gridRadius * Math.sin(phi) * Math.cos(theta);
      const y = gridRadius * Math.cos(phi);
      const z = gridRadius * Math.sin(phi) * Math.sin(theta);
      points.push(new THREE.Vector3(x, y, z));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, gridLineMaterial);
    planet.add(line);
  }
}

export function createSkySphere(): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(80, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0x000000,
    wireframe: true,
    side: THREE.BackSide,
  });
  const sky = new THREE.Mesh(geometry, material);
  sky.position.set(0, -50, 0);
  
  return sky;
}

export function createRectangle(
  position: THREE.Vector3,
  normal: THREE.Vector3,
  heightAboveSurface: number = 2
): THREE.Mesh {
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x000000,
    roughness: 0.7,
    metalness: 0.3
  });

  const rectWidth = 3;
  const rectHeight = 0.2;
  const rectDepth = 3;
  
  const geometry = new THREE.BoxGeometry(rectWidth, rectHeight, rectDepth);
  const rectangle = new THREE.Mesh(geometry, wallMaterial);
  
  rectangle.position.set(
    position.x + normal.x * heightAboveSurface,
    position.y + normal.y * heightAboveSurface,
    position.z + normal.z * heightAboveSurface
  );
  
  const localZ = normal.clone();
  const worldUp = new THREE.Vector3(0, 1, 0);
  const localX = new THREE.Vector3().crossVectors(worldUp, localZ);
  
  if (localX.lengthSq() < 0.001) {
    localX.set(1, 0, 0).cross(localZ);
  }
  localX.normalize();
  
  const localY = new THREE.Vector3().crossVectors(localZ, localX).normalize();
  
  const matrix = new THREE.Matrix4();
  matrix.makeBasis(localX, localY, localZ);
  rectangle.rotation.setFromRotationMatrix(matrix);
  
  return rectangle;
}

export function createRandomRectangles(count: number = 20): THREE.Mesh[] {
  const rectangles: THREE.Mesh[] = [];
  
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    const radius = 50;
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    const position = new THREE.Vector3(x, y, z);
    const normal = position.clone().normalize();
    
    const rectangle = createRectangle(position, normal);
    rectangles.push(rectangle);
  }
  
  return rectangles;
}
