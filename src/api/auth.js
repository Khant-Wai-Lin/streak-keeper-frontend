import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";

export const logoutSession = async () => {
  return signOut(auth);
};
