# Système d'herbe pour la planète 3D

## Vue d'ensemble

Le système d'herbe utilise des shaders GLSL pour créer des brins d'herbe qui suivent la courbure de la planète sphérique. L'herbe se déplace de manière infinie grâce à un système de wrapping qui synchronise avec la rotation de la planète.

## Architecture

### Fichiers créés

- **`utils/grassShader.ts`** - Shader material pour les brins d'herbe avec effet de vent
- **`utils/grassHelpers.ts`** - Logique de wrapping infini pour l'herbe
- **`utils/sceneObjects.ts`** - Fonction `createGrassGrid()` pour générer la grille d'herbe

### Intégration dans `scene3d.tsx`

L'herbe est intégrée dans le composant principal avec :
- Mise à jour du temps pour l'animation du vent
- Synchronisation du wrapping avec la rotation de la planète
- Refs pour maintenir l'état de la grille et du material

## Utilisation

### Configuration de base

```typescript
const grassData = createGrassGrid({
  gridSize: 8,           // Nombre de tuiles par côté (8x8 = 64 patches)
  tileSize: 4,           // Taille de chaque tuile
  spacing: 0.01,         // Espacement entre les tuiles
  instancesPerTile: 500, // Nombre de brins par tuile
  bladeWidth: 0.1,       // Largeur d'un brin
  bladeHeight: 1,        // Hauteur d'un brin
  minHeight: 0.2,        // Hauteur minimale aléatoire
  maxHeight: 0.6,        // Hauteur maximale aléatoire
});
```

### Personnalisation du shader

```typescript
const grassMaterial = createGrassShaderMaterial({
  sphereCenter: new THREE.Vector3(0, -50, 0),
  sphereRadius: 50 - 0.1,
  grassColor: new THREE.Vector3(0.41, 1.0, 0.5), // Couleur RGB
  windStrength: 0.1,                              // Force du vent
});
```

## Fonctionnement technique

### Shader de vertex

Le shader positionne chaque brin d'herbe :
1. Calcule la position sur la sphère basée sur la direction radiale
2. Applique l'effet de vent avec une animation sinusoïdale
3. Positionne la base du brin à la surface de la planète
4. Étend le brin radialement vers l'extérieur

### Wrapping infini

Le système de wrapping :
1. Suit la rotation de la planète (rotation.x et rotation.z)
2. Calcule le déplacement nécessaire basé sur le delta de rotation
3. Déplace les tuiles d'herbe en conséquence
4. Wrappe les tuiles qui sortent des limites de la grille

### Avantages

- ✅ Performance optimale avec `InstancedMesh` (500 brins × 64 tuiles = 32,000 brins)
- ✅ Animation fluide du vent via shader
- ✅ Suit parfaitement la courbure de la planète
- ✅ Wrapping infini synchronisé avec la rotation
- ✅ Compatible avec le système de collision existant

## Extension future

Pour ajouter plus de fonctionnalités :

- Variation de couleur basée sur la position
- Interaction avec les rectangles (herbe écrasée)
- Densité variable selon les zones
- Différents types de végétation
