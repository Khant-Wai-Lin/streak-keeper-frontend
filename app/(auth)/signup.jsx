import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { Alert } from "react-native";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../src/config/firebase";
import { theme } from "../../src/core/theme";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const getSignUpErrorMessage = (code) => {
    switch (code) {
      case "auth/email-already-in-use":
        return "This email is already in use.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/network-request-failed":
        return "Network error. Check your connection.";
      default:
        return "Sign up failed. Please try again.";
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      router.push("/(tabs)/home");
    } catch (error) {
      console.log("SignUp error:", error?.code, error?.message);
      Alert.alert("Sign up failed", getSignUpErrorMessage(error?.code));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.brand}>
          <View style={styles.logoWrap}>
            <Ionicons name="shield-checkmark" size={40} color={theme.colors.primary} />
          </View>
          <Text style={styles.brandText}>Create Account</Text>
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
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor={theme.colors.mutedText}
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={handleSignUp}
        >
          <Text style={styles.primaryButtonText}>Sign Up</Text>
        </TouchableOpacity>

        <View style={styles.signUpRow}>
          <Text style={styles.mutedText}>Already have an account?</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()}>
            <Text style={styles.signUpText}>Log In</Text>
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
    fontSize: 26,
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
