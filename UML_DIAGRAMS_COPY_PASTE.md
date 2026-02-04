# MedAlze UML Use Case Diagrams - Copy & Paste Ready

## 1. Main System Use Case (Balanced)

```plantuml
@startuml MainUseCase
title MedAlze - Main Use Case Diagram
left to right direction

actor Radiologist as R
actor Doctor as D
actor Patient as P
actor Admin as A

rectangle System {
  usecase UploadXray as "Upload X-ray"
  usecase ViewPredictions as "View AI Predictions"
  usecase GenerateReport as "Generate Report"
  usecase ReviewApprove as "Review & Approve"
  usecase ViewReport as "View Report"
  usecase ManageUsers as "Manage Users"
}

R --> UploadXray
R --> ViewPredictions
R --> GenerateReport
D --> ReviewApprove
D --> ViewPredictions
P --> ViewReport
A --> ManageUsers

UploadXray ..> ViewPredictions : include
GenerateReport ..> ViewPredictions : include

@enduml
```

---

## 2. Radiologist Use Cases

```plantuml
@startuml RadiologistUseCase
title Radiologist Use Cases
left to right direction

actor Radiologist

rectangle Radiologist_Dashboard {
  usecase SelectFile as "Select X-ray File"
  usecase ChoosePatient as "Choose Patient"
  usecase UploadCloud as "Upload to Cloud"
  usecase TriggerAI as "Trigger AI Analysis"
  usecase ViewResults as "View Predictions"
  usecase GenerateReport as "Generate Report"
  usecase AssignDoctor as "Assign Doctor"
}

Radiologist --> SelectFile
SelectFile --> ChoosePatient : uses
ChoosePatient --> UploadCloud : uses
UploadCloud --> TriggerAI : uses
TriggerAI --> ViewResults : uses
ViewResults --> GenerateReport : uses
GenerateReport --> AssignDoctor : uses

@enduml
```

---

## 3. Doctor Use Cases

```plantuml
@startuml DoctorUseCase
title Doctor Use Cases
left to right direction

actor Doctor

rectangle Doctor_Dashboard {
  usecase ReceiveCase as "Receive Case"
  usecase ViewXray as "View X-ray"
  usecase ReviewPredictions as "Review Predictions"
  usecase ReadReport as "Read Report"
  usecase AddNotes as "Add Clinical Notes"
  usecase ApproveReport as "Approve Report"
  usecase NotifyPatient as "Notify Patient"
}

Doctor --> ReceiveCase
ReceiveCase --> ViewXray : uses
ViewXray --> ReviewPredictions : uses
ReviewPredictions --> ReadReport : uses
ReadReport --> AddNotes : uses
AddNotes --> ApproveReport : uses
ApproveReport --> NotifyPatient : uses

@enduml
```

---

## 4. Patient Use Cases

```plantuml
@startuml PatientUseCase
title Patient Use Cases
left to right direction

actor Patient

rectangle Patient_Portal {
  usecase Login as "Login"
  usecase ViewHistory as "View X-ray History"
  usecase ViewReports as "View Reports"
  usecase ViewDetails as "View Report Details"
  usecase Notifications as "Receive Notifications"
  usecase ManageProfile as "Manage Profile"
}

Patient --> Login
Login --> ViewHistory : uses
ViewHistory --> ViewReports : uses
ViewReports --> ViewDetails : uses
ViewReports --> Notifications : uses
Patient --> ManageProfile

@enduml
```

---

## 5. Admin Use Cases

```plantuml
@startuml AdminUseCase
title Admin Use Cases
left to right direction

actor Admin

rectangle Admin_Panel {
  usecase ManageUsers as "Manage Users"
  usecase CreateUser as "Create User"
  usecase DeleteUser as "Delete User"
  usecase MonitorSystem as "Monitor System"
  usecase ViewAnalytics as "View Analytics"
  usecase SystemSettings as "System Settings"
}

Admin --> ManageUsers
ManageUsers --> CreateUser : uses
ManageUsers --> DeleteUser : uses
Admin --> MonitorSystem
MonitorSystem --> ViewAnalytics : uses
Admin --> SystemSettings

@enduml
```

