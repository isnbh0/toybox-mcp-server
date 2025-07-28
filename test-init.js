#!/usr/bin/env node

import { initializeToybox } from './dist/handlers/init.js';

async function testInit() {
  console.log('🧪 Testing TOYBOX initialization...\n');
  
  // Set debug mode for logging
  process.env.TOYBOX_DEBUG = 'true';
  process.env.TOYBOX_LOG_LEVEL = 'debug';
  
  console.log('Environment variables set:');
  console.log('  TOYBOX_DEBUG:', process.env.TOYBOX_DEBUG);
  console.log('  TOYBOX_LOG_LEVEL:', process.env.TOYBOX_LOG_LEVEL);
  console.log('  HOME:', process.env.HOME);
  console.log('  USER:', process.env.USER);
  console.log('  PWD:', process.cwd());
  console.log('');
  
  const params = {
    repoName: 'test-toybox',
    templateOwner: 'isnbh0',
    templateRepo: 'toybox',
    config: {
      title: 'Test TOYBOX',
      description: 'A test TOYBOX for debugging',
      theme: 'auto',
      layout: 'grid',
      showFooter: true,
    },
    debug: true,
    localTemplatePath: undefined,
    createRemote: true,
    isPrivate: false,
  };
  
  console.log('📋 Test parameters:');
  console.log(JSON.stringify(params, null, 2));
  console.log('');
  
  try {
    console.log('⚡ Calling initializeToybox...\n');
    const result = await initializeToybox(params);
    
    console.log('✅ Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n🎉 Success! TOYBOX initialized successfully.');
    } else {
      console.log('\n❌ Failed:', result.error);
    }
    
  } catch (error) {
    console.error('\n💥 Unexpected error:');
    console.error(error);
  }
  
  console.log('\n📋 Check the log file for detailed debugging info:');
  console.log('  tail -f ../.local/logs/$(ls -t ../.local/logs/ | head -1)');
}

// Run the test
testInit().catch(console.error);