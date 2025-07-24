const express = require('express');
const cors = require('cors');
const SidelinePinasMarketplace = require('./tiktok-marketplace');

/**
 * Sideline Pinas Marketplace API Server
 * RESTful API for social marketplace features
 */
class SidelinePinasMarketplaceAPI {
  constructor(port = 3000) {
    this.app = express();
    this.port = port;
    this.marketplace = new SidelinePinasMarketplace();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'Sideline Pinas Marketplace API'
      });
    });

    // Creator Management Routes
    this.app.post('/api/creators', async (req, res) => {
      try {
        const { personalInfo, contentCategories } = req.body;
        const creator = await this.marketplace.createCreator(personalInfo, contentCategories);
        
        res.status(201).json({
          success: true,
          data: {
            creatorId: creator.id,
            profile: creator.profile,
            initialTokens: this.marketplace.veriToken.balanceOf(creator.id)
          }
        });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/creators/:creatorId', async (req, res) => {
      try {
        const { creatorId } = req.params;
        const creator = this.marketplace.creators.get(creatorId);
        
        if (!creator) {
          return res.status(404).json({ success: false, error: 'Creator not found' });
        }

        res.json({
          success: true,
          data: {
            ...creator,
            tokenBalance: this.marketplace.veriToken.balanceOf(creatorId),
            contentList: creator.content.map(contentId => this.marketplace.content.get(contentId))
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Content Management Routes
    this.app.post('/api/content', async (req, res) => {
      try {
        const { creatorDID, contentData } = req.body;
        const content = await this.marketplace.createContent(creatorDID, contentData);
        
        res.status(201).json({
          success: true,
          data: {
            contentId: content.id,
            content: content,
            rewardEarned: '10.00 VERI'
          }
        });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/content/:contentId', async (req, res) => {
      try {
        const { contentId } = req.params;
        const content = this.marketplace.content.get(contentId);
        
        if (!content) {
          return res.status(404).json({ success: false, error: 'Content not found' });
        }

        // Increment view count
        content.stats.views++;

        res.json({
          success: true,
          data: content
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/content', async (req, res) => {
      try {
        const { limit = 20, category, creatorId } = req.query;
        let contents = Array.from(this.marketplace.content.values());

        // Filter by category
        if (category) {
          contents = contents.filter(c => c.category === category);
        }

        // Filter by creator
        if (creatorId) {
          contents = contents.filter(c => c.creatorDID === creatorId);
        }

        // Sort by timestamp (newest first)
        contents = contents
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, parseInt(limit));

        res.json({
          success: true,
          data: {
            contents: contents,
            total: contents.length
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/trending', async (req, res) => {
      try {
        const { limit = 10 } = req.query;
        const trending = this.marketplace.getTrendingContent(parseInt(limit));
        
        res.json({
          success: true,
          data: {
            trending: trending,
            algorithm: 'likes * 2 + shares * 3 + comments * 1.5 - age_penalty'
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Social Interaction Routes
    this.app.post('/api/follow', async (req, res) => {
      try {
        const { followerDID, creatorDID } = req.body;
        const follow = await this.marketplace.followCreator(followerDID, creatorDID);
        
        const creator = this.marketplace.creators.get(creatorDID);
        
        res.json({
          success: true,
          data: {
            followId: `${followerDID}_follows_${creatorDID}`,
            newFollowerCount: creator?.stats.followers || 0,
            rewardEarned: '0.5 VERI'
          }
        });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/like', async (req, res) => {
      try {
        const { userDID, contentId } = req.body;
        const like = await this.marketplace.likeContent(userDID, contentId);
        
        const content = this.marketplace.content.get(contentId);
        
        res.json({
          success: true,
          data: {
            likeId: `${userDID}_likes_${contentId}`,
            newLikeCount: content?.stats.likes || 0,
            rewardEarned: '0.01 VERI'
          }
        });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    // Affiliate Program Routes
    this.app.post('/api/affiliate/programs', async (req, res) => {
      try {
        const { merchantDID, programData } = req.body;
        const program = await this.marketplace.createAffiliateProgram(merchantDID, programData);
        
        res.status(201).json({
          success: true,
          data: {
            programId: program.id,
            program: program
          }
        });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/affiliate/programs', async (req, res) => {
      try {
        const { active = true } = req.query;
        const programs = Array.from(this.marketplace.affiliatePrograms.values());
        
        const filteredPrograms = active === 'true' 
          ? programs.filter(p => p.isActive)
          : programs;
        
        res.json({
          success: true,
          data: {
            programs: filteredPrograms,
            total: filteredPrograms.length
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/affiliate/join', async (req, res) => {
      try {
        const { creatorDID, programId, applicationData } = req.body;
        const { affiliation, credential } = await this.marketplace.joinAffiliateProgram(
          creatorDID, 
          programId, 
          applicationData
        );
        
        res.json({
          success: true,
          data: {
            affiliationId: affiliation.id,
            credentialId: credential.id,
            personalizedLinks: affiliation.personalizedLinks,
            commissionTier: this.marketplace.getCurrentCommissionTier(affiliation)
          }
        });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/affiliate/track', async (req, res) => {
      try {
        const { trackingId, activityType, metadata } = req.body;
        const result = await this.marketplace.trackAffiliateActivity(
          trackingId, 
          activityType, 
          metadata
        );
        
        res.json({
          success: true,
          data: {
            tracked: result.activity,
            affiliation: {
              id: result.affiliation.id,
              stats: result.affiliation.stats
            },
            metadata: result.metadata
          }
        });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/affiliate/stats/:creatorId', async (req, res) => {
      try {
        const { creatorId } = req.params;
        const creator = this.marketplace.creators.get(creatorId);
        
        if (!creator) {
          return res.status(404).json({ success: false, error: 'Creator not found' });
        }

        const affiliationStats = creator.affiliations.map(affiliationId => {
          const affiliation = this.marketplace.affiliations.get(affiliationId);
          const program = this.marketplace.affiliatePrograms.get(affiliation?.programId);
          
          return {
            programName: program?.name,
            stats: affiliation?.stats,
            currentTier: this.marketplace.getCurrentCommissionTier(affiliation),
            personalizedLinks: affiliation?.personalizedLinks
          };
        });

        res.json({
          success: true,
          data: {
            creatorId: creatorId,
            affiliationStats: affiliationStats,
            totalCommissionsEarned: affiliationStats.reduce((sum, stat) => 
              sum + (stat.stats?.commissionsEarned || 0), 0
            )
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Challenge Routes
    this.app.post('/api/challenges', async (req, res) => {
      try {
        const { creatorDID, challengeData } = req.body;
        const challenge = await this.marketplace.createChallenge(creatorDID, challengeData);
        
        res.status(201).json({
          success: true,
          data: {
            challengeId: challenge.id,
            challenge: challenge
          }
        });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/challenges', async (req, res) => {
      try {
        const { active = true } = req.query;
        const challenges = Array.from(this.marketplace.challenges.values());
        
        const now = Date.now();
        const filteredChallenges = active === 'true'
          ? challenges.filter(c => !c.endDate || c.endDate > now)
          : challenges;
        
        res.json({
          success: true,
          data: {
            challenges: filteredChallenges,
            total: filteredChallenges.length
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Analytics Routes
    this.app.get('/api/analytics', async (req, res) => {
      try {
        const analytics = this.marketplace.getAnalytics();
        
        res.json({
          success: true,
          data: analytics
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/analytics/creator/:creatorId', async (req, res) => {
      try {
        const { creatorId } = req.params;
        const creator = this.marketplace.creators.get(creatorId);
        
        if (!creator) {
          return res.status(404).json({ success: false, error: 'Creator not found' });
        }

        const creatorContent = creator.content.map(contentId => 
          this.marketplace.content.get(contentId)
        );
        
        const totalViews = creatorContent.reduce((sum, c) => sum + (c?.stats.views || 0), 0);
        const totalLikes = creatorContent.reduce((sum, c) => sum + (c?.stats.likes || 0), 0);
        const totalShares = creatorContent.reduce((sum, c) => sum + (c?.stats.shares || 0), 0);

        res.json({
          success: true,
          data: {
            creatorId: creatorId,
            followers: creator.stats.followers,
            contentCount: creator.stats.contentCount,
            totalViews: totalViews,
            totalLikes: totalLikes,
            totalShares: totalShares,
            engagementRate: totalViews > 0 ? ((totalLikes + totalShares) / totalViews * 100).toFixed(2) : 0,
            tokenBalance: this.marketplace.veriToken.balanceOf(creatorId),
            affiliationCount: creator.affiliations.length
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Search Routes
    this.app.get('/api/search', async (req, res) => {
      try {
        const { q: query, type = 'content', limit = 20 } = req.query;
        
        if (!query) {
          return res.status(400).json({ success: false, error: 'Search query required' });
        }

        let results = [];
        const searchQuery = query.toLowerCase();

        if (type === 'content' || type === 'all') {
          const contents = Array.from(this.marketplace.content.values())
            .filter(c => 
              c.title.toLowerCase().includes(searchQuery) ||
              c.description.toLowerCase().includes(searchQuery) ||
              c.tags.some(tag => tag.toLowerCase().includes(searchQuery))
            )
            .slice(0, parseInt(limit));
          
          results.push({
            type: 'content',
            items: contents
          });
        }

        if (type === 'creators' || type === 'all') {
          const creators = Array.from(this.marketplace.creators.values())
            .filter(c => 
              c.profile.personalInfo?.name?.toLowerCase().includes(searchQuery) ||
              c.profile.personalInfo?.username?.toLowerCase().includes(searchQuery) ||
              c.profile.contentCategories?.some(cat => cat.toLowerCase().includes(searchQuery))
            )
            .slice(0, parseInt(limit));
          
          results.push({
            type: 'creators',
            items: creators
          });
        }

        res.json({
          success: true,
          data: {
            query: query,
            results: results,
            total: results.reduce((sum, r) => sum + r.items.length, 0)
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Error handling middleware
    this.app.use((err, req, res, next) => {
      console.error('API Error:', err);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ 
        success: false, 
        error: 'Endpoint not found',
        availableEndpoints: [
          'GET /health',
          'POST /api/creators',
          'GET /api/creators/:creatorId',
          'POST /api/content',
          'GET /api/content',
          'GET /api/trending',
          'POST /api/follow',
          'POST /api/like',
          'POST /api/affiliate/programs',
          'GET /api/affiliate/programs',
          'POST /api/affiliate/join',
          'POST /api/affiliate/track',
          'GET /api/affiliate/stats/:creatorId',
          'POST /api/challenges',
          'GET /api/challenges',
          'GET /api/analytics',
          'GET /api/search'
        ]
      });
    });
  }

  async start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log('🎵 Sideline Pinas Marketplace API');
        console.log('===============================');
        console.log(`🚀 Server running on port ${this.port}`);
        console.log(`🌐 Health check: http://localhost:${this.port}/health`);
        console.log(`📚 API base URL: http://localhost:${this.port}/api/`);
        console.log('');
        console.log('Available features:');
        console.log('  🎭 Creator management');
        console.log('  🎬 Content creation & discovery');
        console.log('  💰 Affiliate program management');
        console.log('  👥 Social interactions (follow, like)');
        console.log('  🏆 Challenge system');
        console.log('  📊 Analytics & trending');
        console.log('  🔍 Search functionality');
        console.log('');
        resolve();
      });
    });
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('🛑 Sideline Pinas Marketplace API server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = SidelinePinasMarketplaceAPI;
