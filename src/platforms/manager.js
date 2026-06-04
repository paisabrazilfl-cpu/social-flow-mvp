/**
 * Platform Manager
 * Handles platform-specific configurations and limits
 */

export class PlatformManager {
  constructor(api) {
    this.api = api;
    this.platforms = this.initializePlatforms();
  }

  initializePlatforms() {
    return {
      linkedin: {
        name: 'LinkedIn',
        maxChars: 3000,
        maxImages: 10,
        maxVideoSize: 500 * 1024 * 1024, // 500 MB
        maxVideoDuration: 30 * 60, // 30 minutes
        supportsDocuments: true,
        supportsMentions: true,
        supportsScheduling: true,
        rateLimit: 200 // per hour
      },
      twitter: {
        name: 'X/Twitter',
        maxChars: 280,
        maxImages: 4,
        maxVideoSize: 512 * 1024 * 1024, // 512 MB
        maxVideoDuration: 120, // 2 minutes
        supportsDocuments: false,
        supportsMentions: true,
        supportsScheduling: true,
        supportsAutoThreading: true,
        rateLimit: 300 // per hour
      },
      instagram: {
        name: 'Instagram',
        maxChars: 2200,
        maxImages: 10,
        maxVideoSize: 300 * 1024 * 1024, // 300 MB
        maxVideoDuration: 60, // 60 seconds for Reels (API limit)
        supportsDocuments: false,
        supportsMentions: true,
        supportsScheduling: true,
        requiresBusiness: true,
        imageFormat: 'jpeg', // Only JPEG supported
        rateLimit: 50 // per 24 hours
      },
      threads: {
        name: 'Threads',
        maxChars: 500,
        maxImages: 10,
        maxVideoSize: 500 * 1024 * 1024, // 500 MB
        maxVideoDuration: 5 * 60, // 5 minutes
        supportsDocuments: false,
        supportsMentions: true,
        supportsScheduling: true,
        supportsAutoThreading: true,
        rateLimit: 250 // per day
      },
      tiktok: {
        name: 'TikTok',
        maxChars: 2200,
        maxImages: 0, // Video only
        maxVideoSize: 4 * 1024 * 1024 * 1024, // 4 GB
        maxVideoDuration: 10 * 60, // 10 minutes
        supportsDocuments: false,
        supportsMentions: true,
        supportsScheduling: true,
        videoOnly: true,
        requiresMinFPS: 23,
        rateLimit: 15 // per day
      },
      youtube: {
        name: 'YouTube',
        maxChars: 5000, // Description
        maxImages: 0, // Video only
        maxVideoSize: 512 * 1024 * 1024, // 512 MB (Publora limit)
        maxVideoDuration: 12 * 60 * 60, // 12 hours
        supportsDocuments: false,
        supportsMentions: true,
        supportsScheduling: true,
        videoOnly: true,
        rateLimit: 100 // per day
      },
      facebook: {
        name: 'Facebook',
        maxChars: 63206,
        maxImages: 10,
        maxVideoSize: 512 * 1024 * 1024, // 512 MB
        maxVideoDuration: 45 * 60, // 45 minutes
        supportsDocuments: false,
        supportsMentions: true,
        supportsScheduling: true,
        pageOnly: true,
        rateLimit: 200 // per hour
      },
      bluesky: {
        name: 'Bluesky',
        maxChars: 300,
        maxImages: 4,
        maxVideoSize: 100 * 1024 * 1024, // 100 MB
        maxVideoDuration: 3 * 60, // 3 minutes
        supportsDocuments: false,
        supportsMentions: true,
        supportsScheduling: true,
        rateLimit: 300 // per hour
      },
      mastodon: {
        name: 'Mastodon',
        maxChars: 500,
        maxImages: 4,
        maxVideoSize: 99 * 1024 * 1024, // ~99 MB
        maxVideoDuration: 3 * 60,
        supportsDocuments: false,
        supportsMentions: true,
        supportsScheduling: true,
        rateLimit: 300 // per hour
      },
      telegram: {
        name: 'Telegram',
        maxChars: 4096,
        maxCaptionChars: 1024,
        maxImages: 10,
        maxVideoSize: 50 * 1024 * 1024, // 50 MB (Bot API limit)
        supportsDocuments: true,
        supportsMentions: true,
        supportsScheduling: true,
        supportsMarkdown: true,
        rateLimit: 30 // per second
      }
    };
  }

  /**
   * Get platform configuration
   */
  getPlatform(platform) {
    return this.platforms[platform.toLowerCase()] || null;
  }

  /**
   * Validate post content for platform
   */
  validatePost(platform, content, media = {}) {
    const config = this.getPlatform(platform);
    if (!config) {
      return { valid: false, error: `Unknown platform: ${platform}` };
    }

    const errors = [];

    // Check character limit
    if (content && content.length > config.maxChars) {
      errors.push(`Content exceeds ${config.maxChars} character limit`);
    }

    // Check media type
    if (config.videoOnly && media.images?.length > 0) {
      errors.push(`${config.name} is video-only, cannot post images`);
    }

    if (media.images?.length > config.maxImages) {
      errors.push(`Too many images. Maximum: ${config.maxImages}`);
    }

    if (media.videos?.length > 0 && config.maxImages > 0 && media.images?.length > 0) {
      errors.push('Cannot mix images and videos in the same post');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate threading for long content
   */
  calculateThreading(platform, content) {
    const config = this.getPlatform(platform);
    if (!config || !config.supportsAutoThreading) {
      return [content];
    }

    if (content.length <= config.maxChars) {
      return [content];
    }

    // Split content into threads
    const threads = [];
    const maxChars = config.maxChars - 10; // Reserve for (N/N) markers

    // Split by paragraphs first
    const paragraphs = content.split('\n\n');
    let currentThread = '';

    for (const paragraph of paragraphs) {
      if ((currentThread + '\n\n' + paragraph).length <= maxChars) {
        currentThread += (currentThread ? '\n\n' : '') + paragraph;
      } else {
        if (currentThread) threads.push(currentThread);
        // Split by sentences if paragraph is too long
        const sentences = paragraph.split(/(?<=[.!?])\s+/);
        currentThread = '';
        for (const sentence of sentences) {
          if ((currentThread + ' ' + sentence).length <= maxChars) {
            currentThread += (currentThread ? ' ' : '') + sentence;
          } else {
            if (currentThread) threads.push(currentThread);
            currentThread = sentence;
          }
        }
      }
    }
    if (currentThread) threads.push(currentThread);

    // Add thread numbers
    const total = threads.length;
    return threads.map((thread, i) => `${thread}\n(${i + 1}/${total})`);
  }

  /**
   * Get platform icon/emoji
   */
  getPlatformIcon(platform) {
    const icons = {
      linkedin: '💼',
      twitter: '𝕏',
      instagram: '📸',
      threads: '⚙️',
      tiktok: '🎵',
      youtube: '▶️',
      facebook: '📘',
      bluesky: '💙',
      mastodon: '🐘',
      telegram: '✈️'
    };
    return icons[platform.toLowerCase()] || '📱';
  }

  /**
   * Get all platform names
   */
  getAllPlatforms() {
    return Object.keys(this.platforms);
  }
}
