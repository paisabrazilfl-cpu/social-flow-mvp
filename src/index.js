/**
 * Publora MVP - Open Source Social Media Automation Platform
 * 
 * Supported Platforms:
 * - LinkedIn, X/Twitter, Instagram, Threads, TikTok, YouTube
 * - Facebook, Bluesky, Mastodon, Telegram
 * 
 * Features:
 * - Post creation, scheduling, editing, deletion
 * - Multi-platform posting
 * - Media uploads (images, videos)
 * - Analytics (LinkedIn)
 * - MCP server for AI agent integration
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { PublorAPI } from './api/publora.js';
import { MCPServer } from './mcp/server.js';
import { PlatformManager } from './platforms/manager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Configuration
const API_KEY = process.env.PUBLORA_API_KEY || 'dev-api-key-12345';
const BASE_URL = process.env.PUBLORA_API_URL || 'https://api.publora.com/api/v1';

// Initialize components
const api = new PublorAPI(BASE_URL, API_KEY);
const platformManager = new PlatformManager(api);
const mcpServer = new MCPServer(api, platformManager);

// ============ REST API Routes ============

// Health check
app.get('/api/healthz', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get current API key info
app.get('/api/auth/status', (req, res) => {
  const key = req.headers['x-publora-key'] || req.headers['authorization']?.replace('Bearer ', '');
  res.json({
    authenticated: !!key,
    keyPrefix: key ? key.substring(0, 10) + '...' : null,
    plan: 'pro' // Would check against real API
  });
});

// ============ Platform Connections ============

// List connected platforms
app.get('/api/v1/platform-connections', async (req, res) => {
  try {
    const key = req.headers['x-publora-key'] || API_KEY;
    const connections = await api.getPlatformConnections(key);
    res.json(connections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Connect a new platform (mock - would use real OAuth)
app.post('/api/v1/platform-connections', async (req, res) => {
  const { platform, credentials } = req.body;
  try {
    const key = req.headers['x-publora-key'] || API_KEY;
    const result = await api.connectPlatform(key, platform, credentials);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Disconnect platform
app.delete('/api/v1/platform-connections/:platformId', async (req, res) => {
  try {
    const key = req.headers['x-publora-key'] || API_KEY;
    await api.disconnectPlatform(key, req.params.platformId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ Posts ============

// List posts
app.get('/api/v1/posts', async (req, res) => {
  try {
    const key = req.headers['x-publora-key'] || API_KEY;
    const { status, platform, fromDate, toDate, page = 1, limit = 20 } = req.query;
    
    const posts = await api.listPosts(key, {
      status,
      platform,
      fromDate,
      toDate: toDate || fromDate + 'T23:59:59Z',
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create post
app.post('/api/v1/create-post', async (req, res) => {
  try {
    const key = req.headers['x-publora-key'] || API_KEY;
    const { content, platforms, scheduledTime, platformSettings, mediaUrls } = req.body;
    
    if (!content || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required fields: content, platforms (array)' 
      });
    }
    
    const postGroupId = await api.createPost(key, {
      content,
      platforms,
      scheduledTime: scheduledTime || new Date(Date.now() + 60000).toISOString(),
      platformSettings,
      mediaUrls
    });
    
    res.json({ success: true, postGroupId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get post details
app.get('/api/v1/post/:postGroupId', async (req, res) => {
  try {
    const key = req.headers['x-publora-key'] || API_KEY;
    const post = await api.getPost(key, req.params.postGroupId);
    res.json(post);
  } catch (error) {
    res.status(404).json({ error: 'Post not found' });
  }
});

// Update post (reschedule)
app.patch('/api/v1/post/:postGroupId', async (req, res) => {
  try {
    const key = req.headers['x-publora-key'] || API_KEY;
    const { status, scheduledTime } = req.body;
    
    const result = await api.updatePost(key, req.params.postGroupId, {
      status,
      scheduledTime
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete post
app.delete('/api/v1/post/:postGroupId', async (req, res) => {
  try {
    const key = req.headers['x-publora-key'] || API_KEY;
    await api.deletePost(key, req.params.postGroupId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ Media Uploads ============

// Get presigned upload URL
app.post('/api/v1/media/upload-url', async (req, res) => {
  try {
    const key = req.headers['x-publora-key'] || API_KEY;
    const { postGroupId, fileName, contentType, type } = req.body;
    
    const result = await api.getUploadUrl(key, {
      postGroupId,
      fileName,
      contentType,
      type
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ LinkedIn Analytics ============

// Get post statistics
app.post('/api/v1/linkedin-post-statistics', async (req, res) => {
  try {
    const key = req.headers['x-publora-key'] || API_KEY;
    const { platformId, postedId, queryTypes } = req.body;
    
    const stats = await api.getLinkedInPostStats(key, {
      platformId,
      postedId,
      queryTypes
    });
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get account statistics
app.post('/api/v1/linkedin-account-statistics', async (req, res) => {
  try {
    const key = req.headers['x-publora-key'] || API_KEY;
    const { platformId, queryTypes, aggregation } = req.body;
    
    const stats = await api.getLinkedInAccountStats(key, {
      platformId,
      queryTypes,
      aggregation
    });
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LinkedIn reactions
app.post('/api/v1/linkedin/reaction', async (req, res) => {
  try {
    const key = req.headers['x-publora-key'] || API_KEY;
    const { platformId, postedId, reactionType } = req.body;
    
    const result = await api.createLinkedInReaction(key, {
      platformId,
      postedId,
      reactionType
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LinkedIn comments
app.post('/api/v1/linkedin/comment', async (req, res) => {
  try {
    const key = req.headers['x-publora-key'] || API_KEY;
    const { platformId, postedId, message, parentComment } = req.body;
    
    const result = await api.createLinkedInComment(key, {
      platformId,
      postedId,
      message,
      parentComment
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ MCP Server Endpoint ============

// MCP server handle - using streamable HTTP
app.post('/mcp', async (req, res) => {
  try {
    const result = await mcpServer.handleRequest(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MCP SSE endpoint for streaming
app.get('/mcp/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Keep connection alive for MCP streaming
  req.on('close', () => {
    res.end();
  });
});

// ============ Web UI (Static) ============

app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║               PUBLORA MVP - Running                           ║
╠═══════════════════════════════════════════════════════════════╣
║  REST API:    http://localhost:${PORT}/api                     ║
║  MCP Server:  http://localhost:${PORT}/mcp                     ║
║  Web UI:      http://localhost:${PORT}/                        ║
║                                                               ║
║  Auth Header: x-publora-key: YOUR_API_KEY                     ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
