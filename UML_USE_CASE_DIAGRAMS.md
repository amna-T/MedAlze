# MedAlze UML Use Case Diagrams

## 1. PlantUML - Main System Use Case Diagram

```plantuml
@startuml MedAlze_Main_UseCase
!define AWSPUML https://raw.githubusercontent.com/awslabs/aws-icons-for-plantuml/v14.0/dist
!include AWSPUML/AWSCommon.puml

title MedAlze - Main Use Case Diagram

left to right direction

actor Radiologist as R
actor Doctor as D
actor Patient as P
actor Admin as A

rectangle "MedAlze System" {
  usecase "Upload X-ray" as UC1
  usecase "View AI Predictions" as UC2
  usecase "Generate Medical Report" as UC3
  usecase "Assign to Doctor" as UC4
  usecase "Review & Approve" as UC5
  usecase "Download Report" as UC6
  usecase "Manage Users" as UC7
  usecase "View Analytics" as UC8
}

R --> UC1
R --> UC2
R --> UC3
R --> UC4
D --> UC5
D --> UC2
P --> UC6
A --> UC7
A --> UC8

UC1 .> UC2 : <<include>>
UC3 .> UC2 : <<include>>
UC5 .> UC2 : <<include>>

@enduml
```

---

## 2. PlantUML - Radiologist Detailed Use Cases

```plantuml
@startuml MedAlze_Radiologist_UseCase
title MedAlze - Radiologist Use Cases

left to right direction

actor Radiologist

rectangle "Radiologist Dashboard" {
  usecase "Select X-ray File" as UC1
  usecase "Choose Patient" as UC2
  usecase "Upload to Cloud" as UC3
  usecase "Trigger AI Analysis" as UC4
  usecase "View Predictions" as UC5
  usecase "Review Results" as UC6
  usecase "Generate Report" as UC7
  usecase "Assign Doctor" as UC8
  usecase "View History" as UC9
}

Radiologist --> UC1
UC1 --> UC2 : uses
UC2 --> UC3 : uses
UC3 --> UC4 : uses
UC4 --> UC5 : uses
UC5 --> UC6 : uses
UC6 --> UC7 : uses
UC7 --> UC8 : uses
Radiologist --> UC9

UC3 .> UC4 : <<include>>
UC4 .> UC5 : <<include>>
UC7 .> UC5 : <<include>>

@enduml
```

---

## 3. PlantUML - Doctor Approval Workflow

```plantuml
@startuml MedAlze_Doctor_UseCase
title MedAlze - Doctor Use Cases

left to right direction

actor Doctor

rectangle "Doctor Dashboard" {
  usecase "Receive Case Assignment" as UC1
  usecase "View X-ray Image" as UC2
  usecase "Review AI Predictions" as UC3
  usecase "Read Generated Report" as UC4
  usecase "Add Clinical Notes" as UC5
  usecase "Verify Findings" as UC6
  usecase "Approve Report" as UC7
  usecase "Notify Patient" as UC8
}

Doctor --> UC1
UC1 --> UC2 : uses
UC2 --> UC3 : uses
UC3 --> UC4 : uses
UC4 --> UC5 : uses
UC5 --> UC6 : uses
UC6 --> UC7 : uses
UC7 --> UC8 : uses

UC3 .> UC4 : <<include>>
UC6 .> UC7 : <<include>>
UC7 .> UC8 : <<include>>

@enduml
```

---

## 4. PlantUML - Patient Portal Use Cases

```plantuml
@startuml MedAlze_Patient_UseCase
title MedAlze - Patient Use Cases

left to right direction

actor Patient

rectangle "Patient Portal" {
  usecase "Register Account" as UC1
  usecase "Login" as UC2
  usecase "View X-ray History" as UC3
  usecase "View Medical Reports" as UC4
  usecase "Download PDF Report" as UC5
  usecase "Receive Notifications" as UC6
  usecase "Manage Profile" as UC7
  usecase "Share Report" as UC8
}

Patient --> UC1
UC1 --> UC2 : uses
Patient --> UC2
UC2 --> UC3 : uses
UC3 --> UC4 : uses
UC4 --> UC5 : uses
UC4 --> UC6 : uses
Patient --> UC7
UC5 --> UC8 : extends

@enduml
```

---

## 5. PlantUML - Admin Management Use Cases

