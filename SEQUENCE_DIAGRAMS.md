# MedALze - Sequence Diagrams

## 1. X-Ray Upload and Analysis Workflow

```mermaid
sequenceDiagram
    actor Patient
    participant Frontend
    participant Cloudinary
    participant Backend
    participant Model
    participant Firestore
    participant Gemini
    actor Radiologist

    Patient->>Frontend: Upload X-Ray Image
    Frontend->>Cloudinary: Upload to CDN
    Cloudinary-->>Frontend: Image URL
    
    Frontend->>Backend: POST /predict (imageUrl)
    Backend->>Model: Load DenseNet-121 CheXNet
    Model-->>Backend: Model Ready
    
    Backend->>Backend: Preprocess Image
    Backend->>Model: Run Inference
    Model-->>Backend: 14 Disease Probabilities
    
    Backend->>Gemini: Generate Report (predictions + patient info)
    Gemini-->>Backend: Medical Report
    
    Backend->>Firestore: Save Prediction & Report
    Firestore-->>Backend: Saved Successfully
    
    Backend-->>Frontend: Return Results
    Frontend->>Frontend: Display Predictions
    Frontend->>Firestore: Update Patient Record
    
    Radiologist->>Frontend: View Reports
    Frontend->>Firestore: Fetch Patient Reports
    Firestore-->>Frontend: Report Data
    Frontend-->>Radiologist: Display Reports
    
    Radiologist->>Frontend: Verify & Approve Report
    Frontend->>Firestore: Update Report Status
```

## 2. Patient Registration and Role Assignment Workflow

```mermaid
sequenceDiagram
    actor Patient
    participant Frontend
    participant Firebase Auth
    participant Firestore
    actor Admin

    Patient->>Frontend: Click Register
    Frontend->>Firebase Auth: Create Account
    Firebase Auth->>Firebase Auth: Generate Email Verification Link
    Firebase Auth-->>Patient: Send Verification Email
    
    Patient->>Firebase Auth: Click Email Verification Link
    Firebase Auth-->>Frontend: Email Verified
    
    Frontend->>Firebase Auth: Sign In
    Firebase Auth-->>Frontend: JWT Token
    
    Frontend->>Firestore: Create User Document
    Firestore-->>Frontend: User Created (unclaimed)
    
    Admin->>Frontend: Access Patient Management
    Frontend->>Firestore: Fetch All Patients
    Firestore-->>Frontend: Patient List
    
    Admin->>Frontend: Assign Radiologist & Doctor
    Frontend->>Firestore: Update Patient Record
    Firestore-->>Frontend: Assignment Successful
    
    Frontend->>Firestore: Update User Status to 'active'
    Firestore-->>Frontend: Status Updated
    
    Frontend-->>Patient: Account Ready
```

## 3. Report Generation and Review Workflow

```mermaid
sequenceDiagram
    actor Radiologist
    participant Frontend
    participant Firestore
    participant Backend
    participant Gemini
    actor Doctor

    Radiologist->>Frontend: Access Radiologist Dashboard
    Frontend->>Firestore: Fetch Assigned Patients
    Firestore-->>Frontend: Patient List
    
    Radiologist->>Frontend: Select Patient & X-Ray
    Frontend->>Firestore: Fetch X-Ray Data
    Firestore-->>Frontend: X-Ray & Predictions
    
    Radiologist->>Frontend: Request Report Generation
    Frontend->>Backend: POST /generate_report
    Backend->>Gemini: Create Report (predictions, patient history)
    Gemini-->>Backend: Generated Report (Summary, Findings, Impression, Recommendations)
    
    Backend->>Firestore: Save Report
    Firestore-->>Backend: Report Saved
    Backend-->>Frontend: Report Ready
    
    Frontend-->>Radiologist: Display Report
    Radiologist->>Frontend: Add Comments & Verify
    Frontend->>Firestore: Save Radiologist Notes
    Firestore-->>Frontend: Saved
    
    Frontend->>Firestore: Update Report Status to 'verified'
    Firestore-->>Frontend: Status Updated
    
    Frontend->>Firestore: Notify Doctor
    Firestore-->>Frontend: Notification Sent
    
    Doctor->>Frontend: Receive Notification
    Frontend->>Firestore: Fetch Report
    Firestore-->>Frontend: Report Data
    Doctor->>Frontend: View Report & Findings
    Frontend-->>Doctor: Display Report
```

## 4. Real-Time Notification Workflow

