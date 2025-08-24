import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ExternalLink, BookOpen, Save, Plus, Star, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getAllDemoItems, mapToPaper, buildKGFromItems } from "@/lib/demoData";

interface SearchResult {
  id: string;
  title: string;
  source: string;
  year: number;
  organism: string;
  snippet: string;
  entities: string[];
  url: string;
  score: number;
  doi?: string;
  type: "paper" | "dataset";
}

interface QuickAnswer {
  text: string;
  confidence: number;
  supports: Array<{
    chunk_id: string;
    doc_id: string;
    source: string;
    text: string;
    url: string;
    score: number;
  }>;
}

export default function Results() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [quickAnswer, setQuickAnswer] = useState<QuickAnswer | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    organism: "all",
    mission: "all",
    assay: "all",
    dateRange: "all"
  });

  const query = searchParams.get('q') || '';
  const sources = searchParams.get('sources') || '';

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const allItems = getAllDemoItems();
      const filtered = searchDemoItems(query, sources, filters, allItems);
      setResults(filtered.items);
      setQuickAnswer(filtered.quickAnswer);
      buildKGFromItems(filtered.rawItems);
      setLoading(false);
    };

    if (query) {
      fetchResults();
    } else {
      setLoading(false);
      setResults([]);
      setQuickAnswer(null);
    }
  }, [query, sources, filters]);

  function searchDemoItems(q: string, sources: string, filters: any, allItems: any[]) {
    console.log('All items:', allItems.length);
    console.log('Query:', q, 'Sources:', sources, 'Filters:', filters);

    const queryTerms = q.toLowerCase().split(' ');
    let filtered = allItems.filter(item =>
      queryTerms.some(term =>
        item.title.toLowerCase().includes(term) ||
        item.snippet.toLowerCase().includes(term)
      )
    );
    console.log('After query filter:', filtered.length, filtered.map(item => item.id));

    if (sources && sources !== '') {
      const sourceMap: { [key: string]: string } = {
        'nasadata': 'NASA Data Portal',
        'osdrgenelab': 'OSDR/GeneLab',
        'pmcpapers': 'PMC Papers',
        'adsharvard': 'ADS/Harvard'
      };
      const normalizedSources = sources.split(',').map(s => sourceMap[s] || s);
      filtered = filtered.filter(item => normalizedSources.includes(item.source));
    }
    console.log('After source filter:', filtered.length, filtered.map(item => item.id));

    if (filters.organism !== 'all') {
      filtered = filtered.filter(item => item.organism === filters.organism);
      console.log('After organism filter:', filtered.length, filtered.map(item => item.id));
    }
    if (filters.mission !== 'all') {
      filtered = filtered.filter(item => item.mission === filters.mission);
      console.log('After mission filter:', filtered.length, filtered.map(item => item.id));
    }
    if (filters.assay !== 'all') {
      filtered = filtered.filter(item => item.assayType === filters.assay);
      console.log('After assay filter:', filtered.length, filtered.map(item => item.id));
    }
    if (filters.dateRange !== 'all') {
      const currentYear = new Date().getFullYear();
      filtered = filtered.filter(item => {
        if (filters.dateRange === 'recent') return item.year >= currentYear - 5;
        if (filters.dateRange === 'decade') return item.year >= currentYear - 10;
        return true;
      });
      console.log('After dateRange filter:', filtered.length, filtered.map(item => item.id));
    }

    const rawItems = filtered;
    const items = filtered.map(item => ({
      id: item.id,
      title: item.title,
      source: item.source,
      year: item.year,
      organism: item.organism,
      snippet: item.snippet,
      entities: item.entities,
      url: item.url,
      score: Math.random() * 0.3 + 0.7,
      doi: item.doi,
      type: (['PMC Papers', 'ADS/Harvard'].includes(item.source) || item.doi ? 'paper' : 'dataset') as "paper" | "dataset"
    }));

    const topItems = filtered.slice(0, 3);
    const supports = topItems.flatMap((item, i) =>
      item.ragSnippets.map((s, j) => ({
        chunk_id: `c${i}${j}`,
        doc_id: item.id,
        source: item.source,
        text: s,
        url: item.url,
        score: 0.8 + Math.random() * 0.1
      }))
    );
    const text = topItems.map(item => item.snippet).join(' ') + ' [REF:multiple]';

    const quickAnswer = {
      text,
      confidence: 0.8 + Math.random() * 0.1,
      supports
    };

    return { items, quickAnswer, rawItems };
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "confidence-high";
    if (confidence >= 0.6) return "confidence-medium";
    return "confidence-low";
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return "High Confidence";
    if (confidence >= 0.6) return "Medium Confidence";
    return "Low Confidence";
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-nasa-teal border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Analyzing research archives...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!results.length && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Research Results</h1>
        <p className="text-muted-foreground">
          No results found for "<span className="font-semibold">{query}</span>".
          Try adjusting keywords, sources, or filters. Ensure source names match available data (e.g., OSDR/GeneLab, NASA Data Portal, PMC Papers, ADS/Harvard).
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Research Results</h1>
        <p className="text-muted-foreground">
          Found {results.length} results for "<span className="font-semibold">{query}</span>"
        </p>
      </div>

      <div className="mb-8 p-4 bg-card rounded-lg border">
        <div className="flex items-center space-x-4 mb-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium">Filters</span>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          <Select value={filters.organism} onValueChange={(value) => setFilters(prev => ({...prev, organism: value}))}>
            <SelectTrigger>
              <SelectValue placeholder="Organism" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organisms</SelectItem>
              <SelectItem value="Mus musculus">Mus musculus</SelectItem>
              <SelectItem value="Homo sapiens">Homo sapiens</SelectItem>
              <SelectItem value="Potential microorganisms">Potential microorganisms</SelectItem>
              <SelectItem value="Various research subjects">Various research subjects</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.mission} onValueChange={(value) => setFilters(prev => ({...prev, mission: value}))}>
            <SelectTrigger>
              <SelectValue placeholder="Mission" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Missions</SelectItem>
              <SelectItem value="ISS Expedition 61">ISS Expedition 61</SelectItem>
              <SelectItem value="ISS Expedition 62">ISS Expedition 62</SelectItem>
              <SelectItem value="SpaceX CRS-24">SpaceX CRS-24</SelectItem>
              <SelectItem value="ISS Long-duration">ISS Long-duration</SelectItem>
              <SelectItem value="Europa Clipper">Europa Clipper</SelectItem>
              <SelectItem value="Mars transit">Mars transit</SelectItem>
              <SelectItem value="Mars Sample Return">Mars Sample Return</SelectItem>
              <SelectItem value="Future space stations">Future space stations</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.assay} onValueChange={(value) => setFilters(prev => ({...prev, assay: value}))}>
            <SelectTrigger>
              <SelectValue placeholder="Assay Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assays</SelectItem>
              <SelectItem value="RNA-seq">RNA-seq</SelectItem>
              <SelectItem value="Proteomics">Proteomics</SelectItem>
              <SelectItem value="Echocardiography">Echocardiography</SelectItem>
              <SelectItem value="Materials testing">Materials Testing</SelectItem>
              <SelectItem value="Engineering analysis">Engineering Analysis</SelectItem>
              <SelectItem value="Systems engineering">Systems Engineering</SelectItem>
              <SelectItem value="Instrument design">Instrument Design</SelectItem>
              <SelectItem value="Habitat engineering">Habitat Engineering</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({...prev, dateRange: value}))}>
            <SelectTrigger>
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="recent">Last 5 Years</SelectItem>
              <SelectItem value="decade">Last 10 Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {results.map((result) => (
            <Card key={result.id} className="mission-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2 hover:text-nasa-teal cursor-pointer"
                              onClick={() => navigate(`/paper/${result.id}`)}>
                      {result.title}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                      <Badge variant="outline">{result.source}</Badge>
                      <span>{result.year}</span>
                      <span>{result.organism}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-nasa-orange text-nasa-orange" />
                        <span>{result.score.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{result.snippet}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {result.entities.map((entity) => (
                    <Badge key={entity} variant="secondary" className="text-xs">
                      {entity}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/paper/${result.id}`)}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      View Paper
                    </Button>

                    <Button variant="outline" size="sm" asChild>
                      <a href={result.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Source
                      </a>
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {quickAnswer && (
          <Card className="rag-answer sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span>Our Smart Ai model Says (evidence-backed):</span>
                <Badge className={getConfidenceColor(quickAnswer.confidence)}>
                  {getConfidenceText(quickAnswer.confidence)} ({Math.round(quickAnswer.confidence * 100)}%)
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 leading-relaxed">{quickAnswer.text}</p>

              <Separator className="my-4" />

              <div>
                <h4 className="font-semibold mb-3">Supporting Evidence:</h4>
                <div className="space-y-3">
                  {quickAnswer.supports.map((support, index) => (
                    <div key={support.chunk_id} className="text-sm">
                      <p className="mb-2">{support.text}</p>
                      <div className="flex items-center justify-between">
                        <a
                          href={support.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="provenance-link"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          {support.source}: {support.doc_id}
                        </a>
                        <Badge variant="outline" className="text-xs">
                          {support.score.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
