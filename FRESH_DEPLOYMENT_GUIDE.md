# MedAlze Deployment - Complete Setup Guide from Scratch

## Phase 1: Prepare Your Repository

### Step 1.1: Verify Backend Files
Your backend must have these files:
```
backend/
├── app.py                 ✅ (Flask API)
├── model.py               ✅ (DenseNet-121)
├── utils.py               ✅ (Image preprocessing)
├── requirements.txt       ✅ (Python dependencies)
├── model/
│   └── chexnet.pth        ✅ (Model weights)
└── static/
    └── uploads/           ✅ (Temp upload folder)
```

### Step 1.2: Verify Frontend Files
```
src/
├── App.tsx
├── main.tsx
├── index.css
├── pages/
├── components/
├── utils/
├── contexts/
├── hooks/
└── lib/

Public files:
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .env.production
```

### Step 1.3: Environment Files
Create these if missing:

**backend/.env**
```env
FLASK_APP=app.py
FLASK_ENV=production
MODEL_PATH=model/chexnet.pth
GEMINI_API_KEY=AIzaSyBYj5fKR3mHh8Mne9Qdv3Sbj9EpKn5KakQ
UPLOAD_FOLDER=static/uploads
```

**.env.production** (in root)
```env
VITE_FLASK_BACKEND_URL=https://medalze.onrender.com
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_preset
```

---

## Phase 2: Deploy Backend on Render (Fresh Start)

### Step 2.1: Go to Render Dashboard
1. Open: https://dashboard.render.com
2. Login with your GitHub account
3. Click **"New +"** → **"Web Service"**

### Step 2.2: Connect GitHub Repository
1. Select your repository: `amna-T/MedAlze`
2. Connect & Authorize
3. Select branch: `main`
4. Root directory: leave blank (use root)

### Step 2.3: Configure Web Service

| Setting | Value |
|---------|-------|
| **Name** | `medalze-backend` |
| **Environment** | `Python 3` |
| **Build Command** | `pip install -r backend/requirements.txt` |
| **Start Command** | `cd backend && gunicorn -w 1 --timeout 300 app:app` |
| **Plan** | Free |

### Step 2.4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

| Key | Value | Notes |
|-----|-------|-------|
| `FLASK_APP` | `app.py` | Flask entry point |
| `FLASK_ENV` | `production` | Production mode |
| `MODEL_PATH` | `model/chexnet.pth` | Model file path |
| `GEMINI_API_KEY` | `AIzaSyBYj5fKR3mHh8Mne9Qdv3Sbj9EpKn5KakQ` | Your API key |
| `UPLOAD_FOLDER` | `static/uploads` | Upload directory |

