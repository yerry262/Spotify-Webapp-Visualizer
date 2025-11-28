// YouTube to MP3 Service for Educational Research
// Uses YouTube Data API v3 to find videos and backend server for MP3 extraction

// Get YouTube API key from environment variable
const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  console.warn('⚠️ REACT_APP_YOUTUBE_API_KEY not set in .env file');
}

// YouTube API Service
export const YouTubeService = {
  /**
   * Search for a song on YouTube and get the top result
   * @param {string} artistName - The artist name
   * @param {string} songName - The song name
   * @returns {Promise<Object|null>} - Video info object or null
   */
  async searchVideo(artistName, songName) {
    const query = `${artistName} ${songName} music`;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=5&key=${YOUTUBE_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error('YouTube API Error:', data.error.message);
        return null;
      }

      if (!data.items || data.items.length === 0) {
        console.warn('No YouTube results found for:', query);
        return null;
      }

      // Get the top result
      const video = data.items[0];
      return {
        videoId: video.id.videoId,
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
        publishedAt: video.snippet.publishedAt
      };
    } catch (error) {
      console.error('Error searching YouTube:', error);
      return null;
    }
  },

  /**
   * Clear all old MP3 files from the server
   */
  async clearOldMP3s() {
    try {
      const response = await fetch('http://localhost:3001/clear-mp3s', {
        method: 'POST'
      });
      const data = await response.json();
      console.log('🗑️ Cleared old MP3s:', data);
      return data;
    } catch (error) {
      console.error('Error clearing MP3s:', error);
      return null;
    }
  },

  /**
   * Get MP3 from YouTube video via backend server
   * @param {string} youtubeUrl - The YouTube video URL
   * @param {boolean} clearOld - Whether to clear old MP3 files first
   * @returns {Promise<Object|null>} - MP3 info object or null
   */
  async getMP3(youtubeUrl, clearOld = false) {
    try {
      const response = await fetch('http://localhost:3001/get-mp3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: youtubeUrl, clearOld })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('MP3 extraction error:', data.error);
        return null;
      }

      if (data.mp3Url) {
        if (data.cached) {
          console.log('📦 Using cached MP3');
        }
        return {
          mp3Url: data.mp3Url,
          filename: data.filename,
          title: data.title,
          cached: data.cached || false
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching MP3:', error);
      return null;
    }
  },

  /**
   * Main function: Get MP3 from artist and song name
   * Searches YouTube and extracts MP3 via backend
   * Flow:
   *   1. Search YouTube for the video
   *   2. Clear old MP3 files
   *   3. Download MP3 (or use cache if available)
   *   4. Return MP3 info for analysis
   * @param {string} artistName - The artist name
   * @param {string} songName - The song name
   * @returns {Promise<Object|null>} - Full result object or null
   */
  async getMP3ForTrack(artistName, songName) {
    console.log(`🎵 Searching YouTube for: ${artistName} - ${songName}`);
    
    // Step 1: Search YouTube for the video
    const videoInfo = await this.searchVideo(artistName, songName);
    
    if (!videoInfo) {
      console.error('Could not find video on YouTube');
      return null;
    }

    console.log(`📺 Found video: ${videoInfo.title}`);
    console.log(`🔗 URL: ${videoInfo.url}`);

    // Step 2: Get MP3 from backend server (clears old files, checks cache, downloads if needed)
    const mp3Info = await this.getMP3(videoInfo.url, true); // clearOld = true
    
    if (!mp3Info) {
      console.error('Could not extract MP3');
      return null;
    }

    console.log(`🎧 MP3 ready: ${mp3Info.mp3Url}${mp3Info.cached ? ' (cached)' : ''}`);

    // Return combined result
    return {
      artist: artistName,
      song: songName,
      youtube: videoInfo,
      mp3: mp3Info
    };
  }
};

// Example usage function (for testing)
export async function testYouTubeService() {
  const result = await YouTubeService.getMP3ForTrack('Zeds Dead', 'One of These Mornings');
  
  if (result) {
    console.log('✅ Success!');
    console.log('Full result:', result);
    return result;
  } else {
    console.log('❌ Could not get MP3');
    return null;
  }
}

export default YouTubeService;
