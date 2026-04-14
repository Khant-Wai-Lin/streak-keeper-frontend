import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Settings, Zap } from "lucide-react-native";
import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { auth } from "../../src/config/firebase";
import { logoutSession } from "../../src/api/auth";
import { theme } from "../../src/core/theme";
import { deleteStreakHistory, getHistory, getProfileStats } from "../../src/api/streaks";

export default function HistoryReviewScreen() {
  const [streaks, setStreaks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingStreakId, setDeletingStreakId] = useState("");
  const [profileStats, setProfileStats] = useState({
    totalUniqueCheckinDays: 0,
    longestStreak: 0,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleDeleteHistory = useCallback((streak) => {
    if (!streak?.streakId || deletingStreakId) {
      return;
    }

    Alert.alert(
      "Delete history",
      `Delete \"${streak.goalTitle || "this streak"}\" from history?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingStreakId(streak.streakId);
              await deleteStreakHistory({ streakId: streak.streakId });
              setStreaks((prev) => prev.filter((item) => item.streakId !== streak.streakId));
            } catch (error) {
              Alert.alert("Delete failed", error?.message || "Please try again.");
            } finally {
              setDeletingStreakId("");
            }
          },
        },
      ],
    );
  }, [deletingStreakId]);

  useFocusEffect(useCallback(() => {
    let isMounted = true;

    const loadHistory = async () => {
      if (isMounted) {
        setIsLoading(true);
      }

      try {
        const [historyResult, statsResult] = await Promise.all([
          getHistory(),
          getProfileStats(),
        ]);
        if (isMounted) {
          setStreaks(historyResult.history || []);
          setProfileStats({
            totalUniqueCheckinDays: statsResult?.totalUniqueCheckinDays || 0,
            longestStreak: statsResult?.longestStreak || 0,
          });
          setErrorMessage("");
        }
      } catch (error) {
        if (isMounted) {
          setProfileStats({ totalUniqueCheckinDays: 0, longestStreak: 0 });
          setErrorMessage(error?.message || "Unable to load history.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, []));

  const totalDays = profileStats.totalUniqueCheckinDays;
  const longestStreak = profileStats.longestStreak;

  const toTimestamp = (value) => {
    if (!value) {
      return 0;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 0;
    }

    return date.getTime();
  };

  const sortedStreaks = [...streaks].sort((a, b) => {
    const aTime = Math.max(
      toTimestamp(a.lastCheckInDate),
      toTimestamp(a.endDate),
      toTimestamp(a.startDate),
    );
    const bTime = Math.max(
      toTimestamp(b.lastCheckInDate),
      toTimestamp(b.endDate),
      toTimestamp(b.startDate),
    );

    return bTime - aTime;
  });

  const normalizeDateOnly = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const getStreakStatus = (streak) => {
    if (streak?.status) {
      return streak.status;
    }

    const today = normalizeDateOnly(new Date().toISOString());
    const endDate = normalizeDateOnly(streak?.endDate);
    const lastCheckInDate = normalizeDateOnly(streak?.lastCheckInDate);

    if (streak?.isActive) {
      if (endDate && today && today > endDate) {
        return "Failed";
      }
      return "In Progress";
    }

    if (endDate && lastCheckInDate && lastCheckInDate >= endDate) {
      return "Completed";
    }

    return "Failed";
  };

  const getStatusStyle = (status) => {
    if (status === "Completed") {
      return styles.statusCompleted;
    }

    if (status === "In Progress") {
      return styles.statusProgress;
    }

    return styles.statusFailed;
  };

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);
      await logoutSession();
      setIsAccountMenuOpen(false);
      router.replace("/(auth)/login");
    } catch (_error) {
      Alert.alert("Logout failed", "Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>History</Text>
          <View style={styles.accountMenuWrap}>
            <TouchableOpacity
              style={styles.settingsButton}
              activeOpacity={0.7}
              onPress={() => setIsAccountMenuOpen((prev) => !prev)}
            >
              <Settings size={20} color={theme.colors.mutedText} />
            </TouchableOpacity>

            {isAccountMenuOpen ? (
              <View style={styles.accountMenu}>
                <Text style={styles.accountEmail} numberOfLines={1}>
                  {auth.currentUser?.email || "No email"}
                </Text>
                <TouchableOpacity
                  style={styles.accountLogoutButton}
                  activeOpacity={0.85}
                  onPress={handleLogout}
                  disabled={isLoggingOut}
                >
                  <Text style={styles.accountLogoutText}>
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.summaryBlock}>
          <Text style={styles.summaryLabel}>LONGEST CONSISTENCY</Text>
          <Text style={styles.summaryValue}>{isLoading ? "-" : longestStreak}</Text>
          <Text style={styles.summaryCaption}>Longest day streak</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Zap size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardLabel}>UNIQUE CHECK-IN DAYS</Text>
            <Text style={styles.cardValue}>
              {isLoading ? "-" : totalDays} <Text style={styles.cardValueMuted}>Days</Text>
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>YOUR STREAKS</Text>
        </View>

        <View style={styles.streaksScrollArea}>
          <ScrollView contentContainerStyle={styles.streaksContent} showsVerticalScrollIndicator={false}>
            {errorMessage ? (
              <Text style={styles.helperText}>{errorMessage}</Text>
            ) : null}
            {!isLoading && !errorMessage && streaks.length === 0 ? (
              <Text style={styles.helperText}>No streaks yet. Start one from Home.</Text>
            ) : null}

            {sortedStreaks.map((streak) => {
              const status = getStreakStatus(streak);

              return (
                <View key={streak.streakId} style={styles.streakCard}>
                  <View style={styles.streakInfo}>
                    <Text style={styles.streakTitle}>{streak.goalTitle}</Text>
                    <Text style={styles.streakProgress}>
                      {streak.totalDays || 0} days completed
                    </Text>
                    <View style={[styles.statusBadge, getStatusStyle(status)]}>
                      <Text style={styles.statusText}>{status}</Text>
                    </View>
                  </View>
                  <View style={styles.streakActions}>
                    <Text style={styles.streakCount}>{streak.totalDays || 0}</Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      activeOpacity={0.85}
                      onPress={() => handleDeleteHistory(streak)}
                      disabled={Boolean(deletingStreakId)}
                    >
                      <Text style={styles.deleteButtonText}>
                        {deletingStreakId === streak.streakId ? "Deleting..." : "Delete"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
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
    paddingHorizontal: 24,
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
  accountMenuWrap: {
    alignItems: "flex-end",
    position: "relative",
  },
  settingsButton: {
    padding: 2,
  },
  accountMenu: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 12,
    marginTop: 8,
    minWidth: 200,
    padding: 12,
    position: "absolute",
    right: 0,
    top: 22,
    zIndex: 20,
  },
  accountEmail: {
    color: theme.colors.text,
    fontSize: 13,
    marginBottom: 10,
  },
  accountLogoutButton: {
    backgroundColor: "#2a1a1a",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  accountLogoutText: {
    color: "#ff9c9c",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  summaryBlock: {
    alignItems: "center",
    marginBottom: 24,
  },
  summaryLabel: {
    color: theme.colors.mutedText,
    fontSize: 12,
    letterSpacing: 1.2,
  },
  summaryValue: {
    color: theme.colors.primary,
    fontSize: 72,
    fontWeight: "700",
    letterSpacing: 1,
    marginVertical: 6,
  },
  summaryCaption: {
    color: theme.colors.mutedText,
    fontSize: 14,
  },
  card: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 22,
    flexDirection: "row",
    gap: 16,
    padding: 18,
  },
  cardIcon: {
    alignItems: "center",
    backgroundColor: "#0f2617",
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  cardBody: {
    flex: 1,
  },
  cardLabel: {
    color: theme.colors.mutedText,
    fontSize: 12,
    letterSpacing: 1,
  },
  cardValue: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "600",
    marginTop: 4,
  },
  cardValueMuted: {
    color: theme.colors.mutedText,
    fontSize: 16,
    fontWeight: "400",
  },
  sectionHeader: {
    marginTop: 28,
    marginBottom: 12,
  },
  streaksScrollArea: {
    flex: 1,
  },
  streaksContent: {
    paddingBottom: 40,
  },
  sectionTitle: {
    color: theme.colors.mutedText,
    fontSize: 12,
    letterSpacing: 1.2,
  },
  streakCard: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  streakInfo: {
    flex: 1,
    paddingRight: 12,
  },
  streakTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  streakProgress: {
    color: theme.colors.mutedText,
    fontSize: 13,
    marginTop: 6,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 12,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: "#dfe7ef",
    fontSize: 11,
    fontWeight: "700",
  },
  statusCompleted: {
    backgroundColor: "#12311f",
  },
  statusProgress: {
    backgroundColor: "#1f2a3b",
  },
  statusFailed: {
    backgroundColor: "#3a1a1a",
  },
  streakCount: {
    color: theme.colors.primary,
    fontSize: 22,
    fontWeight: "700",
  },
  streakActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  deleteButton: {
    backgroundColor: "#2a1a1a",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteButtonText: {
    color: "#ff9c9c",
    fontSize: 12,
    fontWeight: "600",
  },
  helperText: {
    color: theme.colors.mutedText,
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
});
