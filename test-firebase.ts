// Test Firebase connectivity and basic operations
import { FirebaseStorage } from './server/firebase-storage';

async function testFirebaseConnection() {
  console.log('🔥 Testing Firebase connection...');
  
  const storage = new FirebaseStorage();
  
  try {
    // Test basic operations
    console.log('📊 Getting inventory...');
    const inventory = await storage.getAllInventory();
    console.log(`✅ Found ${inventory.length} items in inventory`);
    
    console.log('👥 Getting users...');
    const users = await storage.getAllUsers();
    console.log(`✅ Found ${users?.length || 0} users`);
    
    console.log('📋 Getting activity logs...');
    const logs = await storage.getActivityLogs();
    console.log(`✅ Found ${logs?.length || 0} activity logs`);
    
    console.log('🎉 Firebase connection test successful!');
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
  }
}

// Run the test
testFirebaseConnection().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
