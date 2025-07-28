#!/usr/bin/env node

import { spawn } from 'child_process';

class SimpleAuthTest {
  constructor() {
    this.server = null;
    this.requestId = 0;
  }

  async start() {
    console.log('🚀 Starting MCP server for auth test...');
    
    const env = {
      ...process.env,
      TOYBOX_DEBUG: 'true',
      TOYBOX_LOG_LEVEL: 'info'
    };
    
    this.server = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env
    });

    // Just show server output
    this.server.stderr.on('data', (data) => {
      console.log('🔍 Server:', data.toString().trim());
    });

    this.server.on('error', (error) => {
      console.error('❌ Server error:', error);
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  sendMessage(message) {
    console.log('📤 Sending:', JSON.stringify(message));
    this.server.stdin.write(JSON.stringify(message) + '\n');
  }

  async testAuth() {
    // Initialize
    this.sendMessage({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'auth-test', version: '1.0.0' }
      }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Try to initialize a toybox (this will trigger GitHub auth check)
    console.log('\n🔐 Triggering GitHub auth check via initialize_toybox...');
    this.sendMessage({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'initialize_toybox',
        arguments: {
          repoName: 'auth-test',
          createRemote: true, // This will trigger GitHub auth
          debug: true
        }
      }
    });

    // Let it run for a bit to see the auth check
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  stop() {
    if (this.server) {
      console.log('\n🛑 Stopping server...');
      this.server.kill('SIGINT');
    }
  }
}

async function runAuthTest() {
  const test = new SimpleAuthTest();
  
  try {
    await test.start();
    await test.testAuth();
  } catch (error) {
    console.error('💥 Test failed:', error);
  } finally {
    test.stop();
  }
  
  console.log('\n📋 Check the logs for GitHub auth details:');
  console.log('  tail -f ../.local/logs/$(ls -t ../.local/logs/ | head -1)');
}

console.log('🔐 MCP GitHub Auth Test');
console.log('======================\n');

runAuthTest().catch(console.error);