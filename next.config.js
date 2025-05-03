/** @type {import('next').NextConfig} */
const nextPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  env: {
    SPOTIFY_CLIENT_ID: process.env.SPOTIPY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIPY_CLIENT_SECRET,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      console.log('Server-side environment variables:', {
        SPOTIFY_CLIENT_ID: process.env.SPOTIPY_CLIENT_ID ? '***' : 'Not set',
        SPOTIFY_CLIENT_SECRET: process.env.SPOTIPY_CLIENT_SECRET ? '***' : 'Not set'
      });
    }
    return config;
  }
};

module.exports = nextPWA(nextConfig);