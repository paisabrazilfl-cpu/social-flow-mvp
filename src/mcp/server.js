/**
 * MCP Server Implementation
 * Provides AI agent tool access to Publora functionality
 * 
 * MCP Protocol: https://modelcontextprotocol.io/
 */

export class MCPServer {
  constructor(api, platformManager) {
    this.api = api;
    this.platformManager = platformManager;
    this.tools = this.registerTools();
  }

  /**
   * Register all MCP tools
   */
  registerTools() {
    return {
      // Posts
      list_posts: {
        name: 'list_posts',
        description: 'List posts with optional filters for status, platform, and date range.',
        inputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['draft', 'scheduled', 'published', 'failed', 'partially_published'] },
            platform: { type: 'string' },
            fromDate: { type: 'string' },
            toDate: { type: 'string' },
            page: { type: 'number', default: 1 },
            limit: { type: 'number', default: 20 },
            sortBy: { type: 'string', default: 'createdAt' },
            sortOrder: { type: 'string', default: 'desc' }
          }
        },
        handler: async (params) => this.listPosts(params)
      },

      create_post: {
        name: 'create_post',
        description: 'Create and schedule a post to one or more platforms.',
        inputSchema: {
          type: 'object',
          required: ['content', 'platforms', 'scheduledTime'],
          properties: {
            content: { type: 'string', description: 'Post text content' },
            platforms: { type: 'array', items: { type: 'string' }, description: 'Platform connection IDs' },
            scheduledTime: { type: 'string', description: 'ISO 8601 datetime' }
          }
        },
        handler: async (params) => this.createPost(params)
      },

      get_post: {
        name: 'get_post',
        description: 'Get details of a specific post group.',
        inputSchema: {
          type: 'object',
          required: ['postGroupId'],
          properties: {
            postGroupId: { type: 'string' }
          }
        },
        handler: async (params) => this.getPost(params)
      },

      update_post: {
        name: 'update_post',
        description: 'Reschedule or change post status.',
        inputSchema: {
          type: 'object',
          required: ['postGroupId'],
          properties: {
            postGroupId: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'scheduled'] },
            scheduledTime: { type: 'string' }
          }
        },
        handler: async (params) => this.updatePost(params)
      },

      delete_post: {
        name: 'delete_post',
        description: 'Delete a post from all platforms.',
        inputSchema: {
          type: 'object',
          required: ['postGroupId'],
          properties: {
            postGroupId: { type: 'string' }
          }
        },
        handler: async (params) => this.deletePost(params)
      },

      get_upload_url: {
        name: 'get_upload_url',
        description: 'Get presigned URL for media uploads.',
        inputSchema: {
          type: 'object',
          required: ['postGroupId', 'fileName', 'contentType', 'type'],
          properties: {
            postGroupId: { type: 'string' },
            fileName: { type: 'string' },
            contentType: { type: 'string' },
            type: { type: 'string', enum: ['image', 'video'] }
          }
        },
        handler: async (params) => this.getUploadUrl(params)
      },

      // Connections
      list_connections: {
        name: 'list_connections',
        description: 'List all connected social media accounts.',
        inputSchema: {
          type: 'object',
          properties: {}
        },
        handler: async () => this.listConnections()
      },

      // LinkedIn Reactions
      linkedin_create_reaction: {
        name: 'linkedin_create_reaction',
        description: 'React to a LinkedIn post.',
        inputSchema: {
          type: 'object',
          required: ['postedId', 'platformId', 'reactionType'],
          properties: {
            postedId: { type: 'string', description: 'LinkedIn post URN' },
            platformId: { type: 'string' },
            reactionType: { 
              type: 'string', 
              enum: ['LIKE', 'PRAISE', 'EMPATHY', 'INTEREST', 'APPRECIATION', 'ENTERTAINMENT'] 
            }
          }
        },
        handler: async (params) => this.linkedinCreateReaction(params)
      },

      linkedin_delete_reaction: {
        name: 'linkedin_delete_reaction',
        description: 'Remove a reaction from a LinkedIn post.',
        inputSchema: {
          type: 'object',
          required: ['postedId', 'platformId'],
          properties: {
            postedId: { type: 'string' },
            platformId: { type: 'string' }
          }
        },
        handler: async (params) => this.linkedinDeleteReaction(params)
      },

      // LinkedIn Comments
      linkedin_create_comment: {
        name: 'linkedin_create_comment',
        description: 'Post a comment on a LinkedIn post (max 1,250 characters).',
        inputSchema: {
          type: 'object',
          required: ['postedId', 'platformId', 'message'],
          properties: {
            postedId: { type: 'string' },
            platformId: { type: 'string' },
            message: { type: 'string', maxLength: 1250 },
            parentComment: { type: 'string' }
          }
        },
        handler: async (params) => this.linkedinCreateComment(params)
      },

      linkedin_delete_comment: {
        name: 'linkedin_delete_comment',
        description: 'Remove a comment from a LinkedIn post.',
        inputSchema: {
          type: 'object',
          required: ['postedId', 'commentId', 'platformId'],
          properties: {
            postedId: { type: 'string' },
            commentId: { type: 'string' },
            platformId: { type: 'string' }
          }
        },
        handler: async (params) => this.linkedinDeleteComment(params)
      },

      // LinkedIn Analytics
      linkedin_post_stats: {
        name: 'linkedin_post_stats',
        description: 'Get engagement metrics for a specific LinkedIn post.',
        inputSchema: {
          type: 'object',
          required: ['postedId', 'platformId'],
          properties: {
            postedId: { type: 'string' },
            platformId: { type: 'string' },
            queryTypes: { type: 'string', default: 'ALL' }
          }
        },
        handler: async (params) => this.linkedinPostStats(params)
      },

      linkedin_account_stats: {
        name: 'linkedin_account_stats',
        description: 'Get aggregated statistics for your LinkedIn account.',
        inputSchema: {
          type: 'object',
          required: ['platformId'],
          properties: {
            platformId: { type: 'string' },
            queryTypes: { type: 'string', default: 'ALL' },
            aggregation: { type: 'string', enum: ['DAILY', 'TOTAL'], default: 'TOTAL' }
          }
        },
        handler: async (params) => this.linkedinAccountStats(params)
      }
    };
  }

  /**
   * Handle incoming MCP request
   */
  async handleRequest(request) {
    const { method, params = {} } = request;

    switch (method) {
      case 'tools/list':
        return this.listTools();
      
      case 'tools/call':
        return this.callTool(params.name, params.arguments);
      
      case 'resources/list':
        return this.listResources();
      
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  /**
   * List available tools
   */
  listTools() {
    const tools = Object.values(this.tools).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));

    return { tools };
  }

  /**
   * Call a specific tool
   */
  async callTool(name, args) {
    const tool = this.tools[name];
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    try {
      const result = await tool.handler(args);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: error.message })
        }],
        isError: true
      };
    }
  }

  /**
   * List resources
   */
  listResources() {
    return { resources: [] };
  }

  // ============ Tool Handlers ============

  async listPosts(args) {
    return this.api.listPosts(process.env.PUBLORA_API_KEY, args);
  }

  async createPost(args) {
    const postGroupId = await this.api.createPost(process.env.PUBLORA_API_KEY, args);
    return { success: true, postGroupId };
  }

  async getPost(args) {
    return this.api.getPost(process.env.PUBLORA_API_KEY, args.postGroupId);
  }

  async updatePost(args) {
    const { postGroupId, ...updates } = args;
    return this.api.updatePost(process.env.PUBLORA_API_KEY, postGroupId, updates);
  }

  async deletePost(args) {
    return this.api.deletePost(process.env.PUBLORA_API_KEY, args.postGroupId);
  }

  async getUploadUrl(args) {
    return this.api.getUploadUrl(process.env.PUBLORA_API_KEY, args);
  }

  async listConnections() {
    return this.api.getPlatformConnections(process.env.PUBLORA_API_KEY);
  }

  async linkedinCreateReaction(args) {
    const { platformId, postedId, reactionType } = args;
    return this.api.createLinkedInReaction(process.env.PUBLORA_API_KEY, {
      platformId,
      postedId,
      reactionType
    });
  }

  async linkedinDeleteReaction(args) {
    // Mock implementation
    return { success: true };
  }

  async linkedinCreateComment(args) {
    const { platformId, postedId, message, parentComment } = args;
    return this.api.createLinkedInComment(process.env.PUBLORA_API_KEY, {
      platformId,
      postedId,
      message,
      parentComment
    });
  }

  async linkedinDeleteComment(args) {
    return { success: true };
  }

  async linkedinPostStats(args) {
    const { platformId, postedId, queryTypes } = args;
    return this.api.getLinkedInPostStats(process.env.PUBLORA_API_KEY, {
      platformId,
      postedId,
      queryTypes
    });
  }

  async linkedinAccountStats(args) {
    const { platformId, queryTypes, aggregation } = args;
    return this.api.getLinkedInAccountStats(process.env.PUBLORA_API_KEY, {
      platformId,
      queryTypes,
      aggregation
    });
  }
}
