export default async function handler(req, res) {
  const { token } = req.query;
  if (!token) return res.status(401).json({ error: 'Missing token. Use ?token=YOUR_USER_ID' });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  res.status(200).json({
    protocol: 'MCP/1.0',
    name: 'DesignCraft CSS',
    version: '2.0',
    user: token,
    capabilities: [
      { name: 'generate_component', description: 'Generate a UI component using AI. POST /api/gemini with prompt.' },
      { name: 'apply_preset', description: 'Apply a design preset to an element.' },
      { name: 'export_css', description: 'Export current canvas as CSS/HTML. GET /api/export.' }
    ],
    endpoints: {
      gemini: '/api/gemini',
      openrouter: '/api/openrouter',
      mcp: '/api/mcp'
    },
    status: 'connected',
    timestamp: new Date().toISOString()
  });
}
