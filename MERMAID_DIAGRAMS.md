# MedAlze Use Case Diagram - Mermaid Code

## 1. Main Use Case Diagram (Recommended)

```mermaid
graph TB
    subgraph Actors["👥 Actors"]
        Radiologist["🏥 Radiologist"]
        Doctor["👨‍⚕️ Doctor"]
        Patient["👤 Patient"]
        Admin["⚙️ Admin"]
    end
    
    subgraph UseCases["📋 Use Cases"]
        UC1["Upload X-ray"]
        UC2["View AI Prediction"]
        UC3["Generate Report"]
        UC4["Assign Doctor"]
        UC5["View Patient X-rays"]
        UC6["Review Predictions"]
        UC7["Approve/Comment Report"]
        UC8["Register/Login"]
        UC9["View X-ray History"]
        UC10["Receive Notifications"]
        UC11["Download Reports"]
        UC12["Manage Users"]
        UC13["Monitor Reports"]
        UC14["View Analytics"]
    end
    
    subgraph System["🔧 System Components"]
        API["Flask API Backend"]
        AI["DenseNet-121 Model"]
        Gemini["Gemini AI Engine"]
        DB["Firebase Database"]
        Storage["Cloudinary Storage"]
    end
    
    Radiologist --> UC1
    Radiologist --> UC2
    Radiologist --> UC3
    Radiologist --> UC4
    
    Doctor --> UC5
    Doctor --> UC6
    Doctor --> UC7
    
    Patient --> UC8
    Patient --> UC9
    Patient --> UC10
    Patient --> UC11
    
    Admin --> UC12
    Admin --> UC13
    Admin --> UC14
    
    UC1 --> Storage
    UC2 --> AI
    UC3 --> Gemini
    UC4 --> DB
    UC5 --> DB
    UC6 --> AI
    UC7 --> DB
    UC8 --> DB
    UC9 --> DB
    UC10 --> DB
    UC11 --> DB
    UC12 --> DB
    UC13 --> DB
    UC14 --> DB
```

---

## 2. Radiologist Use Cases (Detailed)

```mermaid
usecase diagram
    actor Radiologist as R
    
    package "X-ray Management" {
        usecase "Upload X-ray" as UC1
        usecase "Select Patient" as UC1a
        usecase "Associate Metadata" as UC1b
    }
    
    package "AI Analysis" {
        usecase "View AI Prediction" as UC2
        usecase "View Confidence Scores" as UC2a
        usecase "View All Conditions" as UC2b
    }
    
    package "Report Generation" {
        usecase "Generate Report" as UC3
        usecase "Review Generated Report" as UC3a
        usecase "Approve Report" as UC3b
    }
    
    package "Case Management" {
        usecase "Assign Doctor" as UC4
        usecase "Add Comments" as UC4a
    }
    
    R --> UC1
    UC1 --> UC1a
    UC1 --> UC1b
    
    R --> UC2
    UC2 --> UC2a
    UC2 --> UC2b
    
    R --> UC3
    UC3 --> UC3a
    UC3 --> UC3b
    
    R --> UC4
    UC4 --> UC4a
```

---

## 3. Doctor Use Cases (Detailed)

```mermaid
usecase diagram
    actor Doctor as D
    
    package "Case Review" {
        usecase "View Patient X-rays" as UC1
        usecase "Access X-ray List" as UC1a
        usecase "Filter by Date/Condition" as UC1b
    }
    
    package "AI Analysis Review" {
        usecase "Review Predictions" as UC2
        usecase "Check Confidence Scores" as UC2a
        usecase "Compare with Clinical Expertise" as UC2b
    }
    
    package "Report Review" {
        usecase "Consult Patient Reports" as UC3
        usecase "Read Medical Assessment" as UC3a
        usecase "Review Recommendations" as UC3b
    }
    
    package "Report Approval" {
        usecase "Approve/Comment" as UC4
        usecase "Add Clinical Notes" as UC4a
        usecase "Request Modifications" as UC4b
    }
    
    D --> UC1
    UC1 --> UC1a
    UC1 --> UC1b
    
    D --> UC2
    UC2 --> UC2a
    UC2 --> UC2b
    
    D --> UC3
    UC3 --> UC3a
    UC3 --> UC3b
    
    D --> UC4
    UC4 --> UC4a
    UC4 --> UC4b
```

---

## 4. Patient Use Cases (Detailed)

