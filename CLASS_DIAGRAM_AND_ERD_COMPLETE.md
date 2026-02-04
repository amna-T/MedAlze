# MedAlze UML Class Diagram & ERD - Complete Set

## 1. Class Diagram - PlantUML (Software Architecture)

```plantuml
@startuml MedAlze_ClassDiagram
title MedAlze - UML Class Diagram

' Abstract Base Class
abstract class User {
  # userId: UUID
  # name: String
  # email: String
  # password: String (hashed)
  # role: Enum
  # createdAt: Timestamp
  # updatedAt: Timestamp
  --
  + login(email: String, password: String): boolean
  + register(userData: Object): void
  + updateProfile(data: Object): void
  + changePassword(oldPwd: String, newPwd: String): void
  + logout(): void
  + getProfileInfo(): Object
}

' Concrete Classes
class Radiologist {
  - licenseNumber: String
  - department: String
  - specialization: String
  --
  + uploadXray(file: File, patientID: UUID): XRayImage
  + viewPredictions(xrayID: UUID): Prediction
  + generateReport(predictions: Array): Report
  + assignToDoctor(reportID: UUID, doctorID: UUID): void
  + addNotes(reportID: UUID, notes: String): void
}

class Doctor {
  - licenseNumber: String
  - department: String
  - specialization: String
  --
  + viewAssignedReports(): List<Report>
  + reviewReport(reportID: UUID): void
  + approveReport(reportID: UUID, comments: String): void
  + rejectReport(reportID: UUID, reason: String): void
  + addClinicalNotes(reportID: UUID, notes: String): void
  + getPatientHistory(patientID: UUID): List<Report>
}

class Patient {
  - dateOfBirth: Date
  - gender: String
  - medicalHistory: String
  - emergencyContact: String
  --
  + viewOwnXrays(): List<XRayImage>
  + viewOwnReports(): List<Report>
  + downloadReport(reportID: UUID): PDF
  + viewNotifications(): List<Notification>
  + markNotificationRead(notificationID: UUID): void
}

class Admin {
  - department: String
  - permissions: Array<String>
  --
  + manageUsers(action: String, userData: Object): void
  + deleteUser(userID: UUID): void
  + viewSystemAnalytics(): Analytics
  + generateSystemReport(): Report
  + monitorSystem(): void
  + configureSettings(settings: Object): void
  + backupDatabase(): void
}

' Entity Classes
class XRayImage {
  - imageID: UUID
  - URL: String
  - cloudinaryID: String
  - uploadDate: Timestamp
  - fileSize: Integer
  - imageType: String
  - isProcessed: Boolean
  --
  + preprocess(): Tensor
  + validate(): boolean
  + getMetadata(): Object
  + delete(): void
  + updateStatus(status: String): void
}

class Report {
  - reportID: UUID
  - findings: String
  - impression: String
  - recommendations: String
  - status: Enum
  - generatedOn: Timestamp
  - approvedOn: Timestamp
  --
  + generate(predictions: Array): void
  + approve(doctorID: UUID): void
  + reject(reason: String): void
  + export(): PDF
  + addRadiologistNotes(notes: String): void
  + addDoctorNotes(notes: String): void
  + getFullReport(): Object
}

class Prediction {
  - predictionID: UUID
  - modelVersion: String
  - diseaseLabels: Array
  - confidenceScores: Array
  - primaryFinding: String
  - inferenceTime: Float
  --
  + calculateConfidence(): Float
  + getRankedPredictions(): Array
  + formatForReport(): JSON
  + getModelMetadata(): Object
}

class Notification {
  - notificationID: UUID
  - type: String
  - title: String
  - message: String
  - isRead: Boolean
  - createdAt: Timestamp
  --
  + markAsRead(): void
  + delete(): void
  + getNotificationData(): Object
  + sendNotification(): void
}

class ImageProcessor {
  - inputPath: String
  - outputPath: String
  --
  + resize(image: File, width: Int, height: Int): File
  + normalize(image: Tensor): Tensor
  + augment(image: File): File
  + validate(image: File): boolean
  + convertToTensor(image: File): Tensor
}

class DenseNetModel {
  - modelPath: String
  - modelVersion: String
  - weights: Tensor
  --
  + load(): void
  + predict(image: Tensor): Array
  + evaluate(image: Tensor): Object
  + getModelInfo(): Object
  + inferenceTime(): Float
}

class ReportGenerator {
  - geminiAPIKey: String
  --
  + generateFromPredictions(predictions: Array): String
  + formatJSON(reportText: String): JSON
  + validateReport(report: Object): boolean
  + addMetadata(report: Object): Object
}

class NotificationService {
  --
  + sendNotification(userID: UUID, notification: Object): void
  + createNotification(type: String, title: String, message: String): Notification
  + getNotifications(userID: UUID): List<Notification>
  + deleteNotification(notificationID: UUID): void
  + markAsRead(notificationID: UUID): void
}

class AuthenticationService {
  --
  + validateCredentials(email: String, password: String): boolean
  + generateToken(userID: UUID): String
  + verifyToken(token: String): boolean
  + hashPassword(password: String): String
  + validateEmail(email: String): boolean
}

class Database {
  - firestore: FirebaseDB
  --
  + saveUser(user: User): void
  + getUser(userID: UUID): User
  + updateUser(userID: UUID, data: Object): void
  + deleteUser(userID: UUID): void
  + getXrays(patientID: UUID): List<XRayImage>
  + saveReport(report: Report): void
  + getReports(patientID: UUID): List<Report>
}

class FileStorage {
  - cloudinaryAPI: String
  --
  + uploadImage(file: File): String
  + downloadImage(fileID: String): File
  + deleteImage(fileID: String): void
  + getImageURL(fileID: String): String
}

' Relationships
User <|-- Radiologist : "extends"
User <|-- Doctor : "extends"
User <|-- Patient : "extends"
User <|-- Admin : "extends"

Radiologist --> XRayImage : "uploads"
Radiologist --> Report : "creates"
Radiologist --> Prediction : "views"

Doctor --> Report : "reviews/approves"
Doctor --> Notification : "receives"

Patient --> XRayImage : "owns"
Patient --> Report : "views/downloads"
Patient --> Notification : "receives"

Admin --> User : "manages"
Admin --> Database : "configures"

XRayImage --> Prediction : "analyzed by"
XRayImage --> Report : "generates"

Report --> Notification : "triggers"

ImageProcessor --> XRayImage : "processes"
DenseNetModel --> Prediction : "generates"
ReportGenerator --> Report : "creates"

AuthenticationService --> User : "authenticates"
NotificationService --> Notification : "manages"
Database --> User : "persists"
Database --> XRayImage : "persists"
Database --> Report : "persists"
Database --> Prediction : "persists"
FileStorage --> XRayImage : "stores"

@enduml
```