```mermaid
sequenceDiagram
    participant Radiologist
    participant Frontend as Frontend (Radiologist)
    participant Firestore as Firestore (Notifications)
    participant Frontend2 as Frontend (Doctor)
    actor Doctor

    Radiologist->>Frontend: Complete & Verify Report
    Frontend->>Firestore: Update Report Status to 'verified'
    
    Firestore->>Firestore: Create Notification Document
    Firestore->>Frontend2: Real-time Update (Listener)
    
    Frontend2->>Frontend2: Display Notification Badge
    Frontend2-->>Doctor: Show Notification: "New Report Available"
    
    Doctor->>Frontend2: Click Notification
    Frontend2->>Firestore: Fetch Report Details
    Firestore-->>Frontend2: Report Data
    Frontend2-->>Doctor: Navigate to Report View
```

## 5. Appointment Management Workflow

```mermaid
sequenceDiagram
    actor Patient
    participant Frontend as Frontend (Patient)
    participant Firestore
    participant Frontend2 as Frontend (Doctor)
    actor Doctor

    Patient->>Frontend: View Appointments
    Frontend->>Firestore: Fetch Patient Appointments
    Firestore-->>Frontend: Appointment List
    
    Patient->>Frontend: Request New Appointment
    Frontend->>Firestore: Create Appointment Request
    Firestore->>Firestore: Trigger Notification
    Firestore-->>Frontend2: Notify Assigned Doctor
    
    Frontend2-->>Doctor: Show Appointment Request
    Doctor->>Frontend2: Accept/Reject Request
    Frontend2->>Firestore: Update Appointment Status
    Firestore->>Firestore: Create Confirmation Notification
    Firestore-->>Frontend: Notify Patient
    
    Frontend-->>Patient: Show Appointment Confirmed
    Patient->>Frontend: View Confirmed Appointment
    Frontend->>Firestore: Fetch Appointment Details
    Firestore-->>Frontend: Appointment Info
```

## 6. Prescription Management Workflow

```mermaid
sequenceDiagram
    actor Doctor
    participant Frontend as Frontend (Doctor)
    participant Firestore
    participant Frontend2 as Frontend (Patient)
    actor Patient

    Doctor->>Frontend: Create Prescription
    Frontend->>Frontend: Fill Prescription Form
    Frontend->>Firestore: Save Prescription
    Firestore->>Firestore: Create Notification
    Firestore-->>Frontend2: Notify Patient
    Firestore-->>Frontend: Confirm Saved
    
    Frontend2-->>Patient: Show Notification: "New Prescription"
    Patient->>Frontend2: View Prescriptions
    Frontend2->>Firestore: Fetch Prescriptions
    Firestore-->>Frontend2: Prescription List
    
    Frontend2-->>Patient: Display Prescription Details
    Patient->>Frontend2: Request Refill
    Frontend2->>Firestore: Create Refill Request
    Firestore->>Firestore: Notify Doctor
    Firestore-->>Frontend: Notify Doctor of Refill Request
    
    Doctor->>Frontend: View Refill Requests
    Frontend->>Firestore: Fetch Requests
    Firestore-->>Frontend: Request Details
    Doctor->>Frontend: Approve Refill
    Frontend->>Firestore: Update Prescription & Create New One
    Firestore-->>Frontend2: Notify Patient
```

## 7. Admin User Management Workflow

```mermaid
sequenceDiagram
    actor Admin
    participant Frontend as Frontend (Admin)
    participant Firestore
    participant Firebase Auth

    Admin->>Frontend: Access User Management
    Frontend->>Firestore: Fetch All Users
    Firestore-->>Frontend: User List
    
    Admin->>Frontend: Create New Doctor Account
    Frontend->>Firebase Auth: Create User (doctor@example.com)
    Firebase Auth->>Firebase Auth: Generate Temporary Password
    Firebase Auth-->>Frontend: User Created
    
    Frontend->>Firestore: Create Doctor Document
    Firestore-->>Frontend: Doctor Profile Created
    
    Admin->>Frontend: Create New Radiologist Account
    Frontend->>Firebase Auth: Create User (radiologist@example.com)
    Firebase Auth-->>Frontend: User Created
    Frontend->>Firestore: Create Radiologist Document
    Firestore-->>Frontend: Radiologist Profile Created
    
    Admin->>Frontend: Assign Radiologist to Patients
    Frontend->>Firestore: Update Multiple Patient Records
    Firestore-->>Frontend: Assignments Complete
    
    Admin->>Frontend: Assign Doctors to Patients
    Frontend->>Firestore: Update Patient Doctor Assignments
    Firestore-->>Frontend: Assignments Complete
```

## 8. Complete Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Firebase Auth
    participant Firestore
    participant Backend

    User->>Frontend: Enter Email & Password
    Frontend->>Firebase Auth: Sign In
    Firebase Auth-->>Frontend: JWT Token + User Info
    
    Frontend->>Firestore: Fetch User Document
    Firestore-->>Frontend: User Data (role, permissions)
    
    Frontend->>Frontend: Check User Role
    
    alt User is Patient
        Frontend->>Frontend: Redirect to /patient-dashboard
    else User is Doctor
        Frontend->>Frontend: Redirect to /doctor-dashboard
    else User is Radiologist
        Frontend->>Frontend: Redirect to /radiologist-dashboard
    else User is Admin
        Frontend->>Frontend: Redirect to /admin-dashboard
    end
    
    Frontend->>Backend: Include JWT in requests
    Backend->>Backend: Verify JWT Token
    Backend-->>Frontend: Process Request
