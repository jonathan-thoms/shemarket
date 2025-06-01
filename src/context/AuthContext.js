import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch additional profile from Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const profileData = userDoc.exists() ? userDoc.data() : {};

          // Combine Firebase user + Firestore profile
          const extendedUser = {
            ...user,
            ...profileData, // now includes 'name', 'phone', 'address', etc.
          };

          setCurrentUser(extendedUser);
          setIsAdmin(user.email === "admin@shemarket.com");
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setCurrentUser(user); // fallback to basic auth user
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    setCurrentUser, // now optional — rarely needed
    currentUser,
    isAdmin,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
