# MedAlze: Data Flow Diagrams (DFD) & AI Model Architecture

## Part 1: Data Flow Diagram (DFD) - Level 0 (Context Diagram)

```mermaid
graph TB
    User["👤 Users<br/>(Radiologist/Doctor/Patient/Admin)"]
    System["🏥 MedAlze<br/>Medical Imaging System"]
    ExtServices["☁️ External Services<br/>(Firebase, Gemini, Cloudinary)"]
    
    User -->|Medical Images<br/>User Data| System
    System -->|Predictions<br/>Reports<br/>Notifications| User
    System -->|Authentication<br/>Data Storage| ExtServices
    ExtServices -->|Auth Tokens<br/>AI Reports<br/>Image URLs| System
    
    style System fill:#4A90E2,stroke:#2E5C8A,stroke-width:3px,color:#fff
    style User fill:#7ED321,stroke:#5AA217,stroke-width:2px,color:#fff
    style ExtServices fill:#F5A623,stroke:#C17A1A,stroke-width:2px,color:#fff
```

---

## Part 2: Data Flow Diagram (DFD) - Level 1 (Detailed Processes)

```mermaid
graph TB
    Users["👥 Users"]
    Auth["🔐 Process 1:<br/>Authentication<br/>(Login/Register)"]
    Upload["📤 Process 2:<br/>X-ray Upload<br/>& Validation"]
    Process["⚙️ Process 3:<br/>Image Processing<br/>& Preprocessing"]
    Predict["🧠 Process 4:<br/>AI Prediction<br/>(DenseNet Model)"]
    Report["📝 Process 5:<br/>Report Generation<br/>(Gemini AI)"]
    Store["💾 Process 6:<br/>Data Storage<br/>& Retrieval"]
    Notify["🔔 Process 7:<br/>Notifications"]
    
    Firebase["🔥 Data Store 1:<br/>Firebase Firestore<br/>(Users, Reports, Metadata)"]
    XrayDB["🖼️ Data Store 2:<br/>Cloudinary<br/>(X-ray Images)"]
    ModelCache["🧠 Data Store 3:<br/>Model Cache<br/>(DenseNet Weights)"]
    
    Users -->|Credentials| Auth
    Auth -->|User Token| Firebase
    Auth -->|Authenticated| Users
    
    Users -->|X-ray Image| Upload
    Upload -->|File Validation| Upload
    Upload -->|Valid Image| Process
    Upload -->|Image Metadata| Firebase
    
    Process -->|Preprocessed<br/>Tensor| Predict
    Process -->|Processing Log| Firebase
    
    Predict -->|14 Predictions<br/>+ Confidence| Report
    Predict -->|Model Cache| ModelCache
    
    Report -->|AI Generated<br/>Report JSON| Store
    Store -->|Save Report<br/>& Link| Firebase
    Store -->|Link Image| XrayDB
    
    Store -->|Report Status| Notify
    Notify -->|Alert Message| Users
    
    style Auth fill:#FF6B6B,stroke:#C92A2A,stroke-width:2px,color:#fff
    style Upload fill:#4ECDC4,stroke:#2B8A7E,stroke-width:2px,color:#fff
    style Process fill:#45B7D1,stroke:#2E7A8E,stroke-width:2px,color:#fff
    style Predict fill:#96CEB4,stroke:#5A9A6B,stroke-width:2px,color:#fff
    style Report fill:#FFEAA7,stroke:#D4A574,stroke-width:2px,color:#000
    style Store fill:#DDA0DD,stroke:#8B668B,stroke-width:2px,color:#fff
    style Notify fill:#FFB6C1,stroke:#8B5A5A,stroke-width:2px,color:#fff
    
    style Firebase fill:#FF9999,stroke:#CC5555,stroke-width:2px,color:#fff
    style XrayDB fill:#99CCFF,stroke:#5577CC,stroke-width:2px,color:#fff
    style ModelCache fill:#99FF99,stroke:#55CC55,stroke-width:2px,color:#fff
```

---

## Part 3: Detailed Data Flows

### 3.1: X-ray Upload to Prediction Flow

