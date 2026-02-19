import Constants from "expo-constants";

export const buildDailyTriggers = (start, end, hour = 8, minute = 0) => {
  const triggers = [];
  const startAt = new Date(start);
  startAt.setHours(hour, minute, 0, 0);

  const endAt = new Date(end);
  endAt.setHours(hour, minute, 0, 0);

  let cursor = new Date(startAt);
  let count = 0;

  while (cursor <= endAt && count < 366) {
    triggers.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
    count += 1;
  }

  return { triggers, endAt };
};

export const loadNotifications = async () => {
  if (Constants.appOwnership === "expo") {
    return null;
  }

  const module = await import("expo-notifications");
  module.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  return module;
};

export const ensureNotificationPermission = async (notifications) => {
  const current = await notifications.getPermissionsAsync();
  if (current.status === "granted") {
    return true;
  }

  const request = await notifications.requestPermissionsAsync();
  return request.status === "granted";
};

export const cancelScheduledNotifications = async (notifications) => {
  await notifications.cancelAllScheduledNotificationsAsync();
};

export const scheduleStreakNotifications = async (
  notifications,
  startDate,
  endDate,
  hour = 8,
  minute = 0
) => {
  const { triggers, endAt } = buildDailyTriggers(startDate, endDate, hour, minute);
  for (const trigger of triggers) {
    await notifications.scheduleNotificationAsync({
      content: {
        title: "Streak Keeper",
        body: "Time to work on your goal.",
      },
      trigger,
    });
  }

  await notifications.scheduleNotificationAsync({
    content: {
      title: "Streak complete!",
      body: "You reached your target date.",
    },
    trigger: endAt,
  });
};