```plantuml
@startuml MedAlze_Admin_UseCase
title MedAlze - Admin Use Cases

left to right direction

actor Admin

rectangle "Admin Control Panel" {
  usecase "Manage User Accounts" as UC1
  usecase "Create New User" as UC2
  usecase "Delete User" as UC3
  usecase "Reset Password" as UC4
  usecase "Monitor System Activity" as UC5
  usecase "View Analytics Dashboard" as UC6
  usecase "Generate System Reports" as UC7
  usecase "Configure Settings" as UC8
  usecase "Backup Database" as UC9
}

Admin --> UC1
UC1 --> UC2 : uses
UC1 --> UC3 : uses
UC1 --> UC4 : uses
Admin --> UC5
UC5 --> UC6 : uses
UC6 --> UC7 : uses
Admin --> UC8
Admin --> UC9

UC2 .> UC4 : <<include>>
UC3 .> UC4 : <<include>>
UC5 .> UC6 : <<include>>

@enduml
```

---

## 6. PlantUML - Complete System with All Actors

```plantuml
@startuml MedAlze_Complete_System
!define DIRECTION left to right direction

title MedAlze - Complete System Use Case Diagram

left to right direction

actor Radiologist as R
actor Doctor as D
actor Patient as P
actor Admin as A

rectangle "MedAlze Medical Imaging System" {
  
  rectangle "X-ray Management" {
    usecase "Upload X-ray" as UC_Upload
    usecase "Store in Cloud" as UC_Store
    usecase "View Image" as UC_View
    usecase "Delete X-ray" as UC_Delete
  }
  
  rectangle "AI Analysis" {
    usecase "Run DenseNet Model" as UC_Model
    usecase "Get Predictions" as UC_Pred
    usecase "Display Results" as UC_Display
  }
  
  rectangle "Report Generation" {
    usecase "Generate Report" as UC_GenReport
    usecase "Review Report" as UC_ReviewReport
    usecase "Approve Report" as UC_ApproveReport
    usecase "Edit Report" as UC_EditReport
  }
  
  rectangle "Patient Access" {
    usecase "View Own Reports" as UC_ViewOwn
    usecase "View Report Details" as UC_ViewDetails
    usecase "Receive Notifications" as UC_Notify
  }
  
  rectangle "Administration" {
    usecase "Manage Users" as UC_ManageUsers
    usecase "System Monitoring" as UC_Monitor
    usecase "View Analytics" as UC_Analytics
    usecase "System Configuration" as UC_Config
  }
}

R --> UC_Upload
R --> UC_View
R --> UC_Model
R --> UC_GenReport
R --> UC_ReviewReport

D --> UC_ReviewReport
D --> UC_ApproveReport
D --> UC_View

P --> UC_ViewOwn
P --> UC_ViewDetails

A --> UC_ManageUsers
A --> UC_Monitor
A --> UC_Analytics
A --> UC_Config

UC_Upload --> UC_Store : uses
UC_Upload --> UC_Model : triggers
UC_Model --> UC_Pred : uses
UC_Pred --> UC_Display : uses
UC_Display --> UC_GenReport : uses
UC_GenReport --> UC_ReviewReport : uses
UC_ReviewReport --> UC_ApproveReport : uses
UC_ApproveReport --> UC_ViewOwn : uses
UC_ViewOwn --> UC_ViewDetails : uses
UC_ApproveReport --> UC_Notify : uses

@enduml
```

---

## 7. PlantUML - Authentication & Authorization

```plantuml
@startuml MedAlze_Auth_UseCase
title MedAlze - Authentication & Authorization Use Cases

actor User

rectangle "Authentication System" {
  usecase "Login" as UC_Login
  usecase "Register" as UC_Register
  usecase "Forgot Password" as UC_ForgotPwd
  usecase "Verify Email" as UC_VerifyEmail
  usecase "Reset Password" as UC_ResetPwd
  usecase "Multi-Factor Auth" as UC_MFA
}

rectangle "Authorization" {
  usecase "Check User Role" as UC_Role
  usecase "Set Permissions" as UC_Permissions
  usecase "Access Dashboard" as UC_Dashboard
  usecase "View Restricted Content" as UC_Restricted
}

User --> UC_Register
UC_Register --> UC_VerifyEmail : uses
User --> UC_Login
UC_Login --> UC_MFA : uses
UC_Login --> UC_Role : uses
UC_Role --> UC_Permissions : uses
UC_Permissions --> UC_Dashboard : uses
UC_Dashboard --> UC_Restricted : uses

User --> UC_ForgotPwd
UC_ForgotPwd --> UC_ResetPwd : uses
UC_ResetPwd --> UC_Login : uses

@enduml
```

