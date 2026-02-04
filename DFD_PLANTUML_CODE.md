# MedAlze DFD - PlantUML Code

## Level 0 - Context Diagram (PlantUML)

```plantuml
@startuml MedAlze_DFD_Level0
!define DIRECTION top to bottom direction
title MedAlze System - DFD Level 0 (Context Diagram)

actor Users as U
entity MedAlzeSystem as System
entity ExternalServices as Ext

U --> System: Medical Images, User Data
System --> U: Predictions, Reports, Notifications
System --> Ext: Authentication, Data Storage
Ext --> System: Auth Tokens, AI Reports, Image URLs

@enduml
```

---

## Level 1 - Detailed Process Flows (PlantUML)

```plantuml
@startuml MedAlze_DFD_Level1
!define DIRECTION top to bottom direction
title MedAlze System - DFD Level 1 (Detailed Processes)

actor Users

' Processes (Circles with numbers)
component "1: Authentication\n(Login/Register)" as P1
component "2: X-ray Upload\n& Validation" as P2
component "3: Image Processing\n& Preprocessing" as P3
component "4: AI Prediction\n(DenseNet Model)" as P4
component "5: Report Generation\n(Gemini AI)" as P5
component "6: Data Storage\n& Retrieval" as P6
component "7: Notifications" as P7

' Data Stores (Parallel lines)
database "D1: Firebase Firestore\n(Users, Reports, Metadata)" as D1
database "D2: Cloudinary\n(X-ray Images)" as D2
database "D3: Model Cache\n(DenseNet Weights)" as D3

' Data Flows
Users --> P1: Credentials
P1 --> D1: User Token
D1 --> P1: User Verified
P1 --> Users: Authenticated

Users --> P2: X-ray Image
P2 --> P2: File Validation
P2 --> P3: Valid Image
P2 --> D1: Image Metadata

P3 --> P4: Preprocessed Tensor
P3 --> D1: Processing Log

P4 --> P5: 14 Predictions + Confidence
P4 --> D3: Model Cache

P5 --> P6: AI Generated Report
P6 --> D1: Save Report & Link
P6 --> D2: Link Image

P6 --> P7: Report Status
P7 --> Users: Alert Message

@enduml
```

---

## Level 1 - Alternative Syntax (Better for PlantUML Editor)

```plantuml
@startuml MedAlze_DFD_L1_Alternative
title MedAlze - DFD Level 1 (Detailed)

' Define styles
skinparam backgroundColor #FEFEFE
skinparam sequenceStyle plain

' Actors
actor Users
actor Admin

' Processes
circle P1 [Authentication\n(Process 1)]
circle P2 [X-ray Upload\n(Process 2)]
circle P3 [Image Processing\n(Process 3)]
circle P4 [AI Prediction\n(Process 4)]
circle P5 [Report Generation\n(Process 5)]
circle P6 [Data Storage\n(Process 6)]
circle P7 [Notifications\n(Process 7)]

' Data Stores
file D1 {
  folder "Firebase Firestore" {
    file Users_Data
    file Reports_Data
    file Metadata
  }
}

file D2 {
  folder "Cloudinary" {
    file XRay_Images
  }
}

file D3 {
  folder "Model Cache" {
    file DenseNet_Weights
  }
}

' Flows
Users --> P1: Credentials
P1 --> D1: Store User Token
D1 --> P1: Return Token
P1 --> Users: Auth Success

Users --> P2: Upload X-ray
P2 --> P3: Validated Image
P3 --> P4: Preprocessed Tensor
P4 --> P5: 14 Predictions
P5 --> P6: Generated Report
P6 --> D1: Store Report
P7 --> Users: Notification

D3 --> P4: Model Weights
P2 --> D2: Store Image URL
P6 --> D2: Link Image

@enduml
```

---

## Complete X-ray Processing Pipeline (PlantUML)

```plantuml
@startuml MedAlze_XRay_Pipeline
title X-ray Upload to Prediction - Data Flow

actor Radiologist

component Frontend as FE
component "Validation Module" as VM
component "Cloudinary Upload" as CU
component "Preprocessing Engine" as PE
component "DenseNet Model" as DM
component "Post-processor" as PP
component "Firebase Storage" as FS
component "Report Generator" as RG

database CloudinaryDB as CDB
database FirebaseDB as FDB
database ModelCache as MC

Radiologist --> FE: Upload X-ray
FE --> VM: Send Image
VM --> VM: Check format, size, dimensions
VM --> CU: Valid Image
CU --> CDB: Upload to Cloudinary
CDB --> CU: Return Image URL
CU --> PE: Image URL + Binary
PE --> PE: Resize to 224x224
PE --> PE: Normalize (ImageNet stats)
PE --> PE: Convert to Tensor
PE --> DM: Tensor Input
MC --> DM: Load Model Weights
DM --> DM: Forward Pass
DM --> PP: Raw Output (logits)
PP --> PP: Sigmoid Activation
PP --> PP: Generate Confidence Scores
PP --> FS: Predictions JSON
FS --> FDB: Store in Firestore
FDB --> FS: Confirmation
FS --> RG: Trigger Report Generation
RG --> Radiologist: Display Predictions

@enduml
```

---

## Report Generation Data Flow (PlantUML)

