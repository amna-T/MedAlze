# MedALze Troubleshooting Guide

## Current Issue: 502 Bad Gateway + CORS Error

### Root Cause
The backend at `https://medalze-1.onrender.com` is crashing when processing `/predict` requests.

### Recent Fixes Applied (Dec 2, 2025)
1. **Removed eager model loading** - Model was trying to load on startup, causing worker timeout
2. **Fully lazy model loading** - Model now loads only on first `/predict` request
3. **Enhanced error handling** - Better try-catch blocks and error messages
4. **Robust CORS headers** - Using both `before_request` and `after_request` hooks

### What to Do Now

#### Step 1: Wait for Render Redeploy (3-5 minutes)
- Latest commit: `f7786c0` (Add comprehensive error handling and debug endpoints)
- Render auto-deploys on push, but may take a few minutes

#### Step 2: Verify Backend is Running
```bash
# Test 1: Health Check
curl https://medalze-1.onrender.com/health

# Expected Response:
# {"status":"healthy","model_loaded":false,"gemini_initialized":true}

# Test 2: Debug Info
curl https://medalze-1.onrender.com/debug

# Expected Response includes paths and status

# Test 3: CORS Test
curl -X OPTIONS https://medalze-1.onrender.com/predict \
  -H "Origin: https://med-alze.vercel.app"

# Expected Response should include CORS headers
```

#### Step 3: Test X-Ray Upload
1. Go to `https://med-alze.vercel.app`
2. Upload a chest X-ray image
3. **First upload will take 15-20 seconds** (model loading)
4. Subsequent uploads will be 2-3 seconds

#### Step 4: Check Browser Console
- Open DevTools (F12)
- Go to Console tab
- Look for error messages
- Share exact error if it persists

### Expected Behavior

**Request Flow:**
```
1. Frontend: POST /predict with multipart/form-data (file)
   ↓
2. Backend: Receives request, loads model (if first time: ~15-20s)
   ↓
3. Backend: Preprocesses image (2-3s)
   ↓
4. Backend: Runs inference (1-2s)
   ↓
5. Backend: Returns JSON with predictions
   ↓
6. Frontend: Displays results
```

**Total Time:**
- First upload: ~20-25 seconds (includes model load)
- Subsequent uploads: ~5-7 seconds

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 502 Bad Gateway | Backend crash | Wait for redeploy, check Render logs |
| CORS error | Missing headers | Ensure `after_request` hook is active |
| Timeout (>30s) | Model still loading | This is normal for first request, be patient |
| "Failed to fetch" | Network error | Check Origin header matches CORS config |
| Model not loading | File permissions | Check backend/model/chexnet.pth exists |

### Render Dashboard Logs
1. Go to `https://dashboard.render.com`
2. Select `medalze-backend`
3. Click **Logs** tab
4. Look for:
   - ✅ "Backend initialized" message
   - ✅ "Loading CheXNet model on first request" (when first request arrives)
   - ✅ "/predict endpoint called" messages
   - ❌ Any ERROR messages with stack traces

### Debug Endpoints Available

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check if backend is alive (doesn't load model) |
| `/debug` | GET | Full server status including model state |
| `/test` | GET/POST | Simple CORS test |
| `/predict` | POST | Actual X-ray prediction (multipart/form-data) |

### Environment Variables Configured

**Frontend (.env.production):**
```
VITE_FLASK_BACKEND_URL=https://medalze-1.onrender.com
```

**Backend (Render Environment):**
- GEMINI_API_KEY=✅ Set
- MODEL_PATH=✅ Points to /opt/render/project/src/backend/model/chexnet.pth
- PORT=10000

### Next Steps if Issue Persists

1. **Check Render Logs** for exact error message
2. **Share the error** including:
   - Browser console error
   - Render backend log entry
   - Request size (file size)
3. **Possible causes to investigate:**
   - Model file corrupted
   - Out of memory on free tier
   - File upload size exceeds limit
   - PyTorch version incompatibility

### File Limits
- Max upload size: 50MB
- Supported formats: PNG, JPG, JPEG, GIF
- Recommended size: < 5MB

### Model Details
- **Name:** DenseNet-121 CheXNet
- **Size:** ~27MB
- **Load Time:** ~15-20 seconds (one-time)
- **Inference Time:** 1-2 seconds per image
- **Output:** 14 chest disease probabilities

---

**Last Updated:** December 2, 2025
**Latest Commit:** f7786c0
**Status:** Waiting for Render redeploy
