# YouTube API Integration Guide

## Overview
The Pokemon Details modal includes a placeholder for YouTube videos related to each Pokemon. This guide explains how to implement the actual YouTube API integration.

## Prerequisites
1. Google Cloud Console account
2. YouTube Data API v3 enabled
3. API key generated

## Implementation Steps

### 1. Get YouTube API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Restrict the API key to YouTube Data API v3 only

### 2. Update the Server
Add a new endpoint in `Server/serverCalls/app.js`:

```javascript
app.get('/youtube/:pokemonName', requireAuth, async (req, res) => {
    try {
        const { pokemonName } = req.params;
        const apiKey = process.env.YOUTUBE_API_KEY;
        
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${pokemonName}+pokemon&type=video&maxResults=5&key=${apiKey}`
        );
        
        const data = await response.json();
        
        if (data.items) {
            const videos = data.items.map(item => ({
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails.medium.url,
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                duration: 'N/A' // Would need additional API call for duration
            }));
            
            res.json({ videos });
        } else {
            res.json({ videos: [] });
        }
    } catch (error) {
        console.error('YouTube API error:', error);
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
});
```

### 3. Update Client Code
Replace the mock video loading in `Client/pokemonDetails.js`:

```javascript
async function loadPokemonVideos(pokemonName) {
    try {
        const videosContainer = document.getElementById('youtubeVideos');
        if (videosContainer) {
            videosContainer.innerHTML = '<div class="video-loading">Loading videos...</div>';
            
            const response = await fetch(`http://localhost:3000/youtube/${encodeURIComponent(pokemonName)}`);
            const data = await response.json();
            
            if (data.videos && data.videos.length > 0) {
                displayVideos(data.videos);
            } else {
                videosContainer.innerHTML = '<div class="no-videos">No videos found for this Pokemon</div>';
            }
        }
    } catch (error) {
        console.error('Error loading videos:', error);
        const videosContainer = document.getElementById('youtubeVideos');
        if (videosContainer) {
            videosContainer.innerHTML = '<div class="video-error">Error loading videos</div>';
        }
    }
}
```

### 4. Environment Variables
Create a `.env` file in `Server/serverCalls/`:

```env
YOUTUBE_API_KEY=your_api_key_here
```

### 5. Install Dependencies
```bash
cd Server/serverCalls
npm install dotenv
```

### 6. Load Environment Variables
Add to the top of `Server/serverCalls/app.js`:

```javascript
require('dotenv').config();
```

## Features
- Search for Pokemon-related videos
- Display video thumbnails and titles
- Click to open videos in new tab
- Responsive design
- Error handling

## Rate Limits
- YouTube Data API v3: 10,000 units per day (free tier)
- Each search request: 100 units
- Plan accordingly for production use

## Security Notes
- Never expose API keys in client-side code
- Always make API calls from the server
- Implement rate limiting for production use
- Consider caching results to reduce API calls
