import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Rocket, Database, FileText, Microscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
const quickQueries = ["bone loss microgravity rodents", "microbiome ISS astronauts", "transcriptomics mouse spaceflight", "liquid biopsy space medicine", "muscle atrophy prevention"];
const dataSources = [{
  name: "NASA Data",
  count: 847,
  color: "bg-nasa-deep",
  active: true
}, {
  name: "OSDR/GeneLab",
  count: 234,
  color: "bg-nasa-teal",
  active: true
}, {
  name: "PMC Papers",
  count: 1205,
  color: "bg-nasa-orange",
  active: true
}, {
  name: "ADS/Harvard",
  count: 189,
  color: "bg-cosmos-purple",
  active: false
}];
export default function Landing() {
  const [query, setQuery] = useState("");
  const [sources, setSources] = useState(dataSources);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const handleSearch = async (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;
    setIsSearching(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    navigate(`/search?q=${encodeURIComponent(finalQuery)}&sources=${sources.filter(s => s.active).map(s => s.name.toLowerCase().replace(/[^a-z]/g, '')).join(',')}`);
  };
  const toggleSource = (index: number) => {
    setSources(prev => prev.map((source, i) => i === index ? {
      ...source,
      active: !source.active
    } : source));
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleGlobalKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.getElementById('main-search')?.focus();
      }
    };
    document.addEventListener('keydown', handleGlobalKeyPress);
    return () => document.removeEventListener('keydown', handleGlobalKeyPress);
  }, []);
  return <div className="min-h-screen starfield">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Rocket className="w-4 h-4 text-nasa-orange" />
            <span className="text-sm text-muted-foreground">NASA Space Apps Challenge 2025</span>
          </div>
          
          <h1 className="text-6xl font-bold mb-6 leading-tight">
            <span className="text-cosmic">Explore Space Biology</span>
            <br />
            <span className="text-mission">with AI Intelligence</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Discover insights from NASA's space biology research through advanced RAG search, 
            interactive knowledge graphs, and comprehensive datasets from ISS missions.
          </p>
        </div>

        {/* Main Search Interface */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="mission-card bg-card/90 backdrop-blur-sm">
            <div className="flex items-center space-x-4 mb-6">
              <Search className="w-6 h-6 text-nasa-teal" />
              <h2 className="text-xl font-semibold">Mission Control Search</h2>
            </div>

            <div className="relative mb-6">
              <Input id="main-search" type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyPress={handleKeyPress} placeholder="Ask in plain language — e.g. 'How does microgravity affect bone density in rodents?'" className="mission-search text-lg" disabled={isSearching} />
              <Button onClick={() => handleSearch()} disabled={isSearching || !query.trim()} className="absolute right-2 top-2 cosmic-button">
                {isSearching ? <div className="flex items-center space-x-2">
                    <Rocket className="w-4 h-4 rocket-loading" />
                    <span>Searching...</span>
                  </div> : <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>}
              </Button>
            </div>

            {isSearching && <div className="text-center py-4">
                <div className="inline-flex items-center space-x-2 text-nasa-teal">
                  <Microscope className="w-5 h-5 animate-pulse" />
                  <span>Querying NASA and partner archives...</span>
                </div>
              </div>}

            {/* Data Source Toggles */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-3">Data Sources:</p>
              <div className="flex flex-wrap gap-3">
                {sources.map((source, index) => <Button key={source.name} variant="outline" size="sm" onClick={() => toggleSource(index)} className={`source-toggle ${source.active ? 'active' : ''}`}>
                    <div className={`w-3 h-3 rounded-full ${source.color} mr-2`} />
                    {source.name}
                    <Badge variant="secondary" className="ml-2">
                      {source.count}
                    </Badge>
                  </Button>)}
              </div>
            </div>

            {/* Quick Query Suggestions */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">Quick Queries:</p>
              <div className="flex flex-wrap gap-2">
                {quickQueries.map(suggestion => <button key={suggestion} onClick={() => handleSearch(suggestion)} disabled={isSearching} className="quick-chip">
                    {suggestion}
                  </button>)}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="mission-card text-center">
            <div className="w-16 h-16 bg-gradient-cosmic rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-sky-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Comprehensive Data</h3>
            <p className="text-muted-foreground">
              Access NASA Open Data, OSDR/GeneLab experiments, PMC publications, and ADS records in one place.
            </p>
          </div>

          <div className="mission-card text-center">
            <div className="w-16 h-16 bg-gradient-stellar rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-sky-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered RAG</h3>
            <p className="text-muted-foreground">
              Get evidence-backed answers with complete provenance and confidence scoring from our advanced retrieval system.
            </p>
          </div>

          <div className="mission-card text-center">
            <div className="w-16 h-16 bg-gradient-mission rounded-full flex items-center justify-center mx-auto mb-4">
              <Microscope className="w-8 h-8 text-sky-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Knowledge Discovery</h3>
            <p className="text-muted-foreground">
              Explore interactive knowledge graphs and discover hidden connections across space biology research.
            </p>
          </div>
        </div>

        {/* Keyboard Shortcut Hint */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            💡 Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + K</kbd> to focus search from anywhere
          </p>
        </div>
      </div>
    </div>;
}