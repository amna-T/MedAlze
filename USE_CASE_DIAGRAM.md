# MedAlze Use Case Diagram

## 4.3.3 Use Case Diagram

The use case diagram illustrates the interactions between actors (Radiologist, Doctor, Patient, Admin) and the system's functional modules:

### Actors and Their Use Cases

| Actor | Use Cases |
|-------|-----------|
| **Radiologist** | Upload X-ray, View AI Prediction, Generate Report, Review Findings, Assign Doctor |
| **Doctor** | View Patient X-rays, Review AI Predictions, Consult Patient Reports, Approve/Comment on Reports |
| **Patient** | Register/Login, View Personal X-ray History, Receive Notifications, Download Reports |
| **Admin** | Manage Users, View System Analytics, Approve Radiologists, Monitor Reports |

---

## Use Case Diagram (ASCII Representation)

```
                          ┌─────────────────────────────────────────────────────┐
                          │          MedAlze Medical Imaging System            │
                          └─────────────────────────────────────────────────────┘

    ┌──────────────┐                                                    ┌──────────────┐
    │ Radiologist  │◄───────────────────────────────────────────────────►│   Doctor     │
    └──────────────┘                                                    └──────────────┘
           │                                                                    │
           ├─────────────────┬──────────────────────┬─────────────────┐        │
           │                 │                      │                 │        │
           │                 │                      │                 │        │
           ▼                 ▼                      ▼                 ▼        ▼
    ┌─────────────┐   ┌──────────────┐      ┌─────────────────┐  ┌──────────────┐
    │ Upload X-ray│   │View AI        │      │ Generate Report │  │View Patient  │
    │             │   │Prediction     │      │                 │  │X-rays        │
    └─────────────┘   └──────────────┘      └─────────────────┘  └──────────────┘
           │                 │                      │                  │
           │                 │                      │                  │
           ▼                 ▼                      ▼                  ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                      Chest X-Ray Analysis Engine                        │
    │  ┌──────────────────────────────────────────────────────────────────┐   │
    │  │  • DenseNet-121 AI Model                                         │   │
    │  │  • 14 Condition Detection (Pneumonia, Nodule, etc.)             │   │
    │  │  • Confidence Score Calculation                                 │   │
    │  └──────────────────────────────────────────────────────────────────┘   │
    └─────────────────────────────────────────────────────────────────────────┘
           │                                              │
           ▼                                              ▼
    ┌────────────────────┐                      ┌──────────────────────┐
    │ Gemini AI Report   │◄────────────────────►│ Database (Firebase)  │
    │ Generation Engine  │                      │ • Patient Data       │
    └────────────────────┘                      │ • X-ray Records      │
           │                                    │ • Report History     │
           │                                    └──────────────────────┘
           │
           ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │          Report with Findings, Impression, Recommendations     │
    └─────────────────────────────────────────────────────────────────┘
           │
           ├──────────────────────┬──────────────────────┐
           │                      │                      │
           ▼                      ▼                      ▼
    ┌──────────────┐      ┌───────────────┐       ┌──────────────┐
    │Doctor Reviews│      │Patient Receives│      │Notifications │
    │& Approves    │      │Report          │      │System        │
    └──────────────┘      └───────────────┘       └──────────────┘

    ┌──────────────┐
    │    Admin     │
    └──────────────┘
           │
           ├──────┬──────┬─────────────┐
           │      │      │             │
           ▼      ▼      ▼             ▼
    ┌────────┐┌────────┐┌──────────┐┌──────────┐
    │Manage  ││Monitor ││Dashboard ││Analytics │
    │Users   ││Reports ││Systems   ││Reports   │
    └────────┘└────────┘└──────────┘└──────────┘
```

---

## Detailed Use Case Descriptions

### 1. **Radiologist Use Cases**

#### 1.1 Upload X-ray
- **Actor**: Radiologist
- **Precondition**: Radiologist is authenticated and has access to upload page
- **Main Flow**:
  1. Radiologist selects a chest X-ray image (PNG, JPG, JPEG, GIF)
  2. Associates X-ray with patient (existing or new)
  3. Uploads image to system
  4. System stores X-ray in Cloudinary
  5. X-ray record created in Firestore database
- **Postcondition**: X-ray stored and ready for AI analysis