```mermaid
usecase diagram
    actor Patient as P
    
    package "Authentication" {
        usecase "Register Account" as UC1
        usecase "Complete Profile" as UC1a
        usecase "Verify Email" as UC1b
        usecase "Login" as UC2
    }
    
    package "Medical Records" {
        usecase "View X-ray History" as UC3
        usecase "Filter X-rays" as UC3a
        usecase "View X-ray Details" as UC3b
    }
    
    package "Notifications" {
        usecase "Receive Status Updates" as UC4
        usecase "X-ray Assigned Notification" as UC4a
        usecase "Report Ready Notification" as UC4b
    }
    
    package "Report Access" {
        usecase "Download Reports" as UC5
        usecase "View Report Content" as UC5a
        usecase "Share Reports" as UC5b
    }
    
    P --> UC1
    UC1 --> UC1a
    UC1 --> UC1b
    
    P --> UC2
    
    P --> UC3
    UC3 --> UC3a
    UC3 --> UC3b
    
    P --> UC4
    UC4 --> UC4a
    UC4 --> UC4b
    
    P --> UC5
    UC5 --> UC5a
    UC5 --> UC5b
```

---

## 5. Admin Use Cases (Detailed)

```mermaid
usecase diagram
    actor Admin as A
    
    package "User Management" {
        usecase "Manage Users" as UC1
        usecase "View All Users" as UC1a
        usecase "Approve Radiologists" as UC1b
        usecase "Manage Permissions" as UC1c
    }
    
    package "System Monitoring" {
        usecase "Monitor Reports" as UC2
        usecase "Track Report Status" as UC2a
        usecase "Monitor Performance" as UC2b
    }
    
    package "Analytics & Reporting" {
        usecase "View Dashboard" as UC3
        usecase "System Statistics" as UC3a
        usecase "Generate Reports" as UC3b
    }
    
    A --> UC1
    UC1 --> UC1a
    UC1 --> UC1b
    UC1 --> UC1c
    
    A --> UC2
    UC2 --> UC2a
    UC2 --> UC2b
    
    A --> UC3
    UC3 --> UC3a
    UC3 --> UC3b
```

---

## 6. System Data Flow (Sequence)

```mermaid
sequenceDiagram
    actor R as Radiologist
    participant Frontend as Web Frontend
    participant API as Flask API
    participant AI as DenseNet Model
    participant Gemini as Gemini AI
    participant DB as Firebase DB
    participant Cloud as Cloudinary
    actor D as Doctor
    actor P as Patient

    R->>Frontend: Upload X-ray
    Frontend->>Cloud: Store Image
    Cloud-->>Frontend: Image URL
    
    Frontend->>API: POST /predict
    API->>AI: Run DenseNet-121
    AI-->>API: Predictions + Confidence
    API->>DB: Save Results
    DB-->>API: Confirmed
    API-->>Frontend: Display Predictions
    
    R->>Frontend: Generate Report
    Frontend->>API: POST /generate_report
    API->>Gemini: Send Analysis Data
    Gemini-->>API: Generated Report
    API->>DB: Store Report
    DB-->>API: Confirmed
    API-->>Frontend: Display Report
    
    R->>Frontend: Assign Doctor
    Frontend->>DB: Create Assignment
    DB-->>D: Notification Sent
    
    D->>Frontend: View Case
    Frontend->>DB: Fetch Data
    DB-->>Frontend: X-ray + Report
    D->>Frontend: Approve Report
    Frontend->>DB: Update Status
    
    DB-->>P: Notification Sent
    P->>Frontend: Login
    Frontend->>DB: Fetch Patient Data
    DB-->>Frontend: X-rays + Reports
    P->>Frontend: Download Report
```

---

## 7. Complete System Architecture with Use Cases

```mermaid
graph TB
    subgraph Users["👥 Users"]
        Radiologist["🏥 Radiologist<br/>Upload & Analyze"]
        Doctor["👨‍⚕️ Doctor<br/>Review & Approve"]
        Patient["👤 Patient<br/>View & Download"]
        Admin["⚙️ Admin<br/>Manage System"]
    end
    
    subgraph Frontend["🎨 Frontend Layer"]
        RUI["Radiologist UI<br/>Upload, Analyze, Report"]
        DUI["Doctor Dashboard<br/>Review Cases"]
        PUI["Patient Portal<br/>Medical Records"]
        AUI["Admin Panel<br/>System Control"]
    end
    
    subgraph Backend["🔧 Backend Layer"]
        Auth["Authentication<br/>Firebase Auth"]
        API["REST API<br/>Flask/Python"]
        Queue["Task Queue<br/>Background Jobs"]
    end
    
    subgraph Processing["🧠 AI Processing"]
        DenseNet["DenseNet-121 Model<br/>X-ray Classification"]
        Gemini["Gemini AI Engine<br/>Report Generation"]
        Preprocess["Image Preprocessing<br/>Normalization"]
    end
    
    subgraph Storage["💾 Data Storage"]
        Firebase["Firebase<br/>User Data & Records"]
        Cloudinary["Cloudinary<br/>Image Storage"]
    end
    
    subgraph Deployment["🚀 Deployment"]
        Render["Render<br/>Backend Hosting"]
        Vercel["Vercel<br/>Frontend Hosting"]
    end
    
    Radiologist -->|Use| RUI
    Doctor -->|Use| DUI
    Patient -->|Use| PUI
    Admin -->|Use| AUI
    
    RUI -->|API Call| API
    DUI -->|API Call| API
    PUI -->|API Call| API
    AUI -->|API Call| API
    
    API -->|Authenticate| Auth
    API -->|Process| DenseNet
    API -->|Preprocess| Preprocess
    API -->|Generate| Gemini
    API -->|Queue Task| Queue
    
    API -->|Read/Write| Firebase
    API -->|Upload| Cloudinary
    
    Render -->|Host| API
    Vercel -->|Host| Frontend
    
    RUI -.->|Access| Vercel
    DUI -.->|Access| Vercel
    PUI -.->|Access| Vercel
    AUI -.->|Access| Vercel
    
    style Radiologist fill:#e1f5ff
    style Doctor fill:#f3e5f5
    style Patient fill:#e8f5e9
    style Admin fill:#fff3e0
```

