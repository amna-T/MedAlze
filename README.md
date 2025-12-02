# MedALze - AI-Powered Chest X-Ray Analysis System

An intelligent medical imaging platform that uses deep learning to analyze chest X-rays and generate comprehensive diagnostic reports with multi-role access control.

## 🎯 Overview

MedALze is a full-stack healthcare application that combines:
- **AI-Powered Analysis**: DenseNet-121 CheXNet model for chest X-ray predictions
- **Report Generation**: Google Gemini API for intelligent medical report creation
- **Role-Based Access**: Admin, Doctor, Radiologist, and Patient portals
- **Real-Time Notifications**: Firebase-powered updates and alerts
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🏗️ Architecture

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context API + Firebase Authentication
- **Deployment**: Vercel
- **URL**: https://medalze.vercel.app

### Backend
- **Framework**: Flask 3.0.3
- **Language**: Python 3.13
- **ML Framework**: PyTorch 2.6.0
- **Model**: DenseNet-121 (CheXNet) - 27MB
- **AI Integration**: Google Generative AI (Gemini)
- **Deployment**: Render
- **URL**: https://medalze-1.onrender.com

### Database
- **Platform**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Cloud Storage (for X-ray images)
- **Rules**: Role-based access control

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Python 3.13+
- Git
- Firebase account
- Google Generative AI API key
- Cloudinary account (for image uploads)

### Local Setup

#### Frontend
\\\ash
cd medalze
pnpm install
pnpm dev
\\\
Runs on \http://localhost:5173\

#### Backend
\\\ash
cd backend
pip install -r requirements.txt
python app.py
\\\
Runs on \http://localhost:5000\

### Environment Variables

**Frontend (.env.production)**
\\\env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
VITE_FLASK_BACKEND_URL=https://medalze-1.onrender.com
\\\

**Backend (.env in backend/ folder)**
\\\env
GEMINI_API_KEY=your_gemini_api_key
MODEL_PATH=model/chexnet.pth
UPLOAD_FOLDER=static/uploads
\\\

## 🔑 Key Features

### 1. **X-Ray Analysis**
- Upload chest X-ray images (PNG, JPG, JPEG, GIF)
- AI-powered predictions on 14 medical conditions
- Confidence scores and probability rankings

### 2. **Report Generation**
- Automatic report creation using Google Gemini AI
- Sections: Summary, Findings, Impression, Recommendations
- Professional medical formatting

### 3. **Role-Based Dashboards**
- **Admin**: Patient management, user management, system monitoring
- **Radiologist**: Patient analysis, report generation, history tracking
- **Doctor**: Patient access, report viewing, prescription management
- **Patient**: Personal records, appointments, prescriptions

### 4. **Responsive Design**
- Desktop: Full feature table views
- Tablet: Optimized layouts
- Mobile: Card-based interfaces with touch-friendly controls

## 🔧 Technologies Used

**Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Firebase
**Backend**: Flask 3.0.3, PyTorch 2.6.0, Google Generative AI, scikit-learn
**Database**: Firebase Firestore
**Deployment**: Vercel (Frontend), Render (Backend)

## 🤖 AI Models

- **CheXNet (DenseNet-121)**: NIH ChestX-ray14 trained model for 14 chest conditions
- **Google Gemini 2.5 Flash**: Professional medical report generation

## 🔐 Security

- Role-based access control (RBAC) via Firebase
- JWT authentication
- CORS protection
- Input validation and sanitization

## 📊 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| \/\ | GET | Health check |
| \/health\ | GET | Lightweight status |
| \/predict\ | POST | X-ray analysis |
| \/generate_report\ | POST | Report generation |

## 📈 Performance

- X-ray analysis: ~7-8 seconds end-to-end
- Report generation: ~3-5 seconds
- Model loading (first request): 10-20 seconds
- Mobile response time: <3s first paint

## 🐛 Troubleshooting

**X-ray Upload Fails**: Check backend status at https://medalze-1.onrender.com/health
**Model Loading Slow**: Model loads lazily on first request (10-20s normal)
**Report Generation Issues**: Verify GEMINI_API_KEY is set in Render environment
**Firebase Issues**: Check security rules and credentials

## 📝 License

Proprietary - MedALze Healthcare System

---

**Live Deployment**
- Frontend: https://medalze.vercel.app
- Backend: https://medalze-1.onrender.com
- Repository: https://github.com/amna-T/MedAlze
