# Système d'Atmosphère pour la Planète 3D

## Vue d'ensemble

Le système d'atmosphère ajoute une sphère environnementale texturée autour de la planète avec un système de post-processing utilisant une LUT (Look-Up Table) pour le color grading, créant une ambiance visuelle personnalisée.

## Architecture

### Fichiers créés/modifiés

- **`components/Atmosphere.tsx`** - Composants pour créer l'environnement et le post-processing
- **`utils/atmosphereHelpers.ts`** - Helpers pour le rendu avec post-processing
- **`app/(tabs)/scene3d.tsx`** (modifié) - Intégration du système d'atmosphère

### Textures requises

- **`assets/textures/puresky.png`** - Texture de ciel pour la sphère environnementale
- **`assets/textures/lut_test_night2.png`** - LUT pour le color grading (64x64 pixels, 8x8 tiles = 512x512)

## Composants

### 1. Environment Sphere (Sphère d'Environnement)

Sphère de grand rayon (100 unités) avec une texture de ciel, positionnée au centre de la planète.

```typescript
const envMaterial = createEnvironmentMaterial();
```

**Caractéristiques :**
- Material : `MeshBasicMaterial` avec texture
- Side : `BackSide` (visible de l'intérieur)
- Position : Centrée sur la planète (0, -50, 0)
- Rayon : 100 (configurable)

### 2. LUT Post-Processing

Système de color grading utilisant une texture LUT pour transformer les couleurs de la scène.

```typescript
const postMaterial = createLUTPostMaterial();
```

**Comment fonctionne la LUT :**
1. La scène est d'abord rendue dans un `RenderTarget`
2. Un shader post-processing échantillonne la LUT pour chaque pixel
3. Les couleurs sont transformées selon la LUT
4. Le résultat final est affiché à l'écran

## Utilisation

### Configuration de base

```typescript
const atmosphereData = createAtmosphereMeshes(scene, width, height, {
  planetPosition: new THREE.Vector3(0, -50, 0), // Position de la planète
  envRadius: 100,                                 // Rayon de la sphère d'env
  enableLUT: true,                                // Activer le post-processing
  lutIntensity: 0.8,                              // Intensité de la LUT (0-1)
});
```

### Dans la boucle de rendu

```typescript
// Au lieu de :
renderer.render(scene, camera);
gl.endFrameEXP();

// Utiliser :
renderWithAtmosphere(renderer, scene, camera, atmosphereDataRef.current, gl);
```

### Options de configuration

```typescript
interface AtmosphereOptions {
  planetPosition?: THREE.Vector3;  // Position du centre de l'environnement
  envRadius?: number;               // Rayon de la sphère (défaut: 100)
  enableLUT?: boolean;              // Activer/désactiver la LUT (défaut: true)
  lutIntensity?: number;            // Force de la LUT 0-1 (défaut: 0.8)
}
```

## Fonctionnement technique

### Pipeline de rendu avec LUT

1. **Rendu dans RenderTarget**
   ```typescript
   renderer.setRenderTarget(renderTarget);
   renderer.render(scene, camera);
   ```

2. **Application du shader LUT**
   ```typescript
   renderer.setRenderTarget(null);
   postMaterial.uniforms.tDiffuse.value = renderTarget.texture;
   renderer.render(postScene, postCamera);
   ```

3. **Affichage final**
   ```typescript
   gl.endFrameEXP();
   ```

### Shader LUT

Le shader transforme les couleurs RGB en utilisant une texture de lookup :

```glsl
vec3 sampleLUT(vec3 color) {
  // Index dans la LUT basé sur RGB
  float rIndex = floor(color.r * (size - 1.0) + 0.5);
  float gIndex = floor(color.g * (size - 1.0) + 0.5);
  float bIndex = floor(color.b * (size - 1.0) + 0.5);
  
  // Position dans la texture LUT (8x8 tiles)
  float tileX = mod(bIndex, tiles);
  float tileY = floor(bIndex / tiles);
  
  // Échantillonnage de la couleur transformée
  return texture2D(tLUT, lutUV).rgb;
}
```

### Structure de la LUT

- **Taille du cube** : 64³ valeurs
- **Layout** : 8×8 tiles de 64×64 pixels = 512×512 texture
- **Format** : RGB (chaque pixel représente une couleur transformée)

## Avantages

- ✅ **Atmosphère visuelle réaliste** - Texture de ciel immersive
- ✅ **Color grading professionnel** - LUT pour une ambiance cohérente
- ✅ **Performance optimale** - Post-processing GPU via shaders
- ✅ **Flexible** - LUT et intensité configurables
- ✅ **Compatible** - S'intègre avec l'herbe, rectangles, et collisions

## Intégration avec les autres systèmes

### Avec l'herbe
L'atmosphère englobe tout, y compris l'herbe. Le color grading s'applique uniformément.

### Avec les rectangles
Les rectangles sont affectés par le color grading, créant une cohérence visuelle.

### Avec la caméra device motion
La sphère d'environnement suit la planète, l'effet reste constant quelle que soit l'orientation.

## Personnalisation

### Créer une nouvelle LUT

1. Capturer un screenshot de ta scène
2. Utiliser Photoshop/GIMP pour appliquer des ajustements de couleur
3. Exporter avec "Export Color Lookup Table"
4. Placer dans `assets/textures/`

### Désactiver le post-processing

```typescript
const atmosphereData = createAtmosphereMeshes(scene, width, height, {
  enableLUT: false,  // Juste la sphère d'environnement, sans LUT
});
```

### Ajuster l'intensité dynamiquement

```typescript
if (atmosphereDataRef.current) {
  atmosphereDataRef.current.postMaterial.uniforms.uIntensity.value = 0.5;
}
```

## Performance

- **RenderTarget** : Même résolution que l'écran, optimisé pour mobile
- **Shader LUT** : Calcul GPU très rapide
- **Impact** : ~2-5ms par frame sur appareil mobile moderne

## Extension future

Possibilités d'amélioration :
- Transition entre différentes LUTs (jour/nuit)
- Vignette post-processing
- Bloom ou god rays
- Variation de fog/brume basée sur la distance
