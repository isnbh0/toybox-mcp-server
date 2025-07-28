export default function Welcome() {
    return (<div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Welcome to TOYBOX!</h1>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <p className="text-lg text-blue-800 mb-4">
          🎉 Your TOYBOX is ready! This is your first artifact.
        </p>
        <p className="text-blue-700">
          This artifact was automatically created to show you how TOYBOX works. 
          You can now publish new artifacts using Claude Desktop with the TOYBOX MCP server.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">📝 Create</h3>
          <p className="text-sm text-gray-600">
            Ask Claude to create any component, visualization, or interactive element
          </p>
        </div>
        
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">🚀 Publish</h3>
          <p className="text-sm text-gray-600">
            Say "publish to TOYBOX" and it will automatically appear here
          </p>
        </div>
        
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">🎨 Customize</h3>
          <p className="text-sm text-gray-600">
            Edit TOYBOX_CONFIG.json to customize your gallery's appearance
          </p>
        </div>
        
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">🔗 Share</h3>
          <p className="text-sm text-gray-600">
            Your TOYBOX is live at your GitHub Pages URL
          </p>
        </div>
      </div>
    </div>);
}
export const metadata = {
    title: 'Welcome to TOYBOX',
    description: 'Your first TOYBOX artifact - a welcome message and getting started guide',
    type: 'react',
    tags: ['welcome', 'guide', 'getting-started'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};
//# sourceMappingURL=welcome.js.map