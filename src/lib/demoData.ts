import demoItemsRaw from '../seed/demo_items.json';
interface DemoRaw {
  id: string;
  title: string;
  source: string;
  year: number;
  organism: string;
  mission: string;
  assayType: string;
  sampleSize: number;
  snippet: string;
  entities: string[];
  url: string;
  ragSnippets: string[];
  figures?: Array<{id: string; url: string; caption: string; pmcid?: string}>;
  datasets?: string[];
  metadata: Record<string, any>;
  previewData?: any;
  doi?: string;
  ragExpansion?: {
    relevantPassages: Array<{text: string; chunkId: string; confidence: number}>;
    extractionTrace: string[];
  };
  relatedStudies?: Array<{id: string; title: string; similarity: number}>;
}

interface ComparisonItem {
  id: string;
  title: string;
  source: string;
  year: number;
  organism: string;
  mission: string;
  assayType: string;
  sampleSize: number;
  mainOutcome: string;
  ragSnippets: string[];
  metadata: Record<string, any>;
}

interface Dataset {
  id: string;
  title: string;
  mission: string;
  dataType: string;
  instrument: string;
  fileTypes: string[];
  sampleCount: number;
  size: string;
  license: string;
  description: string;
  dateCreated: string;
  lastModified: string;
  associatedPapers: string[];
  downloadUrl: string;
  previewData?: any;
}

interface PaperData {
  id: string;
  title: string;
  authors: string[];
  year: number;
  source: string;
  doi?: string;
  abstract: string;
  metadata: {
    datasets: string[];
    instruments: string[];
    organisms: string[];
    assayTypes: string[];
    missions: string[];
    samplePrep: string;
  };
  figures: Array<{id: string; url: string; caption: string; pmcid?: string}>;
  ragExpansion: {
    relevantPassages: Array<{text: string; chunkId: string; confidence: number}>;
    extractionTrace: string[];
  };
  relatedStudies: Array<{id: string; title: string; similarity: number}>;
}

interface QueryRecord {
  id: string;
  query: string;
  timestamp: string;
  responseTime: number;
  resultsCount: number;
  sources: string[];
}

interface SystemStatus {
  vectorDB: {
    documents: number;
    embeddings: number;
    indexSize: string;
    lastUpdated: string;
  };
  knowledgeGraph: {
    nodes: number;
    edges: number;
    lastSync: string;
  };
  sources: Record<string, number>;
}

interface KGNode {
  id: string;
  type: 'paper' | 'dataset' | 'entity' | 'mission';
  label: string;
  metadata: Record<string, any>;
}

interface KGEdge {
  source: string;
  target: string;
  relation: string;
  provenance: {
    paperId?: string;
    datasetId?: string;
  };
}

interface KGData {
  nodes: KGNode[];
  edges: KGEdge[];
}

export function getAllDemoItems(): DemoRaw[] {
  return demoItemsRaw as DemoRaw[];
}

export function mapToComparisonItem(item: DemoRaw): ComparisonItem {
  return {
    id: item.id,
    title: item.title,
    source: item.source,
    year: item.year,
    organism: item.organism,
    mission: item.mission,
    assayType: item.assayType,
    sampleSize: item.sampleSize,
    mainOutcome: item.snippet,
    ragSnippets: item.ragSnippets || [item.snippet.split('.')[0]],
    metadata: item.metadata
  };
}

export function mapToDataset(item: DemoRaw): Dataset | null {
  if (item.previewData && ['OSDR/GeneLab', 'NASA Data Portal'].includes(item.source)) {
    return {
      id: item.id,
      title: item.title,
      mission: item.mission,
      dataType: item.assayType,
      instrument: item.metadata.instruments[0] || 'Unknown',
      fileTypes: ['FASTQ', 'CSV'],
      sampleCount: item.sampleSize,
      size: '100 GB',
      license: 'NASA Open Data',
      description: item.snippet,
      dateCreated: new Date(item.year, 0, 1).toISOString(),
      lastModified: new Date(item.year, 0, 1).toISOString(),
      associatedPapers: item.relatedStudies?.map(s => s.id) || [],
      downloadUrl: item.url,
      previewData: item.previewData
    };
  }
  return null;
}