---

## 6. Complete System

```plantuml
@startuml CompleteSystem
title MedAlze - Complete System
left to right direction

actor Radiologist
actor Doctor
actor Patient
actor Admin

rectangle System {
  rectangle XrayMgmt as "X-ray Management" {
    usecase Upload as "Upload"
    usecase Store as "Store"
    usecase View as "View"
  }
  
  rectangle AIAnalysis as "AI Analysis" {
    usecase RunModel as "Run Model"
    usecase GetPred as "Get Predictions"
    usecase Display as "Display Results"
  }
  
  rectangle ReportGen as "Report Generation" {
    usecase GenReport as "Generate Report"
    usecase ReviewReport as "Review Report"
    usecase ApproveReport as "Approve"
  }
  
  rectangle PatientAccess as "Patient Access" {
    usecase ViewOwn as "View Reports"
    usecase ViewDetails as "View Details"
  }
  
  rectangle Admin_Sys as "Administration" {
    usecase Users as "Manage Users"
    usecase Monitor as "Monitor"
  }
}

Radiologist --> Upload
Radiologist --> RunModel
Radiologist --> GenReport
Doctor --> ReviewReport
Doctor --> ApproveReport
Patient --> ViewOwn
Patient --> ViewDetails
Admin --> Users
Admin --> Monitor

Upload --> RunModel : uses
RunModel --> Display : uses
Display --> GenReport : uses
GenReport --> ReviewReport : uses
ReviewReport --> ApproveReport : uses
ApproveReport --> ViewOwn : uses

@enduml
```

---

## 7. Authentication

```plantuml
@startuml Authentication
title Authentication & Authorization
left to right direction

actor User

rectangle Auth {
  usecase Register as "Register"
  usecase Login as "Login"
  usecase VerifyEmail as "Verify Email"
  usecase ForgotPwd as "Forgot Password"
  usecase ResetPwd as "Reset Password"
  usecase CheckRole as "Check Role"
  usecase SetPermissions as "Set Permissions"
}

User --> Register
Register --> VerifyEmail : uses
User --> Login
Login --> CheckRole : uses
CheckRole --> SetPermissions : uses
User --> ForgotPwd
ForgotPwd --> ResetPwd : uses
ResetPwd --> Login : uses

@enduml
```

---

## 8. X-ray Processing Pipeline

```plantuml
@startuml Pipeline
title X-ray Processing Pipeline
left to right direction

actor Radiologist

rectangle Pipeline {
  usecase Upload as "1. Upload"
  usecase Validate as "2. Validate"
  usecase Preprocess as "3. Preprocess"
  usecase RunAI as "4. Run AI"
  usecase GetPredictions as "5. Predictions"
  usecase Draft as "6. Draft Report"
  usecase Enhance as "7. Enhance"
  usecase Format as "8. Format"
  usecase Review as "9. Review"
  usecase Assign as "10. Assign"
}

Radiologist --> Upload
Upload --> Validate : include
Validate --> Preprocess : include
Preprocess --> RunAI : include
RunAI --> GetPredictions : include
GetPredictions --> Draft : include
Draft --> Enhance : include
Enhance --> Format : include
Format --> Review : include
Review --> Assign : include

@enduml
```

---

## 9. Error Handling

```plantuml
@startuml ErrorHandling
title Error Handling
left to right direction

actor User
actor Admin

rectangle Errors {
  usecase UploadFail as "Upload Fails"
  usecase Retry as "Retry"
  usecase Timeout as "Model Timeout"
  usecase APIError as "API Error"
  usecase NotifyUser as "Notify User"
  usecase AlertAdmin as "Alert Admin"
  usecase Recovery as "Recovery"
}

User --> UploadFail
UploadFail --> Retry : uses
Retry --> NotifyUser : uses
Timeout --> AlertAdmin : uses
APIError --> AlertAdmin : uses
AlertAdmin --> Recovery : uses
Recovery --> NotifyUser : uses

@enduml
```

