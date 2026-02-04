# MedAlze Component Diagram

## 1. Component Diagram - PlantUML (Recommended for Thesis)

```plantuml
@startuml MedAlze_Component_Diagram
!define DIRECTION top to bottom direction
title MedAlze Medical Imaging System - Component Diagram

' Define components with interfaces

package "Frontend Layer" {
  component "React UI\nComponents" as ReactUI
  component "Authentication\nModule" as AuthUI
  component "Dashboard\nPages" as Dashboard
  component "Form\nValidation" as FormVal
}

package "API Gateway" {
  component "Flask REST\nAPI" as FlaskAPI
  component "Request Router" as Router
  component "Error Handler" as ErrorHandler
  component "CORS Handler" as CORSHandler
}

package "Business Logic Layer" {
  component "Authentication\nService" as AuthService
  component "X-ray Upload\nHandler" as UploadHandler
  component "Image Processing\nEngine" as ImgProcessor
  component "AI Inference\nEngine" as AIEngine
  component "Report Generator\nService" as ReportGen
  component "Notification\nService" as NotifService
}

package "Data Access Layer" {
  component "Firebase\nConnector" as FirebaseConn
  component "Cloudinary\nConnector" as CloudinaryConn
  component "Cache\nManager" as CacheManager
}

package "External Services" {
  component "Firebase Auth" as FirebaseAuth
  component "Firebase Firestore" as Firestore
  component "Google Gemini API" as GeminiAPI
  component "Cloudinary CDN" as CloudinaryCDN
}

package "AI/ML Layer" {
  component "DenseNet-121\nModel" as DenseNet
  component "Image Preprocessor" as ImgPreproc
  component "Model Loader" as ModelLoader
  component "Prediction Formatter" as PredFormatter
}

' Interfaces
interface "HTTP/REST" as HTTP
interface "Firebase SDK" as FirebaseSDK
interface "Gemini SDK" as GeminiSDK
interface "Cloudinary SDK" as CloudinarySDK
interface "PyTorch API" as PyTorchAPI

' Connections - Frontend to API
ReactUI --> HTTP
AuthUI --> HTTP
Dashboard --> HTTP
FormVal --> HTTP
HTTP --> FlaskAPI
FlaskAPI --> Router
Router --> ErrorHandler
Router --> CORSHandler

' Connections - API to Services
FlaskAPI --> AuthService
FlaskAPI --> UploadHandler
FlaskAPI --> ImgProcessor
FlaskAPI --> AIEngine
FlaskAPI --> ReportGen
FlaskAPI --> NotifService

' Connections - Services to Data Layer
AuthService --> FirebaseConn
UploadHandler --> CloudinaryConn
ImgProcessor --> CacheManager
AIEngine --> CacheManager
ReportGen --> FirebaseConn

' Connections - Data Layer to External Services
FirebaseConn --> FirebaseSDK
FirebaseSDK --> FirebaseAuth
FirebaseSDK --> Firestore
CloudinaryConn --> CloudinarySDK
CloudinarySDK --> CloudinaryCDN
ReportGen --> GeminiSDK
GeminiSDK --> GeminiAPI

' Connections - Services to AI/ML
AIEngine --> ImgPreproc
ImgPreproc --> DenseNet
DenseNet --> ModelLoader
DenseNet --> PyTorchAPI
DenseNet --> PredFormatter
ModelLoader --> CacheManager

' Add styling
skinparam component {
  BackgroundColor #E1F5FE
  BorderColor #01579B
  FontColor #000000
}

skinparam package {
  BackgroundColor #FFF9C4
  BorderColor #F57F17
  FontColor #000000
}

skinparam interface {
  BackgroundColor #C8E6C9
  BorderColor #2E7D32
  FontColor #000000
}

@enduml
```

---

## 2. Simplified Component Diagram (Alternative)

