import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showNotification } from "./notifications";
import { activityLogService } from "./firestore-service";
import { auth } from "@shared/firebase";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import { useEffect, useState } from "react";
import type { LoginData } from "@/../../shared/schema";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAuthenticated = !!user;

  return {
    user: user ? {
      id: user.uid,
      email: user.email,
      isAdmin: user.email === 'admin@maanstore.com' // Simple admin check
    } : null,
    isLoading,
    isAuthenticated,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginData) => {
      // For the admin user, we'll use a specific email format
      const email = credentials.email === 'admin' 
        ? 'admin@maanstore.com' 
        : credentials.email;

      const userCredential = await signInWithEmailAndPassword(auth, email, credentials.password);
      return userCredential.user;
    },
    onSuccess: async (user) => {
      queryClient.invalidateQueries();
      
      // Log the login activity
      try {
        await activityLogService.create({
          userId: user.uid,
          action: 'LOGIN',
          details: `User ${user.email} logged in`
        });
      } catch (error) {
        console.warn('Failed to log login activity:', error);
      }
      
      showNotification.success("Welcome back!", "Successfully logged into Maans' Store");
    },
    onError: (error: any) => {
      let message = "Invalid credentials";
      
      if (error.code === 'auth/user-not-found') {
        message = "User not found";
      } else if (error.code === 'auth/wrong-password') {
        message = "Invalid password";
      } else if (error.code === 'auth/invalid-email') {
        message = "Invalid email address";
      } else if (error.code === 'auth/too-many-requests') {
        message = "Too many failed attempts. Please try again later.";
      }

      showNotification.error("Login failed", message);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      // Log the logout activity before signing out
      if (user) {
        try {
          await activityLogService.create({
            userId: user.id,
            action: 'LOGOUT',
            details: `User ${user.email} logged out`
          });
        } catch (error) {
          console.warn('Failed to log logout activity:', error);
        }
      }
      
      await signOut(auth);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      showNotification.success("Logged out", "You have been logged out successfully");
      
      // Force redirect to login page
      window.location.href = "/";
    },
  });
}
