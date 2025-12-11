import * as THREE from "three";
import { TextureLoader } from "expo-three";
import { Asset } from "expo-asset";

export interface ButterflyData {
  sprites: THREE.Sprite[];
  material: THREE.SpriteMaterial;
}

/**
 * Crée et charge les papillons avec leur texture
 * @param scene - La scène THREE
 * @param count - Nombre de papillons (défaut: 50)
 * @returns Promise avec les données des papillons (sprites et material)
 */
export const initializeButterflySystem = async (
  scene: THREE.Scene,
  count: number = 50
): Promise<ButterflyData> => {
  try {
    // Charger la texture du papillon
    const asset = Asset.fromModule(
      require("../assets/textures/butterfly.png")
    );
    await asset.downloadAsync();

    const uri = asset.localUri ?? asset.uri;
    const texture = await new TextureLoader().loadAsync(uri);

    // Paramètres "safe" pour mobile
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.flipY = false;

    // Créer le material partagé
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });

    // Créer les sprites des papillons
    const sprites = createButterflies(scene, material, count);

    return { sprites, material };
  } catch (e) {
    console.warn("Erreur chargement système papillon:", e);
    throw e;
  }
};

/**
 * Crée les sprites individuels des papillons
 */
const createButterflies = (
  scene: THREE.Scene,
  material: THREE.SpriteMaterial,
  count: number
): THREE.Sprite[] => {
  const sprites: THREE.Sprite[] = [];

  for (let i = 0; i < count; i++) {
    const sprite = new THREE.Sprite(material);

    // Taille random
    const size = 0.05 + Math.random() * 0.15;
    sprite.scale.set(size, size, 1);

    // Position de départ autour de la caméra/planète
    sprite.position.set(
      THREE.MathUtils.randFloatSpread(10), // X entre -10 et 10
      THREE.MathUtils.randFloat(0.5, 1.0), // Y au-dessus du sol
      THREE.MathUtils.randFloatSpread(10) // Z entre -10 et 10
    );

    // Paramètres d'anim stockés dans userData
    sprite.userData = {
      speed: 0.4 + Math.random() * 0.6, // vitesse de déplacement
      amplitude: 0.4 + Math.random() * 0.4, // amplitude "flottante"
      freq: 0.8 + Math.random() * 1.2, // fréquence oscillation
      flapSpeed: 6 + Math.random() * 6, // battement d'ailes
      offset: Math.random() * Math.PI * 2, // déphasage
      // direction initiale (en X/Z)
      dir: new THREE.Vector2(
        THREE.MathUtils.randFloatSpread(1),
        THREE.MathUtils.randFloatSpread(1)
      ).normalize(),
    };

    scene.add(sprite);
    sprites.push(sprite);
  }

  return sprites;
};

/**
 * Met à jour l'animation des papillons à chaque frame
 * @param sprites - Array des sprites de papillons
 * @param camera - Caméra de la scène
 * @param time - Temps écoulé en secondes
 */
export const updateButterflyAnimation = (
  sprites: THREE.Sprite[],
  camera: THREE.PerspectiveCamera | null,
  time: number
): void => {
  if (!sprites.length || !camera) return;

  const radius = 10; // rayon grossier de la "zone de vol"

  sprites.forEach((b: THREE.Sprite) => {
    const data = b.userData;

    // Mouvement de base dans le plan XZ
    b.position.x += data.dir.x * data.speed * 0.01;
    b.position.z += data.dir.y * data.speed * 0.01;

    // Légère oscillation verticale
    b.position.y +=
      Math.sin(time * data.freq + data.offset) * 0.01 * data.amplitude;

    // Battement d'ailes en jouant sur la scale Y
    const flap = 0.05 + Math.sin(time * data.flapSpeed + data.offset) * 0.1;
    b.scale.x = flap;

    // Option: légère rotation Z pour donner un peu de vie
    b.rotation.z = Math.sin(time * data.freq + data.offset) * 0.4;

    // Si le papillon sort trop loin, on le wrap près de la caméra
    const dx = b.position.x - camera.position.x;
    const dz = b.position.z - camera.position.z;
    const distXZ = Math.sqrt(dx * dx + dz * dz);

    if (distXZ > radius) {
      // repositionner sur un cercle autour de la caméra
      const angle = Math.random() * Math.PI * 2;
      const r = radius * 0.7;
      b.position.x = camera.position.x + Math.cos(angle) * r;
      b.position.z = camera.position.z + Math.sin(angle) * r;
      b.position.y = THREE.MathUtils.randFloat(0.5, 1.0);

      // nouvelle direction de vol
      data.dir.set(
        THREE.MathUtils.randFloatSpread(1),
        THREE.MathUtils.randFloatSpread(1)
      ).normalize();
    }
  });
};

/**
 * Nettoie les ressources des papillons
 */
export const disposeButterflySystem = (data: ButterflyData | null): void => {
  if (!data) return;

  // Supprimer les sprites
  data.sprites.forEach((sprite) => {
    if (sprite.parent) {
      sprite.parent.remove(sprite);
    }
  });

  // Nettoyer le material
  try {
    data.material.map?.dispose();
    data.material.dispose();
  } catch (e) {
    console.warn("Erreur lors du nettoyage du material papillon:", e);
  }
};
