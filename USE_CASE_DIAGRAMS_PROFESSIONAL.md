# MedAlze Professional Use Case Diagrams

## 1. Main System Use Case Diagram

```mermaid
graph TB
    subgraph System["🏥 MedAlze System"]
        UC1["Upload X-ray Image"]
        UC2["View AI Predictions"]
        UC3["Generate Medical Report"]
        UC4["Review & Approve Report"]
        UC5["Assign to Doctor"]
        UC6["Download Report"]
        UC7["Manage Users"]
        UC8["View Analytics"]
    end
    
    subgraph Actors["👥 Actors"]
        R["🔬 Radiologist"]
        D["👨‍⚕️ Doctor"]
        P["🧑‍⚕️ Patient"]
        A["👨‍💼 Admin"]
    end
    
    R -->|Uses| UC1
    R -->|Uses| UC2
    R -->|Uses| UC3
    R -->|Uses| UC5
    
    D -->|Uses| UC4
    D -->|Uses| UC2
    
    P -->|Uses| UC6
    
    A -->|Uses| UC7
    A -->|Uses| UC8
```

---

## 2. Radiologist Workflow Use Cases

```mermaid
graph TB
    subgraph Radiologist_System["Radiologist Dashboard"]
        R_UC1["📤 Upload X-ray"]
        R_UC2["🤖 View AI Analysis"]
        R_UC3["📝 Generate Report"]
        R_UC4["✅ Assign Doctor"]
        R_UC5["📊 View History"]
    end
    
    Radiologist["🔬 Radiologist"]
    AI["🤖 AI Engine"]
    DB["💾 Database"]
    
    Radiologist -->|Uploads| R_UC1
    R_UC1 -->|Triggers| AI
    AI -->|Returns| R_UC2
    Radiologist -->|Initiates| R_UC3
    R_UC3 -->|Stores| DB
    Radiologist -->|Selects| R_UC4
    Radiologist -->|Queries| R_UC5
```

---

## 3. Doctor Review Workflow

```mermaid
graph TB
    subgraph Doctor_System["Doctor Dashboard"]
        D_UC1["📥 Receive Case"]
        D_UC2["👁️ View X-ray"]
        D_UC3["📋 Review Report"]
        D_UC4["✏️ Add Notes"]
        D_UC5["👍 Approve"]
        D_UC6["🔔 Notify Patient"]
    end
    
    Doctor["👨‍⚕️ Doctor"]
    System["MedAlze System"]
    Patient["🧑‍⚕️ Patient"]
    
    System -->|Assigns Case| Doctor
    Doctor -->|Reviews| D_UC1
    Doctor -->|Views| D_UC2
    Doctor -->|Reads| D_UC3
    Doctor -->|Adds| D_UC4
    Doctor -->|Submits| D_UC5
    D_UC6 -->|Notifies| Patient
```

---

## 4. Patient Portal Use Cases

```mermaid
graph TB
    subgraph Patient_System["Patient Portal"]
        P_UC1["🔐 Login/Register"]
        P_UC2["📚 View X-ray History"]
        P_UC3["📄 View Reports"]
        P_UC4["⬇️ Download PDF"]
        P_UC5["🔔 Get Notifications"]
        P_UC6["👤 View Profile"]
    end
    
    Patient["🧑‍⚕️ Patient"]
    
    Patient -->|Accesses| P_UC1
    Patient -->|Browses| P_UC2
    Patient -->|Reads| P_UC3
    Patient -->|Downloads| P_UC4
    Patient -->|Receives| P_UC5
    Patient -->|Manages| P_UC6
```

---

## 5. Admin Management Use Cases

```mermaid
graph TB
    subgraph Admin_System["Admin Control Panel"]
        A_UC1["👥 Manage Users"]
        A_UC2["🔍 Monitor Reports"]
        A_UC3["📊 View Analytics"]
        A_UC4["⚙️ System Settings"]
        A_UC5["📥 Import Data"]
        A_UC6["📤 Export Reports"]
    end
    
    Admin["👨‍💼 Admin"]
    System["MedAlze System"]
    
    Admin -->|Manages| A_UC1
    Admin -->|Monitors| A_UC2
    Admin -->|Analyzes| A_UC3
    Admin -->|Configures| A_UC4
    Admin -->|Imports| A_UC5
    Admin -->|Exports| A_UC6
```

