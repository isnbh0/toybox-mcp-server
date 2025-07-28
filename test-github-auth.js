#!/usr/bin/env node

import { GitHubService } from './dist/services/github.js';

async function testGitHubAuth() {
  console.log('🔐 Testing GitHub authentication...\n');
  
  // Set debug mode for logging
  process.env.TOYBOX_DEBUG = 'true';
  process.env.TOYBOX_LOG_LEVEL = 'debug';
  
  console.log('Environment check:');
  console.log('  HOME:', process.env.HOME);
  console.log('  PATH:', process.env.PATH?.split(':').slice(0, 5).join(':') + '...');
  console.log('  GH_TOKEN:', process.env.GH_TOKEN ? '[REDACTED]' : 'not set');
  console.log('  GITHUB_TOKEN:', process.env.GITHUB_TOKEN ? '[REDACTED]' : 'not set');
  console.log('');
  
  const githubService = new GitHubService();
  
  try {
    console.log('⚡ Calling checkAuthStatus...\n');
    const authStatus = await githubService.checkAuthStatus();
    
    console.log('✅ Auth Status Result:');
    console.log(JSON.stringify(authStatus, null, 2));
    
    if (authStatus.authenticated) {
      console.log(`\n🎉 Success! Logged in as: ${authStatus.user}`);
      if (authStatus.scopes) {
        console.log(`   Token scopes: ${authStatus.scopes.join(', ')}`);
      }
    } else {
      console.log('\n❌ Not authenticated');
    }
    
  } catch (error) {
    console.error('\n💥 Authentication error:');
    console.error(error.message);
    console.error('\nFull error:', error);
  }
  
  console.log('\n📋 Check the log file for detailed debugging info:');
  console.log('  tail -f ../.local/logs/$(ls -t ../.local/logs/ | head -1)');
}

// Run the test
testGitHubAuth().catch(console.error);