```mermaid
graph LR
    A["📱 Frontend<br/>Upload Page"]
    B["📤 File Validation<br/>- Check format<br/>- Check size<br/>- Check dimensions"]
    C["☁️ Cloudinary<br/>Upload"]
    D["⚙️ Backend<br/>Preprocessing<br/>- Resize<br/>- Normalize<br/>- Tensor conversion"]
    E["🧠 DenseNet Model<br/>Inference"]
    F["📊 Predictions<br/>14 conditions<br/>+ confidence scores"]
    G["💾 Firebase Store<br/>Save predictions<br/>& metadata"]
    H["✅ Return to Frontend<br/>Display predictions"]
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    
    style A fill:#4A90E2,stroke:#2E5C8A,color:#fff
    style B fill:#F5A623,stroke:#C17A1A,color:#fff
    style C fill:#99CCFF,stroke:#5577CC,color:#fff
    style D fill:#45B7D1,stroke:#2E7A8E,color:#fff
    style E fill:#96CEB4,stroke:#5A9A6B,color:#fff
    style F fill:#FFEAA7,stroke:#D4A574,color:#000
    style G fill:#FF9999,stroke:#CC5555,color:#fff
    style H fill:#4A90E2,stroke:#2E5C8A,color:#fff
```

### 3.2: Report Generation Flow

```mermaid
graph LR
    A["📊 AI Predictions<br/>(14 conditions)"]
    B["🧠 Gemini API<br/>Prompt Engineering<br/>Generate structured report"]
    C["📝 JSON Report<br/>- Summary<br/>- Findings<br/>- Impression<br/>- Recommendations"]
    D["💾 Firebase<br/>Store Report"]
    E["🏥 Doctor<br/>Review & Approve"]
    F["👤 Patient<br/>View Report"]
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    
    style A fill:#FFEAA7,stroke:#D4A574,color:#000
    style B fill:#96CEB4,stroke:#5A9A6B,color:#fff
    style C fill:#DDA0DD,stroke:#8B668B,color:#fff
    style D fill:#FF9999,stroke:#CC5555,color:#fff
    style E fill:#FFB6C1,stroke:#8B5A5A,color:#fff
    style F fill:#4A90E2,stroke:#2E5C8A,color:#fff
```

---

## Part 4: AI Model Architecture (DenseNet-121 / CheXNet)

### 4.1: Model Structure Diagram

```
INPUT LAYER
    ↓
[Chest X-ray Image]
(224 × 224 × 3 pixels)
    ↓
PREPROCESSING
    ├─ Resize to 224×224
    ├─ Normalize (ImageNet mean/std)
    └─ Convert to PyTorch Tensor
    ↓
DENSE BLOCK 1
    ├─ Convolutional Layer (64 filters, 7×7)
    ├─ Batch Normalization
    ├─ ReLU Activation
    └─ Max Pooling (3×3)
    ↓
DENSE BLOCK 2 (12 layers)
    ├─ Dense Connections (growth rate = 32)
    ├─ 1×1 → 3×3 Convolution
    ├─ Batch Normalization
    └─ ReLU Activation
    ↓
TRANSITION LAYER 1
    ├─ Compression (0.5x)
    └─ Average Pooling
    ↓
DENSE BLOCK 3 (12 layers)
    └─ [Same as DENSE BLOCK 2]
    ↓
TRANSITION LAYER 2
    └─ [Same as TRANSITION LAYER 1]
    ↓
DENSE BLOCK 4 (24 layers)
    └─ [Same as DENSE BLOCK 2]
    ↓
TRANSITION LAYER 3
    └─ [Same as TRANSITION LAYER 1]
    ↓
DENSE BLOCK 5 (16 layers)
    └─ [Same as DENSE BLOCK 2]
    ↓
GLOBAL AVERAGE POOLING
    └─ Output: (1024,)
    ↓
FULLY CONNECTED LAYERS
    ├─ Dense Layer (1024 → 512)
    ├─ ReLU Activation
    ├─ Dropout (0.5)
    └─ Dense Layer (512 → 14)
    ↓
SIGMOID ACTIVATION
    └─ Multi-label classification
    ↓
OUTPUT LAYER
    ↓
14 CONDITION PREDICTIONS (Probability Scores 0-1)
    ├─ Atelectasis
    ├─ Cardiomegaly
    ├─ Effusion
    ├─ Infiltration
    ├─ Mass
    ├─ Nodule
    ├─ Pneumonia
    ├─ Pneumothorax
    ├─ Consolidation
    ├─ Edema
    ├─ Emphysema
    ├─ Fibrosis
    ├─ Pleural_Thickening
    └─ Hernia
```

