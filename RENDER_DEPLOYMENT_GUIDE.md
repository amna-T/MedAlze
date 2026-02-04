p0p0# Render Deployment Guide for MedAlze

This guide walks you through deploying the optimized backend with model preloading to Render.

## Prerequisites
- GitHub repository with the changes pushed (✅ Already done on branch `fix/model-preloading-optimization`)
- Render account at https://render.com
- Existing Render service for the backend API

## Step 1: Access Your Render Dashboard
1. Go to https://render.com and log in
2. Navigate to **Dashboard**
3. Find your backend service (e.g., `medalze-api-v2`)

## Step 2: Connect to GitHub (if not already done)
1. In Render Dashboard, click **New** → **Web Service**
2. Select **Deploy from a Git repository**
3. Click **Connect account** and authorize your GitHub account
4. Search for and select **amna-T/MedAlze** repository

## Step 3: Update Deployment Settings

### If Creating New Service:
1. **Name:** `medalze-api-v2`
2. **Root Directory:** `backend`
3. **Runtime:** `Python 3`
4. **Build Command:**
   ```bash
   pip install -r requirements.txt
   ```
5. **Start Command:**
   ```bash
   gunicorn -w 1 --timeout 300 app:app
   ```

### If Updating Existing Service:
1. Click on your existing service name
2. Go to **Settings** tab
3. Scroll to **Build & Deploy** section
4. Verify settings match above
5. Under **Deployment Branches**, ensure **main** or **fix/model-preloading-optimization** is selected

## Step 4: Set Environment Variables

Click **Environment** in your service settings and ensure these variables are set:

```
FLASK_APP=app.py
FLASK_ENV=production
MODEL_PATH=model/chexnet.pth
GEMINI_API_KEY=<your-api-key>
CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud>
CLOUDINARY_UPLOAD_PRESET=<your-preset>
```

**Important:** Mark `GEMINI_API_KEY` as **Secret** to prevent exposure in logs.

## Step 5: Deploy the Changes

### Option A: Automatic Deployment (Recommended)
1. Your branch `fix/model-preloading-optimization` is already pushed
2. Go to your service's **Deployments** tab
3. Click **Create Deployment** 
4. Select branch: `fix/model-preloading-optimization`
5. Click **Deploy**

### Option B: Trigger from GitHub
1. Merge the PR from `fix/model-preloading-optimization` → `main`
2. Render will automatically redeploy from main branch

### Option C: Manual Deployment
1. In your service, click **Manual Deploy**
2. Select the branch to deploy from
3. Click **Deploy**

## Step 6: Monitor Deployment

1. Go to **Logs** tab to watch the deployment progress
2. Look for these success messages:
   ```
   DEBUG: Preloading CheXNet model at startup...
   DEBUG: CheXNet model loaded successfully at startup.
   Backend initialized successfully. CheXNet model is preloaded and ready.
   ```
3. If you see errors, check:
   - Model file exists at `backend/model/chexnet.pth`
   - GEMINI_API_KEY is set correctly
   - All dependencies in requirements.txt are installed

## Step 7: Verify Deployment

Test the deployment:

```bash
# Check if API is running
curl https://your-render-service-url/health

# Test the predict endpoint
curl -X POST https://your-render-service-url/ready
```

Expected response:
```json
{
  "ready": true,
  "predict_endpoint": "/predict",
  "model_loaded": true
}
```

## Performance Improvements

After deployment, you'll see:
- **First X-ray prediction:** ~100-120 seconds (model loads once at startup)
- **Subsequent predictions:** ~5-10 seconds (only inference)

This is a **12x-20x speed improvement** for X-ray uploads!

## Troubleshooting

### Issue: Deployment Times Out
- **Cause:** Model takes >5 minutes to load (very rare)
- **Solution:** Increase `--timeout` in start command to 600 seconds

### Issue: Model Not Found Error
- **Cause:** Model file not in repository
- **Solution:** Ensure `backend/model/chexnet.pth` is in your git repo or upload via Render file storage

### Issue: Memory Errors
- **Cause:** Free tier Render instance has limited RAM
- **Solution:** Upgrade to paid plan or optimize model size

### Issue: Gemini API Errors
- **Cause:** Invalid API key or quota exceeded
- **Solution:** Verify GEMINI_API_KEY in environment variables

## Rollback (if needed)

If issues occur, rollback to previous version:
1. Go to **Deployments** tab
2. Find the previous successful deployment
3. Click **Redeploy**

## Next Steps

1. ✅ Push changes to GitHub (already done)
2. ✅ Set environment variables on Render (verify)
3. ⏳ Deploy using one of the options above
4. ✅ Verify with test requests
5. ✅ Merge PR to main for permanent deployment

## Support

For Render-specific issues:
- https://render.com/docs
- https://render.com/support

For MedAlze-specific issues:
- Check backend logs in Render dashboard
- Review git commit: `92806bc`