```plantuml
@startuml MedAlze_Component_Simple
title MedAlze - Simplified Component Architecture

skinparam linetype ortho

' Core Components
component "Client\nLayer" as Client {
  component "React Frontend" as React
  component "UI Components" as UI
}

component "API\nLayer" as APILayer {
  component "Flask Backend" as Flask
  component "Routers" as Routes
}

component "Service\nLayer" as ServiceLayer {
  component "Auth Service" as Auth
  component "Upload Service" as Upload
  component "Processing Service" as Process
  component "AI Service" as AI
  component "Report Service" as Report
}

component "Data\nLayer" as DataLayer {
  component "Database\nConnector" as DBConn
  component "File Storage\nConnector" as FileConn
  component "Cache" as Cache
}

component "AI/ML\nLayer" as MLLayer {
  component "DenseNet Model" as Model
  component "Preprocessor" as PreProc
}

component "External\nServices" as External {
  component "Firebase" as Firebase
  component "Cloudinary" as Cloudinary
  component "Gemini AI" as Gemini
}

' Connections
React --> UI
UI --> Routes
Routes --> Flask
Flask --> Auth
Flask --> Upload
Flask --> Process
Flask --> AI
Flask --> Report
Auth --> DBConn
Upload --> FileConn
Process --> Cache
AI --> Model
AI --> PreProc
Report --> Firebase
DBConn --> Firebase
FileConn --> Cloudinary
PreProc --> Model
Report --> Gemini

@enduml
```

---

## 3. Detailed Component with Interfaces (Most Professional)

```plantuml
@startuml MedAlze_Component_Professional
title MedAlze System - Component Diagram with Interfaces

' Define interfaces first
interface IAuthentication as IAuth << interface >>
interface IImageUpload as IUpload << interface >>
interface IImageProcessing as IProcess << interface >>
interface IAIPrediction as IAI << interface >>
interface IReportGeneration as IReport << interface >>
interface IDataAccess as IData << interface >>
interface INotification as INotif << interface >>
interface IExternalServices as IExternal << interface >>

' Frontend Components
component [React Application] as ReactApp implements IAuth, IUpload, IProcess, IAI, IReport, INotif

' API Layer Components
component [Flask REST API] as FlaskAPI implements IAuth, IUpload, IProcess, IAI, IReport, IData, INotif

' Service Components
component [Authentication Service] as AuthService implements IAuth
component [Upload Handler] as UploadHandler implements IUpload
component [Image Processor] as ImageProc implements IProcess
component [DenseNet Inference] as DenseNetInf implements IAI
component [Report Generator] as ReportGenerator implements IReport
component [Notification Engine] as NotifEngine implements INotif

' Data Access Components
component [Firebase Manager] as FirebaseManager implements IData
component [Cloudinary Manager] as CloudinaryManager implements IData
component [Model Cache] as ModelCache implements IData

' External Services Components
component [Firebase Services] as FirebaseExt implements IExternal
component [Cloudinary API] as CloudinaryAPI implements IExternal
component [Google Gemini API] as GeminiAPI implements IExternal

' AI/ML Components
component [DenseNet-121 Model] as DenseNetModel
component [Image Preprocessor] as ImgPreproc
component [PyTorch Runtime] as PyTorchRT

' Relationships
ReactApp --> FlaskAPI: uses

FlaskAPI --> AuthService: delegates
FlaskAPI --> UploadHandler: delegates
FlaskAPI --> ImageProc: delegates
FlaskAPI --> DenseNetInf: delegates
FlaskAPI --> ReportGenerator: delegates
FlaskAPI --> NotifEngine: delegates

AuthService --> FirebaseManager: uses
UploadHandler --> CloudinaryManager: uses
ImageProc --> ModelCache: uses
DenseNetInf --> ModelCache: uses
DenseNetInf --> ImgPreproc: uses
DenseNetInf --> DenseNetModel: uses
ReportGenerator --> FirebaseManager: uses

FirebaseManager --> FirebaseExt: connects
CloudinaryManager --> CloudinaryAPI: connects
ReportGenerator --> GeminiAPI: connects

ImgPreproc --> PyTorchRT: uses
DenseNetModel --> PyTorchRT: uses

@enduml
```

