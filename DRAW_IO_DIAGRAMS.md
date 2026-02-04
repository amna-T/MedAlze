# MedAlze Use Case Diagrams - Draw.io Compatible Mermaid

## 1. Main Use Case Diagram (Draw.io Compatible)

```mermaid
graph TB
    Radiologist["Radiologist"]
    Doctor["Doctor"]
    Patient["Patient"]
    Admin["Admin"]
    
    UploadXray["Upload X-ray"]
    ViewPrediction["View AI Prediction"]
    GenerateReport["Generate Report"]
    AssignDoctor["Assign Doctor"]
    
    ViewXrays["View Patient X-rays"]
    ReviewPredictions["Review Predictions"]
    ApproveReport["Approve/Comment Report"]
    
    Register["Register/Login"]
    ViewHistory["View X-ray History"]
    ReceiveNotif["Receive Notifications"]
    DownloadReports["Download Reports"]
    
    ManageUsers["Manage Users"]
    MonitorReports["Monitor Reports"]
    ViewAnalytics["View Analytics"]
    
    Radiologist --> UploadXray
    Radiologist --> ViewPrediction
    Radiologist --> GenerateReport
    Radiologist --> AssignDoctor
    
    Doctor --> ViewXrays
    Doctor --> ReviewPredictions
    Doctor --> ApproveReport
    
    Patient --> Register
    Patient --> ViewHistory
    Patient --> ReceiveNotif
    Patient --> DownloadReports
    
    Admin --> ManageUsers
    Admin --> MonitorReports
    Admin --> ViewAnalytics
```

---

## 2. Radiologist Workflow (Simplified)

```mermaid
graph TD
    A["Radiologist"] -->|1. Upload| B["X-ray Image"]
    B -->|2. Store| C["Cloudinary Storage"]
    C -->|3. Process| D["DenseNet-121 Model"]
    D -->|4. Generate| E["AI Predictions"]
    E -->|5. Review| F["View Predictions"]
    F -->|6. Generate| G["Medical Report"]
    G -->|7. Approve| H["Assign to Doctor"]
    H -->|8. Notify| I["Doctor Gets Case"]
```

---

## 3. Doctor Workflow (Simplified)

```mermaid
graph TD
    A["Doctor"] -->|1. Receive| B["Case Assignment"]
    B -->|2. View| C["X-ray Image"]
    C -->|3. Review| D["AI Predictions"]
    D -->|4. Read| E["Medical Report"]
    E -->|5. Add| F["Clinical Notes"]
    F -->|6. Approve| G["Report Status"]
    G -->|7. Notify| H["Patient Access"]
```

---

## 4. Patient Workflow (Simplified)

```mermaid
graph TD
    A["Patient"] -->|1. Register| B["Create Account"]
    B -->|2. Verify| C["Email Verification"]
    C -->|3. View| D["X-ray History"]
    D -->|4. Receive| E["Notifications"]
    E -->|5. Access| F["Medical Reports"]
    F -->|6. Download| G["PDF Report"]
```

---

## 5. Admin Workflow (Simplified)

```mermaid
graph TD
    A["Admin"] -->|1. Manage| B["User Accounts"]
    B -->|2. Monitor| C["System Reports"]
    C -->|3. View| D["Analytics Dashboard"]
    D -->|4. Generate| E["System Reports"]
    E -->|5. Export| F["Data Analysis"]
```

---

## 6. Complete System Architecture

```mermaid
graph TB
    subgraph Users["Users"]
        R["Radiologist"]
        D["Doctor"]
        P["Patient"]
        A["Admin"]
    end
    
    subgraph Frontend["Frontend - Vercel"]
        UI1["Radiologist UI"]
        UI2["Doctor Dashboard"]
        UI3["Patient Portal"]
        UI4["Admin Panel"]
    end
    
    subgraph Backend["Backend - Render"]
        API["Flask API"]
        AUTH["Firebase Auth"]
        QUEUE["Task Queue"]
    end
    
    subgraph AI["AI Processing"]
        MODEL["DenseNet-121"]
        GEMINI["Gemini AI"]
        PREP["Image Preprocessing"]
    end
    
    subgraph Data["Data & Storage"]
        DB["Firebase"]
        IMG["Cloudinary"]
    end
    
    R --> UI1
    D --> UI2
    P --> UI3
    A --> UI4
    
    UI1 --> API
    UI2 --> API
    UI3 --> API
    UI4 --> API
    
    API --> AUTH
    API --> MODEL
    API --> GEMINI
    API --> PREP
    API --> DB
    API --> IMG
```

---

## 7. X-ray Processing Flow

```mermaid
graph LR
    A["Upload"] --> B["Store in Cloud"]
    B --> C["Preprocess Image"]
    C --> D["Run AI Model"]
    D --> E["Get Predictions"]
    E --> F["Display Results"]
    F --> G["Generate Report"]
    G --> H["Assign Doctor"]
    H --> I["Doctor Reviews"]
    I --> J["Doctor Approves"]
    J --> K["Patient Access"]
    K --> L["Download PDF"]
```

---