---

## 2. Class Diagram - Detailed Version (Alternative)

```plantuml
@startuml MedAlze_ClassDiagram_Detailed
title MedAlze - Detailed Class Diagram with Visibility

' User Abstract Class
abstract class User {
  #{id} userId: UUID
  #{id} email: String
  #{id} password: String
  -name: String
  -role: UserRole
  -createdAt: Timestamp
  -updatedAt: Timestamp
  -isActive: Boolean
  --
  {abstract} +viewDashboard(): Dashboard
  {abstract} +getPermissions(): List<Permission>
  +updateProfile(data: Object): void
  +changePassword(oldPwd: String, newPwd: String): void
  +logout(): void
  -validateEmail(): Boolean
  -hashPassword(): String
}

enum UserRole {
  RADIOLOGIST
  DOCTOR
  PATIENT
  ADMIN
}

' Radiologist Class
class Radiologist {
  -licenseNumber: String
  -department: String
  -specialization: String
  -yearsOfExperience: Integer
  --
  +viewDashboard(): RadiologistDashboard
  +getPermissions(): List<Permission>
  +uploadXray(file: File): XRayImage
  +analyzePredictions(xrayID: UUID): Array
  +generateReport(data: Object): Report
  +assignToDoctor(reportID: UUID, doctorID: UUID): void
  -validateXrayFile(): Boolean
  -updateUploadStats(): void
}

' Doctor Class
class Doctor {
  -licenseNumber: String
  -department: String
  -specialization: String
  -hospital: String
  --
  +viewDashboard(): DoctorDashboard
  +getPermissions(): List<Permission>
  +getAssignedReports(): List<Report>
  +reviewReport(reportID: UUID): void
  +approveReport(reportID: UUID, comments: String): void
  +rejectReport(reportID: UUID, reason: String): void
  +getPatientHistory(patientID: UUID): List<Record>
  -notifyPatient(reportID: UUID): void
  -updateApprovalStats(): void
}

' Patient Class
class Patient {
  -dateOfBirth: Date
  -gender: Gender
  -medicalHistory: String
  -phoneNumber: String
  --
  +viewDashboard(): PatientDashboard
  +getPermissions(): List<Permission>
  +getMyXrays(): List<XRayImage>
  +getMyReports(): List<Report>
  +downloadReport(reportID: UUID): PDF
  +getNotifications(): List<Notification>
  -viewHealthRecords(): List<Record>
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

' Admin Class
class Admin {
  -department: String
  -permissions: Array<String>
  --
  +viewDashboard(): AdminDashboard
  +getPermissions(): List<Permission>
  +manageUsers(action: String): void
  +deleteUser(userID: UUID): void
  +viewAnalytics(): Analytics
  +generateReport(type: String): Report
  +configureSystem(): void
  -backupDatabase(): void
  -cleanupExpiredData(): void
}

' Entity Classes
class XRayImage {
  -imageID: UUID
  -patientID: UUID
  -radiologistID: UUID
  -URL: String
  -cloudinaryID: String
  -uploadDate: Timestamp
  -fileSize: Integer
  -imageType: ImageType
  -isProcessed: Boolean
  --
  +preprocess(): Tensor
  +validate(): Boolean
  +delete(): void
  +getMetadata(): Object
  +getDownloadURL(): String
}

enum ImageType {
  JPEG
  PNG
  DICOM
}

class Report {
  -reportID: UUID
  -xrayID: UUID
  -radiologistID: UUID
  -doctorID: UUID
  -findings: String
  -impression: String
  -recommendations: String
  -status: ReportStatus
  -createdAt: Timestamp
  -approvedAt: Timestamp
  --
  +generate(): void
  +approve(comments: String): void
  +reject(reason: String): void
  +export(): PDF
  +addNotes(notes: String): void
  +getFullContent(): String
}

enum ReportStatus {
  PENDING
  APPROVED
  REJECTED
  ARCHIVED
}

class Prediction {
  -predictionID: UUID
  -xrayID: UUID
  -modelVersion: String
  -diseaseLabels: Array<String>
  -confidenceScores: Array<Float>
  -primaryFinding: String
  -inferenceTime: Float
  --
  +getTopPredictions(n: Integer): Array
  +toJSON(): JSON
  +getConfidenceMetrics(): Object
}

class Notification {
  -notificationID: UUID
  -userID: UUID
  -type: NotificationType
  -title: String
  -message: String
  -isRead: Boolean
  -createdAt: Timestamp
  --
  +markAsRead(): void
  +delete(): void
  +resend(): void
}

enum NotificationType {
  REPORT_READY
  REPORT_APPROVED
  APPOINTMENT
  SYSTEM_ALERT
}

' Service Classes
class ImageProcessor {
  -batchSize: Integer
  --
  +resize(image: File): File
  +normalize(tensor: Tensor): Tensor
  +augment(image: File): File
  +validate(file: File): Boolean
  +toTensor(image: File): Tensor
  -loadModel(): void
}

class DenseNetModel {
  -modelPath: String
  -weights: Tensor
  -framework: String
  --
  +load(): void
  +predict(tensor: Tensor): Array<Float>
  +getModelStats(): Object
  +warmup(): void
  -validateInput(): Boolean
}

class ReportGenerator {
  -geminiKey: String
  -promptTemplate: String
  --
  +generateReport(predictions: Array): String
  +formatAsJSON(text: String): JSON
  +validate(report: Object): Boolean
  +addMetadata(report: Object): Object
}

class NotificationService {
  --
  +create(type: String, data: Object): Notification
  +send(userID: UUID, notification: Notification): void
  +getAll(userID: UUID): List<Notification>
  +delete(notificationID: UUID): void
  -sendEmail(email: String): void
}

class AuthService {
  -jwtSecret: String
  --
  +authenticate(email: String, password: String): Token
  +register(userData: Object): User
  +validateToken(token: String): Boolean
  +refreshToken(token: String): Token
  -hashPassword(pwd: String): String
  -verifyEmail(email: String): Boolean
}

class CloudinaryService {
  -apiKey: String
  -apiSecret: String
  --
  +uploadFile(file: File): String
  +deleteFile(fileID: String): void
  +getFileURL(fileID: String): String
  +optimizeImage(fileID: String): void
}

' Database Classes
class FirebaseManager {
  -firestore: FirebaseDB
  --
  +saveUser(user: User): void
  +getUser(userID: UUID): User
  +updateUser(data: Object): void
  +deleteUser(userID: UUID): void
  +saveXray(xray: XRayImage): void
  +getXrays(patientID: UUID): List<XRayImage>
  +saveReport(report: Report): void
  +getReports(criteria: Object): List<Report>
  +savePrediction(prediction: Prediction): void
}

' Relationships with multiplicity
User <|-- Radiologist
User <|-- Doctor
User <|-- Patient
User <|-- Admin

Radiologist "1" --> "many" XRayImage : uploads
Radiologist "1" --> "many" Report : creates
Radiologist "1" --> "many" Prediction : analyzes

Doctor "1" --> "many" Report : reviews
Doctor "1" --> "many" Notification : receives

Patient "1" --> "many" XRayImage : owns
Patient "1" --> "many" Report : views
Patient "1" --> "many" Notification : receives

XRayImage "1" --> "1" Prediction : generates
XRayImage "1" --> "1" Report : produces
Report "1" --> "many" Notification : triggers

ImageProcessor "1" --> "many" XRayImage : processes
DenseNetModel "1" --> "many" Prediction : generates
ReportGenerator "1" --> "many" Report : creates

AuthService "1" --> "many" User : authenticates
NotificationService "1" --> "many" Notification : manages
CloudinaryService "1" --> "many" XRayImage : stores
FirebaseManager "1" --> "many" User : persists

@enduml
```

