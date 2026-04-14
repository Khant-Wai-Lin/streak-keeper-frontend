import Constants from "expo-constants";

const fallbackBaseUrl = "https://us-central1-streak-keeper-d50f0.cloudfunctions.net/api";

const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const extraBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl;

export const API_BASE_URL = envBaseUrl || extraBaseUrl || fallbackBaseUrl;