---

## 4. Component Diagram - Deployment View

```plantuml
@startuml MedAlze_Component_Deployment
title MedAlze - Component Deployment Architecture

' Deployment nodes
node "Client Browser" {
  component "React SPA" as SPA
  component "Redux Store" as Redux
  component "API Client" as APIClient
}

node "Frontend Server\n(Vercel)" {
  component "Next.js Build" as NextBuild
  component "Static Assets" as StaticAssets
  component "CDN Cache" as CDNCache
}

node "Backend Server\n(Render)" {
  component "Flask App" as Flask
  component "Gunicorn\nWSGI Server" as Gunicorn
  component "API Routes" as Routes
}

node "Processing Layer" {
  component "Request Handler" as ReqHandler
  component "Auth Middleware" as AuthMiddleware
  component "Image Processing" as ImgProc
  component "DenseNet Model" as Model
  component "Report Generator" as ReportGen
}

cloud "Firebase Cloud" {
  component "Authentication" as Auth
  component "Firestore DB" as Firestore
  component "Cloud Storage" as CloudStorage
}

cloud "Cloudinary Cloud" {
  component "Image CDN" as IMGCDN
  component "File Storage" as FileStor
}

cloud "Google Cloud" {
  component "Gemini API" as Gemini
}

' Connections
SPA --> Redux
Redux --> APIClient
APIClient --> Routes
NextBuild --> StaticAssets
StaticAssets --> CDNCache
CDNCache --> SPA

Routes --> Gunicorn
Gunicorn --> ReqHandler
ReqHandler --> AuthMiddleware
AuthMiddleware --> ImgProc
ImgProc --> Model
Model --> ReportGen

ReqHandler --> Auth
ReqHandler --> Firestore
ReqHandler --> CloudStorage
ImgProc --> IMGCDN
ImgProc --> FileStor
ReportGen --> Gemini

@enduml
```

---

## 5. Component Dependencies Graph

```plantuml
@startuml MedAlze_Component_Dependencies
title MedAlze - Component Dependencies

' Components
component Frontend
component API
component Auth
component ImageUpload
component ImageProcessing
component AIInference
component ReportGen
component Notification
component Database
component FileStorage
component Cache
component ExternalAPIs

' Dependencies
Frontend --> API: calls
API --> Auth: uses
API --> ImageUpload: uses
API --> AIInference: uses
API --> ReportGen: uses
API --> Notification: uses

Auth --> Database: queries
ImageUpload --> FileStorage: stores
ImageUpload --> Database: records

ImageProcessing --> Cache: uses
ImageProcessing --> FileStorage: reads

AIInference --> ImageProcessing: calls
AIInference --> Cache: uses

ReportGen --> AIInference: depends
ReportGen --> ExternalAPIs: calls
ReportGen --> Database: stores

Notification --> Database: reads
Notification --> Frontend: sends

FileStorage --> ExternalAPIs: (Cloudinary)
Database --> ExternalAPIs: (Firebase)
ExternalAPIs --> ExternalAPIs: (Gemini)

@enduml
```

---

## 6. Text-Based Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    MedAlze Component Architecture               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER (Vercel)                    │
├─────────────────────────────────────────────────────────────────┤
│  • React Application                                             │
│  • TypeScript Components                                         │
│  • Redux State Management                                        │
│  • Tailwind CSS Styling                                          │
│  • Form Validation                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                  API GATEWAY LAYER (Flask/Render)               │
├─────────────────────────────────────────────────────────────────┤
│  • Flask REST API Server                                         │
│  • Gunicorn WSGI Server                                          │
│  • Request Router                                                │
│  • Middleware (Auth, CORS, Logging)                              │
│  • Error Handler                                                 │
└─────────────────────────────────────────────────────────────────┘
           ↓ ↓ ↓ ↓ ↓ ↓ ↓
