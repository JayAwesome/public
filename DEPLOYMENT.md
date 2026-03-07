# Deployment Guide - CyberSafe Local

## Deploying to Render (Recommended - Free Tier Available)

### Prerequisites
- GitHub account with your code pushed
- Render account (free at https://render.com)

### Step-by-Step Deployment

#### 1. Push Latest Changes to GitHub
```powershell
cd "c:\Users\JayAwesome\Documents\3MTT\public"
git add .
git commit -m "Add Procfile and package.json for deployment"
git push origin master
```

#### 2. Create Render Account
1. Go to https://render.com
2. Sign up with your GitHub account
3. Click "Connect GitHub" when prompted

#### 3. Create New Web Service on Render
1. On Render dashboard, click **+ New** → **Web Service**
2. Select your GitHub repository (cybersafe-local)
3. Fill in the form:
   - **Name**: `cybersafe-local`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free (or Paid Starter if you want 24/7 uptime)

#### 4. Set Environment Variables
In the Render dashboard:
1. Scroll to **Environment** section
2. Add these variables:
```
PORT=3000
NODE_ENV=production
SESSION_SECRET=your-secret-key-generate-random-string
ALLOWED_ORIGIN=https://your-render-app-name.onrender.com
```

**Generate a SESSION_SECRET** (run in PowerShell):
```powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([guid]::NewGuid().ToString()))
```

#### 5. Deploy
1. Click **Create Web Service**
2. Render will automatically deploy your app
3. Wait ~2-3 minutes for deployment to complete
4. You'll get a URL like: `https://cybersafe-local.onrender.com`

#### 6. Update Frontend for Production
Update the fetch requests in `script.js` to use your production API URL:

Change:
```javascript
fetch('/api/csrf-token')
```

To:
```javascript
fetch('https://your-app-name.onrender.com/api/csrf-token')
```

Or keep using relative paths if served from same domain.

### Alternative: Deploy to Railway (Also Free)

#### 1. Connection
1. Go to https://railway.app
2. Sign up with GitHub
3. Create new project → Deploy from GitHub repo

#### 2. Configure
1. Select your repository
2. Railway auto-detects Node.js
3. Add environment variables same as Render

#### 3. Deploy
Click "Deploy" - Railway handles everything automatically

### Alternative: Deploy to Heroku

#### 1. Install Heroku CLI
```powershell
# Install via chocolatey or download from heroku.com
choco install heroku-cli
# OR download from https://devcenter.heroku.com/articles/heroku-cli
```

#### 2. Login to Heroku
```powershell
heroku login
```

#### 3. Create Heroku App
```powershell
cd "c:\Users\JayAwesome\Documents\3MTT\public"
heroku create cybersafe-local
```

#### 4. Set Environment Variables
```powershell
heroku config:set SESSION_SECRET=your-secret-key
heroku config:set NODE_ENV=production
```

#### 5. Deploy
```powershell
git push heroku master
```

### Testing Your Deployment

After deployment:

1. **Test API endpoint**:
   ```
   https://your-app-name.onrender.com/api/csrf-token
   ```
   Should return JSON with `csrfToken`

2. **Test form submission**:
   Visit your app URL and submit the assessment

3. **Check logs** (Render):
   Dashboard → Logs tab

## Troubleshooting

### "Cannot GET /"
- Make sure `server.js` is configured correctly
- Check that all static files are in the same directory

### "JSON.parse: unexpected character"
- The API endpoint is returning HTML instead of JSON
- Could be a crash - check the deployment logs

### "Port already in use"
- The port is hardcoded in the environment
- Make sure you're using the `PORT` environment variable

### "CORS error"
- Update `ALLOWED_ORIGIN` in environment variables
- Include the full URL without trailing slash

## Monitoring & Scaling

- **Render**: Free tier spins down after 15 mins of inactivity (~3 second cold start)
- **Railway**: Free $5/month credit, then pay-as-you-go
- **Heroku**: Free dyno discontinued (paid only now)

For production use:
- Render Starter Plan: $7/month
- Railway: Pay-as-you-go (usually $5-20/month)
- AWS: Variable pricing

## Next Steps

1. Deploy backend to Render/Railway/Heroku
2. Get your production URL
3. Update `script.js` API endpoints if needed
4. Test the full workflow in production
5. Share your deployment URL!

## Support

For deployment issues:
- **Render Support**: https://render.com/docs
- **Railway Support**: https://docs.railway.app
- **Heroku Support**: https://devcenter.heroku.com

