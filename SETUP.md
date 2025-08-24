# 🚀 Setup Guide - Pokemon Project

This guide will walk you through setting up the Pokemon project on your local machine.

## 📋 Prerequisites

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)
- **Google Cloud Console account** - [Sign up here](https://console.cloud.google.com/)

## 🔑 Step 1: Get Your YouTube API Key

### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Give it a name (e.g., "Pokemon Project")
4. Click **"Create"**

### 1.2 Enable YouTube Data API
1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"YouTube Data API v3"**
3. Click on it and press **"Enable"**

### 1.3 Create API Key
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"API Key"**
3. Copy your new API key (it looks like: `AIzaSyC...`)
4. **⚠️ Keep this secret! Don't share it publicly.**

### 1.4 Set API Restrictions (Recommended)
1. Click on your API key
2. Under **"Application restrictions"** select **"HTTP referrers"**
3. Add: `localhost:3000/*`
4. Under **"API restrictions"** select **"Restrict key"**
5. Choose **"YouTube Data API v3"**
6. Click **"Save"**

## 🖥️ Step 2: Clone and Setup Project

### 2.1 Clone Repository
```bash
git clone <your-repo-url>
cd pokemon_project
```

### 2.2 Install Dependencies
```bash
cd Server/serverCalls
npm install
```

## ⚙️ Step 3: Environment Configuration

### 3.1 Create Environment File
1. In the `Server/serverCalls/` directory, create a file called `.env`
2. Copy the content from `.env.example` (if it exists) or create it manually

### 3.2 Configure Your .env File
Create `.env` with this content (replace with your actual values):

```env
# YouTube Data API v3 Key
YOUTUBE_API_KEY=AIzaSyC_your_actual_api_key_here

# Server Configuration
PORT=3000
SESSION_SECRET=your_random_secret_string_here
```

**Example:**
```env
YOUTUBE_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz
PORT=3000
SESSION_SECRET=my_super_secret_key_12345
```

## 🚀 Step 4: Start the Server

### 4.1 Start in Production Mode
```bash
npm start
```

### 4.2 Start in Development Mode (with auto-restart)
```bash
npm run dev
```

### 4.3 Verify Server is Running
You should see:
```
Server running on http://localhost:3000
```

## 🌐 Step 5: Test the Application

### 5.1 Open Your Browser
Navigate to: `http://localhost:3000`

### 5.2 Test the Features
1. **Register** a new account
2. **Login** with your credentials
3. **Search** for Pokemon
4. **Click** on a Pokemon card to see details
5. **Check** if YouTube videos appear

## 🐛 Troubleshooting

### Issue: "YouTube API key not configured"
**Solution:** Check your `.env` file exists and has the correct API key

### Issue: "No videos found for every Pokemon"
**Solution:** 
1. Verify your API key is correct
2. Check if YouTube Data API v3 is enabled
3. Verify API restrictions allow localhost

### Issue: Server won't start
**Solution:**
1. Check if port 3000 is available
2. Verify all dependencies are installed
3. Check console for error messages

### Issue: "Module not found: dotenv"
**Solution:** Run `npm install` in the `Server/serverCalls/` directory

## 🔒 Security Best Practices

1. **Never commit** your `.env` file to Git
2. **Use different API keys** for development and production
3. **Set API restrictions** to limit usage
4. **Rotate API keys** regularly
5. **Monitor API usage** in Google Cloud Console

## 📱 Testing on Different Devices

### Local Network Access
To test on your phone/tablet while on the same WiFi:

1. Find your computer's local IP address:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. Update your `.env` file:
   ```env
   PORT=3000
   HOST=0.0.0.0
   ```

3. Access from other devices: `http://YOUR_IP:3000`

## 🎯 Next Steps

Once everything is working:

1. **Explore the code** to understand how it works
2. **Customize the UI** to match your preferences
3. **Add new features** like Pokemon battles or trading
4. **Deploy to production** when ready

## 🆘 Need Help?

If you're still having issues:

1. Check the main [README.md](README.md) file
2. Look for similar issues in GitHub issues
3. Create a new issue with:
   - Your operating system
   - Node.js version
   - Error messages
   - Steps you followed

---

**Happy coding! 🎮✨**
