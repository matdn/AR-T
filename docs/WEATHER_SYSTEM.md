# Composant Weather - Système de Pluie

## Vue d'ensemble

Le composant `Weather.tsx` fournit un système complet de simulation de pluie en utilisant Three.js. Il crée des sprites qui tombent à des positions aléatoires et se réinitialisent au sommet quand ils deviennent trop bas.

## Fonctionnalités

- ✅ Génération automatique de sprites de pluie
- ✅ Positions aléatoires (X, Y, Z)
- ✅ Vitesse de chute variable par goutte
- ✅ Réinitialisation automatique en haut de l'écran
- ✅ Tableau persistant des sprites (pas de suppression)
- ✅ Support de textures personnalisées
- ✅ Configuration flexible

## Utilisation dans `grass.tsx`

### 1. Import du composant

```tsx
import { createWeatherSystem } from "../../components/Weather";
```

### 2. Création du système dans `onContextCreate`

```tsx
const { rainGroup, rainSprites, updateRain } = createWeatherSystem(
  scene,
  {
    rainCount: 200,        // Nombre de gouttes de pluie
    spreadX: 60,           // Largeur de dispersion (axe X)
    spreadY: 40,           // Hauteur de dispersion (axe Y)
    minY: 15,              // Position Y minimale
    maxY: 30,              // Position Y maximale
    fallSpeed: 5,          // Vitesse de chute
    resetThreshold: -5,    // Limite Y pour réinitialisation
  }
);
```

### 3. Mise à jour dans la boucle de rendu

```tsx
const renderLoop = () => {
  // ... autres mises à jour ...
  
  // Mettre à jour la pluie
  updateRain();
  
  // ... rendu ...
};
```

## Configuration des paramètres

| Paramètre | Type | Par défaut | Description |
|-----------|------|-----------|-------------|
| `rainCount` | number | 200 | Nombre de sprites de pluie |
| `spreadX` | number | 50 | Largeur de la zone de pluie (axe X) |
| `spreadY` | number | 50 | Hauteur de la zone de pluie (axe Y) |
| `minY` | number | 10 | Hauteur minimale des gouttes |
| `maxY` | number | 30 | Hauteur maximale des gouttes |
| `fallSpeed` | number | 3 | Vitesse de chute de base |
| `resetThreshold` | number | -5 | Hauteur à laquelle réinitialiser les gouttes |

## Ajouter une texture personnalisée

### Méthode 1 : Après la création du système

```tsx
import { TextureLoader } from "expo-three";
import { setRainTexture } from "../../components/Weather";

// Dans onContextCreate, après createWeatherSystem :
const textureLoader = new TextureLoader();
const rainTexture = textureLoader.load(require("../../assets/textures/rain_drop.png"));
setRainTexture(rainSprites, rainTexture);
```

### Méthode 2 : Modifier le matériau directement

```tsx
rainSprites.forEach((rainSprite) => {
  if (rainSprite.mesh.material instanceof THREE.SpriteMaterial) {
    rainSprite.mesh.material.map = rainTexture;
    rainSprite.mesh.material.needsUpdate = true;
  }
});
```

## Contrôler la pluie

### Changer la vitesse de la pluie

```tsx
import { setRainSpeed } from "../../components/Weather";

// Doubler la vitesse
setRainSpeed(rainSprites, 2);

// Réduire de moitié
setRainSpeed(rainSprites, 0.5);
```

### Afficher/Masquer la pluie

```tsx
import { setRainVisible } from "../../components/Weather";

// Masquer
setRainVisible(rainGroup, false);

// Afficher
setRainVisible(rainGroup, true);
```

## Structure des données

### Objet RainSprite

```typescript
interface RainSprite {
  mesh: THREE.Sprite;           // Le sprite Three.js
  velocityY: number;            // Vitesse de chute (négatif = vers le bas)
  resetY: number;               // Position Y initiale
}
```

### Retour de `createWeatherSystem`

```typescript
{
  rainGroup: THREE.Group;                    // Groupe contenant tous les sprites
  rainSprites: RainSprite[];                // Tableau de tous les sprites
  updateRain: (deltaTime?: number) => void;  // Fonction de mise à jour
  material: THREE.SpriteMaterial;           // Matériau partagé des sprites
}
```

## Optimisations

- Tous les sprites partagent le même matériau (pas de duplication)
- Les sprites sont réutilisés via repositionnement, pas création/suppression
- La texture par défaut est générée via Canvas 2D pour légèreté

## Personnalisation avancée

### Modifier l'apparence des sprites

```tsx
// Changer la taille
rainSprites.forEach(rs => {
  rs.mesh.scale.set(0.5, 0.5, 1);  // Plus petits
});

// Changer la couleur
if (rainGroup.children[0].material instanceof THREE.SpriteMaterial) {
  rainGroup.children[0].material.color.setHex(0x88ccff);
}
```

### Ajouter des variations visuelles

```tsx
rainSprites.forEach(rs => {
  // Rotation aléatoire
  rs.mesh.rotation.z = Math.random() * Math.PI * 2;
  
  // Transparence variable
  rs.mesh.material.opacity = 0.6 + Math.random() * 0.4;
});
```

## Notes d'implémentation

- Les gouttes conservent des vitesses variables (50-150% de la vitesse de base) pour un effet plus naturel
- La réinitialisation inclut aussi une position X et Z aléatoire pour éviter les patterns
- Le système utilise `requestAnimationFrame` avec baseline 60fps pour la physique
- Les sprites tombent indépendamment, créant un effet de pluie naturelle

## Exemple complet d'intégration

Voir `/app/(tabs)/grass.tsx` lignes 247-257 et 356 pour l'implémentation complète.
