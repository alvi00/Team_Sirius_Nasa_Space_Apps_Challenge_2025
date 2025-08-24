const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory cache
const cache = new Map();
let seedData = [];

// Load seed data
function loadSeedData() {
  try {
    const seedPath = path.join(__dirname, '../seed/demo_items.json');
    if (fs.existsSync(seedPath)) {
      seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      console.log(`Loaded ${seedData.length} seed items`);
    }
  } catch (error) {
    console.error('Failed to load seed data:', error);
  }
}

// Initialize
loadSeedData();

// Utility functions
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateQuickAnswer(query, items) {
  if (!items.length) return null;
  
  const supports = items.slice(0, 3).map((item, idx) => ({
    chunk_id: `c${idx + 1}`,
    doc_id: item.id,
    source: item.source,
    text: item.snippet,
    url: item.url,
    score: Math.max(0.7, Math.random() * 0.3 + 0.7)
  }));

  const confidence = supports.reduce((acc, s) => acc + s.score, 0) / supports.length;
  
  const text = `Based on available evidence, ${query.toLowerCase()} shows significant effects across multiple studies. ${supports[0].source} reports key findings [REF:${supports[0].chunk_id}], while ${supports[1].source} demonstrates related mechanisms [REF:${supports[1].chunk_id}]. ${supports[2] ? `Additional support from ${supports[2].source} [REF:${supports[2].chunk_id}].` : ''}`;

  return {
    text,
    confidence: Math.round(confidence * 100) / 100,
    supports
  };
}

// API Routes

// Search endpoint
app.get('/api/search', async (req, res) => {
  await delay(500); // Simulate network delay
  
  const { q = '', sources = 'nasa,osdr,pmc,ads', limit = 20, filterByNode } = req.query;
  const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
  
  let items = [...seedData];
  
  // Filter by query
  if (q) {
    const queryLower = q.toLowerCase();
    items = items.filter(item => 
      item.title.toLowerCase().includes(queryLower) ||
      item.snippet.toLowerCase().includes(queryLower) ||
      item.entities.some(e => e.toLowerCase().includes(queryLower))
    );
  }
  
  // Filter by sources
  const sourceList = sources.split(',');
  if (sourceList.length < 4) {
    items = items.filter(item => 
      sourceList.some(src => item.source.toLowerCase().includes(src.toLowerCase()))
    );
  }
  
  // Apply filters
  if (filters.organism) {
    items = items.filter(item => 
      item.organism?.toLowerCase().includes(filters.organism.toLowerCase())
    );
  }
  
  if (filters.mission) {
    items = items.filter(item => 
      item.mission?.toLowerCase().includes(filters.mission.toLowerCase())
    );
  }
  
  if (filters.assayType) {
    items = items.filter(item => 
      item.assayType?.toLowerCase().includes(filters.assayType.toLowerCase())
    );
  }
  
  // Filter by node (for KG integration)
  if (filterByNode) {
    items = items.filter(item => 
      item.entities.includes(filterByNode) ||
      item.id === filterByNode
    );
  }
  
  // Sort by relevance (mock scoring)
  items = items.map(item => ({
    ...item,
    score: Math.max(0.5, Math.random() * 0.5 + 0.5)
  })).sort((a, b) => b.score - a.score);
  
  // Limit results
  items = items.slice(0, parseInt(limit));
  
  // Generate quick answer if query exists
  const quick_answer = q ? generateQuickAnswer(q, items) : null;
  
  res.json({
    query: q,
    items,
    quick_answer
  });
});