---

## 6. Complete System Architecture with Use Cases

```mermaid
graph TB
    subgraph Users["👥 Users & Actors"]
        R["🔬 Radiologist"]
        D["👨‍⚕️ Doctor"]
        P["🧑‍⚕️ Patient"]
        A["👨‍💼 Admin"]
    end
    
    subgraph Frontend["🎨 Frontend Layer<br/>Vercel"]
        R_UI["Radiologist UI"]
        D_UI["Doctor Dashboard"]
        P_UI["Patient Portal"]
        A_UI["Admin Panel"]
    end
    
    subgraph Backend["⚙️ Backend Layer<br/>Render"]
        API["REST API"]
        AUTH["Authentication"]
        MODEL["AI Model<br/>DenseNet-121"]
        GEMINI["Gemini AI<br/>Report Gen"]
    end
    
    subgraph Data["💾 Data Layer"]
        DB["Firebase<br/>Firestore"]
        STORAGE["Cloudinary<br/>Image Storage"]
    end
    
    subgraph External["🔗 External Services"]
        FIREBASE["Firebase Auth"]
        GEMINI_API["Google Gemini<br/>API"]
    end
    
    R --> R_UI
    D --> D_UI
    P --> P_UI
    A --> A_UI
    
    R_UI --> API
    D_UI --> API
    P_UI --> API
    A_UI --> API
    
    API --> AUTH
    API --> MODEL
    API --> GEMINI
    API --> DB
    API --> STORAGE
    
    AUTH --> FIREBASE
    GEMINI --> GEMINI_API
    DB --> FIREBASE
    STORAGE --> FIREBASE
```

---

## 7. X-ray Processing Pipeline (Use Case Flow)

```mermaid
graph LR
    A["📤 Upload X-ray<br/>Radiologist"] 
    --> B["☁️ Store in Cloud<br/>Cloudinary"]
    --> C["🔄 Preprocess<br/>Image Prep"]
    --> D["🤖 Run AI Model<br/>DenseNet-121"]
    --> E["📊 Get Predictions<br/>14 Conditions"]
    --> F["🧠 Generate Report<br/>Gemini AI"]
    --> G["✏️ Review Report<br/>Radiologist"]
    --> H["✅ Assign Doctor<br/>Doctor Queue"]
    --> I["👁️ Doctor Reviews<br/>Doctor Dashboard"]
    --> J["✍️ Approve/Comment<br/>Doctor"]
    --> K["🔔 Notify Patient<br/>Notifications"]
    --> L["📥 Patient Access<br/>Patient Portal"]
    --> M["⬇️ Download PDF<br/>Patient"]
```

---

## 8. Use Case: Upload & Analyze X-ray

```mermaid
graph TB
    subgraph Upload_UC["Upload & Analyze X-ray"]
        step1["1️⃣ Select X-ray File"]
        step2["2️⃣ Choose Patient"]
        step3["3️⃣ Confirm Upload"]
        step4["4️⃣ Upload to Cloud"]
        step5["5️⃣ Trigger AI Analysis"]
        step6["6️⃣ Run DenseNet Model"]
        step7["7️⃣ Get Predictions"]
        step8["8️⃣ Display Results"]
    end
    
    Radiologist["🔬 Radiologist"]
    System["MedAlze System"]
    AI["🤖 AI Engine"]
    
    Radiologist -->|Initiates| step1
    step1 --> step2
    step2 --> step3
    step3 -->|Sends| System
    System --> step4
    step4 --> step5
    step5 -->|Calls| AI
    AI --> step6
    step6 --> step7
    step7 -->|Returns| step8
    step8 -->|Shows| Radiologist
```

---

## 9. Use Case: Generate Medical Report