---

## 3. Entity-Relationship Diagram (ERD) - Database Schema

```plantuml
@startuml MedAlze_ERD
title MedAlze - Entity Relationship Diagram (Database Schema)

entity "User" as User {
  * userID : UUID <<PK>>
  --
  email : STRING <<UNIQUE>>
  password : STRING
  name : STRING
  role : ENUM
  createdAt : TIMESTAMP
  updatedAt : TIMESTAMP
  isActive : BOOLEAN
}

entity "XRayImage" as XRay {
  * imageID : UUID <<PK>>
  --
  patientID : UUID <<FK>>
  radiologistID : UUID <<FK>>
  URL : STRING
  cloudinaryID : STRING
  uploadDate : TIMESTAMP
  fileSize : INTEGER
  imageType : STRING
  isProcessed : BOOLEAN
}

entity "Report" as Report {
  * reportID : UUID <<PK>>
  --
  xrayID : UUID <<FK>> <<UNIQUE>>
  patientID : UUID <<FK>>
  radiologistID : UUID <<FK>>
  doctorID : UUID <<FK>>
  findings : TEXT
  impression : TEXT
  recommendations : TEXT
  status : ENUM
  generatedOn : TIMESTAMP
  approvedOn : TIMESTAMP
}

entity "Prediction" as Prediction {
  * predictionID : UUID <<PK>>
  --
  xrayID : UUID <<FK>> <<UNIQUE>>
  modelVersion : STRING
  diseaseLabels : JSON
  confidenceScores : JSON
  primaryFinding : STRING
  inferenceTime : FLOAT
  generatedAt : TIMESTAMP
}

entity "Notification" as Notification {
  * notificationID : UUID <<PK>>
  --
  userID : UUID <<FK>>
  type : STRING
  title : STRING
  message : TEXT
  isRead : BOOLEAN
  createdAt : TIMESTAMP
}

' Relationships
User ||--o{ XRay : "uploads"
User ||--o{ Report : "creates/approves"
User ||--o{ Notification : "receives"
XRay ||--|| Report : "generates"
XRay ||--|| Prediction : "analyzed by"
Report }o--|| Prediction : "uses"

@enduml
```