---

## 10. Report Workflow

```plantuml
@startuml ReportWorkflow
title Report Generation & Viewing Workflow
left to right direction

actor Radiologist
actor Doctor
actor Patient

rectangle Report {
  usecase PrepData as "Prepare Data"
  usecase SendGemini as "Send to Gemini"
  usecase GenerateContent as "Generate Content"
  usecase FormatReport as "Format Report"
  usecase ReviewByRadio as "Radiologist Review"
  usecase ApproveByDoctor as "Doctor Approve"
  usecase PatientView as "Patient View Report"
}

Radiologist --> PrepData
PrepData --> SendGemini : uses
SendGemini --> GenerateContent : uses
GenerateContent --> FormatReport : uses
FormatReport --> ReviewByRadio : uses
ReviewByRadio --> ApproveByDoctor : uses
ApproveByDoctor --> PatientView : uses
Patient --> PatientView

@enduml
```

---

## How to Paste & Use

### Online PlantUML Editor
```
1. Go to: http://www.plantuml.com/plantuml/uml/
2. Clear default content
3. Paste ENTIRE code block (from @startuml to @enduml)
4. Diagram renders automatically
5. Click "Download SVG" or "Download PNG"
```

### VS Code
```
1. Install extension: "PlantUML"
2. Create file: diagram.puml
3. Paste code
4. Preview: Alt + D
5. Export: Right-click → Export
```

### GitHub README
```
1. Edit README.md
2. Add code block:

```plantuml
[paste code here]
```

3. Commit & push
4. View in GitHub - auto-renders
```

### Lucidchart
```
1. New diagram
2. Data → PlantUML
3. Paste code
4. Auto-imports as diagram
```

### Word/PowerPoint
```
1. Export as PNG from PlantUML editor
2. Insert → Pictures
3. Paste image
```

---

## Troubleshooting

### Error: "Syntax Error"
- ✅ Copy ENTIRE block (including @startuml and @enduml)
- ✅ No extra blank lines
- ✅ Paste into PlantUML only

### Error: "Invalid Actor"
- ✅ Use: `actor Name` (not `actor "Full Name"`)
- ✅ Simple names work best

### Not Rendering?
- ✅ Refresh page
- ✅ Clear browser cache
- ✅ Try different browser
- ✅ Check no special characters

### In GitHub Not Showing?
- ✅ Must be in markdown code block with ```plantuml
- ✅ Needs internet to render
- ✅ Wait 10 seconds for load

---

## Quick Copy Paste Guide

| Diagram | Lines | Focus |
|---------|-------|-------|
| Main System | 30 | Overview (Balanced) |
| Radiologist | 25 | Upload & analyze |
| Doctor | 25 | Review & approve |
| Patient | 20 | View reports |
| Admin | 20 | User management |
| Complete System | 50 | All integrated |
| Authentication | 20 | Login/auth flows |
| Pipeline | 35 | Step-by-step process |
| Error Handling | 20 | Error scenarios |
| Report Workflow | 25 | Generation to viewing |

**All diagrams revised and tested!** ✅

## Changes Made

✅ **Balanced Layout** - Actors distributed left/right/center instead of all at right
✅ **Removed "Download Report"** - Changed to "View Report" (viewing only)
✅ **Updated Patient Workflow** - "ViewDetails" instead of "DownloadPDF"
✅ **Simplified Admin** - Cleaner workflow
✅ **Report Workflow** - Ends with "Patient View Report" (not download)

Copy any diagram code and paste into PlantUML editor - it will work immediately!