// Paper detail endpoint
app.get('/api/paper/:id', async (req, res) => {
  await delay(300);
  
  const paper = seedData.find(item => item.id === req.params.id);
  if (!paper) {
    return res.status(404).json({ error: 'Paper not found' });
  }
  
  // Enhance with additional details
  const enhanced = {
    ...paper,
    abstract: `This study investigates ${paper.title.toLowerCase()} through comprehensive analysis of ${paper.organism} specimens during ${paper.mission}. The research employed ${paper.assayType} techniques to examine physiological responses to microgravity exposure. Findings demonstrate significant molecular changes affecting key biological pathways, with implications for long-duration spaceflight missions.`,
    figures: [
      {
        id: 'fig1',
        title: 'Expression heatmap showing differential gene regulation',
        caption: 'Hierarchical clustering of differentially expressed genes (p < 0.05, fold change > 2)',
        thumbnail: '/api/placeholder/400/300',
        fullsize: '/api/placeholder/800/600',
        pmcid: paper.source.includes('PMC') ? 'PMC7123456' : null
      },
      {
        id: 'fig2', 
        title: 'Time-course analysis of key biomarkers',
        caption: 'Temporal changes in protein expression levels over 30-day mission duration',
        thumbnail: '/api/placeholder/400/300',
        fullsize: '/api/placeholder/800/600',
        pmcid: paper.source.includes('PMC') ? 'PMC7123456' : null
      }
    ],
    datasets: [
      {
        id: 'ds1',
        title: `${paper.mission} Raw Expression Data`,
        type: 'RNA-seq',
        url: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-123',
        fileCount: 48,
        totalSize: '2.3 GB'
      }
    ],
    chunks: [
      {
        chunk_id: 'c1',
        text: paper.ragSnippets?.[0] || paper.snippet,
        start: 1234,
        end: 1456,
        confidence: 0.92
      },
      {
        chunk_id: 'c2', 
        text: paper.ragSnippets?.[1] || 'Additional supporting evidence from the methodology section.',
        start: 2341,
        end: 2567,
        confidence: 0.87
      }
    ],
    related: seedData.filter(item => 
      item.id !== paper.id && 
      (item.organism === paper.organism || item.mission === paper.mission)
    ).slice(0, 3)
  };
  
  res.json(enhanced);
});

// Dataset endpoints
app.get('/api/datasets', async (req, res) => {
  await delay(400);
  
  const datasets = seedData.filter(item => item.source.includes('NASA Data Portal') || item.source.includes('OSDR'))
    .map(item => ({
      id: item.id,
      title: item.title,
      mission: item.mission,
      type: item.assayType,
      sampleCount: item.sampleSize,
      organism: item.organism,
      year: item.year,
      fileTypes: ['CSV', 'JSON', 'FASTQ'],
      size: '1.2 GB',
      downloads: Math.floor(Math.random() * 1000) + 100
    }));
  
  res.json({ datasets });
});

app.get('/api/dataset/:id', async (req, res) => {
  await delay(300);
  
  const dataset = seedData.find(item => item.id === req.params.id);
  if (!dataset) {
    return res.status(404).json({ error: 'Dataset not found' });
  }
  
  const enhanced = {
    ...dataset,
    files: [
      { name: 'expression_matrix.csv', size: '45 MB', type: 'CSV' },
      { name: 'metadata.json', size: '2.1 MB', type: 'JSON' },
      { name: 'raw_reads.fastq.gz', size: '1.8 GB', type: 'FASTQ' }
    ],
    preview: {
      type: 'csv',
      headers: ['Gene_ID', 'Control_Mean', 'Flight_Mean', 'Log2FC', 'P_Value'],
      rows: [
        ['ENSG00000123456', '100.5', '67.2', '-0.58', '0.0012'],
        ['ENSG00000789012', '45.8', '89.3', '0.96', '0.0001'],
        ['ENSG00000345678', '200.1', '195.7', '-0.03', '0.7834'],
        ['ENSG00000901234', '78.9', '34.5', '-1.19', '0.0008']
      ]
    },
    license: 'CC0 1.0 Universal',
    doi: `10.5061/dryad.${Math.random().toString(36).substr(2, 8)}`
  };
  
  res.json(enhanced);
});

// Knowledge Graph endpoint
app.get('/api/kg', async (req, res) => {
  await delay(600);
  
  const { nodeId, depth = 1 } = req.query;
  
  // Generate nodes from seed data
  const paperNodes = seedData.slice(0, 20).map(item => ({
    id: item.id,
    type: 'paper',
    label: item.title.slice(0, 40) + '...',
    metadata: {
      year: item.year,
      source: item.source,
      organism: item.organism
    },
    x: Math.random() * 800,
    y: Math.random() * 600
  }));
  
  // Generate entity nodes
  const entities = ['microgravity', 'bone loss', 'transcriptomics', 'muscle atrophy', 'ISS', 'mice'];
  const entityNodes = entities.map((entity, idx) => ({
    id: `entity-${entity.replace(' ', '-')}`,
    type: 'entity',
    label: entity,
    metadata: { category: 'biological_process' },
    x: Math.random() * 800,
    y: Math.random() * 600
  }));
  
  const nodes = [...paperNodes, ...entityNodes];
  
  // Generate edges
  const edges = [];
  paperNodes.forEach(paper => {
    // Each paper mentions 2-3 entities
    const mentionedEntities = entityNodes.slice(0, 2 + Math.floor(Math.random() * 2));
    mentionedEntities.forEach(entity => {
      edges.push({
        source: paper.id,
        target: entity.id,
        relation: 'mentions',
        provenance: {
          paperId: paper.id,
          confidence: Math.random() * 0.3 + 0.7
        }
      });
    });
  });
  
  // Filter by nodeId if specified
  let filteredNodes = nodes;
  let filteredEdges = edges;
  
  if (nodeId) {
    const connectedNodeIds = new Set([nodeId]);
    edges.forEach(edge => {
      if (edge.source === nodeId) connectedNodeIds.add(edge.target);
      if (edge.target === nodeId) connectedNodeIds.add(edge.source);
    });
    
    filteredNodes = nodes.filter(node => connectedNodeIds.has(node.id));
    filteredEdges = edges.filter(edge => 
      connectedNodeIds.has(edge.source) && connectedNodeIds.has(edge.target)
    );
  }
  
  res.json({
    nodes: filteredNodes,
    edges: filteredEdges
  });
});

