# MedAlze Entity Relationship Diagram - Classical Chen Style

## 1. Main ER Diagram - PlantUML Classical Format

```plantuml
@startuml MedAlze_Classical_ERD
title MedAlze - Classical Entity Relationship Diagram

' Entities as rectangles
entity "Users" as users {
  * user_id : UUID
  --
  email : STRING
  password_hash : STRING
  full_name : STRING
  role : ENUM
  is_active : BOOLEAN
  created_at : TIMESTAMP
}

entity "Patients" as patients {
  * patient_id : UUID
  --
  date_of_birth : DATE
  gender : ENUM
  blood_type : STRING
  medical_history : TEXT
  emergency_contact : STRING
}

entity "XRayImages" as xrays {
  * xray_id : UUID
  --
  image_url : STRING
  cloudinary_id : STRING
  image_type : STRING
  upload_date : TIMESTAMP
  file_size : INTEGER
  is_processed : BOOLEAN
}

entity "AIPredictions" as predictions {
  * prediction_id : UUID
  --
  model_version : STRING
  predictions_json : JSON
  confidence_scores : JSON
  primary_finding : STRING
  inference_time : FLOAT
}

entity "MedicalReports" as reports {
  * report_id : UUID
  --
  findings : TEXT
  impression : TEXT
  recommendations : TEXT
  report_status : ENUM
  radiologist_notes : TEXT
  doctor_notes : TEXT
  generated_at : TIMESTAMP
  approved_at : TIMESTAMP
}

entity "DoctorAssignments" as assignments {
  * assignment_id : UUID
  --
  status : ENUM
  assignment_date : TIMESTAMP
  completion_date : TIMESTAMP
}

entity "Notifications" as notifications {
  * notification_id : UUID
  --
  type : STRING
  title : STRING
  message : TEXT
  is_read : BOOLEAN
  created_at : TIMESTAMP
}

' Relationships with cardinality
users ||--o{ patients : "has profile"
users ||--o{ xrays : "uploads"
patients ||--o{ xrays : "owns"
xrays ||--o{ predictions : "analyzed by"
xrays ||--o{ reports : "generates"
predictions ||--o{ reports : "informs"
users ||--o{ reports : "creates/approves"
reports ||--o{ assignments : "assigned in"
users ||--o{ assignments : "assigned to"
users ||--o{ notifications : "receives"

@enduml
```

---

## 2. Chen-Style Diagram Description

Below is the **textual representation** of the classical Chen ER diagram:

```
┌─────────────────────────────────────────────────────────────────┐
│                         MEDALLZE ER DIAGRAM                     │
│                      (Classical Chen Style)                      │
└─────────────────────────────────────────────────────────────────┘

ENTITIES (Rectangles):
═══════════════════════

┌──────────────────┐
│     USERS        │
├──────────────────┤
│ PK: user_id      │
│ email (UNIQUE)   │
│ password_hash    │
│ full_name        │
│ role             │
│ is_active        │
│ created_at       │
└──────────────────┘

┌──────────────────┐
│    PATIENTS      │
├──────────────────┤
│ PK: patient_id   │
│ FK: user_id      │
│ date_of_birth    │
│ gender           │
│ blood_type       │
│ medical_history  │
│ emergency_contact│
└──────────────────┘

┌──────────────────┐
│   XRAY_IMAGES    │
├──────────────────┤
│ PK: xray_id      │
│ FK: patient_id   │
│ FK: radiologist_id
│ image_url        │
│ cloudinary_id    │
│ image_type       │
│ upload_date      │
│ is_processed     │
└──────────────────┘

┌──────────────────┐
│  AI_PREDICTIONS  │
├──────────────────┤
│ PK: prediction_id│
│ FK: xray_id      │
│ model_version    │
│ predictions_json │
│ confidence_scores│
│ primary_finding  │
│ inference_time   │
└──────────────────┘

┌──────────────────┐
│ MEDICAL_REPORTS  │
├──────────────────┤
│ PK: report_id    │
│ FK: xray_id      │
│ FK: patient_id   │
│ FK: radiologist_id
│ FK: doctor_id    │
│ findings         │
│ impression       │
│ recommendations  │
│ report_status    │
│ generated_at     │
│ approved_at      │
└──────────────────┘

┌──────────────────┐
│ DOCTOR_ASSIGN    │
├──────────────────┤
│ PK: assignment_id│
│ FK: report_id    │
│ FK: doctor_id    │
│ FK: assigned_by  │
│ status           │
│ assignment_date  │
│ completion_date  │
└──────────────────┘

┌──────────────────┐
│  NOTIFICATIONS   │
├──────────────────┤
│ PK: notif_id     │
│ FK: user_id      │
│ type             │
│ message          │
│ is_read          │
│ created_at       │
└──────────────────┘


RELATIONSHIPS (Diamonds):
════════════════════════

         "has"
    USERS ──────────── PATIENTS
      │
      │ "uploads"
      │
    XRAY_IMAGES
      │
      ├─ "owned by" → PATIENTS
      │
      ├─ "analyzed" → AI_PREDICTIONS
      │
      └─ "generates" → MEDICAL_REPORTS
                          │
                          ├─ "informed by" → AI_PREDICTIONS
                          │
                          ├─ "created by" → USERS (Radiologist)
                          │
                          ├─ "approved by" → USERS (Doctor)
                          │
                          └─ "assigned in" → DOCTOR_ASSIGNMENTS
                                               │
                                               └─ "assigned to" → USERS (Doctor)

    USERS ──────────── NOTIFICATIONS
            "receives"


CARDINALITY NOTATION:
════════════════════

Entity1 ──── 1:N ──── Entity2
(One-to-Many)

Entity1 ──── 1:1 ──── Entity2
(One-to-One)

Entity1 ──── M:N ──── Entity2
(Many-to-Many)
```

