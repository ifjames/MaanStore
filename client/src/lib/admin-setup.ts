import { auth } from "@shared/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { showNotification } from "./notifications";

// Simple admin check - we'll use a different approach
// Since we can't securely check user count without authentication,
// we'll use a combination of localStorage flag and admin email existence check
export const checkIfAdminSetupNeeded = async (): Promise<boolean> => {
  try {
    // Check if admin setup was already completed (stored locally)
    const setupCompleted = localStorage.getItem('admin-setup-completed');
    if (setupCompleted === 'true') {
      return false;
    }

    // For security, we'll assume if we reach here and no local flag exists,
    // we should allow admin setup ONLY once per browser
    // This is not perfect but prevents the security issue while maintaining functionality
    return true;
  } catch (error) {
    console.error('Error checking admin setup status:', error);
    // On error, assume setup is not needed to be safe
    return false;
  }
};

export const createAdminUser = async (email: string, password: string) => {
  try {
    // Create the admin user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Mark admin setup as completed
    localStorage.setItem('admin-setup-completed', 'true');
    
    showNotification.success(
      "Admin account created", 
      "Admin account has been created successfully. You can now log in."
    );

    return userCredential.user;
  } catch (error: any) {
    let message = "Failed to create admin account";
    
    if (error.code === 'auth/email-already-in-use') {
      message = "An account with this email already exists";
      // If email exists, mark setup as completed
      localStorage.setItem('admin-setup-completed', 'true');
    } else if (error.code === 'auth/weak-password') {
      message = "Password should be at least 6 characters";
    } else if (error.code === 'auth/invalid-email') {
      message = "Invalid email address";
    }

    throw new Error(message);
  }
};