**Important:** Set `GEMINI_API_KEY` to **NOT sync** (it's sensitive)

### Step 2.5: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Check logs for:
   ```
   ==> Your service is live 🎉
   Available at: https://medalze.onrender.com
   ```

### Step 2.6: Note Your Backend URL
```
Your Backend URL: https://medalze.onrender.com
```

---

## Phase 3: Deploy Frontend on Vercel (Fresh Start)

### Step 3.1: Go to Vercel Dashboard
1. Open: https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Import GitHub repository
4. Select: `amna-T/MedAlze`

### Step 3.2: Configure Project

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` (or `pnpm run build`) |
| **Output Directory** | `dist` |
| **Install Command** | `pnpm install` (or `npm install`) |

### Step 3.3: Add Environment Variables

Click **"Environment Variables"** and add for **Production** environment:

| Key | Value |
|-----|-------|
| `VITE_FLASK_BACKEND_URL` | `https://medalze.onrender.com` |
| `VITE_FIREBASE_API_KEY` | Your Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Your Firebase domain |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `VITE_CLOUDINARY_CLOUD_NAME` | Your Cloudinary name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Your Cloudinary preset |

### Step 3.4: Deploy
1. Click **"Deploy"**
2. Wait for build (3-5 minutes)
3. Get your frontend URL:
   ```
   Your Frontend URL: https://med-alze.vercel.app
   ```

---

## Phase 4: Verify Deployment

### Step 4.1: Test Backend Health
```bash
curl https://medalze.onrender.com/
```

Expected response:
```json
{
  "status": "MedAlze Flask API is running!",
  "model_loaded": false,
  "gemini_initialized": true
}
```

### Step 4.2: Test Connectivity
```bash
curl -X GET https://medalze.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": false,
  "gemini_initialized": true
}
```

### Step 4.3: Test Debug Info
```bash
curl https://medalze.onrender.com/debug
```

Should show model path, upload folder, and all routes.

### Step 4.4: Test Frontend
1. Open: https://med-alze.vercel.app
2. You should see the login page
3. No CORS errors should appear

---

## Phase 5: End-to-End Testing

### Test 5.1: Login as Radiologist
```
Email: radiologist@medalze.com
Password: (your password)
```

### Test 5.2: Upload X-ray
1. Click "Upload X-ray"
2. Select a chest X-ray image (PNG/JPG)
3. Choose a patient
4. Click "Upload"
5. **First upload: Wait 40-60 seconds** (model loads)
6. Should see predictions with confidence scores

### Test 5.3: Generate Report
1. After predictions appear
2. Click "Generate Report"
3. Wait for Gemini AI to process
4. Should see formatted medical report
5. Check for: Summary, Findings, Impression, Recommendations

### Test 5.4: Doctor Approval
1. Logout (or new tab)
2. Login as Doctor:
   ```
   Email: doctor@medalze.com
   Password: (your password)
   ```
3. Should see assigned case
4. Review predictions and report
5. Add notes and approve
6. Patient should be notified

### Test 5.5: Patient Access
1. Logout
2. Login as Patient:
   ```
   Email: patient@medalze.com
   Password: (your password)
   ```
3. Should see their X-rays
4. Should see approved report
5. Should be able to download PDF

---

## Phase 6: Troubleshooting

### Issue: Backend not starting
**Symptom:** `Build failed` or `Worker timeout`

**Solution:**
1. Check Render logs
2. Ensure `requirements.txt` has all dependencies:
   ```
   Flask==3.0.0
   flask-cors==4.0.0
   torch==2.0.0
   torchvision==0.15.0
   google-generativeai==0.3.0
   python-dotenv==1.0.0
   gunicorn==21.0.0
   Pillow==10.0.0
   numpy==1.24.0
   requests==2.31.0
   ```
3. Ensure `model/chexnet.pth` exists in repository
4. Redeploy from Render dashboard

### Issue: Frontend can't reach backend
**Symptom:** CORS error or "Failed to fetch"

**Solution:**
1. Check `VITE_FLASK_BACKEND_URL` in Vercel environment variables
2. Should be: `https://medalze.onrender.com` (no trailing slash)
3. Redeploy frontend
4. Clear browser cache (Ctrl+Shift+Delete)

### Issue: Model loading timeout
**Symptom:** `WORKER TIMEOUT` or `502 Bad Gateway`

**Solution:**
1. Already set to 300 seconds in `render.yaml`
2. First request takes 40-60 seconds (normal)
3. If still failing:
   - Check Render logs for specific errors
   - Increase timeout to 600 seconds
   - Or upgrade to paid Render plan

### Issue: Gemini API key error
**Symptom:** "API key expired" or "Invalid API key"

**Solution:**
1. Get new API key from: https://aistudio.google.com/apikey
2. Update in Render environment variables
3. Restart service
4. Test report generation

### Issue: Cloudinary upload fails
**Symptom:** "Failed to upload image" or 403 error

**Solution:**
1. Verify Cloudinary credentials in `.env.production`
2. Check upload preset exists in Cloudinary dashboard
3. Ensure upload preset allows unsigned uploads

---

## Phase 7: Post-Deployment Checklist

- [ ] Backend deployed and health check passes
- [ ] Frontend deployed and loads without errors
- [ ] CORS headers present in network tab
- [ ] X-ray upload works (first one slow, ~40-60 seconds)
- [ ] AI predictions display with confidence scores
- [ ] Report generation works with Gemini
- [ ] Doctor can approve reports
- [ ] Patient can download reports
- [ ] Notifications work
- [ ] No console errors in browser
- [ ] No 502/503 errors in backend logs
- [ ] Model caching works (2nd upload faster)

---

## Phase 8: Production Optimization

### Monitor Backend Performance
Go to Render dashboard → Logs
- Watch for errors
- Check response times
- Monitor CPU/Memory usage

### Monitor Frontend Performance
Go to Vercel dashboard → Analytics
- Page load times
- User errors
- Network issues

### Enable Analytics
Add to your README:
- Backend: https://medalze.onrender.com
- Frontend: https://med-alze.vercel.app
- Status: ✅ Live

---

## Important URLs

| Service | URL | Type |
|---------|-----|------|
| Backend API | https://medalze.onrender.com | Production |
| Frontend App | https://med-alze.vercel.app | Production |
| Render Dashboard | https://dashboard.render.com | Admin |
| Vercel Dashboard | https://vercel.com/dashboard | Admin |
| Firebase Console | https://console.firebase.google.com | Admin |
| Cloudinary Dashboard | https://cloudinary.com/console | Admin |

---

## Key Files for Fresh Deployment

**Critical files that must exist:**
1. ✅ `backend/app.py` - Flask application
2. ✅ `backend/model.py` - DenseNet model loading
3. ✅ `backend/utils.py` - Image preprocessing
4. ✅ `backend/requirements.txt` - Python dependencies
5. ✅ `backend/model/chexnet.pth` - Model weights
6. ✅ `backend/Procfile` - (optional, for compatibility)
7. ✅ `render.yaml` - Render configuration
8. ✅ `src/main.tsx` - React entry point
9. ✅ `vite.config.ts` - Vite configuration
10. ✅ `package.json` - Node dependencies

---

## Next Steps After Deployment

1. **Monitor Logs**
   - Render: Check logs every 30 minutes for first day
   - Vercel: Check for build errors

2. **Test All Workflows**
   - Complete X-ray → Report → Approval → Patient Download flow
   - Test error scenarios

3. **Optimize Performance**
   - Cache model between requests (already done)
   - Monitor memory usage
   - Optimize image preprocessing

4. **Set Up Alerts**
   - Render: Enable error alerts
   - Vercel: Enable deployment alerts
   - Firebase: Enable security alerts

5. **Documentation**
   - Update README with deployment info
   - Document API endpoints
   - Create user guides

---

**Deployment Complete!** 🎉

Your MedAlze system is now live and ready for use. Start testing workflows immediately!
