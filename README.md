# Publora MVP - Open Source Social Media Automation

A fully-functional open-source clone of Publora - the AI-powered social media management platform. Post to 10 platforms with a unified API and MCP server for AI agent integration.

![Platforms](https://img.shields.io/badge/Platforms-10-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Node.js](https://img.shields.io/badge/Node.js-20+-green)

## Features

### Multi-Platform Support
| Platform | Posts | Media | Notes |
|----------|-------|-------|-------|
| LinkedIn | 3,000 chars | Images, Video, Documents | @mentions, auto-threading |
| X/Twitter | 280 chars | Images, Video | Auto-threading for long content |
| Instagram | 2,200 chars | Images, Video, Reels | Business account required |
| Threads | 500 chars | Images, Video | Auto-threading |
| TikTok | 2,200 chars | Video only | Privacy controls |
| YouTube | 5,000 desc | Video only | Privacy settings |
| Facebook | 63,206 chars | Images, Video | Pages only |
| Bluesky | 300 chars | Images, Video | Rich text facets |
| Mastodon | 500 chars | Images, Video | Fediverse |
| Telegram | 4,096 chars | Images, Video | Markdown support |

### Core Capabilities
- **Post Scheduling**: Schedule posts for future publication
- **Multi-Platform Posting**: Post to multiple platforms simultaneously
- **Media Uploads**: Image and video upload with presigned URLs
- **Analytics**: LinkedIn post and account statistics
- **Engagement**: React and comment on LinkedIn posts
- **MCP Server**: AI agent integration via Model Context Protocol

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/paisabrazilfl-cpu/publora-mvp.git
cd publora-mvp

# Install dependencies
npm install

# Start the server
npm start
```

### Configuration

Set environment variables:

```bash
export PUBLORA_API_KEY=your_api_key_here
export PUBLORA_API_URL=https://api.publora.com/api/v1
export PORT=3000
```

Or create a `.env` file:

```bash
PUBLORA_API_KEY=your_api_key_here
PUBLORA_API_URL=https://api.publora.com/api/v1
PORT=3000
```

### Running

```bash
# Development mode
npm run dev

# Production
npm start
```

## API Usage

### REST API

#### List Connected Platforms
```bash
curl -X GET "http://localhost:3000/api/v1/platform-connections" \
  -H "x-publora-key: your_api_key"
```

#### Create a Post
```bash
curl -X POST "http://localhost:3000/api/v1/create-post" \
  -H "x-publora-key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello from Publora MVP!",
    "platforms": ["linkedin-abc123"],
    "scheduledTime": "2026-06-05T10:00:00Z"
  }'
```

#### Get Posts
```bash
curl -X GET "http://localhost:3000/api/v1/posts?status=scheduled" \
  -H "x-publora-key: your_api_key"
```

### MCP Server

The MCP server provides AI agent tool access. Configure your Claude Desktop:

```json
{
  "mcpServers": {
    "publora-mvp": {
      "type": "http",
      "url": "http://localhost:3000/mcp",
      "headers": {
        "Authorization": "Bearer your_api_key"
      }
    }
  }
}
```

#### MCP Tools

| Tool | Description |
|------|-------------|
| `list_posts` | List posts with filters |
| `create_post` | Create/schedule a post |
| `get_post` | Get post details |
| `update_post` | Reschedule or change status |
| `delete_post` | Delete a post |
| `get_upload_url` | Get presigned media URL |
| `list_connections` | List connected platforms |
| `linkedin_post_stats` | Get LinkedIn analytics |
| `linkedin_create_reaction` | React to LinkedIn post |
| `linkedin_create_comment` | Comment on LinkedIn post |

## Platform Limits

| Platform | Characters | Images | Video Size | Video Duration |
|----------|------------|--------|------------|----------------|
| LinkedIn | 3,000 | 10 | 500 MB | 30 min |
| X/Twitter | 280 | 4 | 512 MB | 2 min |
| Instagram | 2,200 | 10 | 300 MB | 15 min (Reels) |
| Threads | 500 | 10 | 500 MB | 5 min |
| TikTok | 2,200 | - | 4 GB | 10 min |
| YouTube | 5,000 | - | 512 MB | 12 hours |
| Facebook | 63,206 | 10 | 512 MB | 45 min |
| Bluesky | 300 | 4 | 100 MB | 3 min |
| Mastodon | 500 | 4 | ~99 MB | ~3 min |
| Telegram | 4,096 | 10 | 50 MB | - |

## Architecture

```
publora-mvp/
├── src/
│   ├── index.js          # Main Express server
│   ├── api/
│   │   └── publora.js    # API client
│   ├── mcp/
│   │   └── server.js     # MCP server implementation
│   ├── platforms/
│   │   ├── manager.js    # Platform configuration
│   │   └── adapters.js   # Platform-specific adapters
│   └── utils/
│       └── helpers.js    # Utility functions
├── public/
│   └── index.html        # Web UI
├── tests/
├── package.json
└── README.md
```

## Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Render

```bash
# Connect your GitHub repo to Render
# Set environment variables:
# PUBLORA_API_KEY=your_key
# PORT=10000
```

## Differences from Original Publora

This MVP provides:
- ✅ REST API with same endpoints
- ✅ MCP server for AI agents
- ✅ Platform validation and limits
- ✅ Post scheduling
- ✅ Media upload handling
- ✅ LinkedIn analytics
- ⚠️ Uses mock data when real API unavailable
- ⚠️ OAuth flows not implemented (use real Publora for auth)

## License

MIT License - See [LICENSE](LICENSE) for details.

## Credits

Original Publora: [publora.com](https://publora.com)
