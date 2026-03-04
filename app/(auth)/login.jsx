import { ShieldCheck } from "lucide-react-native";
import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../src/config/firebase";
import { theme } from "../../src/core/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const getLoginErrorMessage = (code) => {
    switch (code) {
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Incorrect email or password.";
      case "auth/too-many-requests":
        return "Too many attempts. Try again later.";
      case "auth/network-request-failed":
        return "Network error. Check your connection.";
      default:
        return "Login failed. Please try again.";
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Please enter email and password.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push("/(tabs)/home");
    } catch (error) {
      Alert.alert("Login failed", getLoginErrorMessage(error?.code));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.brand}>
          <View style={styles.logoWrap}>
            <ShieldCheck size={40} color={theme.colors.primary} />
          </View>
          <Text style={styles.brandText}>StreakKeeper</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            placeholder="Email"
            placeholderTextColor={theme.colors.mutedText}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={theme.colors.mutedText}
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.linkButton} activeOpacity={0.7}>
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={handleLogin}
        >
          <Text style={styles.primaryButtonText}>Log In</Text>
        </TouchableOpacity>

        <View style={styles.signUpRow}>
          <Text style={styles.mutedText}>Don’t have an account?</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/(auth)/signup") }>
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingTop: 64,
    paddingBottom: 40,
  },
  brand: {
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  logoWrap: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 28,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  brandText: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  form: {
    gap: 16,
    marginTop: 24,
  },
  input: {
    backgroundColor: theme.colors.inputBg,
    borderColor: theme.colors.inputBorder,
    borderRadius: 16,
    borderWidth: 1,
    color: theme.colors.text,
    fontSize: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  linkButton: {
    alignItems: "flex-end",
  },
  linkText: {
    color: theme.colors.mutedText,
    fontSize: 14,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 18,
    fontWeight: "600",
  },
  signUpRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  mutedText: {
    color: theme.colors.mutedText,
    fontSize: 14,
  },
  signUpText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});
