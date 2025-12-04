import { TextureLoader } from "expo-three";
import * as THREE from "three";

export interface RainSprite {
  mesh: THREE.Sprite;
  velocityY: number;
  resetY: number;
}

export interface WeatherConfig {
  rainCount?: number;
  spreadX?: number;
  spreadY?: number;
  minY?: number;
  maxY?: number;
  fallSpeed?: number;
  resetThreshold?: number;
}

const DEFAULT_CONFIG: Required<WeatherConfig> = {
  rainCount: 200,
  spreadX: 50,
  spreadY: 50,
  minY: 10,
  maxY: 30,
  fallSpeed: 3,
  resetThreshold: -5,
};

/**
 * Crée un système de pluie avec des sprites Three.js
 * Les sprites tombent à des positions aléatoires et redémarrent au sommet
 * @param scene - La scène Three.js où ajouter la pluie
 * @param config - Configuration optionnelle du système de pluie
 * @returns Un objet contenant le groupe de pluie et les sprites pour gestion
 */
export const createWeatherSystem = (
  scene: THREE.Scene,
  config: WeatherConfig = {}
) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const rainGroup = new THREE.Group();
  const rainSprites: RainSprite[] = [];

  const rainTexture = new TextureLoader().load(
      require("../assets/textures/goutte.png")
    );

  const material = new THREE.SpriteMaterial({
    map: rainTexture,
    sizeAttenuation: true,
    transparent: true,
  });

  for (let i = 0; i < finalConfig.rainCount; i++) {
    const sprite = new THREE.Sprite(material);

    const x = (Math.random() - 0.5) * finalConfig.spreadX;
    const y = Math.random() * finalConfig.spreadY + finalConfig.minY;
    const z = (Math.random() - 0.5) * finalConfig.spreadX;

    sprite.position.set(x, y, z);
    sprite.scale.set(0.3, 0.3, 1);

    rainGroup.add(sprite);

    rainSprites.push({
      mesh: sprite,
      velocityY: -finalConfig.fallSpeed * (0.5 + Math.random() * 0.5),
      resetY: y,
    });
  }

  scene.add(rainGroup);

  /**
   * Mettre à jour la pluie chaque frame
   * @param deltaTime - Temps écoulé depuis la dernière frame
   */
  const updateRain = (deltaTime: number = 0.016) => {
    rainSprites.forEach((rainSprite) => {
      rainSprite.mesh.position.y += rainSprite.velocityY * deltaTime * 60; // 60fps baseline

      if (rainSprite.mesh.position.y < finalConfig.resetThreshold) {
        rainSprite.mesh.position.y = finalConfig.maxY + Math.random() * 5;

        rainSprite.mesh.position.x =
          (Math.random() - 0.5) * finalConfig.spreadX;
        rainSprite.mesh.position.z =
          (Math.random() - 0.5) * finalConfig.spreadX;
      }
    });
  };

  return {
    rainGroup,
    rainSprites,
    updateRain,
    material,
  };
};

/**
 * Ajouter une texture personnalisée aux sprites de pluie
 * @param rainSprites - Tableau des sprites de pluie
 * @param textureUrl - URL ou chemin de la texture
 */
export const setRainTexture = (
  rainSprites: RainSprite[],
  texture: THREE.Texture
) => {
  rainSprites.forEach((rainSprite) => {
    if (rainSprite.mesh.material instanceof THREE.SpriteMaterial) {
      rainSprite.mesh.material.map = texture;
    }
  });
};

/**
 * Mettre à jour la vitesse de la pluie
 * @param rainSprites - Tableau des sprites de pluie
 * @param speedMultiplier - Multiplicateur de vitesse
 */
export const setRainSpeed = (
  rainSprites: RainSprite[],
  speedMultiplier: number = 1
) => {
  rainSprites.forEach((rainSprite) => {
    rainSprite.velocityY *= speedMultiplier;
  });
};

/**
 * Obtenir ou modifier la visibilité de la pluie
 * @param rainGroup - Le groupe de pluie
 * @param visible - État de visibilité
 */
export const setRainVisible = (
  rainGroup: THREE.Group,
  visible: boolean
) => {
  rainGroup.visible = visible;
};