```plantuml
@startuml MedAlze_Report_Flow
title Report Generation - Data Flow Diagram

component "Predictions Module" as PM
component "Prompt Engineering" as PE
component "Gemini API" as GA
component "JSON Formatter" as JF
component "Database Store" as DB
component "Doctor Review" as DR
component "Patient Access" as PA

database Firestore as FS

PM --> PM: Extract 14 condition scores
PM --> PE: Condition data
PE --> PE: Build structured prompt
PE --> GA: Send prompt
GA --> GA: Generate medical report
GA --> JF: Return report text
JF --> JF: Parse & structure JSON
JF --> DB: Report object
DB --> FS: Save to Firestore
FS --> DR: Notify Doctor
DR --> DR: Review & Approve
DR --> FS: Store approval
FS --> PA: Patient notification
PA --> PA: View report

@enduml
```

---

## Full System Integration (PlantUML)

```plantuml
@startuml MedAlze_Full_DFD
title MedAlze - Complete Data Flow Diagram

skinparam backgroundColor #FEFEFE

' External Actors
actor Radiologist
actor Doctor
actor Patient

' Frontend
component "React Frontend" as FE

' API Gateway
component "Flask Backend API" as API

' Processing Modules
component "Auth Module\n(Process 1)" as P1
component "Upload Handler\n(Process 2)" as P2
component "Image Processor\n(Process 3)" as P3
component "AI Inference\n(Process 4)" as P4
component "Report Generator\n(Process 5)" as P5
component "Notification Service\n(Process 6)" as P6

' External Services
cloud "Firebase Auth" as FA
cloud "Google Gemini AI" as GA
cloud "Cloudinary CDN" as CC

' Data Stores
database "Firebase Firestore" as FDB
database "Model Cache" as MC

' Flows - Authentication
Radiologist --> FE: Login Credentials
FE --> API: POST /auth
API --> P1: Authenticate
P1 --> FA: Verify Credentials
FA --> P1: Token
P1 --> FDB: Store Session
FDB --> API: Confirmed
API --> FE: Auth Token
FE --> Radiologist: Authenticated

' Flows - Upload & Predict
Radiologist --> FE: Upload X-ray
FE --> API: POST /predict + Image
API --> P2: Validate
P2 --> CC: Upload Image
CC --> P2: Image URL
P2 --> P3: Preprocessed Data
P3 --> MC: Load Model
MC --> P3: DenseNet Weights
P3 --> P4: Forward Pass
P4 --> P4: Generate Predictions
P4 --> FDB: Store Predictions
FDB --> API: Confirmed
API --> FE: 14 Predictions
FE --> Radiologist: Display Results

' Flows - Report Generation
Radiologist --> FE: Generate Report
FE --> API: POST /generate_report
API --> P5: Process
P5 --> FDB: Get Predictions
FDB --> P5: Prediction Data
P5 --> GA: Send Prompt
GA --> P5: AI Report
P5 --> FDB: Store Report
FDB --> API: Confirmed
API --> FE: Report JSON
FE --> Radiologist: Display Report

' Flows - Doctor & Patient
FDB --> P6: Report Ready
P6 --> API: Notify Doctor
API --> FE: Alert
FE --> Doctor: New Report
Doctor --> FE: Approve
FE --> API: POST /approve
API --> FDB: Update Status
FDB --> P6: Status Changed
P6 --> API: Notify Patient
API --> FE: Alert
FE --> Patient: Report Available
Patient --> FE: View Report
FE --> Patient: Display Report

@enduml
```

---

## Simplified DFD for Presentation (PlantUML)

```plantuml
@startuml MedAlze_Simplified_DFD
title MedAlze - Simplified Data Flow

skinparam linetype ortho

actor Users

component "Authentication\nService" as Auth
component "Image Upload\nService" as Upload
component "Image Processing\nEngine" as Process
component "DenseNet AI\nModel" as Model
component "Report Generator\nGemini API" as Report
component "Notification\nService" as Notify
component "Data Access\nLayer" as Data

database "Firebase\nFirestore" as DB
database "Cloudinary\nCDN" as CDN
database "Model\nCache" as Cache

Users --> Auth: Credentials
Auth --> DB: Verify
DB --> Auth: User Data
Auth --> Users: Token

Users --> Upload: X-ray File
Upload --> CDN: Store Image
CDN --> Process: Image URL
Process --> Cache: Load Model
Process --> Model: Preprocessed Data
Model --> Report: 14 Predictions
Report --> Data: Generate Report
Data --> DB: Store Results
DB --> Notify: Status Update
Notify --> Users: Notification

@enduml
```

---

## How to Use in PlantUML Editor

### Online PlantUML Editor:
1. Go to: https://www.plantuml.com/plantuml/uml/
2. Copy-paste any code block above
3. Click "Update"
4. Export as PNG/SVG

### In VS Code:
1. Install "PlantUML" extension
2. Create file: `dfd.puml`
3. Paste code
4. Right-click → "Preview"

### Generate Different Formats:

```bash
# PNG
plantuml dfd.puml -tpng

# SVG
plantuml dfd.puml -tsvg

# PDF
plantuml dfd.puml -tpdf
```

---

## Best DFD for Thesis: Use "Full System Integration"

This one shows:
- ✅ All actors (Radiologist, Doctor, Patient)
- ✅ All processes (Auth, Upload, Processing, AI, Report, Notify)
- ✅ All data stores (Firebase, Cloudinary, Model Cache)
- ✅ Complete data flows
- ✅ External services integration

**Perfect for including in your thesis documentation!** 📊