---

## 8. State Diagram - X-ray Processing Workflow

```mermaid
stateDiagram-v2
    [*] --> Uploaded: Radiologist Uploads

    Uploaded --> Analyzing: Start AI Analysis
    Analyzing --> PredictionReady: DenseNet Process Complete
    
    PredictionReady --> ReportGeneration: Radiologist Initiates Report
    ReportGeneration --> ReportReady: Gemini Generates Report
    
    ReportReady --> DoctorAssignment: Radiologist Assigns Doctor
    DoctorAssignment --> UnderReview: Doctor Reviews Case
    
    UnderReview --> Approved: Doctor Approves
    UnderReview --> RequestModified: Radiologist Requested Changes
    
    RequestModified --> Analyzing: Radiologist Re-analyzes
    
    Approved --> Finalized: Report Finalized
    Finalized --> PatientAccess: Patient Notified & Can Access
    
    PatientAccess --> Downloaded: Patient Downloads
    Downloaded --> Archived: Report Archived
    
    Archived --> [*]: End of Workflow
    
    style Uploaded fill:#bbdefb
    style Analyzing fill:#c5cae9
    style PredictionReady fill:#b2dfdb
    style ReportGeneration fill:#fff9c4
    style ReportReady fill:#ffccbc
    style DoctorAssignment fill:#f8bbd0
    style UnderReview fill:#d1c4e9
    style Approved fill:#c8e6c9
    style Finalized fill:#a5d6a7
    style PatientAccess fill:#81c784
    style Downloaded fill:#4caf50
    style Archived fill:#757575
```

---

## 9. Entity Relationship for Use Cases

```mermaid
erDiagram
    RADIOLOGIST ||--o{ XRAY : uploads
    RADIOLOGIST ||--o{ REPORT : generates
    RADIOLOGIST ||--o{ DOCTOR_ASSIGNMENT : creates
    
    DOCTOR ||--o{ DOCTOR_ASSIGNMENT : accepts
    DOCTOR ||--o{ REPORT : approves
    DOCTOR ||--o{ PATIENT : treats
    
    PATIENT ||--o{ XRAY : owns
    PATIENT ||--o{ REPORT : receives
    PATIENT ||--o{ NOTIFICATION : receives
    
    XRAY ||--o{ AI_PREDICTION : has
    XRAY ||--o{ REPORT : results_in
    
    AI_PREDICTION {
        string condition_name
        float confidence_score
        int rank
    }
    
    REPORT {
        string summary
        string findings
        string impression
        string recommendations
        datetime created_at
        string status
    }
    
    NOTIFICATION {
        string message
        datetime created_at
        boolean read
        string type
    }
```

---

## 10. How to Use These Mermaid Diagrams

### In Markdown:
```markdown
\`\`\`mermaid
[Paste the diagram code here]
\`\`\`
```

### In GitHub:
- Copy the diagram code into your README.md or documentation files
- GitHub will automatically render Mermaid diagrams

### In Other Platforms:
- **Notion**: Use Mermaid embed
- **Obsidian**: Use Mermaid plugin
- **Confluence**: Use Mermaid macro
- **GitLab**: Supported natively
- **Draw.io**: Import Mermaid code
- **Mermaid Live Editor**: https://mermaid.live (paste code to preview)

---

## Summary

You now have **10 comprehensive Mermaid diagrams**:

1. ✅ **Main Use Case Diagram** - Complete system overview
2. ✅ **Radiologist Detailed** - Specific use cases
3. ✅ **Doctor Detailed** - Specific use cases  
4. ✅ **Patient Detailed** - Specific use cases
5. ✅ **Admin Detailed** - Specific use cases
6. ✅ **Sequence Diagram** - Data flow between components
7. ✅ **System Architecture** - Complete tech stack integration
8. ✅ **State Diagram** - X-ray processing workflow
9. ✅ **Entity Relationship** - Database relationships
10. ✅ **Implementation Guide** - How to embed them

**Choose the one that best fits your documentation needs!** 🎯