┌──────────────────────────────────────────────────────────────┐
│              BUSINESS LOGIC LAYER                            │
├──────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐  ┌─────────────────┐                    │
│ │Auth Service     │  │Upload Handler   │                    │
│ │- Login/Register │  │- File Validation│                    │
│ │- JWT Tokens     │  │- Size Check     │                    │
│ │- Verify User    │  │- Format Check   │                    │
│ └─────────────────┘  └─────────────────┘                    │
│ ┌─────────────────┐  ┌─────────────────┐                    │
│ │Image Processor  │  │AI Engine        │                    │
│ │- Resize 224x224 │  │- DenseNet Model │                    │
│ │- Normalize      │  │- Forward Pass   │                    │
│ │- Convert Tensor │  │- 14 Predictions │                    │
│ └─────────────────┘  └─────────────────┘                    │
│ ┌─────────────────┐  ┌─────────────────┐                    │
│ │Report Generator │  │Notification Svc │                    │
│ │- Gemini Prompt  │  │- Send Alerts    │                    │
│ │- JSON Format    │  │- Track Status   │                    │
│ │- Validation     │  │- Email/SMS      │                    │
│ └─────────────────┘  └─────────────────┘                    │
└──────────────────────────────────────────────────────────────┘
           ↓ ↓ ↓ ↓ ↓ ↓ ↓
┌──────────────────────────────────────────────────────────────┐
│              DATA ACCESS LAYER                               │
├──────────────────────────────────────────────────────────────┤
│ • Firebase Connector (Firestore)                             │
│ • Cloudinary Connector (Image CDN)                           │
│ • Model Cache Manager                                        │
│ • Database Connection Pool                                   │
└──────────────────────────────────────────────────────────────┘
        ↓           ↓            ↓
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│   Firebase   │ │Cloudinary│ │Google Gemini │
│   Firestore  │ │   CDN    │ │    API       │
└──────────────┘ └──────────┘ └──────────────┘

┌──────────────────────────────────────────────────────────────┐
│              AI/ML LAYER                                     │
├──────────────────────────────────────────────────────────────┤
│ • DenseNet-121 Model (27 MB)                                 │
│ • Image Preprocessor                                         │
│ • Model Loader (lazy-loaded)                                 │
│ • PyTorch Runtime                                            │
│ • GPU/CPU Support                                            │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. Component Interaction Matrix

| Component | Depends On | Used By | Purpose |
|-----------|-----------|---------|---------|
| **Frontend** | API, Redux | Browser | User Interface |
| **API Gateway** | Services, DB | Frontend | Request Router |
| **Auth Service** | Firebase, DB | API | Authentication |
| **Upload Handler** | Cloudinary, DB | API | File Management |
| **Image Processor** | Cache, PyTorch | AI Engine | Preprocessing |
| **AI Engine** | DenseNet Model | Report Gen | Inference |
| **Report Generator** | Gemini API, DB | Notification | Report Creation |
| **Notification** | DB, Frontend | API | Alerts |
| **Firebase Manager** | Firestore | All Services | Data Storage |
| **Cloudinary Manager** | Cloudinary API | Upload/Process | File Storage |
| **Model Cache** | PyTorch | AI Engine | Model Management |
| **DenseNet Model** | PyTorch | AI Engine | ML Inference |

---

## How to Use in Your Thesis

### **Best Option for Thesis: #1 (Component Diagram - PlantUML)**
- ✅ Shows all components organized by layers
- ✅ Shows interfaces and connections
- ✅ Professional appearance
- ✅ Easy to export as PNG/SVG

### **Online PlantUML Editor:**
1. Go to: https://www.plantuml.com/plantuml/uml/
2. Copy code from Section 1, 2, or 3
3. Paste and click "Update"
4. Export as PNG/SVG/PDF

### **In VS Code:**
```bash
# Install PlantUML extension
# Create file: component.puml
# Paste code and right-click → Preview
```

---

**Use Component Diagram #1 for your thesis - it's the most comprehensive!** 📊