---

## 4. Comparison Table

```
┌──────────────────────────────────────────────────────────────────────┐
│            CLASS DIAGRAM vs ERD - Side by Side                       │
├──────────────────────────────────────────────────────────────────────┤
│ ASPECT              │ CLASS DIAGRAM      │ ERD                       │
├──────────────────────────────────────────────────────────────────────┤
│ Purpose             │ Software design   │ Database design           │
│ Shows               │ Classes & methods │ Entities & attributes     │
│ Focuses on          │ Object behavior   │ Data structure            │
│ Audience            │ Developers        │ Database architects       │
│ Methods?            │ ✅ YES            │ ❌ NO                     │
│ Inheritance?        │ ✅ YES            │ ❌ NO (abstract)          │
│ Polymorphism?       │ ✅ YES            │ ❌ NO                     │
│ Primary Key         │ Not highlighted   │ ✅ Marked with *          │
│ Foreign Key         │ Not shown         │ ✅ Marked with FK         │
│ Data types          │ In class diagram  │ ✅ SQL types specified    │
│ Relationships       │ Inheritance,      │ 1:1, 1:M, M:M             │
│                     │ composition       │                           │
│ Example             │ +login()          │ email: VARCHAR(255)       │
│ Focus               │ "What can it do?" │ "What data is stored?"    │
├──────────────────────────────────────────────────────────────────────┤
│ FOR MedAlze:                                                         │
│ Class Diagram shows:                                                 │
│ - Radiologist.uploadXray() method                                    │
│ - Doctor.approveReport() behavior                                    │
│ - Inheritance from User class                                        │
│                                                                      │
│ ERD shows:                                                           │
│ - User table with fields (userID, email, password, role)            │
│ - XRayImage table linked to User                                    │
│ - One-to-many relationship: User uploads many XRayImages            │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. How They Work Together

```
DEVELOPMENT PROCESS:

Step 1: CLASS DIAGRAM (Design Phase)
   └─ Define User, Radiologist, Doctor, Patient classes
   └─ Define methods: uploadXray(), generateReport()
   └─ Show inheritance and relationships
   └─ Used by: Software architects & developers

            ↓ USED FOR CODING ↓

Step 2: IMPLEMENT CLASSES
   └─ Write Python/TypeScript classes
   └─ Implement methods
   └─ Create object structure

            ↓ NEED TO PERSIST DATA ↓

Step 3: ERD (Database Design Phase)
   └─ Design User entity with fields
   └─ Design XRayImage entity
   └─ Define primary/foreign keys
   └─ Show cardinality (1:1, 1:M)
   └─ Used by: Database architects & DBAs

            ↓ USED FOR DATABASE ↓

Step 4: CREATE DATABASE
   └─ Create tables from ERD
   └─ Set up indexes and constraints
   └─ Create relationships
   └─ Deploy to Firebase/SQL
```

---

## 6. PlantUML Online Links

**For Class Diagram #1:**
- Go to: https://www.plantuml.com/plantuml/uml/
- Copy Section 1 code
- Paste & click "Update"

**For ERD:**
- Go to: https://www.plantuml.com/plantuml/uml/
- Copy Section 3 code
- Paste & click "Update"

---

## 7. Quick Summary

### **Use CLASS DIAGRAM When:**
- ✅ Designing software architecture
- ✅ Showing object-oriented structure
- ✅ Planning inheritance hierarchies
- ✅ Documenting methods & behaviors
- ✅ Creating API design

### **Use ERD When:**
- ✅ Designing database schema
- ✅ Planning data storage
- ✅ Showing data relationships
- ✅ Defining table constraints
- ✅ Data modeling

### **For Your Thesis:**
- **Chapter 3 (System Design)** → Include Class Diagram
- **Chapter 4 (Implementation)** → Include ERD

**Both are essential for complete software documentation!** 📊