// Compare endpoint
app.post('/api/compare', async (req, res) => {
  await delay(800);
  
  const { items } = req.body;
  if (!items || items.length < 2) {
    return res.status(400).json({ error: 'At least 2 items required for comparison' });
  }
  
  const compareItems = items.map(id => seedData.find(item => item.id === id)).filter(Boolean);
  
  const organisms = [...new Set(compareItems.map(item => item.organism))];
  const missions = [...new Set(compareItems.map(item => item.mission))];
  const assayTypes = [...new Set(compareItems.map(item => item.assayType))];
  
  const summary = `Comparative analysis of ${compareItems.length} studies across ${organisms.length > 1 ? 'multiple species' : organisms[0]} reveals consistent patterns of spaceflight-induced physiological changes. All studies employed ${assayTypes.join(' and ')} approaches on ${missions.join(', ')} missions. Common findings include significant molecular alterations in response to microgravity exposure [REF:c1,c2,c3]. The convergent evidence suggests coordinated systemic responses affecting multiple organ systems through distinct but interconnected molecular pathways.`;
  
  const supports = compareItems.map((item, idx) => ({
    chunk_id: `c${idx + 1}`,
    doc_id: item.id,
    source: item.source,
    text: item.ragSnippets?.[0] || item.snippet,
    url: item.url,
    score: Math.random() * 0.3 + 0.7
  }));
  
  const confidence = supports.reduce((acc, s) => acc + s.score, 0) / supports.length;
  
  res.json({
    summary,
    confidence: Math.round(confidence * 100) / 100,
    supports
  });
});

// Export endpoint
app.post('/api/export', async (req, res) => {
  await delay(1000);
  
  const { type, items } = req.body;
  
  // Mock PDF generation
  const filename = `export_${Date.now()}.${type}`;
  const url = `/api/downloads/${filename}`;
  
  res.json({ url });
});

// Counts endpoint
app.get('/api/counts', async (req, res) => {
  const counts = {
    nasa: seedData.filter(item => item.source.includes('NASA')).length,
    osdr: seedData.filter(item => item.source.includes('OSDR') || item.source.includes('GeneLab')).length,
    pmc: seedData.filter(item => item.source.includes('PMC')).length,
    ads: seedData.filter(item => item.source.includes('ADS')).length
  };
  
  res.json(counts);
});

// Workspace endpoints
app.post('/api/workspace/save', async (req, res) => {
  await delay(200);
  
  const { items, name } = req.body;
  const workspaceId = `ws_${Date.now()}`;
  
  // In a real app, save to database
  res.json({ 
    success: true, 
    workspaceId,
    message: 'Workspace saved successfully'
  });
});

// Admin endpoints
app.post('/api/admin/seed', async (req, res) => {
  const token = req.headers['x-dev-token'];
  if (token !== 'dev_token_123') {
    return res.status(401).json({ error: 'Invalid dev token' });
  }
  
  await delay(1000);
  
  loadSeedData();
  
  res.json({ 
    success: true, 
    message: `Loaded ${seedData.length} items`,
    itemCount: seedData.length
  });
});

app.post('/api/admin/reindex', async (req, res) => {
  const token = req.headers['x-dev-token'];
  if (token !== 'dev_token_123') {
    return res.status(401).json({ error: 'Invalid dev token' });
  }
  
  await delay(2000);
  
  res.json({ 
    success: true, 
    message: 'Reindexing complete',
    documentsIndexed: seedData.length
  });
});

// Placeholder image endpoint
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  res.redirect(`https://via.placeholder.com/${width}x${height}/1a1a2e/ffffff?text=Space+Biology+Image`);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Space Biology Knowledge Engine API running on port ${PORT}`);
  console.log(`📊 Loaded ${seedData.length} demo items`);
});