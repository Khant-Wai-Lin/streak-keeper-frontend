import { ArrowRight, Calendar, Check, Flag, Play, Settings } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../src/config/firebase";
import { theme } from "../../src/core/theme";
import { cancelStreak, checkIn, createStreak, getHistory } from "../../src/api/streaks";
// import {
//   cancelScheduledNotifications,
//   ensureNotificationPermission,
//   loadNotifications,
//   scheduleStreakNotifications,
// } from "../../src/utils/notifications";

export default function HomeScreen() {
  const [goalTitle, setGoalTitle] = useState("");
  const [activeStreaks, setActiveStreaks] = useState([]);
  const [completedTodayById, setCompletedTodayById] = useState({});
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [pickerTarget, setPickerTarget] = useState(null);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingInId, setIsCheckingInId] = useState("");
  const [isCancelingId, setIsCancelingId] = useState("");
  const [loadError, setLoadError] = useState("");

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const todayLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, []);

  const loadActiveStreaks = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getHistory();
      const history = result?.history || [];
      const activeOnly = history.filter((streak) => streak.isActive);
      const completedMap = activeOnly.reduce((acc, streak) => {
        acc[streak.streakId] = streak.lastCheckInDate === todayKey;
        return acc;
      }, {});

      setActiveStreaks(activeOnly);
      setCompletedTodayById(completedMap);
      setLoadError("");
    } catch (error) {
      setLoadError(error?.message || "Unable to load challenges.");
    } finally {
      setIsLoading(false);
    }
  }, [todayKey]);

  useFocusEffect(
    useCallback(() => {
      loadActiveStreaks();
    }, [loadActiveStreaks]),
  );

  const openPicker = (target) => {
    const seedDate = target === "end" ? endDate : startDate;
    setPickerDate(seedDate || new Date());
    setPickerTarget(target);
  };

  const handleDateChange = (event, selectedDate) => {
    if (event?.type === "dismissed") {
      setPickerTarget(null);
      return;
    }

    const nextDate = selectedDate || pickerDate;
    if (pickerTarget === "start") {
      setStartDate(nextDate);
      if (endDate && nextDate > endDate) {
        setEndDate(null);
      }
    }

    if (pickerTarget === "end") {
      setEndDate(nextDate);
    }

    setPickerTarget(null);
  };

  const formatDate = (date) => {
    if (!date) {
      return "Select date";
    }

    return date.toLocaleDateString();
  };

  const resetChallengeForm = () => {
    setGoalTitle("");
    setStartDate(null);
    setEndDate(null);
  };

  const formatRangeDate = (value) => {
    if (!value) {
      return "-";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "-";
    }

    return parsed.toLocaleDateString();
  };

  const normalizeDateOnly = (value) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    parsed.setHours(0, 0, 0, 0);
    return parsed;
  };

  const handleStartStreak = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Not logged in", "Please log in again before starting a streak.");
      return;
    }

    if (!goalTitle.trim()) {
      Alert.alert("Add a goal", "Please enter a goal title.");
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert("Pick dates", "Please choose a start and end date.");
      return;
    }

    if (endDate < startDate) {
      Alert.alert("Check dates", "End date should be after the start date.");
      return;
    }

    try {
      setIsSaving(true);
      const result = await createStreak({
        goalTitle: goalTitle.trim(),
        frequency: "daily",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      setActiveStreaks((prev) => [{
        streakId: result.streakId,
        goalTitle: goalTitle.trim(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalDays: 0,
        currentStreak: 0,
        longestStreak: 0,
        isActive: true,
      }, ...prev]);
      setCompletedTodayById((prev) => ({ ...prev, [result.streakId]: false }));
      resetChallengeForm();

      // Notification setup disabled for now.
    } catch (error) {
      Alert.alert("Could not start", error?.message || "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckIn = async (streakId) => {
    if (!streakId || completedTodayById[streakId] || isCheckingInId) {
      return;
    }

    try {
      setIsCheckingInId(streakId);
      const result = await checkIn({
        streakId,
        date: new Date().toISOString(),
      });

      setActiveStreaks((prev) => prev.map((streak) => {
        if (streak.streakId !== streakId) {
          return streak;
        }

        return {
          ...streak,
          currentStreak: result.currentStreak ?? streak.currentStreak,
          longestStreak: result.longestStreak ?? streak.longestStreak,
          totalDays: (streak.totalDays || 0) + 1,
          lastCheckInDate: todayKey,
        };
      }));
      setCompletedTodayById((prev) => ({ ...prev, [streakId]: true }));

      const targetStreak = activeStreaks.find((streak) => streak.streakId === streakId);
      const todayDateOnly = normalizeDateOnly(new Date().toISOString());
      const endDateOnly = normalizeDateOnly(targetStreak?.endDate);
      const shouldCompleteChallenge = Boolean(
        todayDateOnly && endDateOnly && todayDateOnly >= endDateOnly,
      );

      if (shouldCompleteChallenge) {
        await cancelStreak({ streakId });
        Alert.alert(
          "Challenge Completed",
          `You finished \"${targetStreak?.goalTitle || "your challenge"}\"!`,
        );
        await loadActiveStreaks();
      }
    } catch (error) {
      Alert.alert("Check-in failed", error?.message || "Please try again.");
    } finally {
      setIsCheckingInId("");
    }
  };

  const handleCancelStreak = (streak) => {
    if (!streak?.streakId || isCancelingId) {
      return;
    }

    Alert.alert(
      "Cancel streak",
      "Are you sure you want to cancel this streak?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setIsCancelingId(streak.streakId);
              await cancelStreak({ streakId: streak.streakId });

              // Notification cancel disabled for now.

              setActiveStreaks((prev) => prev.filter((item) => item.streakId !== streak.streakId));
              setCompletedTodayById((prev) => {
                const next = { ...prev };
                delete next[streak.streakId];
                return next;
              });
            } catch (error) {
              Alert.alert("Cancel failed", error?.message || "Please try again.");
            } finally {
              setIsCancelingId("");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.headerDate}>{todayLabel}</Text>
          <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
            <Settings size={18} color={theme.colors.mutedText} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Add New Challenge</Text>

        <View style={styles.inputWrap}>
          <TextInput
            placeholder="e.g., Study 30 minutes daily"
            placeholderTextColor={theme.colors.mutedText}
            style={styles.input}
            value={goalTitle}
            onChangeText={setGoalTitle}
          />
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            onPress={() => openPicker("start")}
          >
            <Calendar size={20} color={theme.colors.mutedText} />
          </TouchableOpacity>
        </View>

        <View style={styles.dateRange}>
          <Text style={styles.dateLabel}>Date range</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateChip}
              activeOpacity={0.8}
              onPress={() => openPicker("start")}
            >
              <Play size={14} color={theme.colors.mutedText} />
              <Text style={styles.dateChipText}>{formatDate(startDate)}</Text>
            </TouchableOpacity>
            <ArrowRight size={16} color={theme.colors.mutedText} />
            <TouchableOpacity
              style={styles.dateChip}
              activeOpacity={0.8}
              onPress={() => openPicker("end")}
            >
              <Flag size={14} color={theme.colors.mutedText} />
              <Text style={styles.dateChipText}>{formatDate(endDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={handleStartStreak}
          disabled={isSaving}
        >
          <Text style={styles.primaryButtonText}>
            {isSaving ? "Adding..." : "Add Challenge"}
          </Text>
        </TouchableOpacity>

        <View style={styles.sectionHeadRow}>
          <Text style={styles.sectionLabel}>ACTIVE CHALLENGES</Text>
        </View>

        {loadError ? (
          <Text style={styles.helperText}>{loadError}</Text>
        ) : null}
        {isLoading ? (
          <Text style={styles.helperText}>Loading challenges...</Text>
        ) : null}
        {!isLoading && !loadError && activeStreaks.length === 0 ? (
          <Text style={styles.helperText}>No active challenge yet. Add one above.</Text>
        ) : null}

        {activeStreaks.map((streak) => {
          const isCompletedToday = Boolean(completedTodayById[streak.streakId]);
          const isCheckingIn = isCheckingInId === streak.streakId;
          const isCanceling = isCancelingId === streak.streakId;

          return (
            <View key={streak.streakId} style={styles.challengeCard}>
              <Text style={styles.currentTaskTitle}>{streak.goalTitle}</Text>
              <Text style={styles.challengeDates}>
                {formatRangeDate(streak.startDate)} - {formatRangeDate(streak.endDate)}
              </Text>

              <View style={styles.challengeStatsRow}>
                <Text style={styles.challengeStatText}>Current: {streak.currentStreak || 0}d</Text>
                <Text style={styles.challengeStatText}>Longest: {streak.longestStreak || 0}d</Text>
              </View>

              <View style={styles.challengeActionsRow}>
                <TouchableOpacity
                  style={[styles.actionButton, isCompletedToday && styles.actionButtonDone]}
                  activeOpacity={0.85}
                  onPress={() => handleCheckIn(streak.streakId)}
                  disabled={isCheckingIn || isCompletedToday || Boolean(isCheckingInId)}
                >
                  <Text style={styles.actionButtonText}>
                    {isCheckingIn ? "Completing..." : isCompletedToday ? "Done Today" : "Complete Today"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  activeOpacity={0.85}
                  onPress={() => handleCancelStreak(streak)}
                  disabled={isCanceling || Boolean(isCancelingId)}
                >
                  <Text style={styles.secondaryButtonText}>
                    {isCanceling ? "Canceling..." : "Cancel"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {pickerTarget && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          minimumDate={pickerTarget === "end" && startDate ? startDate : undefined}
          onChange={handleDateChange}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    alignItems: "stretch",
    gap: 22,
    paddingHorizontal: 28,
    paddingTop: 44,
    paddingBottom: 40,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  headerDate: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  settingsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  settingsText: {
    color: theme.colors.mutedText,
    fontSize: 14,
  },
  iconButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: 0.4,
    textAlign: "left",
  },
  inputWrap: {
    alignItems: "center",
    backgroundColor: theme.colors.inputLight,
    borderRadius: 26,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    width: "100%",
  },
  input: {
    color: theme.colors.inputLightText,
    flex: 1,
    fontSize: 16,
  },
  helperText: {
    color: theme.colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  dateRange: {
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  dateLabel: {
    color: theme.colors.mutedText,
    fontSize: 14,
  },
  dateRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  dateChip: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 18,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dateChipText: {
    color: theme.colors.text,
    fontSize: 14,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 26,
    paddingVertical: 16,
    width: "100%",
  },
  primaryButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 18,
    fontWeight: "600",
  },
  sectionHeadRow: {
    marginTop: 8,
  },
  challengeCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  currentTaskTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  challengeDates: {
    color: theme.colors.mutedText,
    fontSize: 12,
    marginTop: 4,
  },
  challengeStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  challengeStatText: {
    color: theme.colors.text,
    fontSize: 13,
  },
  sectionLabel: {
    color: theme.colors.mutedText,
    fontSize: 12,
    letterSpacing: 1,
  },
  challengeActionsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    flex: 1,
    paddingVertical: 10,
  },
  actionButtonDone: {
    backgroundColor: "#1f3b2a",
  },
  actionButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#0f2617",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});
