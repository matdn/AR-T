import * as THREE from 'three';
import { createGrassShaderMaterial } from './grassShader';

export function createPlanet(): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(50, 64, 64);
  const material = new THREE.MeshStandardMaterial({ 
    color: 0x88cc88, 
    roughness: 0.8,
    metalness: 0.2,
    wireframe: false
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

export function createRectangle( position: THREE.Vector3, normal: THREE.Vector3, heightAboveSurface: number = 2 ): THREE.Mesh {
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 0.7,
    metalness: 0.3,
    side: THREE.DoubleSide,
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

  // Améliorer les performances du raycaster et éviter un culottage incorrect
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
  rectangle.frustumCulled = false;

  return rectangle;
}

export function createRandomRectangles(count: number = 20): THREE.Mesh[] {
  const rectangles: THREE.Mesh[] = [];
  
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    const radius = 52; // Au-dessus de la planète (rayon 50)
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    const position = new THREE.Vector3(x, y, z);
    const normal = position.clone().normalize();
    
    const rectangle = createRectangle(position, normal);
    
    // Stocker les infos pour l'animation et l'interaction
    rectangle.userData = {
      basePosition: position.clone(),
      floatOffset: Math.random() * Math.PI * 2, // Phase aléatoire pour l'animation
      floatSpeed: 0.5 + Math.random() * 0.5, // Vitesse de flottement variable
      floatAmplitude: 0.1 + Math.random() * 0.15, // Amplitude variable
      id: i,
      message: `Rectangle ${i + 1}`
    };
    
    rectangles.push(rectangle);
  }
  
  return rectangles;
}

interface GrassGridConfig {
  gridSize?: number;
  tileSize?: number;
  spacing?: number;
  instancesPerTile?: number;
  bladeWidth?: number;
  bladeHeight?: number;
  minHeight?: number;
  maxHeight?: number;
}

export function createGrassGrid(config: GrassGridConfig = {}): {
  group: THREE.Group;
  material: THREE.ShaderMaterial;
  params: {
    gridSize: number;
    step: number;
    halfWidth: number;
    wrapDistance: number;
  };
} {
  const {
    gridSize = 8,
    tileSize = 4,
    spacing = 0.01,
    instancesPerTile = 500,
    bladeWidth = 0.1,
    bladeHeight = 1,
    minHeight = 0.2,
    maxHeight = 0.6,
  } = config;

  const grassMaterial = createGrassShaderMaterial({
    sphereCenter: new THREE.Vector3(0, -50, 0),
    sphereRadius: 50 - 0.1,
  });

  const gridGroup = new THREE.Group();
  const step = tileSize + spacing;
  const halfWidth = (gridSize * step) / 2;
  const wrapDistance = gridSize * step;

  const bladeGeo = new THREE.PlaneGeometry(bladeWidth, bladeHeight, 1, 4);
  bladeGeo.translate(0, bladeHeight / 2, 0);

  const dummy = new THREE.Object3D();

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const grassPatch = new THREE.InstancedMesh(
        bladeGeo,
        grassMaterial,
        instancesPerTile
      );

      grassPatch.position.set(
        i * step - (gridSize - 1) * step * 0.5,
        0,
        j * step - (gridSize - 1) * step * 0.5
      );

      for (let k = 0; k < instancesPerTile; k++) {
        dummy.position.set(
          (Math.random() - 0.5) * tileSize,
          0,
          (Math.random() - 0.5) * tileSize
        );

        const randomHeight = minHeight + Math.random() * (maxHeight - minHeight);
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

  return {
    group: gridGroup,
    material: grassMaterial,
    params: {
      gridSize,
      step,
      halfWidth,
      wrapDistance,
    },
  };
}

export function createInnerAtmosphere(): THREE.Group {
  const radius = 72; 
  const gridGroup = new THREE.Group();
  
  const material = new THREE.LineBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    linewidth: 3 
  });
  
  const latSegments = 20;
  const lonSegments = 40; 
  
  for (let i = 0; i <= latSegments; i++) {
    const phi = (Math.PI * i) / latSegments;
    const points = [];
    
    for (let j = 0; j <= 64; j++) {
      const theta = (2 * Math.PI * j) / 64;
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      points.push(new THREE.Vector3(x, y, z));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    gridGroup.add(line);
  }
  
  for (let i = 0; i < lonSegments; i++) {
    const theta = (2 * Math.PI * i) / lonSegments;
    const points = [];
    
    for (let j = 0; j <= 64; j++) {
      const phi = (Math.PI * j) / 64;
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      points.push(new THREE.Vector3(x, y, z));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    gridGroup.add(line);
  }
  
  gridGroup.position.set(0, -50, 0);
  
  return gridGroup;
}
