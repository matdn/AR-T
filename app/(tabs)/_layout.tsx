import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
    screenOptions={{
      tabBarActiveTintColor: "#ffd33d",
      headerStyle : {
        backgroundColor: "#25292e",
      },
      headerShadowVisible: false,
      headerTintColor: "#fff",
      tabBarStyle: {
        backgroundColor: "#25292e",
      },
    }}
    > 
      <Tabs.Screen name = "index" options = {{
        headerTitle: "Create Expo APP",
        title: "Index",
        tabBarIcon: ({focused, color}) => <Ionicons name={focused ? "home-sharp" : "home-outline"} color={color} size={24} />,
      }} />
      <Tabs.Screen name = "about" options = {{
        title: "About",
        tabBarIcon: ({color, focused}) => <Ionicons name={focused ? "information-circle" : "information-circle-outline"} color={color} size={24} />,
      }} />
      <Tabs.Screen name = "grass" options = {{
        title: "Grass",
        tabBarIcon: ({color, focused}) => <Ionicons name={focused ? "radio" : "radio-outline"} color={color} size={24} />,
      }} />
      <Tabs.Screen name = "scene3d" options = {{
        title: "Scene",
        tabBarIcon: ({color, focused}) => <Ionicons name={focused ? "globe" : "globe-outline"} color={color} size={24} />,
      }} />
      <Tabs.Screen name = "+not-found" options = {{
        
      }} />
    </Tabs>

  );
}
