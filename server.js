const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Spotify API configuration
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Store access token and expiry
let spotifyToken = null;
let tokenExpiry = null;

// Function to get Spotify access token using Client Credentials flow
async function getSpotifyToken() {
  if (spotifyToken && tokenExpiry && Date.now() < tokenExpiry) {
    return spotifyToken;
  }

  try {
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    
    const response = await axios.post(tokenUrl, 'grant_type=client_credentials', {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    spotifyToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer
    
    return spotifyToken;
  } catch (error) {
    console.error('Error getting Spotify token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Spotify API');
  }
}

// Function to extract artist ID from Spotify URL
function extractArtistId(url) {
  const regex = /spotify\.com\/artist\/([a-zA-Z0-9]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Function to fetch all albums with pagination
async function fetchAllAlbums(artistId, token) {
  let allAlbums = [];
  let offset = 0;
  const limit = 50;
  
  do {
    try {
      const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/albums`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          include_groups: 'album,single,compilation,appears_on',
          limit: limit,
          offset: offset,
          market: 'US'
        }
      });

      allAlbums = allAlbums.concat(response.data.items);
      
      if (response.data.items.length < limit) {
        break;
      }
      
      offset += limit;
    } catch (error) {
      console.error('Error fetching albums:', error.response?.data || error.message);
      throw error;
    }
  } while (true);

  return allAlbums;
}

// Function to fetch detailed album info including tracks
async function fetchAlbumDetails(albumId, token) {
  try {
    const albumResponse = await axios.get(`https://api.spotify.com/v1/albums/${albumId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        market: 'US'
      }
    });

    const album = albumResponse.data;
    
    // Get track details with additional metadata including ISRC and popularity
    const enhancedTracks = await Promise.all(
      album.tracks.items.map(async (track) => {
        try {
          // Fetch individual track details for ISRC and popularity
          const trackResponse = await axios.get(`https://api.spotify.com/v1/tracks/${track.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            params: {
              market: 'US'
            }
          });
          
          const trackDetails = trackResponse.data;
          
          return {
            track_number: track.track_number,
            track_name: track.name,
            duration_ms: track.duration_ms,
            explicit: track.explicit,
            spotify_track_id: track.id,
            artists: track.artists.map(artist => ({
              name: artist.name,
              spotify_artist_id: artist.id
            })),
            // Enhanced metadata for catalog administration
            isrc: trackDetails.external_ids?.isrc || null,
            popularity: trackDetails.popularity || 0,
            available_markets: trackDetails.available_markets || [],
            market_count: trackDetails.available_markets ? trackDetails.available_markets.length : 0,
            preview_url: trackDetails.preview_url || null,
            disc_number: track.disc_number || 1
          };
        } catch (error) {
          console.warn(`Could not fetch enhanced details for track ${track.id}:`, error.message);
          // Return basic track info if enhanced fetch fails
          return {
            track_number: track.track_number,
            track_name: track.name,
            duration_ms: track.duration_ms,
            explicit: track.explicit,
            spotify_track_id: track.id,
            artists: track.artists.map(artist => ({
              name: artist.name,
              spotify_artist_id: artist.id
            })),
            isrc: null,
            popularity: 0,
            available_markets: [],
            market_count: 0,
            preview_url: null,
            disc_number: track.disc_number || 1
          };
        }
      })
    );

    // Determine release date precision
    const releaseDatePrecision = album.release_date_precision || 'day';
    let formattedReleaseDate = album.release_date;
    let releaseYear = null;
    let releaseMonth = null;
    let releaseDay = null;
    
    if (album.release_date) {
      const dateParts = album.release_date.split('-');
      releaseYear = parseInt(dateParts[0]);
      if (dateParts.length > 1) releaseMonth = parseInt(dateParts[1]);
      if (dateParts.length > 2) releaseDay = parseInt(dateParts[2]);
    }

    return {
      release_name: album.name,
      release_type: album.album_type,
      release_date: album.release_date,
      release_date_precision: releaseDatePrecision,
      release_year: releaseYear,
      release_month: releaseMonth,
      release_day: releaseDay,
      spotify_album_id: album.id,
      total_tracks: album.total_tracks,
      label: album.label || 'Unknown',
      external_urls: album.external_urls,
      external_ids: album.external_ids || {},
      images: album.images,
      available_markets: album.available_markets || [],
      market_count: album.available_markets ? album.available_markets.length : 0,
      popularity: album.popularity || 0,
      copyrights: album.copyrights || [],
      genres: album.genres || [],
      tracks: enhancedTracks,
      // Calculate average track popularity for release
      avg_track_popularity: enhancedTracks.length > 0 
        ? Math.round(enhancedTracks.reduce((sum, track) => sum + track.popularity, 0) / enhancedTracks.length)
        : 0
    };
  } catch (error) {
    console.error(`Error fetching album details for ${albumId}:`, error.response?.data || error.message);
    throw error;
  }
}

// Function to get artist info
async function getArtistInfo(artistId, token) {
  try {
    const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      artist_id: response.data.id,
      artist_name: response.data.name,
      followers: response.data.followers.total,
      genres: response.data.genres,
      images: response.data.images,
      external_urls: response.data.external_urls
    };
  } catch (error) {
    console.error('Error fetching artist info:', error.response?.data || error.message);
    throw error;
  }
}

// Main API endpoint to fetch discography
app.post('/api/discography', async (req, res) => {
  try {
    const { artistUrl } = req.body;
    
    if (!artistUrl) {
      return res.status(400).json({ error: 'Artist URL is required' });
    }

    // Extract artist ID from URL
    const artistId = extractArtistId(artistUrl);
    if (!artistId) {
      return res.status(400).json({ error: 'Invalid Spotify artist URL' });
    }

    // Get access token
    const token = await getSpotifyToken();

    // Get artist information
    const artistInfo = await getArtistInfo(artistId, token);

    // Fetch all albums
    const albums = await fetchAllAlbums(artistId, token);

    // Group albums by type
    const discography = {
      albums: [],
      singles: [],
      compilations: [],
      appears_on: []
    };

    // Process albums in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < albums.length; i += batchSize) {
      const batch = albums.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (album) => {
        try {
          const details = await fetchAlbumDetails(album.id, token);
          
          // Categorize by album_group (not album_type)
          const group = album.album_group || album.album_type;
          
          switch (group) {
            case 'album':
              discography.albums.push(details);
              break;
            case 'single':
              discography.singles.push(details);
              break;
            case 'compilation':
              discography.compilations.push(details);
              break;
            case 'appears_on':
              discography.appears_on.push(details);
              break;
            default:
              // Default to albums if unclear
              discography.albums.push(details);
          }
        } catch (error) {
          console.error(`Failed to fetch details for album ${album.id}:`, error.message);
        }
      });

      await Promise.all(batchPromises);
      
      // Add a small delay between batches to respect rate limits
      if (i + batchSize < albums.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Sort each category by release date (newest first)
    Object.keys(discography).forEach(key => {
      discography[key].sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
    });

    const result = {
      ...artistInfo,
      discography,
      total_releases: {
        albums: discography.albums.length,
        singles: discography.singles.length,
        compilations: discography.compilations.length,
        appears_on: discography.appears_on.length,
        total: albums.length
      },
      fetched_at: new Date().toISOString()
    };

    res.json(result);

  } catch (error) {
    console.error('Error in discography endpoint:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch discography', 
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🎵 DiscoFetch server running on http://localhost:${PORT}`);
  console.log('Make sure to set your Spotify API credentials in .env file');
});