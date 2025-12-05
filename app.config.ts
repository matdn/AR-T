import {ConfigContext,ExpoConfig} from "expo/config"
const IDENTIFIER = "fr.gobelins.groupe3";
const PROJECT_ID = "cab54c5b-3910-45c8-b70f-46c3d3835ade";
 
export default ({ config }: ConfigContext): ExpoConfig => {
  const identifier = process.env.APP_VARIANT === "development" ? `${IDENTIFIER}.dev` : IDENTIFIER;
 
  return {
    ...config,
    owner: "artgobelins",
    slug: "groupe3",
    ios: {
      bundleIdentifier: identifier,
      config: {
        usesNonExemptEncryption: false
      }
    },
    android: {
      package: identifier,
    },
    extra: {
      eas: {
        projectId: PROJECT_ID,
      },
    },
  
    name: "ExpoGyro",
    version: "1.0.0",
    orientation: "landscape",
    icon: "./assets/images/icon.png",
    scheme: "expogyro",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
     
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff",
          "dark": {
            "backgroundColor": "#000000"
          }
        }
      ]
    ],
    experiments: {
      "typedRoutes": true,
      "reactCompiler": true
    }
  }
}