## 8. Use Case - Upload X-ray

```mermaid
graph TD
    A["Radiologist"] -->|Select X-ray| B["Upload Dialog"]
    B -->|Choose File| C["Select Patient"]
    C -->|Add Metadata| D["Confirm Upload"]
    D -->|Send to Backend| E["Store in Cloud"]
    E -->|Create Record| F["X-ray Saved"]
    F -->|Trigger| G["AI Analysis Starts"]
```

---

## 9. Use Case - Generate Report

```mermaid
graph TD
    A["Radiologist"] -->|Click Generate| B["Prepare Data"]
    B -->|Send to AI| C["Gemini Processing"]
    C -->|Generate Content| D["Create Report"]
    D -->|Format Report| E["Display to Radiologist"]
    E -->|Review| F["Approve or Edit"]
    F -->|Save| G["Report Ready"]
```

---

## 10. Use Case - Approve Report

```mermaid
graph TD
    A["Doctor"] -->|Receive Case| B["View X-ray"]
    B -->|Review| C["Read Report"]
    C -->|Check| D["Verify AI Findings"]
    D -->|Add Notes| E["Clinical Assessment"]
    E -->|Approve| F["Update Status"]
    F -->|Notify| G["Patient Access"]
```

---

## 11. Authentication Flow

```mermaid
graph TD
    A["User"] -->|Enter Credentials| B["Firebase Auth"]
    B -->|Verify| C["Check User Type"]
    C -->|Radiologist| D["Load Radiologist UI"]
    C -->|Doctor| E["Load Doctor Dashboard"]
    C -->|Patient| F["Load Patient Portal"]
    C -->|Admin| G["Load Admin Panel"]
    D --> H["Access Granted"]
    E --> H
    F --> H
    G --> H
```

---

## 12. Report Status Workflow

```mermaid
graph LR
    A["New X-ray"] --> B["AI Analyzing"]
    B --> C["Predictions Ready"]
    C --> D["Report Generated"]
    D --> E["Doctor Assigned"]
    E --> F["Doctor Reviewing"]
    F --> G["Doctor Approved"]
    G --> H["Patient Notified"]
    H --> I["Patient Access"]
    I --> J["Downloaded"]
```

---

## 13. System Integration Points

```mermaid
graph TB
    Frontend["React Frontend"]
    API["Flask API"]
    Model["DenseNet Model"]
    Gemini["Gemini AI"]
    Firebase["Firebase"]
    Cloudinary["Cloudinary"]
    
    Frontend -->|HTTP Requests| API
    API -->|Run Inference| Model
    API -->|Generate Report| Gemini
    API -->|Read/Write| Firebase
    API -->|Upload/Download| Cloudinary
    
    Frontend -->|User Data| Firebase
    Frontend -->|Store Images| Cloudinary
```

---

## 14. Role-Based Access Control

```mermaid
graph TB
    User["User Login"] --> Auth["Authentication"]
    Auth --> RoleCheck["Check User Role"]
    
    RoleCheck -->|Radiologist| R["Upload X-rays<br/>View Predictions<br/>Generate Reports<br/>Assign Doctors"]
    RoleCheck -->|Doctor| D["View X-rays<br/>Review Predictions<br/>Approve Reports<br/>Add Clinical Notes"]
    RoleCheck -->|Patient| P["View Own X-rays<br/>View Reports<br/>Download PDFs<br/>Receive Notifications"]
    RoleCheck -->|Admin| A["Manage Users<br/>Monitor System<br/>View Analytics<br/>Export Reports"]
```

---

## 15. Error Handling Flow

```mermaid
graph TD
    A["User Action"] --> B["Send Request"]
    B --> C["Validate Input"]
    C -->|Valid| D["Process Request"]
    C -->|Invalid| E["Return Error 400"]
    D -->|Success| F["Return Success 200"]
    D -->|Server Error| G["Return Error 500"]
    E --> H["Show Error Message"]
    F --> I["Update UI"]
    G --> H
```

---

## How to Use in Draw.io

### Method 1: Import from Mermaid
1. Open draw.io
2. Go to **File → Import from → URL**
3. Use: `https://mermaid.live/` and paste code
4. Or manually recreate from description

### Method 2: Direct Paste
1. Create new diagram in draw.io
2. Paste these flowchart codes directly
3. draw.io will attempt to interpret

### Method 3: Use as Reference
If draw.io doesn't auto-render:
- Use the flowchart as a guide
- Manually create boxes and connections
- Follow the arrow directions shown

### Better Alternative for Draw.io:
These simplified flowchart formats work better in draw.io since it has native support for:
- **Graph (TB, TD, LR)** - flowchart direction
- **Boxes and arrows** - standard shapes
- **Subgraphs** - grouping related items

---

## Summary

All 15 diagrams use **draw.io compatible syntax**:
- ✅ No complex markdown features
- ✅ Simple graph TB/TD/LR syntax
- ✅ Basic shapes and connections
- ✅ Clean flowchart format
- ✅ Easy to understand hierarchy

**Choose the diagram that fits your documentation best!** 🎯
