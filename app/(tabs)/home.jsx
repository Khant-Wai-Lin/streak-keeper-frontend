import { ArrowRight, Calendar, Check, Flag, Play, Settings } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../src/core/theme";
import {
  cancelScheduledNotifications,
  ensureNotificationPermission,
  loadNotifications,
  scheduleStreakNotifications,
} from "../../src/utils/notifications";

export default function HomeScreen() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isCompletedToday, setIsCompletedToday] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [pickerTarget, setPickerTarget] = useState(null);
  const [pickerDate, setPickerDate] = useState(new Date());

  const todayLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, []);

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


  const handleStartStreak = async () => {
    if (!startDate || !endDate) {
      Alert.alert("Pick dates", "Please choose a start and end date.");
      return;
    }

    if (endDate < startDate) {
      Alert.alert("Check dates", "End date should be after the start date.");
      return;
    }

    // const notifications = await loadNotifications();
    // if (!notifications) {
    //   Alert.alert(
    //     "Use a dev build",
    //     "Notifications are not supported in Expo Go. Open this app in a development build."
    //   );
    //   return;
    // }

    // const permissionGranted = await ensureNotificationPermission(notifications);
    // if (!permissionGranted) {
    //   Alert.alert(
    //     "Notifications disabled",
    //     "Enable notifications to receive daily reminders."
    //   );
    //   return;
    // }

    // await cancelScheduledNotifications(notifications);
    // await scheduleStreakNotifications(notifications, startDate, endDate);

    setHasStarted(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.headerDate}>{todayLabel}</Text>
          <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
            <Settings size={18} color={theme.colors.mutedText} />
          </TouchableOpacity>
        </View>

        {!hasStarted ? (
          <>
            <Text style={styles.title}>Define Your{"\n"}Goal</Text>

            <View style={styles.inputWrap}>
              <TextInput
                placeholder="e.g., Study 30 minutes daily"
                placeholderTextColor={theme.colors.mutedText}
                style={styles.input}
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

            <Text style={styles.helperText}>
              What habit would you like to build?{"\n"}
              Your streak starts as soon as you define it.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              onPress={handleStartStreak}
            >
              <Text style={styles.primaryButtonText}>Start My Streak</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {!isCompletedToday ? (
              <TouchableOpacity
                style={styles.streakCircle}
                activeOpacity={0.85}
                onPress={() => setIsCompletedToday(true)}
              >
                <Text style={styles.streakPrompt}>Did you do{"\n"}it today?</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.completedCircle}>
                <View style={styles.checkBadge}>
                  <Check size={28} color={theme.colors.primary} />
                </View>
                <Text style={styles.completedText}>Completed!</Text>
              </View>
            )}

            <View style={styles.streakCard}>
              <Text style={styles.sectionLabel}>CURRENT STREAK</Text>
              <Text style={styles.streakValue}>16 Days</Text>
            </View>

            <Text style={styles.helperTextAlt}>See you tomorrow!</Text>
          </>
        )}
      </View>

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
    alignItems: "center",
    flex: 1,
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
    fontSize: 28,
    fontWeight: "600",
    letterSpacing: 0.4,
    textAlign: "center",
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
    marginTop: "auto",
    paddingVertical: 16,
    width: "100%",
  },
  primaryButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 18,
    fontWeight: "600",
  },
  streakCircle: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 170,
    height: 280,
    justifyContent: "center",
    width: 280,
  },
  streakPrompt: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: "600",
    textAlign: "center",
  },
  sectionLabel: {
    color: theme.colors.mutedText,
    fontSize: 12,
    letterSpacing: 1,
  },
  streakValue: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "600",
  },
  completedCircle: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 170,
    height: 280,
    justifyContent: "center",
    width: 280,
  },
  checkBadge: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 26,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  completedText: {
    color: theme.colors.onPrimary,
    fontSize: 24,
    fontWeight: "600",
    marginTop: 12,
  },
  streakCard: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 20,
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 18,
  },
  helperTextAlt: {
    color: theme.colors.mutedText,
    fontSize: 16,
  },
});