---

## 3. Draw.io Native ER Diagram Format

Here's a Draw.io compatible format using native ER shapes:

```
Go to Draw.io → Shapes Panel → Search "ER" 
You'll find:
- Entity (Rectangle)
- Attribute (Oval)
- Relationship (Diamond)
- Line Connector

Build diagram like this:

[Oval: user_id] ─┐
[Oval: email]   ─┼─→ [Rectangle: USERS] ←─ [Diamond: has] ←─ [Rectangle: PATIENTS]
[Oval: role]    ─┘                                             ↓
                                                        [Oval: patient_id]
                                                        [Oval: dob]
                                                        [Oval: gender]
                                                               │
                                                               └─ [Diamond: owns] ← [Rectangle: XRAY_IMAGES]
                                                                                            │
                                                                                    [Oval: xray_id]
                                                                                    [Oval: image_url]
                                                                                    [Oval: upload_date]
```

---

## 4. Mermaid ER Diagram Format

```mermaid
erDiagram
    USERS {
        uuid user_id PK
        string email UK
        string password_hash
        string full_name
        enum role
        boolean is_active
        timestamp created_at
    }
    
    PATIENTS {
        uuid patient_id PK
        uuid user_id FK
        date date_of_birth
        enum gender
        string blood_type
        text medical_history
        string emergency_contact
    }
    
    XRAY_IMAGES {
        uuid xray_id PK
        uuid patient_id FK
        uuid radiologist_id FK
        string image_url
        string cloudinary_id
        string image_type
        timestamp upload_date
        boolean is_processed
    }
    
    AI_PREDICTIONS {
        uuid prediction_id PK
        uuid xray_id FK
        string model_version
        json predictions_json
        json confidence_scores
        string primary_finding
        float inference_time
    }
    
    MEDICAL_REPORTS {
        uuid report_id PK
        uuid xray_id FK
        uuid patient_id FK
        uuid radiologist_id FK
        uuid doctor_id FK
        text findings
        text impression
        text recommendations
        enum report_status
        timestamp generated_at
        timestamp approved_at
    }
    
    DOCTOR_ASSIGNMENTS {
        uuid assignment_id PK
        uuid report_id FK
        uuid doctor_id FK
        uuid assigned_by FK
        enum status
        timestamp assignment_date
    }
    
    NOTIFICATIONS {
        uuid notification_id PK
        uuid user_id FK
        string type
        text message
        boolean is_read
        timestamp created_at
    }
    
    USERS ||--o{ PATIENTS : "has"
    USERS ||--o{ XRAY_IMAGES : "uploads"
    PATIENTS ||--o{ XRAY_IMAGES : "owns"
    XRAY_IMAGES ||--o{ AI_PREDICTIONS : "analyzed_by"
    XRAY_IMAGES ||--o{ MEDICAL_REPORTS : "generates"
    AI_PREDICTIONS ||--o{ MEDICAL_REPORTS : "informs"
    USERS ||--o{ MEDICAL_REPORTS : "creates_approves"
    MEDICAL_REPORTS ||--o{ DOCTOR_ASSIGNMENTS : "assigned_in"
    USERS ||--o{ DOCTOR_ASSIGNMENTS : "assigned_to"
    USERS ||--o{ NOTIFICATIONS : "receives"
```

---

## 5. How to Create in Draw.io

### Step-by-Step:

1. **Open Draw.io**
   - Go to https://draw.io/
   - Create new blank diagram

