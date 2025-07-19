const API = require('./src/marketplace/api-server');

async function testAPI() {
  try {
    console.log('🧪 Testing API Server initialization...');
    
    const api = new API(3000);
    
    console.log('✅ API Server created successfully');
    console.log('📊 Components initialized:');
    console.log('  - Marketplace:', !!api.marketplace);
    console.log('  - Customer Onboarding:', !!api.customerOnboarding);
    console.log('  - Product Authenticity:', !!api.productAuthenticity);
    console.log('  - ZKP System:', !!api.zkpSystem);
    
    // Test ZKP system initialization
    console.log('\n🔐 Testing ZKP System initialization...');
    await api.zkpSystem.initialize();
    
    console.log('✅ ZKP System initialized successfully');
    console.log('📊 ZKP Statistics:', api.zkpSystem.getStatistics());
    
    // Test ZKP proof generation
    console.log('\n🔍 Testing ZKP proof generation...');
    const ageProof = await api.zkpSystem.generateAgeProof('1990-01-01', 18, {
      purpose: 'marketplace_access'
    });
    
    console.log('✅ Age proof generated:', ageProof.proofId);
    
    // Test ZKP proof verification
    console.log('\n🔍 Testing ZKP proof verification...');
    const verificationResult = await api.zkpSystem.verifyProof(ageProof.proofId);
    
    console.log('✅ Proof verification result:', verificationResult.isValid);
    console.log('📊 Final ZKP Statistics:', api.zkpSystem.getStatistics());
    
    console.log('\n🎉 API Server test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

testAPI().catch(console.error);
