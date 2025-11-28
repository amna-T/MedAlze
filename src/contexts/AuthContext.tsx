import React, { createContext, useContext, useState, useEffect } from 'react';
import { firebaseAvailable, auth, googleProvider, db } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  updateProfile as firebaseUpdateProfile,
  getRedirectResult,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { addNotification } from '@/utils/notificationUtils'; // Import the utility

export type UserRole = 'radiologist' | 'doctor' | 'patient' | 'admin' | 'pending_role_selection';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean; // Added this property
  avatar?: string;
  patientId?: string;
  // Radiologist-specific fields
  license?: string;
  certifications?: string; // e.g., "Board Certified in Radiology"
  hospitalAffiliation?: string;
  contactPhone?: string; // Professional contact number
  // Doctor-specific fields
  specialty?: string;
  medicalSchool?: string;
  yearsOfExperience?: number;
  // hospitalAffiliation is common for doctors and radiologists
  // contactPhone is common for doctors and radiologists
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void> | void;
  register: (email: string, password: string, name: string, role: UserRole, patientId?: string) => Promise<void>;
  updateUserProfile: (updates: Partial<Pick<User, 'name' | 'avatar' | 'license' | 'certifications' | 'hospitalAffiliation' | 'contactPhone' | 'specialty' | 'medicalSchool' | 'yearsOfExperience' | 'role' | 'patientId'>>) => Promise<void>;
  refetchUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const MOCK_USERS = [
  { id: '1', email: 'radiologist@medalze.com', password: 'radio123', name: 'Dr. Sarah Johnson', role: 'radiologist' as UserRole, emailVerified: true },
  { id: '2', email: 'doctor@medalze.com', password: 'doctor123', name: 'Dr. Michael Chen', role: 'doctor' as UserRole, emailVerified: true },
  { id: '3', email: 'patient@medalze.com', password: 'patient123', name: 'John Anderson', role: 'patient' as UserRole, patientId: 'P3', emailVerified: true },
  { id: '5', email: 'admin@medalze.com', password: 'admin123', name: 'Admin User', role: 'admin' as UserRole, emailVerified: true },
];

