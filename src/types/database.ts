import { Timestamp } from 'firebase/firestore';

export type UserRole = 'radiologist' | 'doctor' | 'patient' | 'admin' | 'pending_role_selection'; // Added 'pending_role_selection'

export interface UserDocument {
  id: string; // Added Firestore document ID
  email: string;
  name: string;
  role: UserRole;
  createdAt: Timestamp; // Changed to Timestamp
  patientId?: string; // Only for patients
  avatar?: string;
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

export interface PatientDocument {
  id: string; // Added Firestore document ID
  userId: string | null; // Can be null if unclaimed
  name: string;
  email: string;
  createdAt: Timestamp; // Changed to Timestamp
  status: 'active' | 'monitoring' | 'treatment' | 'inactive' | 'unclaimed'; // Expanded status options
  medicalHistory?: string;
  allergies?: string[];
  bloodType?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  age?: number; // New field
  gender?: string; // New field
  phone?: string; // New field
  avatar?: string; // Added avatar field
  assignedRadiologistId?: string; // NEW: ID of the radiologist assigned to this patient
  assignedRadiologistName?: string; // NEW: Name of the radiologist assigned to this patient
  assignedDoctorIds?: string[]; // NEW: Array of doctor UIDs assigned to this patient
}

export interface XRayRecord {
  id: string;
  patientId: string;
  uploadedBy?: string; // radiologist's userId, optional for patient requests
  uploadedAt: Timestamp; // Changed to Timestamp
  imageUrl?: string; // Optional for pending requests
  status: 'pending' | 'pending_ai_analysis' | 'ai_analysis_complete' | 'analyzed' | 'reviewed' | 'requires_radiologist_review'; // Updated status options
  aiAnalysis?: {
    condition: string;
    confidence: number;
    detectedAt: string;
    allPredictions: Array<{
      condition: string;
      probability: number;
    }>;
    noSignificantFinding?: boolean; // New field for AI uncertainty
  };
  report?: {
    summary: string;
    findings: string;
    impression: string;
    recommendations: string;
  };
  radiologistNotes?: string;
  doctorReview?: {
    doctorId: string;
    doctorName: string; // Added doctorName
    reviewedAt: string;
    diagnosis: string;
    recommendations: string;
    prescriptionId?: string; // Link to a prescription if one is created
  };
  prescriptionId?: string; // Top-level link to a prescription
  
  // Fields for X-ray requests (these will now primarily be on the Appointment interface)
  examType?: string; // e.g., 'chest', 'abdomen'
  preferredDate?: string; // ISO date string for preferred appointment

  // New fields for assigning a doctor
  assignedDoctorId?: string;
  assignedDoctorName?: string;
}

export interface Prescription {
  id: string;
  reportId: string; // Link to the X-ray report
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  createdAt: Timestamp; // Changed to Timestamp
  diagnosis: string;
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    specialInstructions?: string;
  }>;
  instructions: string;
  status: 'draft' | 'sent';
}

export interface Notification {
  id: string;
  userId: string; // The ID of the user who should receive the notification
  senderId?: string; // The ID of the user who sent the notification (e.g., radiologist, doctor)
  senderName?: string; // The name of the user who sent the notification
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: Timestamp; // Firestore Timestamp
  read: boolean;
  action?: {
    type: 'view_xray' | 'view_prescription' | 'view_report' | 'update_profile';
    payload: string; // ID of the related document (e.g., xrayId, prescriptionId)
  };
}

// NEW: Appointment Interface
export interface Appointment {
  id: string;
  patientId: string; // Document ID from 'patients' collection
  patientName: string; // Denormalized for easier display
  patientEmail: string; // Denormalized
  requestedByUserId: string; // Firebase UID of the user who made the request (could be patient or doctor)
  requestedByUserName: string; // Denormalized
  assignedRadiologistId?: string; // Firebase UID of the radiologist who will handle it
  assignedRadiologistName?: string; // Denormalized
  assignedDoctorId?: string; // Firebase UID of the doctor who referred/will review
  assignedDoctorName?: string; // Denormalized
  type: 'xray_scan' | 'consultation' | 'follow_up'; // Type of appointment
  examType?: string; // Specific X-ray type if 'xray_scan'
  preferredDate: string; // ISO date string
  preferredTime?: string; // Optional time slot
  symptoms: string;
  medicalHistory?: string; // Patient's medical history at time of request
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  notes?: string; // Radiologist/doctor notes
  xrayId?: string; // Link to XRayRecord if type is xray_scan and completed
}