---

## 8. PlantUML - X-ray Processing Pipeline

```plantuml
@startuml MedAlze_Pipeline_UseCase
title MedAlze - X-ray Processing Pipeline

actor Radiologist

rectangle "Processing Pipeline" {
  usecase "Upload X-ray" as UC1
  usecase "Validate Image" as UC2
  usecase "Preprocess Image" as UC3
  usecase "Run AI Model" as UC4
  usecase "Generate Predictions" as UC5
  usecase "Create Report Draft" as UC6
  usecase "Gemini AI Enhancement" as UC7
  usecase "Format Report" as UC8
  usecase "Radiologist Review" as UC9
  usecase "Doctor Assignment" as UC10
}

Radiologist --> UC1
UC1 --> UC2 : uses
UC2 --> UC3 : uses
UC3 --> UC4 : uses
UC4 --> UC5 : uses
UC5 --> UC6 : uses
UC6 --> UC7 : uses
UC7 --> UC8 : uses
UC8 --> UC9 : uses
UC9 --> UC10 : uses

UC1 .> UC2 : <<include>>
UC3 .> UC4 : <<include>>
UC5 .> UC6 : <<include>>
UC7 .> UC8 : <<include>>
UC9 .> UC10 : <<include>>

@enduml
```

---

## 9. PlantUML - Error Handling & Recovery

```plantuml
@startuml MedAlze_Error_UseCase
title MedAlze - Error Handling & Recovery

actor User
actor Admin

rectangle "Error Handling" {
  usecase "File Upload Fails" as UC_UploadFail
  usecase "Retry Upload" as UC_Retry
  usecase "Model Timeout" as UC_Timeout
  usecase "API Error" as UC_APIError
  usecase "Database Error" as UC_DBError
  usecase "Notify User" as UC_NotifyUser
  usecase "Alert Admin" as UC_AlertAdmin
  usecase "Log Error" as UC_LogError
  usecase "Recovery Process" as UC_Recovery
}

User --> UC_UploadFail
UC_UploadFail --> UC_Retry : uses
UC_Retry --> UC_NotifyUser : uses
UC_UploadFail --> UC_LogError : uses

UC_Timeout --> UC_AlertAdmin : uses
UC_APIError --> UC_AlertAdmin : uses
UC_DBError --> UC_AlertAdmin : uses

UC_AlertAdmin --> UC_Recovery : uses
UC_Recovery --> UC_NotifyUser : uses

UC_NotifyUser .> UC_LogError : <<include>>

@enduml
```

---