```mermaid
graph TB
    subgraph Report_UC["Generate Medical Report"]
        R_step1["1️⃣ Review Predictions"]
        R_step2["2️⃣ Click Generate"]
        R_step3["3️⃣ Prepare Data"]
        R_step4["4️⃣ Send to Gemini"]
        R_step5["5️⃣ AI Writes Report"]
        R_step6["6️⃣ Format Report"]
        R_step7["7️⃣ Display to User"]
        R_step8["8️⃣ Approve/Edit"]
        R_step9["9️⃣ Save Report"]
    end
    
    Radiologist["🔬 Radiologist"]
    Gemini["🧠 Gemini AI"]
    DB["💾 Database"]
    
    Radiologist --> R_step1
    R_step1 --> R_step2
    R_step2 --> R_step3
    R_step3 --> R_step4
    R_step4 -->|API Call| Gemini
    Gemini --> R_step5
    R_step5 --> R_step6
    R_step6 --> R_step7
    R_step7 --> R_step8
    R_step8 --> R_step9
    R_step9 -->|Stores| DB
```

---

## 10. Use Case: Doctor Approval Workflow

```mermaid
graph TB
    subgraph Approval_UC["Doctor Review & Approval"]
        A_step1["1️⃣ Receive Notification"]
        A_step2["2️⃣ Open Case"]
        A_step3["3️⃣ View X-ray Image"]
        A_step4["4️⃣ Review AI Predictions"]
        A_step5["5️⃣ Read Report"]
        A_step6["6️⃣ Add Clinical Notes"]
        A_step7["7️⃣ Verify Findings"]
        A_step8["8️⃣ Approve Report"]
        A_step9["9️⃣ Update Status"]
        A_step10["🔟 Notify Patient"]
    end
    
    Doctor["👨‍⚕️ Doctor"]
    System["MedAlze System"]
    Patient["🧑‍⚕️ Patient"]
    
    System -->|Notifies| Doctor
    Doctor --> A_step1
    A_step1 --> A_step2
    A_step2 --> A_step3
    A_step3 --> A_step4
    A_step4 --> A_step5
    A_step5 --> A_step6
    A_step6 --> A_step7
    A_step7 --> A_step8
    A_step8 --> A_step9
    A_step9 -->|Informs| Patient
```

---

## 11. Authentication & Authorization Use Cases

```mermaid
graph TB
    subgraph Auth_UC["Authentication & Authorization"]
        Auth1["🔐 User Login"]
        Auth2["✓ Verify Credentials"]
        Auth3["🔍 Check User Role"]
        Auth4["📍 Route to Dashboard"]
        Auth5["🛡️ Set Permissions"]
        Auth6["⏱️ Create Session"]
        Auth7["✅ Grant Access"]
    end
    
    User["👤 User"]
    Firebase["🔒 Firebase Auth"]
    System["MedAlze System"]
    
    User -->|Enters| Auth1
    Auth1 -->|Sends| Firebase
    Firebase --> Auth2
    Auth2 --> Auth3
    Auth3 -->|Returns| Auth4
    Auth4 --> Auth5
    Auth5 --> Auth6
    Auth6 -->|Grants| Auth7
    Auth7 -->|Allows| System
```

---

## 12. Patient Download & Access Use Cases

```mermaid
graph TB
    subgraph Patient_UC["Patient Report Access"]
        P_step1["1️⃣ Login to Portal"]
        P_step2["2️⃣ View X-ray List"]
        P_step3["3️⃣ Select Report"]
        P_step4["4️⃣ View Report"]
        P_step5["5️⃣ Read Findings"]
        P_step6["6️⃣ Download as PDF"]
        P_step7["7️⃣ Share with Others"]
        P_step8["8️⃣ Archive Report"]
    end
    
    Patient["🧑‍⚕️ Patient"]
    System["MedAlze System"]
    Storage["☁️ Cloud Storage"]
    
    Patient --> P_step1
    P_step1 --> P_step2
    P_step2 --> P_step3
    P_step3 --> P_step4
    P_step4 --> P_step5
    P_step5 --> P_step6
    P_step6 -->|Generates| Storage
    Storage -->|Downloads| Patient
    Patient --> P_step7
    Patient --> P_step8
```

---

## 13. Admin Monitoring & Analytics Use Cases

