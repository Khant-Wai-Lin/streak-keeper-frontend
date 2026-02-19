import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../src/core/theme";

export default function HistoryReviewScreen() {
  const streaks = [
    {
      id: "1",
      title: "Study 30 minutes daily",
      daysCompleted: 16,
      goalDays: 30,
    },
    {
      id: "2",
      title: "Read 10 pages",
      daysCompleted: 9,
      goalDays: 21,
    },
    {
      id: "3",
      title: "Workout",
      daysCompleted: 42,
      goalDays: 60,
    },
  ];

  const longestStreak = 42;
  const totalDays = streaks.reduce((sum, streak) => sum + streak.daysCompleted, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>History</Text>
          <Ionicons name="settings-outline" size={20} color={theme.colors.mutedText} />
        </View>

        <View style={styles.summaryBlock}>
          <Text style={styles.summaryLabel}>TOTAL DAYS</Text>
          <Text style={styles.summaryValue}>{totalDays}</Text>
          <Text style={styles.summaryCaption}>Days of consistency</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Ionicons name="flash" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardLabel}>LONGEST STREAK</Text>
            <Text style={styles.cardValue}>
              {longestStreak} <Text style={styles.cardValueMuted}>Days</Text>
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>YOUR STREAKS</Text>
        </View>

        {streaks.map((streak) => (
          <View key={streak.id} style={styles.streakCard}>
            <View style={styles.streakInfo}>
              <Text style={styles.streakTitle}>{streak.title}</Text>
              <Text style={styles.streakProgress}>
                {streak.daysCompleted} / {streak.goalDays} days completed
              </Text>
            </View>
            <Text style={styles.streakCount}>{streak.daysCompleted}</Text>
          </View>
        ))}
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
  streakCount: {
    color: theme.colors.primary,
    fontSize: 22,
    fontWeight: "700",
  },
});