#### 1.2 View AI Prediction
- **Actor**: Radiologist
- **Precondition**: X-ray has been uploaded and analyzed
- **Main Flow**:
  1. System runs DenseNet-121 model on X-ray
  2. AI detects 14 chest conditions with confidence scores
  3. Results displayed: Primary condition + all predictions
  4. Confidence levels shown as percentages
  5. Findings ranked by probability
- **Postcondition**: Radiologist reviews AI confidence and accuracy

#### 1.3 Generate Report
- **Actor**: Radiologist
- **Precondition**: AI prediction complete and radiologist ready to generate report
- **Main Flow**:
  1. System sends prediction data + patient info to Gemini AI
  2. Gemini generates comprehensive medical report including:
     - Summary of findings
     - Key findings specific to detected condition
     - Impression and clinical assessment
     - Recommendations for follow-up
  3. Report formatted in professional medical style
  4. Report displayed for radiologist review
  5. Radiologist can approve or request modifications
- **Postcondition**: Report generated and ready for doctor review

#### 1.4 Assign Doctor
- **Actor**: Radiologist
- **Precondition**: X-ray processed and report generated
- **Main Flow**:
  1. Radiologist selects appropriate doctor from list
  2. Assigns doctor to review the X-ray and report
  3. Doctor receives notification of assignment
  4. System creates assignment record in database
- **Postcondition**: Doctor assigned and notified

---

### 2. **Doctor Use Cases**

#### 2.1 View Patient X-rays
- **Actor**: Doctor
- **Precondition**: Doctor logged in and has assigned patients
- **Main Flow**:
  1. Doctor accesses patient dashboard
  2. Views list of all X-rays for their patients
  3. Can filter by date, patient, or condition
  4. Selects X-ray to view detailed information
- **Postcondition**: Doctor views X-ray details and metadata

#### 2.2 Review AI Predictions
- **Actor**: Doctor
- **Precondition**: X-ray has AI predictions available
- **Main Flow**:
  1. Doctor views AI predictions and confidence scores
  2. Reviews all 14 condition predictions
  3. Compares AI assessment with clinical expertise
  4. Can view radiologist's comments and findings
- **Postcondition**: Doctor understands AI's assessment

#### 2.3 Consult Patient Reports
- **Actor**: Doctor
- **Precondition**: Report generated by radiologist
- **Main Flow**:
  1. Doctor accesses generated medical report
  2. Reviews radiologist's assessment and Gemini-generated content
  3. Reads clinical recommendations
  4. Makes clinical decisions based on report
- **Postcondition**: Doctor makes informed clinical decisions

#### 2.4 Approve/Comment on Reports
- **Actor**: Doctor
- **Precondition**: Report available for review
- **Main Flow**:
  1. Doctor reviews complete report
  2. Can add clinical comments or notes
  3. Approves report as clinically accurate
  4. Or requests modifications from radiologist
  5. Report status updated in system
- **Postcondition**: Report approved and moved to final status

---

### 3. **Patient Use Cases**

#### 3.1 Register/Login
- **Actor**: Patient
- **Precondition**: Patient is new or returning user
- **Main Flow**:
  1. New patient: Complete registration with email, password, medical info
  2. Returning patient: Login with credentials
  3. Email verification required
  4. Complete medical profile (age, gender, clinical history)
- **Postcondition**: Patient authenticated and profile accessible

#### 3.2 View Personal X-ray History
- **Actor**: Patient
- **Precondition**: Patient logged in and has X-rays on file
- **Main Flow**:
  1. Patient accesses "My X-rays" section
  2. Views chronological list of all uploaded X-rays
  3. Can filter by date or viewing status
  4. Selects X-ray to view:
     - Upload date
     - Radiologist assigned
     - Analysis results
     - Generated report (if approved)
- **Postcondition**: Patient informed of their medical history

#### 3.3 Receive Notifications
- **Actor**: Patient
- **Precondition**: X-ray assigned to doctor or report ready
- **Main Flow**:
  1. System detects status changes
  2. Generates notification:
     - "Your X-ray has been assigned to Dr. [Name]"
     - "Your report is ready for viewing"
     - "Doctor has reviewed your results"
  3. Patient receives in-app notification
  4. Optional: Email notification sent
- **Postcondition**: Patient stays informed of progress

