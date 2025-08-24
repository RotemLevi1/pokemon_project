# 🎮 Pokemon Project

A full-stack web application for searching, viewing, and managing Pokemon favorites with embedded YouTube videos and user authentication.

## ✨ Features

- 🔍 **Pokemon Search**: Search by ID, Type, and Ability
- ❤️ **Favorites System**: Save and manage your favorite Pokemon
- 🎥 **YouTube Integration**: Embedded videos for each Pokemon
- 🔐 **User Authentication**: Secure login/register system
- 📱 **Responsive Design**: Works on all devices
- 🎨 **Modern UI**: Beautiful modal overlays and animations

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Cloud Console account (for YouTube API)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd pokemon_project
```

### 2. Install Dependencies

```bash
cd Server/serverCalls
npm install
```

### 3. Set Up YouTube API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **YouTube Data API v3**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy your API key

### 4. Environment Configuration

1. **Copy the example environment file:**
   ```bash
   # In the Server/serverCalls directory
   copy .env.example .env
   ```

2. **Edit the .env file** and add your API key:
   ```env
   YOUTUBE_API_KEY=your_actual_api_key_here
   PORT=3000
   SESSION_SECRET=your_session_secret_here
   ```

### 5. Start the Server

```bash
# In the Server/serverCalls directory
npm start
# or
node app.js
```

The server will start at `http://localhost:3000`

### 6. Open the Application

Open your browser and navigate to `http://localhost:3000`

## 📁 Project Structure

```
pokemon_project/
├── Client/                 # Frontend files
│   ├── index.html         # Home page
│   ├── login.html         # Login page
│   ├── register.html      # Registration page
│   ├── search.html        # Pokemon search/gallery
│   ├── favorites.html     # Favorites page
│   ├── auth.js           # Authentication utilities
│   ├── pokemonDetails.js # Pokemon modal logic
│   └── pokemonDetails.css # Modal styling
├── Server/                # Backend files
│   ├── serverCalls/      # Main server
│   │   ├── app.js        # Express server & routes
│   │   └── package.json  # Dependencies
│   ├── pokemonAPIdata/   # Pokemon API integration
│   └── usersData/        # User management
└── README.md             # This file
```

## 🔧 API Endpoints

### Authentication Required
- `GET /idList` - Get available Pokemon IDs
- `GET /typeList` - Get available Pokemon types
- `GET /abilityList` - Get available Pokemon abilities
- `GET /:id/:type/:ability` - Search Pokemon
- `GET /youtube/:pokemonName` - Get YouTube videos for Pokemon
- `GET /embed` - Get embed HTML for YouTube videos

### Public
- `POST /newUser` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /auth/status` - Check authentication status

## 🎥 YouTube API Setup

### Required Steps:
1. **Enable YouTube Data API v3** in Google Cloud Console
2. **Create API credentials** (API Key)
3. **Set quota limits** (YouTube API has daily limits)
4. **Add API key** to your `.env` file

### API Quota:
- **Free tier**: 10,000 units per day
- **Search requests**: 100 units per request
- **Plan accordingly** for production use

## 🛠️ Development

### Running in Development Mode

```bash
# Install nodemon for auto-restart
npm install -g nodemon

# Start with nodemon
nodemon app.js
```

### Environment Variables

Create a `.env` file in `Server/serverCalls/` with:

```env
YOUTUBE_API_KEY=your_api_key_here
PORT=3000
SESSION_SECRET=your_secret_here
```

## 🚨 Security Notes

- **Never commit** your `.env` file to version control
- **Rotate API keys** regularly
- **Use HTTPS** in production
- **Set appropriate** session secrets

## 🐛 Troubleshooting

### Common Issues:

1. **"YouTube API key not configured"**
   - Check your `.env` file exists
   - Verify `YOUTUBE_API_KEY` is set correctly

2. **"No videos found"**
   - Verify your API key is valid
   - Check YouTube API quota limits
   - Ensure YouTube Data API v3 is enabled

3. **Server won't start**
   - Check if port 3000 is available
   - Verify all dependencies are installed
   - Check console for error messages

### Debug Mode:

Enable detailed logging by setting:
```env
DEBUG=true
NODE_ENV=development
```

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed information

## 🔮 Future Features

- [ ] Pokemon battle system
- [ ] Trading functionality
- [ ] Team building
- [ ] Advanced search filters
- [ ] Mobile app version

---

**Happy Pokemon hunting! 🎮✨**