### 4.2: DenseNet Architecture Mermaid

```mermaid
graph TB
    Input["📥 Input<br/>224×224×3"]
    Conv1["Conv 7×7, stride=2<br/>64 channels"]
    Pool1["Max Pool 3×3"]
    DB1["Dense Block 1<br/>12 layers"]
    Trans1["Transition<br/>Compression"]
    DB2["Dense Block 2<br/>12 layers"]
    Trans2["Transition<br/>Compression"]
    DB3["Dense Block 3<br/>24 layers"]
    Trans3["Transition<br/>Compression"]
    DB4["Dense Block 4<br/>16 layers"]
    GAP["Global Avg Pool"]
    FC1["Fully Connected<br/>1024 → 512"]
    Drop["Dropout 0.5"]
    FC2["Fully Connected<br/>512 → 14"]
    Sigmoid["Sigmoid<br/>Multi-label"]
    Output["📤 Output<br/>14 Predictions"]
    
    Input --> Conv1
    Conv1 --> Pool1
    Pool1 --> DB1
    DB1 --> Trans1
    Trans1 --> DB2
    DB2 --> Trans2
    Trans2 --> DB3
    Trans3 --> DB4
    DB3 --> Trans3
    DB4 --> GAP
    GAP --> FC1
    FC1 --> Drop
    Drop --> FC2
    FC2 --> Sigmoid
    Sigmoid --> Output
    
    style Input fill:#FF6B6B,color:#fff
    style Conv1 fill:#4ECDC4,color:#fff
    style DB1 fill:#45B7D1,color:#fff
    style DB2 fill:#45B7D1,color:#fff
    style DB3 fill:#45B7D1,color:#fff
    style DB4 fill:#45B7D1,color:#fff
    style FC1 fill:#96CEB4,color:#fff
    style FC2 fill:#FFEAA7,color:#000
    style Output fill:#FF9999,color:#fff
```

### 4.3: Model Parameters & Performance

```
┌────────────────────────────────────────────────────┐
│         DenseNet-121 / CheXNet Specifications      │
├────────────────────────────────────────────────────┤
│ Architecture       │ DenseNet-121 (Pre-trained)    │
│ Input Size         │ 224 × 224 × 3 (RGB)           │
│ Total Parameters   │ ~7.97 million                  │
│ Model Size         │ ~27 MB (.pth file)             │
│ Pre-training Data  │ NIH ChestX-ray14 Dataset       │
│ Training Images    │ 112,120 chest X-rays           │
│ Number of Classes  │ 14 conditions (multi-label)    │
│ Output Layer       │ Sigmoid (multi-label)          │
│ Inference Time     │ 50-200ms per image             │
│ Memory Required    │ ~500MB (GPU) / 300MB (CPU)     │
│ Framework          │ PyTorch 2.0+                   │
├────────────────────────────────────────────────────┤
│ Conditions Detected (14 Labels):                   │
│ 1. Atelectasis     8. Pneumothorax                 │
│ 2. Cardiomegaly    9. Consolidation                │
│ 3. Effusion       10. Edema                        │
│ 4. Infiltration   11. Emphysema                    │
│ 5. Mass           12. Fibrosis                     │
│ 6. Nodule         13. Pleural Thickening           │
│ 7. Pneumonia      14. Hernia                       │
├────────────────────────────────────────────────────┤
│ Accuracy Metrics (on ChestX-ray14):                │
│ Average AUC       │ ~0.76 (across conditions)      │
│ Sensitivity       │ 70-85% (condition-dependent)   │
│ Specificity       │ 80-95% (condition-dependent)   │
└────────────────────────────────────────────────────┘
```

### 4.4: Pre/Post-Processing Pipeline

