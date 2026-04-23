import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../src/core/theme";

const FEATURES = [
  {
    title: "Streaks that adapt",
    body: "Miss a day without losing everything. Built-in grace keeps you moving forward.",
  },
  {
    title: "Daily check-ins",
    body: "Track progress in seconds with a clean, focused flow.",
  },
  {
    title: "Honest stats",
    body: "See current, longest, and missed days without guessing.",
  },
];

const HIGHLIGHTS = ["Create challenges", "Mark daily wins", "Review history"];
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.anonymous.streakkeeper";

export default function LandingScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const isMedium = width >= 720;
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroLift = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(heroLift, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [heroFade, heroLift]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.backdrop}>
          <View style={styles.orbOne} />
          <View style={styles.orbTwo} />
          <View style={styles.orbThree} />
        </View>

        <View style={[styles.nav, isMedium && styles.navWide]}>
          <View style={styles.brand}>
            <Image
              source={require("../assets/shield-check.png")}
              style={styles.brandIcon}
            />
            <Text style={styles.brandText}>Streak Keeper</Text>
          </View>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => Linking.openURL(PLAY_STORE_URL)}
          >
            <Text style={styles.navButtonText}>Open app</Text>
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.hero,
            isWide && styles.heroWide,
            {
              opacity: heroFade,
              transform: [{ translateY: heroLift }],
            },
          ]}
        >
          <View style={[styles.heroLeft, isWide && styles.heroLeftWide]}>
            <Text style={styles.heroEyebrow}>Build habits that stick</Text>
            <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]}>
              Your daily streaks, protected from slip-ups.
            </Text>
            <Text style={[styles.heroSubtitle, isWide && styles.heroSubtitleWide]}>
              Streak Keeper helps you stay consistent without the all-or-nothing
              pressure. Track challenges, keep momentum, and see your real progress.
            </Text>
            <View style={[styles.heroActions, isMedium && styles.heroActionsWide]}>
              <TouchableOpacity
                style={[styles.primaryButton, isMedium && styles.primaryButtonWide]}
                onPress={() => router.push("/(auth)/login")}
              >
                <Text style={styles.primaryButtonText}>Get started free</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, isMedium && styles.secondaryButtonWide]}
                onPress={() => router.push("/(auth)/login")}
              >
                <Text style={styles.secondaryButtonText}>I already have an account</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.badgesRow}>
              {HIGHLIGHTS.map((item) => (
                <View key={item} style={styles.badge}>
                  <Text style={styles.badgeText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.heroCard, isWide && styles.heroCardWide]}>
            <Text style={styles.cardTitle}>Today</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Meditate</Text>
              <Text style={styles.cardValue}>Day 9</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Run 3km</Text>
              <Text style={styles.cardValue}>Day 5</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Read 20 pages</Text>
              <Text style={styles.cardValue}>Day 12</Text>
            </View>
            <View style={styles.cardFooter}>
              <View style={styles.cardDot} />
              <Text style={styles.cardFooterText}>Grace days left: 1</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why people keep their streaks here</Text>
          <View style={[styles.featureGrid, isWide && styles.featureGridWide]}>
            {FEATURES.map((item) => (
              <View key={item.title} style={[styles.featureCard, isWide && styles.featureCardWide]}>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureBody}>{item.body}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.sectionAlt, isWide && styles.sectionAltWide]}>
          <View style={styles.statBlock}>
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>Grace days to keep you on track</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statNumber}>3x</Text>
            <Text style={styles.statLabel}>Easier to maintain habit momentum</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statNumber}>1 min</Text>
            <Text style={styles.statLabel}>Daily check-in flow</Text>
          </View>
        </View>

        <View style={[styles.ctaSection, isWide && styles.ctaSectionWide]}>
          <Text style={styles.ctaTitle}>Start your first streak today.</Text>
          <Text style={styles.ctaBody}>
            Create a challenge, track wins, and watch the streak grow.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, isMedium && styles.primaryButtonWide]}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.primaryButtonText}>Create my account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    padding: 20,
    paddingBottom: 48,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  orbOne: {
    position: "absolute",
    top: -120,
    left: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(34, 227, 90, 0.15)",
  },
  orbTwo: {
    position: "absolute",
    top: 180,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(110, 168, 255, 0.16)",
  },
  orbThree: {
    position: "absolute",
    bottom: -60,
    left: 80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 191, 105, 0.14)",
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  navWide: {
    marginBottom: 36,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandIcon: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  brandText: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "Georgia",
    letterSpacing: 0.4,
  },
  navButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
  },
  navButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  hero: {
    flexDirection: "column",
    gap: 28,
  },
  heroWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 36,
  },
  heroLeft: {
    gap: 14,
  },
  heroLeftWide: {
    flex: 1,
    maxWidth: 520,
  },
  heroEyebrow: {
    color: theme.colors.primary,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1.8,
    fontWeight: "600",
  },
  heroTitle: {
    color: theme.colors.text,
    fontSize: 34,
    lineHeight: 40,
    fontFamily: "Georgia",
  },
  heroTitleWide: {
    fontSize: 42,
    lineHeight: 48,
  },
  heroSubtitle: {
    color: theme.colors.mutedText,
    fontSize: 15,
    lineHeight: 22,
  },
  heroSubtitleWide: {
    fontSize: 16,
    lineHeight: 24,
  },
  heroActions: {
    gap: 12,
  },
  heroActionsWide: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: "center",
  },
  primaryButtonWide: {
    minWidth: 200,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  secondaryButton: {
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    alignItems: "center",
    backgroundColor: theme.colors.surfaceAlt,
  },
  secondaryButtonWide: {
    minWidth: 220,
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  badgeText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    gap: 12,
  },
  heroCardWide: {
    width: 320,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardLabel: {
    color: theme.colors.text,
    fontSize: 14,
  },
  cardValue: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  cardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  cardFooterText: {
    color: theme.colors.mutedText,
    fontSize: 12,
  },
  section: {
    marginTop: 36,
    gap: 18,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "600",
    fontFamily: "Georgia",
  },
  featureGrid: {
    gap: 14,
  },
  featureGridWide: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  featureCard: {
    backgroundColor: theme.colors.surfaceAlt,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
  },
  featureCardWide: {
    flexBasis: "30%",
    minWidth: 220,
    flexGrow: 1,
  },
  featureTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  featureBody: {
    color: theme.colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionAlt: {
    marginTop: 36,
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
  },
  sectionAltWide: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBlock: {
    gap: 6,
  },
  statNumber: {
    color: theme.colors.primary,
    fontSize: 26,
    fontWeight: "700",
  },
  statLabel: {
    color: theme.colors.mutedText,
    fontSize: 13,
  },
  ctaSection: {
    marginTop: 40,
    padding: 20,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    gap: 10,
    alignItems: "flex-start",
  },
  ctaSectionWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },
  ctaTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "600",
    fontFamily: "Georgia",
  },
  ctaBody: {
    color: theme.colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
});
