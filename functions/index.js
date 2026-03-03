const {setGlobalOptions} = require("firebase-functions/v2");
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const cors = require("cors");
const express = require("express");

admin.initializeApp();

setGlobalOptions({maxInstances: 10});

const app = express();

app.use(cors({origin: true}));
app.use(express.json());

const getDateKey = (date) => {
  return date.toISOString().slice(0, 10);
};

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) {
    return res.status(401).json({error: "Missing bearer token"});
  }

  try {
    const decoded = await admin.auth().verifyIdToken(match[1]);
    req.user = decoded;
    return next();
  } catch (error) {
    logger.warn("Invalid token", {error});
    return res.status(401).json({error: "Invalid token"});
  }
};

app.get("/api/v1/health", (req, res) => {
  res.json({status: "ok"});
});

app.post("/api/v1/auth/login", (req, res) => {
  return res.status(400).json({
    error: "Use client Firebase Auth",
    message: "Sign in on the mobile app with Firebase Auth SDK and send the ID token as a Bearer token.",
  });
});

app.post("/api/v1/auth/logout", authMiddleware, async (req, res) => {
  try {
    await admin.auth().revokeRefreshTokens(req.user.uid);
    return res.json({success: true});
  } catch (error) {
    logger.error("Logout failed", {error});
    return res.status(500).json({success: false});
  }
});

app.post("/api/v1/streaks", authMiddleware, async (req, res) => {
  const {goalTitle, frequency} = req.body || {};
  if (!goalTitle || !frequency) {
    return res.status(400).json({error: "goalTitle and frequency are required"});
  }

  const startDate = new Date().toISOString();
  try {
    const docRef = await admin.firestore().collection("streaks").add({
      userId: req.user.uid,
      goalTitle,
      frequency,
      isActive: true,
      startDate,
      endDate: null,
      totalDays: 0,
      currentStreak: 0,
      longestStreak: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({streakId: docRef.id, isActive: true, startDate});
  } catch (error) {
    logger.error("Create streak failed", {error});
    return res.status(500).json({error: "Failed to create streak"});
  }
});

app.post("/api/v1/streaks/checkin", authMiddleware, async (req, res) => {
  const {streakId, date} = req.body || {};
  if (!streakId) {
    return res.status(400).json({error: "streakId is required"});
  }

  const targetDate = date ? new Date(date) : new Date();
  if (Number.isNaN(targetDate.getTime())) {
    return res.status(400).json({error: "Invalid date"});
  }

  const streakRef = admin.firestore().collection("streaks").doc(streakId);
  try {
    const result = await admin.firestore().runTransaction(async (transaction) => {
      const streakSnap = await transaction.get(streakRef);
      if (!streakSnap.exists) {
        throw new Error("streak_not_found");
      }

      const streak = streakSnap.data();
      if (streak.userId !== req.user.uid) {
        throw new Error("forbidden");
      }

      const dateKey = getDateKey(targetDate);
      const checkinRef = streakRef.collection("checkins").doc(dateKey);
      const checkinSnap = await transaction.get(checkinRef);

      if (checkinSnap.exists) {
        return {
          currentStreak: streak.currentStreak || 0,
          longestStreak: streak.longestStreak || 0,
        };
      }

      const currentStreak = (streak.currentStreak || 0) + 1;
      const longestStreak = Math.max(streak.longestStreak || 0, currentStreak);
      const totalDays = (streak.totalDays || 0) + 1;

      transaction.set(checkinRef, {
        date: dateKey,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      transaction.update(streakRef, {
        currentStreak,
        longestStreak,
        totalDays,
        lastCheckin: dateKey,
      });

      return {currentStreak, longestStreak};
    });

    return res.json(result);
  } catch (error) {
    if (error.message === "streak_not_found") {
      return res.status(404).json({error: "Streak not found"});
    }
    if (error.message === "forbidden") {
      return res.status(403).json({error: "Not allowed"});
    }

    logger.error("Check-in failed", {error});
    return res.status(500).json({error: "Check-in failed"});
  }
});

app.get("/api/v1/streaks/history", authMiddleware, async (req, res) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection("streaks")
      .where("userId", "==", req.user.uid)
      .get();

    const history = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        streakId: doc.id,
        goalTitle: data.goalTitle,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: data.totalDays || 0,
      };
    });

    return res.json({history});
  } catch (error) {
    logger.error("History fetch failed", {error});
    return res.status(500).json({error: "Failed to load history"});
  }
});

app.post("/api/v1/streaks/cancel", authMiddleware, async (req, res) => {
  const {streakId} = req.body || {};
  if (!streakId) {
    return res.status(400).json({error: "streakId is required"});
  }

  const streakRef = admin.firestore().collection("streaks").doc(streakId);
  try {
    const snapshot = await streakRef.get();
    if (!snapshot.exists) {
      return res.status(404).json({error: "Streak not found"});
    }

    const streak = snapshot.data();
    if (streak.userId !== req.user.uid) {
      return res.status(403).json({error: "Not allowed"});
    }

    const endDate = new Date().toISOString();
    await streakRef.update({isActive: false, endDate});

    return res.json({success: true, message: "Challenge canceled"});
  } catch (error) {
    logger.error("Cancel failed", {error});
    return res.status(500).json({success: false, message: "Cancel failed"});
  }
});

exports.api = onRequest(app);
