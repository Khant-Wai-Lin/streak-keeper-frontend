import { onAuthStateChanged } from "firebase/auth";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { auth } from "../src/config/firebase";
import { theme } from "../src/core/theme";
import LandingScreen from "./landing";

export default function Index() {
  const [initializing, setInitializing] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsSignedIn(Boolean(user));
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  if (Platform.OS === "web") {
    if (isSignedIn) {
      return <Redirect href="/(tabs)/home" />;
    }
    return <LandingScreen />;
  }

  if (initializing) {
    return (
      <View
        style={{
          alignItems: "center",
          backgroundColor: theme.colors.background,
          flex: 1,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return <Redirect href={isSignedIn ? "/(tabs)/home" : "/(auth)/login"} />;
}
