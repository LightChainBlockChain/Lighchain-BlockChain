const SidelinePinasAPI = require('./src/marketplace/tiktok-api');

/**
 * Start Sideline Pinas Marketplace API Server
 */
async function startServer() {
  console.log('🎵 Starting Sideline Pinas Marketplace API...\n');
  
  const port = process.env.PORT || 3000;
  const api = new SidelinePinasAPI(port);
  
  try {
    await api.start();
    
    console.log('✨ Ready to serve requests!');
    console.log('');
    console.log('🔗 Quick API Examples:');
    console.log(`   curl http://localhost:${port}/health`);
    console.log(`   curl http://localhost:${port}/api/analytics`);
    console.log(`   curl http://localhost:${port}/api/trending`);
    console.log('');
    console.log('📚 Full API documentation available at each endpoint');
    console.log('🛑 Press Ctrl+C to stop the server');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
  
  // Handle shutdown gracefully
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await api.stop();
    process.exit(0);
  });
}

// Start the server
startServer();
