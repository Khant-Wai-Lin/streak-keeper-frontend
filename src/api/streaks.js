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

const MS_IN_DAY = 24 * 60 * 60 * 1000;

const toDateKeyOrNull = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return getDateKey(parsed);
};

const dateKeyToUtcDate = (dateKey) => {
  return new Date(`${dateKey}T00:00:00.000Z`);
};

const addDaysToDateKey = (dateKey, days) => {
  const next = dateKeyToUtcDate(dateKey);
  next.setUTCDate(next.getUTCDate() + days);
  return getDateKey(next);
};

const daysBetweenInclusive = (startKey, endKey) => {
  const start = dateKeyToUtcDate(startKey);
  const end = dateKeyToUtcDate(endKey);
  if (end < start) {
    return 0;
  }

  return Math.floor((end.getTime() - start.getTime()) / MS_IN_DAY) + 1;
};

const isDateKeyInRange = (dateKey, startKey, endKey) => {
  return dateKey >= startKey && dateKey <= endKey;
};

const computeLongestStreak = (checkinKeys, startKey, endKey) => {
  if (!startKey || !endKey || checkinKeys.length === 0) {
    return 0;
  }

  const filtered = checkinKeys
    .filter((dateKey) => isDateKeyInRange(dateKey, startKey, endKey))
    .sort();

  let longest = 0;
  let current = 0;
  let previous = null;

  for (const dateKey of filtered) {
    if (!previous) {
      current = 1;
      longest = Math.max(longest, current);
      previous = dateKey;
      continue;
    }

    const expectedNext = addDaysToDateKey(previous, 1);
    if (dateKey === expectedNext) {
      current += 1;
    } else {
      current = 1;
    }

    longest = Math.max(longest, current);
    previous = dateKey;
  }

  return longest;
};

const computeCurrentStreak = ({ checkinSet, startKey, endKey, todayKey }) => {
  if (!startKey || !endKey) {
    return 0;
  }

  const cappedToday = todayKey > endKey ? endKey : todayKey;
  const hasToday = checkinSet.has(cappedToday);
  const anchor = hasToday ? cappedToday : addDaysToDateKey(cappedToday, -1);

  if (anchor < startKey || anchor > endKey) {
    return 0;
  }

  let cursor = anchor;
  let count = 0;
  while (cursor >= startKey && checkinSet.has(cursor)) {
    count += 1;
    cursor = addDaysToDateKey(cursor, -1);
  }

  return count;
};

const computeMissedDays = ({ checkinKeys, startKey, endKey, isActive, todayKey }) => {
  if (!startKey || !endKey) {
    return 0;
  }

  let evaluationEnd = endKey;
  const yesterdayKey = addDaysToDateKey(todayKey, -1);

  // A day is only counted as missed after it fully passes.
  if (isActive && endKey >= todayKey) {
    evaluationEnd = yesterdayKey;
  }

  if (evaluationEnd < startKey) {
    return 0;
  }

  const expectedDays = daysBetweenInclusive(startKey, evaluationEnd);
  const completedDays = checkinKeys.filter((dateKey) =>
    isDateKeyInRange(dateKey, startKey, evaluationEnd),
  ).length;

  return Math.max(0, expectedDays - completedDays);
};

const resolveStreakStatus = ({
  isActive,
  endKey,
  todayKey,
  missedDays,
  allowedMisses,
  canceledByUser,
}) => {
  if (canceledByUser) {
    return "Failed";
  }

  if (isActive && endKey >= todayKey) {
    return "In Progress";
  }

  return missedDays <= allowedMisses ? "Completed" : "Failed";
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
    allowedMisses: 2,
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

    const previousDateKey = addDaysToDateKey(dateKey, -1);
    const previousCheckinRef = doc(collection(streakRef, "checkins"), previousDateKey);
    const previousCheckinSnap = await transaction.get(previousCheckinRef);

    const currentStreak = previousCheckinSnap.exists() ? (streak.currentStreak || 0) + 1 : 1;
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

  const todayKey = getDateKey(new Date());

  const history = await Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const startKey = toDateKeyOrNull(data.startDate) || todayKey;
      const endKey = toDateKeyOrNull(data.endDate) || todayKey;
      const isActive = data.isActive !== false;
      const canceledByUser = data.canceledByUser === true;
      const allowedMisses = Number.isInteger(data.allowedMisses) ? data.allowedMisses : 2;

      const checkinsSnapshot = await getDocs(collection(docSnap.ref, "checkins"));
      const checkinKeys = checkinsSnapshot.docs
        .map((checkinDoc) => {
          const checkinData = checkinDoc.data();
          return String(checkinData?.date || checkinDoc.id).slice(0, 10);
        })
        .filter(Boolean)
        .sort();

      const checkinSet = new Set(checkinKeys);
      const totalDays = checkinSet.size;
      const currentStreak = computeCurrentStreak({
        checkinSet,
        startKey,
        endKey,
        todayKey,
      });
      const longestStreak = computeLongestStreak(checkinKeys, startKey, endKey);
      const missedDays = computeMissedDays({
        checkinKeys,
        startKey,
        endKey,
        isActive,
        todayKey,
      });
      const status = resolveStreakStatus({
        isActive,
        endKey,
        todayKey,
        missedDays,
        allowedMisses,
        canceledByUser,
      });

      return {
        streakId: docSnap.id,
        goalTitle: data.goalTitle,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays,
        isActive,
        status,
        allowedMisses,
        missedDays,
        canceledByUser,
        currentStreak,
        longestStreak,
        lastCheckInDate: checkinKeys.length ? checkinKeys[checkinKeys.length - 1] : null,
      };
    }),
  );

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
  await updateDoc(streakRef, { isActive: false, endDate, canceledByUser: true });

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