```

## 9. X-Ray Analysis Detail Flow

```mermaid
sequenceDiagram
    participant Frontend as Frontend
    participant Backend as Flask Backend
    participant PyTorch as PyTorch Model
    participant Utils as Image Utils
    participant Gemini as Gemini API
    participant Firestore as Firestore

    Frontend->>Backend: POST /predict {imageUrl, patientId}
    Backend->>Backend: Load Model (lazy if needed)
    Backend->>Backend: Download Image from Cloudinary
    
    Backend->>Utils: Preprocess Image
    Utils->>Utils: Resize to 224x224
    Utils->>Utils: Normalize Pixel Values
    Utils-->>Backend: Preprocessed Tensor
    
    Backend->>PyTorch: Forward Pass
    PyTorch->>PyTorch: 14 Sigmoid Outputs
    PyTorch-->>Backend: Disease Probabilities
    
    Backend->>Backend: Find Top Prediction
    Backend->>Backend: Check no_significant_finding flag
    Backend-->>Frontend: {predictions, conditions_order, no_significant_finding}
    
    Frontend->>Frontend: Display Predictions Table
    Frontend->>Frontend: Show Confidence Scores
    
    Frontend->>Backend: POST /generate_report
    Backend->>Backend: Construct Prompt (predictions + patient context)
    Backend->>Gemini: Generate Report
    Gemini-->>Backend: JSON Report {summary, findings, impression, recommendations}
    
    Backend-->>Frontend: Report Data
    Frontend->>Frontend: Display Report
    
    Frontend->>Firestore: Save Report Document
    Firestore-->>Frontend: Report Saved
```

## 10. Database Schema and CRUD Operations

```mermaid
sequenceDiagram
    participant Frontend
    participant Firestore
    participant SecurityRules as Security Rules

    Frontend->>Frontend: Prepare Data
    
    alt CREATE Operation
        Frontend->>Firestore: doc(collection).set(data)
        Firestore->>SecurityRules: Check write permission
        SecurityRules->>SecurityRules: Verify user.role == 'admin' or creator
        SecurityRules-->>Firestore: Allow/Deny
        Firestore-->>Frontend: Document Created/Rejected
    
    else READ Operation
        Frontend->>Firestore: doc(collection).get()
        Firestore->>SecurityRules: Check read permission
        SecurityRules->>SecurityRules: Verify user can access
        SecurityRules-->>Firestore: Allow/Deny
        Firestore-->>Frontend: Document Data/Rejected
    
    else UPDATE Operation
        Frontend->>Firestore: doc(collection).update(data)
        Firestore->>SecurityRules: Check update permission
        SecurityRules->>SecurityRules: Verify user.id == owner or user.role == 'admin'
        SecurityRules-->>Firestore: Allow/Deny
        Firestore-->>Frontend: Document Updated/Rejected
    
    else DELETE Operation
        Frontend->>Firestore: doc(collection).delete()
        Firestore->>SecurityRules: Check delete permission
        SecurityRules->>SecurityRules: Verify user.role == 'admin'
        SecurityRules-->>Firestore: Allow/Deny
        Firestore-->>Frontend: Document Deleted/Rejected
    end
```

---

## Key Components in Diagrams

### Actors
- **Patient**: End user seeking medical consultation
- **Doctor**: Physician who reviews reports and creates prescriptions
- **Radiologist**: Specialist who analyzes X-rays and verifies reports
- **Admin**: System administrator managing users and assignments

### Systems
- **Frontend (React)**: User interface deployed on Vercel
- **Backend (Flask)**: API server deployed on Render
- **Firebase**: Authentication and real-time database
- **Cloudinary**: Image hosting and CDN
- **PyTorch Model**: DenseNet-121 CheXNet for predictions
- **Gemini API**: LLM for report generation

### Key Flows
1. **Prediction Pipeline**: Image Upload → Preprocessing → Model Inference → Report Generation
2. **Notification System**: Database updates → Real-time listeners → UI notifications
3. **Role-Based Access**: Authentication → Role check → Feature availability
4. **Data Security**: Firebase security rules → Permission validation → CRUD operations

---

## Performance Metrics

| Operation | Duration | Notes |
|-----------|----------|-------|
| Image Upload | 2-3s | Cloudinary upload |
| Model Load | 10-20s | First request only (lazy loading) |
| Model Inference | <100ms | Per image prediction |
| Report Generation | 3-5s | Gemini API call |
| Database Query | <100ms | Firestore indexed query |
| **Total End-to-End** | **7-8s** | After model load |