export function mapToPaper(item: DemoRaw): PaperData | null {
  if (['PMC Papers', 'ADS/Harvard'].includes(item.source) || item.doi) {
    return {
      id: item.id,
      title: item.title,
      authors: item.metadata.authors || ['Unknown Author'],
      year: item.year,
      source: item.source,
      doi: item.doi,
      abstract: item.snippet,
      metadata: {
        datasets: item.datasets || [],
        instruments: item.metadata.instruments || [],
        organisms: [item.organism],
        assayTypes: [item.assayType],
        missions: [item.mission],
        samplePrep: item.metadata.samplePrep || 'Standard preparation'
      },
      figures: item.figures || [
        {id: 'fig1', url: '/api/placeholder/600/400', caption: 'Placeholder figure 1', pmcid: item.source === 'PMC Papers' ? 'PMC' + Math.floor(Math.random() * 1000000) : undefined}
      ],
      ragExpansion: item.ragExpansion || {
        relevantPassages: item.ragSnippets.map((s, i) => ({text: s, chunkId: 'chunk_placeholder_' + i, confidence: 0.8})),
        extractionTrace: item.ragSnippets.map((_, i) => 'chunk_placeholder_' + i)
      },
      relatedStudies: item.relatedStudies || []
    };
  }
  return null;
}

export function buildMockSystemStatus(): SystemStatus {
  const items = getAllDemoItems();
  const documents = items.length;
  const sourcesCount: Record<string, number> = {};
  items.forEach(item => {
    sourcesCount[item.source] = (sourcesCount[item.source] || 0) + 1;
  });
  const kg = buildKGFromItems(items);
  return {
    vectorDB: {
      documents,
      embeddings: documents,
      indexSize: (documents * 0.5).toFixed(1) + ' GB',
      lastUpdated: new Date().toISOString()
    },
    knowledgeGraph: {
      nodes: kg.nodes.length,
      edges: kg.edges.length,
      lastSync: new Date().toISOString()
    },
    sources: sourcesCount
  };
}

export function generateMockQueryHistory(): QueryRecord[] {
  const queries = [
    {query: 'microgravity bone loss rodents', sources: ['OSDR/GeneLab', 'PMC Papers']},
    {query: 'ISS microbiome changes astronauts', sources: ['NASA Data Portal', 'PMC Papers']},
    {query: 'transcriptomics space biology', sources: ['OSDR/GeneLab', 'ADS/Harvard']},
    {query: 'radiation dna repair space', sources: ['PMC Papers', 'NASA Data Portal']},
    {query: 'plant growth microgravity', sources: ['OSDR/GeneLab']},
    {query: 'immune system spaceflight', sources: ['PMC Papers']},
    {query: 'liver metabolism microgravity', sources: ['OSDR/GeneLab']}
  ];
  return queries.map((q, i) => ({
    id: 'q' + (i + 1),
    query: q.query,
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    responseTime: Math.floor(Math.random() * 1000 + 500),
    resultsCount: Math.floor(Math.random() * 10 + 5),
    sources: q.sources
  }));
}

export function buildKGFromItems(items: DemoRaw[]): KGData {
  const nodes: KGNode[] = [];
  const edges: KGEdge[] = [];
  const entityMap = new Map<string, string>();
  const missionMap = new Map<string, string>();

  items.forEach(item => {
    const type = item.source.includes('PMC') || item.source.includes('ADS') ? 'paper' : 'dataset';
    nodes.push({
      id: type + '-' + item.id,
      type,
      label: item.title,
      metadata: {
        year: item.year,
        source: item.source,
        url: item.url,
        abstract: item.snippet || "No abstract available",
        relatedStudies: item.relatedStudies || []
      }
    });

    const missionId = 'mission-' + item.mission.replace(/\s/g, '-').toLowerCase();
    if (!missionMap.has(item.mission)) {
      nodes.push({
        id: missionId,
        type: 'mission',
        label: item.mission,
        metadata: {duration: item.metadata.duration || 'Unknown'}
      });
      missionMap.set(item.mission, missionId);
    }
    edges.push({
      source: type + '-' + item.id,
      target: missionId,
      relation: 'part_of_mission',
      provenance: {paperId: item.id}
    });

    item.entities.forEach(entity => {
      const entitySlug = entity.replace(/\s/g, '-').toLowerCase();
      const entityId = 'entity-' + entitySlug;
      if (!entityMap.has(entity)) {
        nodes.push({
          id: entityId,
          type: 'entity',
          label: entity,
          metadata: {category: 'general', mentions: 1}
        });
        entityMap.set(entity, entityId);
      } else {
        const node = nodes.find(n => n.id === entityId);
        if (node) node.metadata.mentions += 1;
      }
      edges.push({
        source: type + '-' + item.id,
        target: entityId,
        relation: 'mentions',
        provenance: {paperId: item.id}
      });
    });
  });

  return {nodes, edges};
}