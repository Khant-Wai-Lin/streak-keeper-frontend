import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

const getDateKey = (date) => {
  return date.toISOString().slice(0, 10);
};

const requireUser = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Please log in first.");
  }
  return user;
};

const parseIsoDate = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
};

export const createStreak = async ({ goalTitle, frequency = "daily", startDate, endDate }) => {
  const user = requireUser();
  if (!goalTitle || !frequency) {
    throw new Error("goalTitle and frequency are required");
  }

  const resolvedStartDate = parseIsoDate(startDate) || new Date().toISOString();
  const resolvedEndDate = parseIsoDate(endDate);

  const docRef = await addDoc(collection(db, "streaks"), {
    userId: user.uid,
    goalTitle,
    frequency,
    isActive: true,
    startDate: resolvedStartDate,
    endDate: resolvedEndDate,
    totalDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    createdAt: serverTimestamp(),
  });

  return {
    streakId: docRef.id,
    isActive: true,
    startDate: resolvedStartDate,
  };
};

export const checkIn = async ({ streakId, date }) => {
  const user = requireUser();
  if (!streakId) {
    throw new Error("streakId is required");
  }

  const targetDate = date ? new Date(date) : new Date();
  if (Number.isNaN(targetDate.getTime())) {
    throw new Error("Invalid date");
  }

  const streakRef = doc(db, "streaks", streakId);
  const dateKey = getDateKey(targetDate);

  return runTransaction(db, async (transaction) => {
    const streakSnap = await transaction.get(streakRef);
    if (!streakSnap.exists()) {
      throw new Error("Streak not found");
    }

    const streak = streakSnap.data();
    if (streak.userId !== user.uid) {
      throw new Error("Not allowed");
    }

    const checkinRef = doc(collection(streakRef, "checkins"), dateKey);
    const checkinSnap = await transaction.get(checkinRef);

    if (checkinSnap.exists()) {
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
      createdAt: serverTimestamp(),
    });

    transaction.update(streakRef, {
      currentStreak,
      longestStreak,
      totalDays,
      lastCheckin: dateKey,
      lastCheckInDate: dateKey,
    });

    return { currentStreak, longestStreak };
  });
};

export const getHistory = async () => {
  const user = requireUser();
  const snapshot = await getDocs(
    query(collection(db, "streaks"), where("userId", "==", user.uid)),
  );

  const history = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      streakId: docSnap.id,
      goalTitle: data.goalTitle,
      startDate: data.startDate,
      endDate: data.endDate,
      totalDays: data.totalDays || 0,
      isActive: data.isActive || false,
      currentStreak: data.currentStreak || 0,
      longestStreak: data.longestStreak || 0,
      lastCheckInDate: data.lastCheckInDate || data.lastCheckin || null,
    };
  });

  return { history };
};

export const getProfileStats = async () => {
  const user = requireUser();
  const snapshot = await getDocs(
    query(collection(db, "streaks"), where("userId", "==", user.uid)),
  );

  const uniqueDays = new Set();
  let longestStreak = 0;

  await Promise.all(
    snapshot.docs.map(async (streakDoc) => {
      const streakData = streakDoc.data();
      longestStreak = Math.max(longestStreak, streakData.longestStreak || 0);

      const checkinsSnapshot = await getDocs(collection(streakDoc.ref, "checkins"));
      checkinsSnapshot.forEach((checkinDoc) => {
        const checkinData = checkinDoc.data();
        const dayKey = checkinData?.date || checkinDoc.id;
        if (dayKey) {
          uniqueDays.add(String(dayKey).slice(0, 10));
        }
      });
    }),
  );

  return {
    totalUniqueCheckinDays: uniqueDays.size,
    longestStreak,
  };
};

export const cancelStreak = async ({ streakId }) => {
  const user = requireUser();
  if (!streakId) {
    throw new Error("streakId is required");
  }

  const streakRef = doc(db, "streaks", streakId);
  const snapshot = await getDoc(streakRef);
  if (!snapshot.exists()) {
    throw new Error("Streak not found");
  }

  const streak = snapshot.data();
  if (streak.userId !== user.uid) {
    throw new Error("Not allowed");
  }

  const endDate = new Date().toISOString();
  await updateDoc(streakRef, { isActive: false, endDate });

  return { success: true, message: "Challenge canceled" };
};

export const deleteStreakHistory = async ({ streakId }) => {
  const user = requireUser();
  if (!streakId) {
    throw new Error("streakId is required");
  }

  const streakRef = doc(db, "streaks", streakId);
  const snapshot = await getDoc(streakRef);
  if (!snapshot.exists()) {
    throw new Error("Streak not found");
  }

  const streak = snapshot.data();
  if (streak.userId !== user.uid) {
    throw new Error("Not allowed");
  }

  const checkinsSnapshot = await getDocs(collection(streakRef, "checkins"));
  await Promise.all(checkinsSnapshot.docs.map((checkinDoc) => deleteDoc(checkinDoc.ref)));
  await deleteDoc(streakRef);

  return { success: true };
};