```mermaid
graph LR
    subgraph Preprocessing["🔄 Preprocessing"]
        P1["Load Image<br/>.jpg/.png"]
        P2["Resize<br/>→ 224×224"]
        P3["Normalize<br/>ImageNet stats"]
        P4["Convert<br/>→ Tensor"]
    end
    
    subgraph Model["🧠 DenseNet Model"]
        M1["Forward Pass<br/>through layers"]
    end
    
    subgraph Postprocessing["📊 Post-processing"]
        Post1["Sigmoid<br/>Activation"]
        Post2["Confidence<br/>Scores 0-1"]
        Post3["Sort by<br/>Confidence"]
        Post4["Format<br/>JSON Output"]
    end
    
    Input["📥 Input<br/>X-ray Image"]
    Output["📤 Output<br/>14 Predictions"]
    
    Input --> P1
    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> M1
    M1 --> Post1
    Post1 --> Post2
    Post2 --> Post3
    Post3 --> Post4
    Post4 --> Output
    
    style Preprocessing fill:#4ECDC4,stroke:#2B8A7E,stroke-width:2px,color:#fff
    style Model fill:#96CEB4,stroke:#5A9A6B,stroke-width:2px,color:#fff
    style Postprocessing fill:#FFEAA7,stroke:#D4A574,stroke-width:2px,color:#000
    style Input fill:#FF6B6B,stroke:#C92A2A,color:#fff
    style Output fill:#FF9999,stroke:#CC5555,color:#fff
```

---

## Part 5: Full System Data Pipeline

```mermaid
graph TB
    A["👤 Patient/Radiologist"]
    B["📱 Frontend React App"]
    C["🔐 Firebase Auth<br/>Verify user"]
    D["📤 Upload API<br/>/predict"]
    E["☁️ Cloudinary<br/>Store X-ray"]
    F["⚙️ Image Preprocessing<br/>Resize, Normalize"]
    G["🧠 DenseNet Model<br/>Load & Inference"]
    H["📊 Predictions<br/>14 conditions"]
    I["💬 Prompt Gemini<br/>Report generation"]
    J["📝 Medical Report<br/>JSON structured"]
    K["💾 Firebase Store<br/>Predictions + Report"]
    L["👨‍⚕️ Doctor Review<br/>Approve/Comment"]
    M["🔔 Notify Patient"]
    N["📥 Patient Views<br/>Report"]
    
    A -->|Upload X-ray| B
    B -->|Authenticate| C
    C -->|Verified| D
    D -->|Send image| E
    E -->|URL + File| F
    F -->|Tensor| G
    G -->|14 scores| H
    H -->|Condition data| I
    I -->|Generate| J
    J -->|Save| K
    K -->|Notify| L
    L -->|Approved| M
    M -->|Alert| N
    N -->|View| A
    
    style A fill:#FF6B6B,color:#fff
    style B fill:#4A90E2,color:#fff
    style C fill:#FF9999,color:#fff
    style D fill:#45B7D1,color:#fff
    style E fill:#99CCFF,color:#fff
    style F fill:#4ECDC4,color:#fff
    style G fill:#96CEB4,color:#fff
    style H fill:#FFEAA7,color:#000
    style I fill:#96CEB4,color:#fff
    style J fill:#DDA0DD,color:#fff
    style K fill:#FF9999,color:#fff
    style L fill:#FFB6C1,color:#fff
    style M fill:#FFA07A,color:#fff
    style N fill:#4A90E2,color:#fff
```

---

## Part 6: Summary Table - Diagrams for Thesis

| Diagram Type | Purpose | Uses For Thesis |
|--------------|---------|-----------------|
| **DFD Level 0** | System context | Show high-level overview |
| **DFD Level 1** | Process breakdown | Explain system components |
| **Sequence Flows** | Step-by-step workflows | Detail X-ray processing |
| **AI Model Architecture** | Model structure | Explain ML component |
| **Data Pipeline** | End-to-end flow | System integration |
| **ERD** | Database design | Data organization |
| **Use Case Diagram** | User interactions | Functional requirements |
| **Deployment Architecture** | System deployment | Infrastructure setup |

---

**These diagrams provide comprehensive documentation for your thesis!** 📊
