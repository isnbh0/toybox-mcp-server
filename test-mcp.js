#!/usr/bin/env node

import { spawn } from 'child_process';
import { EventEmitter } from 'events';

class MCPTestClient extends EventEmitter {
  constructor() {
    super();
    this.server = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
  }

  async start() {
    console.log('🚀 Starting MCP server...');
    
    // Set environment variables for the server process
    const env = {
      ...process.env,
      TOYBOX_DEBUG: 'true',
      TOYBOX_LOG_LEVEL: 'debug'
    };
    
    this.server = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env
    });

    this.server.stderr.on('data', (data) => {
      console.log('📡 Server stderr:', data.toString().trim());
    });

    this.server.stdout.on('data', (data) => {
      const messages = data.toString().trim().split('\n');
      for (const message of messages) {
        if (message.trim()) {
          try {
            const parsed = JSON.parse(message);
            this.handleMessage(parsed);
          } catch (e) {
            console.log('📡 Server stdout (non-JSON):', message);
          }
        }
      }
    });

    this.server.on('error', (error) => {
      console.error('❌ Server error:', error);
    });

    this.server.on('exit', (code) => {
      console.log(`🛑 Server exited with code ${code}`);
    });

    // Wait a bit for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  handleMessage(message) {
    console.log('📥 Received:', JSON.stringify(message, null, 2));
    
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);
      
      if (message.error) {
        reject(new Error(message.error.message || 'MCP Error'));
      } else {
        resolve(message.result);
      }
    }
  }

  async sendRequest(method, params = {}) {
    const id = ++this.requestId;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    console.log('📤 Sending:', JSON.stringify(request, null, 2));

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      
      this.server.stdin.write(JSON.stringify(request) + '\n');
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  async initialize() {
    console.log('\n🔌 Initializing MCP connection...');
    return await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    });
  }

  async listTools() {
    console.log('\n🛠️ Listing available tools...');
    return await this.sendRequest('tools/list');
  }

  async callTool(name, arguments_) {
    console.log(`\n⚡ Calling tool: ${name}`);
    return await this.sendRequest('tools/call', {
      name,
      arguments: arguments_
    });
  }

  async stop() {
    if (this.server) {
      console.log('\n🛑 Stopping server...');
      this.server.kill('SIGINT');
      
      // Wait for graceful shutdown
      await new Promise(resolve => {
        this.server.on('exit', resolve);
        setTimeout(() => {
          this.server.kill('SIGKILL');
          resolve();
        }, 5000);
      });
    }
  }
}

async function runTests() {
  const client = new MCPTestClient();
  
  try {
    // Start the server
    await client.start();
    
    // Initialize the connection
    const initResult = await client.initialize();
    console.log('✅ Initialization successful:', initResult);
    
    // List available tools
    const tools = await client.listTools();
    console.log('✅ Available tools:', tools.tools.map(t => t.name));
    
    // Test GitHub authentication by trying to initialize a toybox
    console.log('\n🧪 Testing TOYBOX initialization (this will test GitHub auth)...');
    
    const initParams = {
      repoName: 'test-toybox-' + Date.now(),
      templateOwner: 'isnbh0',
      templateRepo: 'toybox',
      config: {
        title: 'Test TOYBOX',
        description: 'A test TOYBOX for debugging auth',
        theme: 'auto',
        layout: 'grid',
        showFooter: true,
      },
      debug: true,
      createRemote: false, // Start without remote to test local setup
      isPrivate: false,
    };
    
    const result = await client.callTool('initialize_toybox', initParams);
    
    if (result.content && result.content[0]) {
      const parsed = JSON.parse(result.content[0].text);
      console.log('\n📋 TOYBOX initialization result:');
      console.log('  Success:', parsed.success);
      if (parsed.success) {
        console.log('  Repository:', parsed.repository.localPath);
        console.log('  Message:', parsed.message);
      } else {
        console.log('  Error:', parsed.error);
      }
    }
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.stop();
  }
  
  console.log('\n📋 Check logs for detailed debugging info:');
  console.log('  tail -f ../.local/logs/$(ls -t ../.local/logs/ | head -1)');
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n⚠️ Received SIGINT, shutting down...');
  process.exit(0);
});

console.log('🧪 MCP Server Test Client');
console.log('========================\n');

runTests().catch(console.error);