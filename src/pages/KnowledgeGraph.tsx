import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import * as d3 from "d3";
import { 
  ZoomIn, ZoomOut, RotateCcw, Download, Search, Info, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { getAllDemoItems, buildKGFromItems } from "@/lib/demoData";

interface KGNode {
  id: string;
  type: "paper" | "dataset" | "entity" | "mission";
  label: string;
  metadata: Record<string, any>;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
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

export default function KnowledgeGraph() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const containerRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

  const [kgData, setKgData] = useState<KGData>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<KGNode | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [nodeTypeFilter, setNodeTypeFilter] = useState("all");
  const [expandDepth, setExpandDepth] = useState([2]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKGData = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      const allItems = getAllDemoItems();
      const query = searchParams.get('q') || '';
      let filteredItems = allItems;

      if (query) {
        const queryTerms = query.toLowerCase().split(' ');
        filteredItems = allItems.filter(item =>
          queryTerms.some(term =>
            item.title.toLowerCase().includes(term) ||
            item.snippet.toLowerCase().includes(term)
          )
        );
      }

      const kg = buildKGFromItems(filteredItems);
      setKgData(kg);
      setLoading(false);
    };
    fetchKGData();
  }, [searchParams]);

  useEffect(() => {
    if (!loading && kgData.nodes.length > 0) {
      renderGraph();
    }
  }, [kgData, nodeTypeFilter, loading]);

  const renderGraph = () => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;

    svg.attr("width", width).attr("height", height);

    const filteredNodes = kgData.nodes.filter(
      (node) => nodeTypeFilter === "all" || node.type === nodeTypeFilter
    );

    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = kgData.edges.filter(
      (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );

    const container = svg.append("g");
    containerRef.current = container;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform.toString());
      });

    svg.call(zoom as any);
    zoomRef.current = zoom;

    const links = container
      .selectAll("line")
      .data(filteredEdges)
      .enter()
      .append("line")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1.5);

    const nodeColors: Record<string, string> = {
      paper: "var(--nasa-deep)",
      dataset: "var(--nasa-teal)",
      entity: "var(--nasa-orange)",
      mission: "var(--cosmos-purple)",
    };

    const nodes = container
      .selectAll("circle")
      .data(filteredNodes)
      .enter()
      .append("circle")
      .attr("r", (d) => {
        switch (d.type) {
          case "paper": return 12;
          case "dataset": return 10;
          case "entity": return 8;
          case "mission": return 14;
          default: return 8;
        }
      })
      .attr("fill", (d) => nodeColors[d.type])
      .attr("stroke", (d) => "#fff")
      .attr("stroke-width", (d) => (d.type === "paper" || d.type === "dataset" ? 4 : 2))
      .style("cursor", "pointer")
      .on("click", (_, d) => setSelectedNode(d))
      .call(
        d3.drag<SVGCircleElement, KGNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    const labels = container
      .selectAll("text")
      .data(filteredNodes)
      .enter()
      .append("text")
      .text((d) => d.label)
      .attr("font-size", 10)
      .attr("dx", 15)
      .attr("dy", 4);

    const simulation = d3
      .forceSimulation(filteredNodes as any)
      .force("link", d3.forceLink(filteredEdges).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30))
      .on("tick", () => {
        links
          .attr("x1", (d: any) => (d.source as any).x)
          .attr("y1", (d: any) => (d.source as any).y)
          .attr("x2", (d: any) => (d.target as any).x)
          .attr("y2", (d: any) => (d.target as any).y);

        nodes.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);

        labels.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
      });
  };

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(zoomRef.current.scaleBy, 1.2);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(zoomRef.current.scaleBy, 1 / 1.2);
  };

  const handleResetView = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(500).call(
      zoomRef.current.transform,
      d3.zoomIdentity.translate(400, 300).scale(1)
    );
  };

  const handleExportKG = () => {
    const blob = new Blob([JSON.stringify(kgData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "knowledge-graph.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search Nodes</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Node Type</label>
                <Select value={nodeTypeFilter} onValueChange={setNodeTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="paper">Papers</SelectItem>
                    <SelectItem value="dataset">Datasets</SelectItem>
                    <SelectItem value="entity">Entities</SelectItem>
                    <SelectItem value="mission">Missions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Expand Depth: {expandDepth[0]}</label>
                <Slider
                  value={expandDepth}
                  onValueChange={setExpandDepth}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Button onClick={handleZoomIn} variant="outline" size="sm" className="w-full">
                  <ZoomIn className="w-4 h-4 mr-2" />
                  Zoom In
                </Button>
                <Button onClick={handleZoomOut} variant="outline" size="sm" className="w-full">
                  <ZoomOut className="w-4 h-4 mr-2" />
                  Zoom Out
                </Button>
                <Button onClick={handleResetView} variant="outline" size="sm" className="w-full">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleExportKG}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export KG
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardContent className="p-0 h-full">
              <svg ref={svgRef} className="w-full h-full border rounded"></svg>
            </CardContent>
          </Card>
        </div>

        <div>
          {selectedNode ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  {selectedNode.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="capitalize">
                  {selectedNode.type}
                </Badge>
                <div className="mt-2 text-sm space-y-2">
                  {Object.entries(selectedNode.metadata).filter(([k]) => !['relatedStudies'].includes(k)).map(([k, v]) => (
                    <div key={k}>
                      <span className="font-medium capitalize">{k.replace("_", " ")}:</span>{" "}
                      <span className="text-muted-foreground">{String(v)}</span>
                    </div>
                  ))}
                </div>
                {selectedNode.type === "paper" && (
                  <div className="mt-4 space-y-2">
                    <p className="font-medium">Abstract:</p>
                    <p className="text-sm text-muted-foreground">{selectedNode.metadata.abstract || "No abstract available"}</p>
                    <p className="text-sm text-muted-foreground">Source: {selectedNode.metadata.source}</p>
                    <p className="text-sm text-muted-foreground">Year: {selectedNode.metadata.year}</p>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href={selectedNode.metadata.url || "#"} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Source
                      </a>
                    </Button>
                  </div>
                )}
                {selectedNode.type === "dataset" && (
                  <div className="mt-4 space-y-2">
                    <p className="font-medium">Description:</p>
                    <p className="text-sm text-muted-foreground">{selectedNode.metadata.abstract || "No description available"}</p>
                    <p className="text-sm text-muted-foreground">Source: {selectedNode.metadata.source}</p>
                    <p className="text-sm text-muted-foreground">Year: {selectedNode.metadata.year}</p>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href={selectedNode.metadata.url || "#"} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Source
                      </a>
                    </Button>
                  </div>
                )}
                {selectedNode.metadata.relatedStudies && selectedNode.metadata.relatedStudies.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="font-medium">Related Studies:</p>
                    <div className="space-y-2">
                      {selectedNode.metadata.relatedStudies.map((study: {id: string, title: string}) => (
                        <Button 
                          key={study.id} 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-start" 
                          onClick={() => navigate(`/paper/${study.id}`)}
                        >
                          {study.title}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {selectedNode.type === "mission" && (
                  <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                    <a href={`https://en.wikipedia.org/wiki/${selectedNode.label.replace(' ', '_')}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Mission on Wikipedia
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Click a node to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}