2. **Add ER Shapes** (from left panel)
   - Search for "entity" → drag ER Entity box
   - Search for "oval" → drag attributes
   - Search for "diamond" → drag relationship box

3. **Create Entities** (Rectangles)
   - Draw 7 rectangles
   - Label: USERS, PATIENTS, XRAY_IMAGES, AI_PREDICTIONS, MEDICAL_REPORTS, DOCTOR_ASSIGNMENTS, NOTIFICATIONS

4. **Add Attributes** (Ovals - outside entities)
   - For USERS: user_id (underlined/primary key), email, password_hash, full_name, role
   - For PATIENTS: patient_id, date_of_birth, gender, blood_type, medical_history
   - For XRAY_IMAGES: xray_id, image_url, cloudinary_id, upload_date
   - For AI_PREDICTIONS: prediction_id, predictions_json, confidence_scores
   - For MEDICAL_REPORTS: report_id, findings, impression, recommendations, status
   - For DOCTOR_ASSIGNMENTS: assignment_id, status, assignment_date
   - For NOTIFICATIONS: notification_id, type, message, is_read

5. **Connect Attributes to Entities**
   - Draw lines from each oval to its entity
   - (Like the image you showed)

6. **Add Relationships** (Diamonds)
   - Between USERS and PATIENTS: label "has"
   - Between USERS and XRAY_IMAGES: label "uploads"
   - Between PATIENTS and XRAY_IMAGES: label "owns"
   - Between XRAY_IMAGES and AI_PREDICTIONS: label "analyzed by"
   - Between XRAY_IMAGES and MEDICAL_REPORTS: label "generates"
   - Between MEDICAL_REPORTS and DOCTOR_ASSIGNMENTS: label "assigned in"

7. **Add Cardinality**
   - 1 to N (one-to-many)
   - 1 to 1 (one-to-one)
   - Label on connecting lines

8. **Format & Export**
   - Right-click entities → Format cells → colors
   - File → Export as PNG/SVG

---

## 6. Classical ER Symbols

```
Entity          ┌──────────┐
(Rectangle)     │  Entity  │
                └──────────┘

Attribute       ╭─────────╮
(Oval)          │ Attribute│
                ╰─────────╯

Relationship    ◇─────────◇
(Diamond)       │ Relation │
                ◇─────────◇

Weak Entity     ┌──────┬──────┐
(Double Box)    │Entity│Entity│
                └──────┴──────┘

Primary Key     ┌──────────┐
(Underlined)    │ *user_id │
                └──────────┘

Foreign Key     ┌──────────┐
(Dashed box)    │ #doctor_id
                └──────────┘

Cardinality:
1:1 (One to One)
1:N (One to Many)
M:N (Many to Many)
```

---

## 7. Your Diagram Structure (Like Your Image)

```
                    ┌─────────────┐
                    │ Attributes  │
                    └─────────────┘
                         / | \
                        /  |  \
            ┌─────────┐ ┌──┴──┐ ┌──────────┐
            │user_id  │ │ ... │ │ doctor_id│
            └─────────┘ └─────┘ └──────────┘
                 \       |       /
                  \      |      /
                   ▼     ▼     ▼
                  ┌──────────────┐
                  │    USERS     │◇────── "has" ─────◇┌──────────┐
                  ├──────────────┤                      │ PATIENTS │
                  │ PK: user_id  │                      └──────────┘
                  │ email        │
                  │ password     │
                  │ full_name    │
                  │ role         │
                  └──────────────┘
                        │
                        │ "uploads"
                        ◇
                  ┌──────────────┐
                  │XRAY_IMAGES   │
                  ├──────────────┤
                  │ PK: xray_id  │
                  │ image_url    │
                  │ upload_date  │
                  └──────────────┘
                        │
                   ┌────┴─────┬────────────┐
                   │           │            │
              "analyzed" "generates"   ...
                   ◇           ◇
                   │           │
            ┌──────────┐  ┌──────────────┐
            │PREDICTIONS │ │MEDICAL_REPORTS
            └──────────┘  └──────────────┘
                             │
                        "assigned_in"
                             ◇
                        ┌────────────────┐
                        │ DOCTOR_ASSIGN  │
                        └────────────────┘
```

---

## Quick Reference: Cardinality Symbols

```
1:1 Relationship    Entity1 ──── Entity2
(One to One)

1:N Relationship    Entity1 ──┬─ Entity2
(One to Many)                 │
                              └─ Entity2

M:N Relationship    Entity1 ┬─┼─┬ Entity2
(Many to Many)              │ │ │
                            └─┼─┘
```

---

**Perfect for Draw.io visualization!** 🎨
