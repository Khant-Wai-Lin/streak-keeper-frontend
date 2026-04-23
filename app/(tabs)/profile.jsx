import { Lock, Trophy, User } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../src/config/firebase";
import { theme } from "../../src/core/theme";
import { logoutSession } from "../../src/api/auth";
import { getProfileStats } from "../../src/api/streaks";

export default function ProfileScreen() {
  const [currentStreakDays, setCurrentStreakDays] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const tiers = [
    { days: 7, label: "Bronze" },
    { days: 14, label: "Silver" },
    { days: 30, label: "Gold" },
    { days: 60, label: "Platinum" },
    { days: 90, label: "Diamond" },
  ];
  const tierColors = {
    Bronze: "#c57c48",
    Silver: "#c0c7d1",
    Gold: "#f2c14f",
    Platinum: "#8bd1c7",
    Diamond: "#7fb3ff",
  };

  const user = auth.currentUser;
  const displayName = useMemo(() => {
    if (user?.displayName) {
      return user.displayName;
    }

    if (user?.email) {
      return user.email.split("@")[0];
    }

    return "User";
  }, [user?.displayName, user?.email]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadStats = async () => {
        try {
          const result = await getProfileStats();
          const nextTotalDays = result?.totalUniqueCheckinDays || 0;
          const nextBestStreak = result?.longestStreak || 0;

          if (isMounted) {
            setTotalDays(nextTotalDays);
            setCurrentStreakDays(nextBestStreak);
          }
        } catch (_error) {
          if (isMounted) {
            setTotalDays(0);
            setCurrentStreakDays(0);
          }
        }
      };

      loadStats();
      return () => {
        isMounted = false;
      };
    }, []),
  );

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await logoutSession();
      router.replace("/(auth)/login");
    } catch (_error) {
      Alert.alert("Logout failed", "Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleConfirmLogout = () => {
    if (isLoggingOut) return;

    if (Platform.OS === "web") {
      const confirmed = globalThis?.confirm?.("Logout\n\nAre you sure you want to logout?");
      if (confirmed) {
        handleLogout();
      }
      return;
    }

    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: handleLogout,
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <User size={28} color={theme.colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{user?.email || "No email"}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{currentStreakDays}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalDays}</Text>
            <Text style={styles.statLabel}>Total Days</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>BADGES</Text>
        </View>

        <View style={styles.badgeGrid}>
          {tiers.map((tier) => {
            const unlocked = currentStreakDays >= tier.days;
            const tierColor = tierColors[tier.label] || theme.colors.primary;
            return (
              <View
                key={tier.days}
                style={[styles.badgeCard, !unlocked && styles.badgeCardLocked]}
              >
                <View
                  style={[
                    styles.badgeIcon,
                    unlocked && { backgroundColor: "#0f2617" },
                    !unlocked && styles.badgeIconLocked,
                  ]}
                >
                  {unlocked ? (
                    <Trophy size={18} color={tierColor} />
                  ) : (
                    <Lock size={18} color={theme.colors.mutedText} />
                  )}
                </View>
                <Text
                  style={[
                    styles.badgeLabel,
                    unlocked && { color: tierColor },
                    !unlocked && styles.badgeLabelLocked,
                  ]}
                >
                  {tier.label}
                </Text>
                <Text style={[styles.badgeDays, !unlocked && styles.badgeLabelLocked]}>
                  {tier.days} days
                </Text>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.logoutButtonBottom, isLoggingOut && styles.logoutButtonDisabled]}
          onPress={handleConfirmLogout}
          activeOpacity={0.85}
          disabled={isLoggingOut}
        >
          <Text style={styles.logoutButtonBottomText}>
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "600",
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonBottom: {
    alignItems: "center",
    backgroundColor: "#5a1f1f",
    borderRadius: 14,
    marginTop: 10,
    paddingVertical: 14,
    width: "100%",
  },
  logoutButtonBottomText: {
    color: "#ffd5d5",
    fontSize: 15,
    fontWeight: "700",
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 22,
    flexDirection: "row",
    gap: 14,
    padding: 18,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#0f2617",
    borderRadius: 26,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "600",
  },
  profileEmail: {
    color: theme.colors.mutedText,
    fontSize: 13,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  statCard: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 18,
    flex: 1,
    paddingVertical: 16,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "600",
  },
  statLabel: {
    color: theme.colors.mutedText,
    fontSize: 12,
    marginTop: 6,
  },
  sectionHeader: {
    marginTop: 26,
    marginBottom: 12,
  },
  sectionTitle: {
    color: theme.colors.mutedText,
    fontSize: 12,
    letterSpacing: 1.2,
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  badgeCard: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 18,
    marginBottom: 12,
    width: "48%",
    paddingVertical: 14,
  },
  badgeCardLocked: {
    opacity: 0.5,
  },
  badgeIcon: {
    alignItems: "center",
    backgroundColor: "#0f2617",
    borderRadius: 16,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  badgeIconLocked: {
    backgroundColor: "#1c2229",
  },
  badgeLabel: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },
  badgeDays: {
    color: theme.colors.mutedText,
    fontSize: 11,
    marginTop: 4,
  },
  badgeLabelLocked: {
    color: theme.colors.mutedText,
  },
});