const firebaseUserToAppUser = async (fbUser: FirebaseUser | null): Promise<User | null> => {
  if (!fbUser) return null;
  
  try {
    if (!db) {
      console.log("AuthContext: Firestore not available, returning minimal user.");
      return {
        id: fbUser.uid,
        email: fbUser.email || '',
        name: fbUser.displayName || fbUser.email || 'User',
        role: 'patient', // Default role if Firestore is not available
        emailVerified: fbUser.emailVerified,
      };
    }

    const userDocRef = doc(db, 'users', fbUser.uid);
    const userSnap = await getDoc(userDocRef);
    
    let appUser: User;

    if (userSnap.exists()) {
      const data = userSnap.data() as any;
      const fetchedRole = (data.role as UserRole);
      if (!fetchedRole) {
        console.warn(`AuthContext: User document for ${fbUser.email} (UID: ${fbUser.uid}) exists but 'role' field is missing or invalid. Defaulting to 'patient'.`);
      }
      appUser = {
        id: fbUser.uid,
        email: fbUser.email || '',
        name: data.name || fbUser.displayName || fbUser.email || 'User',
        role: fetchedRole || 'patient', // Default to 'patient' if role is missing
        emailVerified: fbUser.emailVerified,
        avatar: data.avatar,
        patientId: data.patientId,
        // Radiologist-specific
        license: data.license,
        certifications: data.certifications,
        hospitalAffiliation: data.hospitalAffiliation,
        contactPhone: data.contactPhone,
        // Doctor-specific
        specialty: data.specialty,
        medicalSchool: data.medicalSchool,
        yearsOfExperience: data.yearsOfExperience,
      };
      console.log("AuthContext: User doc exists in Firestore. Fetched Role:", appUser.role, "Patient ID:", appUser.patientId);
    } else {
      // If user document does NOT exist in Firestore, it means this user was created
      // outside of our app's registration flow (e.g., directly in Firebase console)
      // or there's a race condition.
      // We should create a basic user document for them with a default role.
      console.warn(`AuthContext: Firestore user document for ${fbUser.email} (UID: ${fbUser.uid}) not found. Creating a default user document.`);
      
      const defaultRole: UserRole = 'patient'; // Default to patient if no role is specified
      
      await setDoc(userDocRef, {
        email: fbUser.email,
        name: fbUser.displayName || fbUser.email || 'User',
        role: defaultRole,
        createdAt: serverTimestamp(),
      });
      console.log(`AuthContext: Default user document for ${fbUser.uid} created with role '${defaultRole}'.`);
      
      appUser = {
        id: fbUser.uid,
        email: fbUser.email || '',
        name: fbUser.displayName || fbUser.email || 'User',
        role: defaultRole,
        emailVerified: fbUser.emailVerified,
      };
    }
    console.log("AuthContext: Mapped Firebase user to app user:", appUser);
    console.log("AuthContext: Current user role after mapping:", appUser.role, "Patient ID:", appUser.patientId);
    return appUser;

  } catch (e) {
    console.error('AuthContext: Error mapping firebase user:', e);
    // Fallback to a generic patient role if an error occurs during linking/creation
    return {
      id: fbUser.uid,
      email: fbUser.email || '',
      name: fbUser.displayName || fbUser.email || 'User',
      role: 'patient', 
      emailVerified: fbUser.emailVerified,
    };
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Removed useNotifications hook from here

  useEffect(() => {
    if (!firebaseAvailable || !auth) {
      console.log("AuthContext: Firebase not available. Checking localStorage for mock user.");
      const storedUser = localStorage.getItem('medalze_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log("AuthContext: Loaded mock user from localStorage:", parsedUser);
      }
      setIsLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true);
      if (fbUser) {
        console.log("AuthContext: Firebase onAuthStateChanged - user logged in:", fbUser.uid);
        const appUser = await firebaseUserToAppUser(fbUser);
        setUser(appUser);
        localStorage.setItem('medalze_user', JSON.stringify(appUser));
        console.log("AuthContext: User state set from Firebase:", appUser);
      } else {
        console.log("AuthContext: Firebase onAuthStateChanged - user logged out.");
        setUser(null);
        localStorage.removeItem('medalze_user');
      }
      setIsLoading(false);
    });

    // Handle redirect result for Google Sign-In (still keep this for any lingering redirects)
    const handleRedirectResult = async () => {
      setIsLoading(true);
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log("AuthContext: Firebase getRedirectResult - user logged in via redirect:", result.user.uid);
          const appUser = await firebaseUserToAppUser(result.user);
          setUser(appUser);
          localStorage.setItem('medalze_user', JSON.stringify(appUser));
          console.log("AuthContext: User state set from Firebase redirect:", appUser);
        }
      } catch (error) {
        console.error('AuthContext: Error handling Google redirect result:', error);
      } finally {
        setIsLoading(false);
      }
    };

    handleRedirectResult(); // Call this once on mount to check for redirect result

    return () => unsub();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    if (!firebaseAvailable || !auth) {
      console.log("AuthContext: Firebase not available. Attempting mock login.");
      await new Promise((r) => setTimeout(r, 700));
      const found = MOCK_USERS.find((u) => u.email === email && u.password === password);
      if (!found) {
        setIsLoading(false);
        throw new Error('Invalid credentials');
      }
      // For mock login, ensure emailVerified is set
      const { password: _, ...userWithoutPassword } = found;
      setUser(userWithoutPassword as User); // Cast to User to satisfy type
      localStorage.setItem('medalze_user', JSON.stringify(userWithoutPassword));
      console.log("AuthContext: Mock login successful, user set:", userWithoutPassword);
      setIsLoading(false);
      return;
    }

    try {
      console.log("AuthContext: Attempting Firebase email/password login.");
      const cred = await signInWithEmailAndPassword(auth, email, password);
      
      // Force reload user data to get the latest emailVerified status
      await cred.user.reload();

      // Check if email is verified
      if (!cred.user.emailVerified) {
        await firebaseSignOut(auth); // Sign out the unverified user
        throw new Error('EMAIL_NOT_VERIFIED'); // Throw specific error
      }

      const appUser = await firebaseUserToAppUser(cred.user);
      setUser(appUser);
      localStorage.setItem('medalze_user', JSON.stringify(appUser));
      console.log("AuthContext: Firebase login successful, user set:", appUser);
    } catch (e: any) {
      console.error('AuthContext: Firebase login error', e);
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password');
      } else if (e.message === 'EMAIL_NOT_VERIFIED') {
        throw new Error('EMAIL_NOT_VERIFIED'); // Re-throw for Login.tsx to catch
      }
      throw new Error('An unexpected error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!firebaseAvailable || !auth) {
      console.log("AuthContext: Firebase not available. Performing mock logout.");
      setUser(null);
      localStorage.removeItem('medalze_user');
      return;
    }
    try {
      console.log("AuthContext: Attempting Firebase logout.");
      await firebaseSignOut(auth);
      setUser(null);
      localStorage.removeItem('medalze_user');
      console.log("AuthContext: Firebase logout successful.");
    } catch (e) {
      console.error('AuthContext: Sign out error', e);
    }
  };

  const register = async (email: string, password: string, name: string, role: UserRole, patientId?: string) => {
    setIsLoading(true);
    if (!firebaseAvailable || !auth || !db) {
      console.log("AuthContext: Firebase not available. Performing mock registration without auto-login.");
      await new Promise((r) => setTimeout(r, 700));
      // In mock, we don't auto-login after register, just simulate creation
      console.log("AuthContext: Mock registration successful (no auto-login).");
      setIsLoading(false);
      return;
    }

    try {
      console.log("AuthContext: Attempting Firebase registration.");
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCred.user.uid;

      // Send email verification immediately after user creation
      await sendEmailVerification(userCred.user);
      console.log(`AuthContext: Verification email sent to ${userCred.user.email}.`);

      let finalPatientId = patientId;

      if (role === 'patient') {
        if (!finalPatientId) {
          throw new Error('Patient ID is required for patient registration.'); // Enforce mandatory patient ID
        }

        // Attempt to link to an existing patient record
        const patientDocRef = doc(db, 'patients', finalPatientId);
        const patientSnap = await getDoc(patientDocRef);

        if (!patientSnap.exists()) {
          throw new Error(`Patient ID '${finalPatientId}' not found. Please ensure you have the correct ID.`);
        }
        const patientData = patientSnap.data() as any;
        if (patientData.userId) {
          throw new Error(`Patient ID '${finalPatientId}' is already claimed by another user.`);
        }

        // Fetch all radiologists to assign one if not already assigned
        let assignedRadiologistId: string | undefined;
        let assignedRadiologistName: string | undefined;

        if (!patientData.assignedRadiologistId) { // Only assign if not already assigned
          const radiologistsQuery = query(collection(db, 'users'), where('role', '==', 'radiologist'));
          const radiologistsSnapshot = await getDocs(radiologistsQuery);
          if (!radiologistsSnapshot.empty) {
            const firstRadiologist = radiologistsSnapshot.docs[0].data();
            assignedRadiologistId = radiologistsSnapshot.docs[0].id;
            assignedRadiologistName = firstRadiologist.name;
            console.log(`AuthContext: Assigning patient ${finalPatientId} to radiologist ${assignedRadiologistName} (${assignedRadiologistId}).`);
          } else {
            console.warn("AuthContext: No radiologists found to assign to the new patient.");
          }
        } else {
          assignedRadiologistId = patientData.assignedRadiologistId;
          assignedRadiologistName = patientData.assignedRadiologistName;
        }

        // Link the new user to the existing patient record
        await updateDoc(patientDocRef, {
          userId: userId,
          status: 'active',
          name: name, // Update patient name with registered user's name
          email: email, // Update patient email with registered user's email
          ...(assignedRadiologistId && { assignedRadiologistId }),
          ...(assignedRadiologistName && { assignedRadiologistName }),
          assignedDoctorIds: [], // Initialize assignedDoctorIds for new patient
        });
        console.log(`AuthContext: Patient record ${finalPatientId} updated with userId ${userId}, status 'active', name '${name}', email '${email}'.`);

        // Send notification to the assigned radiologist using the utility
        if (assignedRadiologistId) {
          await addNotification(
            assignedRadiologistId,
            'New Patient Assigned',
            `Patient ${name} (ID: ${finalPatientId}) has registered and been assigned to you.`,
            'info',
            { type: 'update_profile', payload: finalPatientId }, // Placeholder, could be 'view_patient'
            userId,
            name
          );
        }

      } else {
        finalPatientId = undefined;
      }
      
      await setDoc(doc(db, 'users', userId), {
        email,
        name,
        role,
        createdAt: serverTimestamp(),
        ...(finalPatientId && { patientId: finalPatientId }),
      });
      console.log("AuthContext: User document for ${userId} created with role '${role}' and patientId '${finalPatientId}'.");

      // IMPORTANT: Do NOT automatically log in after registration.
      // The user will be redirected to login page.
      await firebaseSignOut(auth); // Ensure no user is logged in after registration
      console.log("AuthContext: Firebase registration successful. User signed out to enforce explicit login.");

    } catch (e) {
      console.error('AuthContext: Registration error', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<Pick<User, 'name' | 'avatar' | 'license' | 'certifications' | 'hospitalAffiliation' | 'contactPhone' | 'specialty' | 'medicalSchool' | 'yearsOfExperience' | 'role' | 'patientId'>>) => {
    if (!user || !auth?.currentUser || !db) {
      throw new Error('User not authenticated or database not available.');
    }

    setIsLoading(true);
    try {
      console.log("AuthContext: Attempting to update Firebase Auth profile.");
      await firebaseUpdateProfile(auth.currentUser, {
        displayName: updates.name ?? auth.currentUser.displayName,
        photoURL: updates.avatar ?? auth.currentUser.photoURL,
      });

      const userDocRef = doc(db, 'users', user.id);
      const updateData: { [key: string]: any } = {
        name: updates.name ?? user.name,
        avatar: updates.avatar ?? user.avatar,
      };

      // Update role if provided and different from current
      if (updates.role && updates.role !== user.role) {
        updateData.role = updates.role;
      }

      // Update patientId if provided (relevant for pending_role_selection to patient)
      if (updates.patientId !== undefined) {
        updateData.patientId = updates.patientId;
      }


      if (user.role === 'radiologist' || updateData.role === 'radiologist') { // Check for current or new role
        updateData.license = updates.license ?? user.license;
        updateData.certifications = updates.certifications ?? user.certifications;
        updateData.hospitalAffiliation = updates.hospitalAffiliation ?? user.hospitalAffiliation;
        updateData.contactPhone = updates.contactPhone ?? user.contactPhone;
      } else if (user.role === 'doctor' || updateData.role === 'doctor') { // Check for current or new role
        updateData.specialty = updates.specialty ?? user.specialty;
        updateData.medicalSchool = updates.medicalSchool ?? user.medicalSchool;
        updateData.yearsOfExperience = updates.yearsOfExperience ?? user.yearsOfExperience;
        updateData.hospitalAffiliation = updates.hospitalAffiliation ?? user.hospitalAffiliation;
        updateData.contactPhone = updates.contactPhone ?? user.contactPhone;
      }

      await updateDoc(userDocRef, updateData);

      // If the user is a patient, also update their patient document
      if ((user.role === 'patient' || updateData.role === 'patient') && (user.patientId || updates.patientId)) {
        const targetPatientId = updates.patientId || user.patientId;
        if (targetPatientId) {
          const patientDocRef = doc(db, 'patients', targetPatientId);
          await updateDoc(patientDocRef, {
            name: updates.name ?? user.name,
            userId: user.id, // Ensure userId is linked
            status: 'active', // Set status to active once claimed
          });
          console.log(`AuthContext: Patient document ${targetPatientId} updated with name '${updates.name ?? user.name}' and linked to user.`);
        }
      }

      setUser(prevUser => {
        if (!prevUser) return null;
        const updatedUser = {
          ...prevUser,
          name: updates.name ?? prevUser.name,
          avatar: updates.avatar ?? prevUser.avatar,
          role: updates.role ?? prevUser.role, // Update role in local state
          patientId: updates.patientId ?? prevUser.patientId, // Update patientId in local state
          emailVerified: auth.currentUser?.emailVerified ?? prevUser.emailVerified, // Ensure emailVerified is updated
          // Update role-specific fields in local state
          ...(updates.role === 'radiologist' || prevUser.role === 'radiologist'
            ? {
                license: updates.license ?? prevUser.license,
                certifications: updates.certifications ?? prevUser.certifications,
                hospitalAffiliation: updates.hospitalAffiliation ?? prevUser.hospitalAffiliation,
                contactPhone: updates.contactPhone ?? prevUser.contactPhone,
              }
            : {}),
          ...(updates.role === 'doctor' || prevUser.role === 'doctor'
            ? {
                specialty: updates.specialty ?? prevUser.specialty,
                medicalSchool: updates.medicalSchool ?? prevUser.medicalSchool,
                yearsOfExperience: updates.yearsOfExperience ?? prevUser.yearsOfExperience,
                hospitalAffiliation: updates.hospitalAffiliation ?? prevUser.hospitalAffiliation,
                contactPhone: updates.contactPhone ?? prevUser.contactPhone,
              }
            : {}),
        };
        localStorage.setItem('medalze_user', JSON.stringify(updatedUser));
        console.log("AuthContext: User profile updated, local state set:", updatedUser);
        return updatedUser;
      });
    } catch (error) {
      console.error('AuthContext: Error updating user profile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refetchUser = async () => {
    if (!auth?.currentUser) return;
    setIsLoading(true);
    try {
      await auth.currentUser.reload();
      const refreshedUser = await firebaseUserToAppUser(auth.currentUser);
      setUser(refreshedUser);
      if (refreshedUser) {
        localStorage.setItem('medalze_user', JSON.stringify(refreshedUser));
      } else {
        localStorage.removeItem('medalze_user');
      }
      console.log("AuthContext: User re-fetched and state updated.");
    } catch (error) {
      console.error("AuthContext: Error refetching user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateUserProfile, refetchUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};