```mermaid
graph TB
    subgraph Admin_UC["Admin Monitoring & Analytics"]
        Adm1["📊 View Dashboard"]
        Adm2["📈 Check Statistics"]
        Adm3["⏱️ Monitor Activity"]
        Adm4["⚠️ Alert on Issues"]
        Adm5["👥 Manage Users"]
        Adm6["🔧 System Settings"]
        Adm7["📋 Generate Reports"]
        Adm8["💾 Backup Data"]
    end
    
    Admin["👨‍💼 Admin"]
    System["MedAlze System"]
    DB["💾 Database"]
    
    Admin --> Adm1
    Adm1 -->|Queries| System
    System -->|Returns| Adm2
    Adm2 --> Adm3
    Adm3 -->|Monitors| DB
    DB -->|Alerts| Adm4
    Admin --> Adm5
    Admin --> Adm6
    Admin --> Adm7
    Admin -->|Triggers| Adm8
```

---

## 14. Error Handling & Recovery Use Cases

```mermaid
graph TB
    subgraph Error_UC["Error Handling"]
        Err1["❌ Upload Fails"]
        Err2["🔄 Retry Logic"]
        Err3["💬 Show Error Message"]
        
        Err4["⏱️ Model Timeout"]
        Err5["🔄 Restart Worker"]
        Err6["📧 Notify Admin"]
        
        Err7["🔑 API Key Error"]
        Err8["⚠️ Fallback Message"]
        Err9["👨‍💼 Alert Admin"]
    end
    
    User["👤 User"]
    System["MedAlze System"]
    Admin["👨‍💼 Admin"]
    
    User -->|Triggers| Err1
    Err1 --> Err2
    Err2 --> Err3
    
    System -->|Detects| Err4
    Err4 --> Err5
    Err5 --> Err6
    Err6 -->|Notifies| Admin
    
    System -->|Encounters| Err7
    Err7 --> Err8
    Err8 --> Err9
    Err9 -->|Alerts| Admin
```

---

## 15. System Integration Use Cases

```mermaid
graph TB
    subgraph Integration_UC["External Integrations"]
        Int1["🔗 Firebase Auth"]
        Int2["☁️ Cloudinary Upload"]
        Int3["🧠 Gemini AI Report"]
        Int4["📧 Email Notifications"]
        Int5["📱 SMS Alerts"]
        Int6["📊 Analytics Export"]
    end
    
    Frontend["🎨 Frontend"]
    Backend["⚙️ Backend"]
    External["🔗 External Services"]
    
    Frontend --> Backend
    Backend -->|Uses| Int1
    Backend -->|Uses| Int2
    Backend -->|Uses| Int3
    Backend -->|Uses| Int4
    Backend -->|Uses| Int5
    Backend -->|Uses| Int6
    Int1 --> External
    Int2 --> External
    Int3 --> External
    Int4 --> External
    Int5 --> External
    Int6 --> External
```

---

## How to Use These Diagrams

### In GitHub (README.md)
```markdown
## System Architecture

[View Use Case Diagram](#main-system-use-case-diagram)

![Use Case Diagram](https://your-repo/diagrams/usecase.png)
```

### In Draw.io
1. Copy the Mermaid code
2. Go to draw.io
3. Click "File" → "Import from" → "Mermaid"
4. Paste the code
5. Auto-renders as diagram

### In Notion
1. Create code block
2. Select language: "mermaid"
3. Paste diagram code
4. Renders automatically

### In Microsoft Teams/Slack
1. Copy as image
2. Paste into chat
3. Or embed as documentation

---

## Color Legend

| Symbol | Meaning |
|--------|---------|
| 🔬 | Radiologist (Medical professional analyzing X-rays) |
| 👨‍⚕️ | Doctor (Clinical review & approval) |
| 🧑‍⚕️ | Patient (End user) |
| 👨‍💼 | Admin (System management) |
| 🤖 | AI/ML System (Automated processing) |
| ☁️ | Cloud Services (External storage/APIs) |
| 🔐 | Security/Authentication |
| 💾 | Database/Storage |
| 🔔 | Notifications |

---

**Total Diagrams:** 15 comprehensive use case flows covering all system aspects ✅
