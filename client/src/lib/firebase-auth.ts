import { auth } from "@shared/firebase";
import { getIdToken } from "firebase/auth";

export const getAuthHeaders = async (): Promise<HeadersInit> => {
  const user = auth.currentUser;
  if (!user) {
    return {};
  }

  try {
    const token = await getIdToken(user);
    return {
      'Authorization': `Bearer ${token}`
    };
  } catch (error) {
    console.error("Error getting auth token:", error);
    return {};
  }
};

// For backward compatibility with existing API calls
export const getHeaders = async (): Promise<HeadersInit> => {
  return await getAuthHeaders();
};
