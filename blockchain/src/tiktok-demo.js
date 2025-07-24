const SidelinePinasMarketplace = require('./marketplace/tiktok-marketplace');

/**
 * Sideline_Pinas Marketplace Demo
 * Showcases creators, content creation, and affiliation program
 */
async function sidelinePinasDemo() {
  console.log('🎵 Sideline Pinas Marketplace Demo');
  console.log('==================================\n');
  
  const marketplace = new SidelinePinasMarketplace();
  
  try {
    // 1. Create a merchant with products
    console.log('1️⃣ Creating Electronics Merchant...');
    const merchant = await marketplace.createEntity('merchant', {
      businessInfo: {
        name: 'TechHub Philippines',
        type: 'Corporation',
        registrationNumber: 'TECH-2024-001',
        taxId: 'TAX-TH-001',
        address: 'BGC, Taguig City, Metro Manila'
      }
    });
    console.log(`✅ Merchant created: ${merchant.id.split(':').pop().substr(0, 12)}...\n`);

    // 2. Create products for affiliate marketing
    console.log('2️⃣ Creating Products...');
    const products = [];
    
    const productData = [
      { name: 'iPhone 15 Pro', category: 'Electronics', price: 75000 },
      { name: 'Samsung Galaxy Buds', category: 'Audio', price: 8500 },
      { name: 'MacBook Air M3', category: 'Computers', price: 85000 }
    ];

    for (const item of productData) {
      const product = await marketplace.createEntity('product', {
        productInfo: {
          name: item.name,
          manufacturer: 'TechHub Philippines',
          category: item.category,
          price: item.price,
          currency: 'PHP',
          inStock: true
        }
      });
      products.push(product);
      console.log(`📱 Product: ${item.name} - ₱${item.price.toLocaleString()}`);
    }
    console.log('');

    // 3. Create affiliate program
    console.log('3️⃣ Setting up Affiliate Program...');
    const affiliateProgram = await marketplace.createAffiliateProgram(merchant.id, {
      name: 'TechHub Creator Program',
      description: 'Earn commissions promoting the latest tech gadgets!',
      products: products.map(p => p.id),
      commissionRate: 0.08, // 8% base commission
      tiers: [
        { minSales: 0, rate: 0.08 },    // Bronze: 8%
        { minSales: 5, rate: 0.10 },    // Silver: 10%
        { minSales: 20, rate: 0.12 },   // Gold: 12%
        { minSales: 50, rate: 0.15 }    // Diamond: 15%
      ],
      minFollowers: 1000,
      payoutSchedule: 'monthly'
    });
    console.log(`💼 Program: ${affiliateProgram.name}`);
    console.log(`💰 Base Commission: ${affiliateProgram.commissionRates.base * 100}%\n`);

    // 4. Create content creators
    console.log('4️⃣ Creating Content Creators...');
    const creators = [];
    
    const creatorProfiles = [
      {
        name: 'Maya Santos',
        username: 'TechMayaPH',
        categories: ['Tech Reviews', 'Gadgets', 'Lifestyle'],
        bio: 'Tech reviewer from Manila 📱✨'
      },
      {
        name: 'Jake Reyes',
        username: 'GadgetGuyJake',
        categories: ['Gaming', 'Tech', 'Unboxing'],
        bio: 'Gaming tech enthusiast 🎮🔥'
      },
      {
        name: 'Sarah Kim',
        username: 'SarahTechTips',
        categories: ['Tech Tips', 'Productivity', 'Reviews'],
        bio: 'Making tech simple for everyone 💡'
      }
    ];

    for (const profile of creatorProfiles) {
      const creator = await marketplace.createCreator(profile, profile.categories);
      creators.push({ profile: profile, creator: creator });
      
      // Simulate some followers to meet affiliate requirements
      for (let i = 0; i < 1200; i++) {
        const followerDID = `did:follower:${i}`;
        await marketplace.followCreator(followerDID, creator.id);
      }
      
      console.log(`👤 Creator: ${profile.name} (@${profile.username})`);
      console.log(`   📊 Followers: ${marketplace.creators.get(creator.id).stats.followers.toLocaleString()}`);
    }
    console.log('');

    // 5. Join affiliate programs
    console.log('5️⃣ Joining Affiliate Program...');
    const affiliations = [];
    
    for (const { profile, creator } of creators) {
      const { affiliation, credential } = await marketplace.joinAffiliateProgram(
        creator.id,
        affiliateProgram.id,
        { reason: `I create ${profile.categories.join(', ')} content for Filipino tech enthusiasts` }
      );
      
      affiliations.push(affiliation);
      console.log(`🤝 ${profile.name} joined affiliate program`);
      console.log(`🎫 Credential: ${credential.id.substr(0, 20)}...`);
    }
    console.log('');

    // 6. Create viral content with affiliate links
    console.log('6️⃣ Creating Viral Content...');
    const contentPieces = [];
    
    const contentIdeas = [
      {
        creator: 0,
        title: 'iPhone 15 Pro UNBOXING + First Impressions! 🔥',
        description: 'OMG guys! Finally got the new iPhone 15 Pro! The cameras are insane! 📸 Link in bio to get yours! #iPhone15Pro #TechReview',
        tags: ['#iPhone15Pro', '#TechReview', '#Unboxing', '#Apple', '#Philippines'],
        duration: 45,
        category: 'Tech Reviews',
        productIndex: 0
      },
      {
        creator: 1,
        title: 'GALAXY BUDS vs AIRPODS - Gaming Test! 🎮',
        description: 'Testing Galaxy Buds for mobile gaming! No lag, crystal clear audio! Perfect for MLBB! Get them here 👇 #GalaxyBuds #Gaming',
        tags: ['#GalaxyBuds', '#Gaming', '#MLBB', '#Samsung', '#AudioTest'],
        duration: 60,
        category: 'Gaming',
        productIndex: 1
      },
      {
        creator: 2,
        title: 'MacBook Air M3 - Perfect for Content Creators! 💻',
        description: 'Why the MacBook Air M3 is perfect for Filipino content creators! Speed, portability, battery life! Link below 📱',
        tags: ['#MacBookAir', '#M3Chip', '#ContentCreator', '#Apple', '#ProductivityTips'],
        duration: 90,
        category: 'Productivity',
        productIndex: 2
      }
    ];

    for (const idea of contentIdeas) {
      const { creator } = creators[idea.creator];
      const product = products[idea.productIndex];
      const affiliation = affiliations[idea.creator];
      
      const content = await marketplace.createContent(creator.id, {
        type: 'video',
        title: idea.title,
        description: idea.description,
        tags: idea.tags,
        duration: idea.duration,
        category: idea.category,
        isSponsored: true,
        sponsoredProducts: [product.id],
        affiliateLinks: [
          {
            productDID: product.id,
            trackingId: Object.values(affiliation.personalizedLinks)[idea.productIndex]?.trackingId
          }
        ],
        thumbnail: `https://cdn.sideline.ph/thumbnails/${idea.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`,
        mediaUrl: `https://cdn.sideline.ph/videos/${Date.now()}.mp4`
      });
      
      contentPieces.push(content);
      console.log(`🎬 "${idea.title}"`);
      console.log(`   👤 Creator: ${creatorProfiles[idea.creator].name}`);
      console.log(`   🏷️ Product: ${productData[idea.productIndex].name}`);
    }
    console.log('');

    // 7. Simulate user engagement
    console.log('7️⃣ Simulating User Engagement...');
    
    for (const content of contentPieces) {
      // Simulate views, likes, and shares
      content.stats.views = Math.floor(Math.random() * 100000) + 50000;
      content.stats.likes = Math.floor(content.stats.views * 0.08); // 8% like rate
      content.stats.shares = Math.floor(content.stats.views * 0.02); // 2% share rate
      
      // Simulate likes from users
      for (let i = 0; i < Math.min(content.stats.likes, 100); i++) {
        const userDID = `did:user:${Math.floor(Math.random() * 10000)}`;
        await marketplace.likeContent(userDID, content.id);
      }
      
      console.log(`📊 ${content.title.substr(0, 30)}...`);
      console.log(`   👀 Views: ${content.stats.views.toLocaleString()}`);
      console.log(`   ❤️ Likes: ${content.stats.likes.toLocaleString()}`);
    }
    console.log('');

    // 8. Simulate affiliate sales
    console.log('8️⃣ Simulating Affiliate Sales...');
    
    const salesData = [
      { creatorIndex: 0, productIndex: 0, sales: 8, avgAmount: 75000 },  // Maya - iPhone
      { creatorIndex: 1, productIndex: 1, sales: 15, avgAmount: 8500 },  // Jake - Galaxy Buds
      { creatorIndex: 2, productIndex: 2, sales: 6, avgAmount: 85000 }   // Sarah - MacBook
    ];

    for (const sale of salesData) {
      const affiliation = affiliations[sale.creatorIndex];
      const product = products[sale.productIndex];
      const creator = creatorProfiles[sale.creatorIndex];
      
      // Get tracking ID for this product
      const trackingId = Object.values(affiliation.personalizedLinks)[sale.productIndex]?.trackingId;
      
      if (trackingId) {
        // Simulate clicks first
        const clicks = sale.sales * 10; // 10% conversion rate
        for (let i = 0; i < clicks; i++) {
          await marketplace.trackAffiliateActivity(trackingId, 'click');
        }
        
        // Simulate conversions
        for (let i = 0; i < sale.sales; i++) {
          await marketplace.trackAffiliateActivity(trackingId, 'conversion', {
            amount: sale.avgAmount,
            currency: 'PHP',
            orderId: `order_${Date.now()}_${i}`,
            productName: productData[sale.productIndex].name
          });
        }
        
        console.log(`💳 ${creator.name}: ${sale.sales} sales of ${productData[sale.productIndex].name}`);
        console.log(`   💰 Revenue: ₱${(sale.sales * sale.avgAmount).toLocaleString()}`);
        
        // Show commission earned
        const tier = marketplace.getCurrentCommissionTier(affiliation);
        const totalCommission = sale.sales * sale.avgAmount * tier.rate;
        console.log(`   🏆 Tier: ${tier.rate * 100}% commission`);
        console.log(`   💵 Commission: ₱${totalCommission.toLocaleString()}`);
      }
    }
    console.log('');

    // 9. Create a viral challenge
    console.log('9️⃣ Creating Viral Challenge...');
    const challenge = await marketplace.createChallenge(creators[0].creator.id, {
      title: 'Tech Setup Tour Challenge',
      description: 'Show us your ultimate tech setup! Tag #TechSetupPH and use any TechHub product!',
      hashtag: 'TechSetupPH',
      rules: [
        'Must feature at least one TechHub product',
        'Video must be 30-60 seconds',
        'Tag 3 friends to participate'
      ],
      prizes: [
        'Grand Prize: iPhone 15 Pro + MacBook Air',
        '2nd Prize: Samsung Galaxy Buds + Accessories',
        '5 Runner-ups: TechHub Gift Cards'
      ],
      isSponsored: true,
      sponsorDID: merchant.id,
      endDate: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    });
    console.log(`🏆 Challenge: ${challenge.title}`);
    console.log(`   #️⃣ Hashtag: #${challenge.hashtag}`);
    console.log(`   🎁 Prizes: ${challenge.prizes.length} tiers`);
    console.log('');

    // 10. Get trending content
    console.log('🔟 Trending Content Analysis...');
    const trending = marketplace.getTrendingContent(3);
    console.log('Top 3 Trending Videos:');
    trending.forEach((content, index) => {
      const creatorData = creatorProfiles.find(c => 
        creators.find(cr => cr.creator.id === content.creatorDID)?.profile.username === c.username
      );
      console.log(`${index + 1}. "${content.title.substr(0, 40)}..."`);
      console.log(`   👤 @${creatorData?.username || 'Unknown'}`);
      console.log(`   📊 ${content.stats.views.toLocaleString()} views, ${content.stats.likes.toLocaleString()} likes`);
    });
    console.log('');

    // 11. Show comprehensive analytics
    console.log('1️⃣1️⃣ Marketplace Analytics Dashboard');
    console.log('=====================================');
    const analytics = marketplace.getAnalytics();
    
    console.log('📊 CORE MARKETPLACE:');
    console.log(`   Entities: ${analytics.totalEntities}`);
    console.log(`   Credentials: ${analytics.totalCredentials}`);
    console.log(`   Transactions: ${analytics.totalTransactions}`);
    console.log('');
    
    console.log('🎵 SIDELINE PINAS FEATURES:');
    console.log(`   Creators: ${analytics.tiktokMarketplace.creators}`);
    console.log(`   Content Pieces: ${analytics.tiktokMarketplace.totalContent}`);
    console.log(`   Total Follows: ${analytics.tiktokMarketplace.totalFollows.toLocaleString()}`);
    console.log(`   Total Likes: ${analytics.tiktokMarketplace.totalLikes.toLocaleString()}`);
    console.log(`   Challenges: ${analytics.tiktokMarketplace.challenges}`);
    console.log('');
    
    console.log('💰 AFFILIATE PROGRAM:');
    console.log(`   Programs: ${analytics.tiktokMarketplace.affiliatePrograms}`);
    console.log(`   Active Affiliates: ${analytics.tiktokMarketplace.activeAffiliations}`);
    console.log(`   Total Commissions: ₱${analytics.tiktokMarketplace.totalCommissionsPaid.toLocaleString()}`);
    console.log('');
    
    console.log('🏆 TOP CREATORS:');
    analytics.tiktokMarketplace.topCreators.forEach((creator, index) => {
      const profile = creatorProfiles.find(p => 
        creators.find(c => c.creator.id.includes(creator.did))?.profile.username === p.username
      );
      console.log(`   ${index + 1}. @${profile?.username || creator.did}`);
      console.log(`      👥 ${creator.followers.toLocaleString()} followers`);
      console.log(`      🎬 ${creator.content} content pieces`);
    });
    console.log('');
    
    console.log('💎 TOKENOMICS:');
    const tokenStats = analytics.tokenomics;
    console.log(`   Total Supply: ${marketplace.veriToken.formatTokens(tokenStats.totalSupply)} VERI`);
    console.log(`   Circulating Supply: ${marketplace.veriToken.formatTokens(tokenStats.circulatingSupply)} VERI`);
    console.log(`   Total Holders: ${tokenStats.totalHolders}`);
    console.log(`   Total Transactions: ${tokenStats.totalTransactions}`);
    console.log('');

    console.log('🎉 SIDELINE PINAS MARKETPLACE DEMO COMPLETE! 🎉');
    console.log('===============================================');
    console.log('✨ Features Demonstrated:');
    console.log('   🎭 Content Creator Profiles');
    console.log('   🎬 Short-form Video Content');
    console.log('   💰 Multi-tier Affiliate Program');
    console.log('   📊 Real-time Analytics');
    console.log('   🏆 Viral Challenges');
    console.log('   👥 Social Engagement (Follows, Likes)');
    console.log('   🔗 Affiliate Link Tracking');
    console.log('   💳 Commission Payouts');
    console.log('   🪙 Token-based Rewards');
    console.log('   🎯 Trending Algorithm');
    console.log('');
    console.log('Ready for the Philippine market! 🇵🇭✨');

  } catch (error) {
    console.error('❌ Demo Error:', error.message);
    console.error(error.stack);
  }
}

// Export and run
module.exports = sidelinePinasDemo;

if (require.main === module) {
  sidelinePinasDemo().catch(console.error);
}