#### 3.4 Download Reports
- **Actor**: Patient
- **Precondition**: Report approved and available
- **Main Flow**:
  1. Patient navigates to report section
  2. Selects report to download
  3. System generates PDF with:
     - Patient information
     - X-ray images
     - AI predictions
     - Radiologist assessment
     - Doctor recommendations
  4. PDF downloaded to patient device
- **Postcondition**: Patient has personal copy of report

---

### 4. **Admin Use Cases**

#### 4.1 Manage Users
- **Actor**: Admin
- **Precondition**: Admin logged in
- **Main Flow**:
  1. View all users (Radiologists, Doctors, Patients)
  2. Approve new radiologist registrations
  3. Manage user permissions and roles
  4. Deactivate/Activate accounts
  5. Reset passwords if needed
- **Postcondition**: User management complete

#### 4.2 Monitor Reports
- **Actor**: Admin
- **Precondition**: Admin dashboard accessible
- **Main Flow**:
  1. View all reports generated in system
  2. Track report status: Pending → In Review → Approved → Archived
  3. Monitor report generation times
  4. Flag any issues or bottlenecks
- **Postcondition**: Admin oversight maintained

#### 4.3 Dashboard & Analytics
- **Actor**: Admin
- **Precondition**: Admin logged in
- **Main Flow**:
  1. View system-wide analytics:
     - Total X-rays processed
     - Number of active users by role
     - Average report generation time
     - Most common detected conditions
     - System performance metrics
  2. Generate custom reports
  3. Export data for analysis
- **Postcondition**: Data-driven insights available

---

## System Interactions & Data Flow

### X-ray Upload & Analysis Flow
```
1. Radiologist uploads X-ray
   ↓
2. Image stored in Cloudinary (secure cloud storage)
   ↓
3. Record created in Firestore with metadata
   ↓
4. DenseNet-121 AI model processes image
   ↓
5. AI generates predictions (14 conditions + confidence scores)
   ↓
6. Predictions displayed to radiologist
   ↓
7. Radiologist initiates report generation
   ↓
8. Gemini AI creates detailed medical report
   ↓
9. Report displayed for radiologist review/approval
   ↓
10. Doctor assigned to case
    ↓
11. Doctor reviews X-ray, predictions, and report
    ↓
12. Doctor approves or requests modifications
    ↓
13. Final approved report available to patient
    ↓
14. Patient receives notification and can download
```

---

## Technology Stack Integration

| Component | Technology | Use Case |
|-----------|-----------|----------|
| Frontend | React/TypeScript (Vite) | User interfaces for all actors |
| Backend | Python Flask | API endpoints, model inference |
| AI Model | DenseNet-121 (PyTorch) | X-ray analysis & predictions |
| Report Generation | Google Gemini AI | Medical report creation |
| Database | Firebase/Firestore | User data, X-ray records, reports |
| Storage | Cloudinary | X-ray image storage |
| Deployment | Render, Vercel | Production hosting |
| Authentication | Firebase Auth | User login & verification |

---

## Functional Requirements Mapping

✅ **All use cases support the following functional requirements:**

1. ✓ Users can register and authenticate
2. ✓ Radiologists can upload and analyze X-rays
3. ✓ AI provides automated predictions with confidence scores
4. ✓ Medical reports are generated using AI
5. ✓ Doctors can review and approve reports
6. ✓ Patients can view their medical records
7. ✓ System sends notifications for status updates
8. ✓ Admin has full system visibility and control
9. ✓ Data is securely stored and accessible
10. ✓ Role-based access control is enforced

---

## Non-Functional Requirements Support

| Requirement | Implementation |
|------------|-----------------|
| **Security** | Firebase Auth, HTTPS, encrypted data storage |
| **Performance** | Optimized DenseNet model, lazy loading, caching |
| **Scalability** | Serverless architecture (Firebase), scalable hosting |
| **Availability** | 99.9% uptime (Render, Vercel), redundant systems |
| **Usability** | Intuitive UI, role-specific dashboards, mobile-responsive |
| **Maintainability** | Clean code, API documentation, comprehensive logging |

---

## Summary

This use case diagram demonstrates that **MedAlze successfully addresses all stakeholder needs**:
- **Radiologists** can efficiently analyze X-rays with AI assistance
- **Doctors** can make informed clinical decisions with comprehensive reports
- **Patients** have access to their medical records and stay informed
- **Admins** maintain system integrity and monitor performance

The system integrates cutting-edge AI technology with a user-centric design to improve diagnostic accuracy and streamline medical workflows.
