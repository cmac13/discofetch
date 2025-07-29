# 🎵 DiscoFetch - Spotify Discography Fetcher

A modern web application that fetches complete artist discographies from Spotify, including albums, singles, compilations, and features.

![DiscoFetch Screenshot](https://via.placeholder.com/800x400/667eea/ffffff?text=DiscoFetch+Web+App)

## ✨ Features

- **Complete Discography Fetching**: Get all releases including albums, singles, compilations, and "appears on" tracks
- **Enhanced Catalog Administration**: ISRC codes, market availability, popularity metrics, and rights information
- **Modern Web Interface**: Clean, responsive design with tabbed navigation and visual indicators
- **Detailed Track Information**: View complete tracklists with durations, explicit content markers, and artist credits
- **Rights & Metadata Management**: UPC/EAN codes, copyright information, release date precision
- **Artist Information**: Display artist stats, followers, genres, and images
- **Dual Export Functionality**: Download as structured JSON or catalog-ready CSV with enhanced metadata
- **Rate Limit Handling**: Built-in pagination and rate limiting for Spotify API
- **Error Handling**: Robust error handling with user-friendly messages
- **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile devices

### 🎯 **Catalog Administration Features**

Perfect for music industry professionals managing artist catalogs:

- **ISRC Tracking**: Automatic ISRC code collection for rights management
- **Market Analysis**: Available market counts for global distribution insights  
- **Popularity Metrics**: Track and release popularity scores for prioritization
- **Rights Information**: Copyright details and label information
- **Release Precision**: Distinguish between exact dates vs. year-only releases
- **Product Codes**: UPC/EAN codes for physical and digital distribution
- **Preview Availability**: Track which songs have preview clips available
- **Multi-Disc Support**: Proper disc numbering for complex releases
- **Visual Indicators**: Quick-scan emojis for ISRC (📋), previews (🎵), popularity (🔥), explicit content (🅴)

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- Spotify Developer Account
- Spotify API credentials (Client ID and Client Secret)

### 1. Get Spotify API Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create App"
4. Fill in the app details:
   - **App Name**: DiscoFetch (or any name you prefer)
   - **App Description**: Spotify Discography Fetcher
   - **Redirect URI**: `http://localhost:3000` (not used but required)
5. Save your app and copy the **Client ID** and **Client Secret**

### 2. Installation

```bash
# Clone or download this repository
cd discofetch

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 3. Configuration

Edit the `.env` file and add your Spotify credentials:

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
PORT=3000
```

### 4. Run the Application

```bash
# Start the server
npm start

# For development with auto-reload
npm run dev
```

Open your browser and navigate to `http://localhost:3000`

## 🎯 How to Use

1. **Get Artist URL**: Go to Spotify, find an artist, and copy their URL
   - Example: `https://open.spotify.com/artist/7dGJo4pcD2V6oG8kP0tJRR`

2. **Fetch Discography**: Paste the URL into DiscoFetch and click "Fetch Discography"

3. **Explore Results**: Browse through tabs (Albums, Singles, Compilations, Appears On)

4. **Export Data**: Use the export buttons to download JSON or copy to clipboard

## 📊 API Response Format

The application returns structured JSON data with enhanced catalog administration metadata:

```json
{
  "artist_id": "7dGJo4pcD2V6oG8kP0tJRR",
  "artist_name": "Eminem",
  "followers": 58000000,
  "genres": ["detroit hip hop", "hip hop", "rap"],
  "discography": {
    "albums": [
      {
        "release_name": "The Marshall Mathers LP2",
        "release_type": "album", 
        "release_date": "2013-11-05",
        "release_date_precision": "day",
        "release_year": 2013,
        "release_month": 11,
        "release_day": 5,
        "spotify_album_id": "abc123",
        "total_tracks": 16,
        "label": "Aftermath Entertainment",
        "popularity": 85,
        "avg_track_popularity": 78,
        "market_count": 184,
        "external_ids": {
          "upc": "602537518456"
        },
        "copyrights": [
          {
            "type": "C",
            "text": "2013 Aftermath Entertainment"
          }
        ],
        "tracks": [
          {
            "track_number": 1,
            "disc_number": 1,
            "track_name": "Bad Guy",
            "duration_ms": 484013,
            "explicit": true,
            "popularity": 82,
            "isrc": "USUR11300001",
            "preview_url": "https://p.scdn.co/mp3-preview/...",
            "available_markets": ["US", "CA", "GB", ...],
            "market_count": 184,
            "spotify_track_id": "xyz789"
          }
        ]
      }
    ],
    "singles": [...],
    "compilations": [...],
    "appears_on": [...]
  },
  "total_releases": {
    "albums": 11,
    "singles": 45, 
    "compilations": 8,
    "appears_on": 127,
    "total": 191
  },
  "fetched_at": "2024-01-15T10:30:00.000Z"
}
```

## 🛠️ Technical Details

### Backend
- **Framework**: Express.js
- **API Integration**: Spotify Web API with Client Credentials flow
- **Features**: Pagination, rate limiting, error handling, token caching

### Frontend
- **Vanilla JavaScript**: No framework dependencies
- **Modern CSS**: Grid layouts, flexbox, responsive design
- **Features**: Tab navigation, JSON export, clipboard integration

### API Endpoints

- `POST /api/discography` - Fetch artist discography
- `GET /api/health` - Health check endpoint
- `GET /` - Serve frontend application

## 🔧 Development

### Project Structure

```
discofetch/
├── server.js          # Express server and Spotify API integration
├── package.json       # Dependencies and scripts
├── .env.example       # Environment variables template
├── public/            # Frontend files
│   ├── index.html     # Main HTML page
│   ├── styles.css     # CSS styles
│   └── script.js      # JavaScript functionality
└── README.md          # This file
```

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload

## 📝 Rate Limits

The Spotify API has rate limits. DiscoFetch handles this by:
- Processing albums in batches of 10
- Adding small delays between batches
- Caching access tokens
- Providing user feedback during long operations

## 🚧 Troubleshooting

### Common Issues

1. **"Failed to authenticate with Spotify API"**
   - Check your Client ID and Client Secret in `.env`
   - Ensure your Spotify app is set up correctly

2. **"Invalid Spotify artist URL"**
   - Make sure you're using the full Spotify artist URL
   - Format: `https://open.spotify.com/artist/{artist_id}`

3. **Rate limit errors**
   - Wait a few minutes and try again
   - The app handles most rate limiting automatically

4. **Missing data**
   - Some artists may have limited data availability
   - Regional restrictions may affect results

## 📚 Features Roadmap

- [ ] CSV export functionality
- [ ] Artist search by name (without URL)
- [ ] Bulk artist processing
- [ ] Track preview integration
- [ ] Duplicate detection and filtering
- [ ] Advanced filtering options

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Spotify Web API for providing comprehensive music data
- The music community for inspiring this tool

---

**Note**: This application uses the Spotify Web API but is not endorsed or certified by Spotify. Make sure to comply with Spotify's Terms of Service and API usage guidelines.