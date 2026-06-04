/**
 * Utility Functions
 */

export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(date) {
  return new Date(date).toISOString();
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function truncate(str, length = 100) {
  if (str.length <= length) return str;
  return str.substring(0, length - 3) + '...';
}

export function parsePlatformId(platformId) {
  const [platform, id] = platformId.split('-');
  return { platform, id };
}

export function buildPlatformId(platform, id) {
  return `${platform}-${id}`;
}

export function calculateEngagementRate(likes, comments, shares, impressions) {
  if (!impressions || impressions === 0) return 0;
  return ((likes + comments + shares) / impressions * 100).toFixed(2);
}

export function getTimeUntilExpiration(expiresAt) {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires - now;
  
  if (diff <= 0) return 'expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}