## 10. XMI Format (For UML Tools)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<uml:Model xmi:version="20131001" xmlns:xmi="http://www.omg.org/XMI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore" xmlns:uml="http://www.omg.org/uml/3.0.0/uml.ecore" xmi:id="_MedAlze_UseCaseModel" name="MedAlze Use Case Model">
  <ownedComment xmi:id="_comment1" annotatedElement="_MedAlze_UseCaseModel">
    <body>MedAlze Medical Imaging System - Use Case Diagram</body>
  </ownedComment>
  
  <packagedElement xmi:type="uml:UseCase" xmi:id="_UC_Upload" name="Upload X-ray">
    <ownedComment xmi:id="_UC_Upload_comment">
      <body>Radiologist uploads chest X-ray image to system</body>
    </ownedComment>
  </packagedElement>
  
  <packagedElement xmi:type="uml:UseCase" xmi:id="_UC_Analyze" name="Analyze with AI">
    <ownedComment xmi:id="_UC_Analyze_comment">
      <body>DenseNet-121 model analyzes X-ray and generates predictions</body>
    </ownedComment>
  </packagedElement>
  
  <packagedElement xmi:type="uml:UseCase" xmi:id="_UC_GenReport" name="Generate Report">
    <ownedComment xmi:id="_UC_GenReport_comment">
      <body>Gemini AI generates medical report based on predictions</body>
    </ownedComment>
  </packagedElement>
  
  <packagedElement xmi:type="uml:UseCase" xmi:id="_UC_Review" name="Review & Approve">
    <ownedComment xmi:id="_UC_Review_comment">
      <body>Doctor reviews and approves the medical report</body>
    </ownedComment>
  </packagedElement>
  
  <packagedElement xmi:type="uml:UseCase" xmi:id="_UC_Download" name="Download Report">
    <ownedComment xmi:id="_UC_Download_comment">
      <body>Patient downloads report as PDF</body>
    </ownedComment>
  </packagedElement>
  
  <packagedElement xmi:type="uml:Actor" xmi:id="_A_Radiologist" name="Radiologist"/>
  <packagedElement xmi:type="uml:Actor" xmi:id="_A_Doctor" name="Doctor"/>
  <packagedElement xmi:type="uml:Actor" xmi:id="_A_Patient" name="Patient"/>
  <packagedElement xmi:type="uml:Actor" xmi:id="_A_Admin" name="Admin"/>
  
  <packagedElement xmi:type="uml:Association" xmi:id="_Assoc_R_Upload">
    <memberEnd xmi:id="_Assoc_R_Upload_end1" name="" type="_A_Radiologist"/>
    <memberEnd xmi:id="_Assoc_R_Upload_end2" name="" type="_UC_Upload"/>
  </packagedElement>
  
  <packagedElement xmi:type="uml:Association" xmi:id="_Assoc_Upload_Analyze">
    <memberEnd xmi:id="_Assoc_Upload_Analyze_end1" name="" type="_UC_Upload"/>
    <memberEnd xmi:id="_Assoc_Upload_Analyze_end2" name="" type="_UC_Analyze"/>
  </packagedElement>
  
  <packagedElement xmi:type="uml:Association" xmi:id="_Assoc_Analyze_GenReport">
    <memberEnd xmi:id="_Assoc_Analyze_GenReport_end1" name="" type="_UC_Analyze"/>
    <memberEnd xmi:id="_Assoc_Analyze_GenReport_end2" name="" type="_UC_GenReport"/>
  </packagedElement>
  
  <packagedElement xmi:type="uml:Association" xmi:id="_Assoc_D_Review">
    <memberEnd xmi:id="_Assoc_D_Review_end1" name="" type="_A_Doctor"/>
    <memberEnd xmi:id="_Assoc_D_Review_end2" name="" type="_UC_Review"/>
  </packagedElement>
  
  <packagedElement xmi:type="uml:Association" xmi:id="_Assoc_P_Download">
    <memberEnd xmi:id="_Assoc_P_Download_end1" name="" type="_A_Patient"/>
    <memberEnd xmi:id="_Assoc_P_Download_end2" name="" type="_UC_Download"/>
  </packagedElement>
</uml:Model>
```

---

## How to Use These UML Codes

### PlantUML (Recommended)
**Tools:** Lucidchart, Visual Paradigm, PlantUML Online
```
1. Go to www.plantuml.com/plantuml/uml/
2. Paste the PlantUML code
3. Auto-renders as UML diagram
4. Export as PNG/SVG
```

### In VS Code
```
1. Install PlantUML extension
2. Create .puml file
3. Paste code
4. Preview with Alt+D
```

### In GitHub
```
1. Create PLANTUML_USECASE.md
2. Add code blocks with ```plantuml
3. GitHub auto-renders
```

### StarUML / Enterprise Architect
```
1. Import XMI file
2. Or manually recreate from diagram
3. Export to various formats
```

### ArchiMate / TOGAF
```
1. Use PlantUML code as reference
2. Map to ArchiMate notation
3. Import into Enterprise Architect
```

---

## Key Relationships in UML Notation

| Notation | Meaning |
|----------|---------|
| `-->` | Association (actor uses use case) |
| `.>` | Dependency (with stereotype) |
| `<<include>>` | Mandatory inclusion |
| `<<extend>>` | Optional extension |
| `<<uses>>` | General association |

---

## Export Options

All PlantUML diagrams can be exported to:
- ✅ PNG (high quality)
- ✅ SVG (scalable vector)
- ✅ PDF (for documents)
- ✅ EPS (for printing)
- ✅ ASCII (for plain text)

**File Naming Convention:**
```
MedAlze_[ComponentName]_UseCase.[format]
- MedAlze_Main_UseCase.png
- MedAlze_Radiologist_UseCase.svg
- MedAlze_Complete_System.pdf
```

---

**Total UML Diagrams:** 10 comprehensive use case diagrams ✅
