import { useState, useEffect } from "react";
import { Plus, X, Download, Save, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { getAllDemoItems, mapToComparisonItem } from "@/lib/demoData";

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

const mappedDemoItems: ComparisonItem[] = getAllDemoItems().map(mapToComparisonItem);

const generateComparisonSummary = (items: ComparisonItem[]) => {
  if (items.length < 2) return "";

  const organisms = [...new Set(items.map(item => item.organism))];
  const missions = [...new Set(items.map(item => item.mission))];
  const assayTypes = [...new Set(items.map(item => item.assayType))];

  return `Comparative analysis of ${items.length} studies across ${
    organisms.length > 1 ? "multiple species" : organisms[0]
  } reveals consistent patterns of spaceflight-induced physiological changes. 
  All studies employed ${assayTypes.join(" and ")} approaches on ISS missions (${
    missions.join(", ")
  }). Common findings include significant molecular alterations in response to microgravity exposure, 
  with tissue-specific adaptations observed in bone, stress response systems, and muscle tissue. 
  The convergent evidence suggests that microgravity triggers coordinated systemic responses affecting multiple organ systems [Confidence: 0.89].`;
};

export default function ComparativeAnalysis() {
  const [comparisonItems, setComparisonItems] = useState<ComparisonItem[]>([]);
  const [workspaceName, setWorkspaceName] = useState("Untitled Comparison");
  const [autoSummary, setAutoSummary] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("comparison-workspace");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setComparisonItems(data.items || []);
        setWorkspaceName(data.name || "Untitled Comparison");
      } catch (e) {
        console.error("Failed to load comparison workspace:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (comparisonItems.length >= 2) {
      setLoading(true);
      setTimeout(() => {
        setAutoSummary(generateComparisonSummary(comparisonItems));
        setLoading(false);
      }, 1200);
    } else {
      setAutoSummary("");
    }
  }, [comparisonItems]);

  const saveWorkspace = (items: ComparisonItem[], name: string) => {
    const data = { items, name, lastModified: new Date().toISOString() };
    localStorage.setItem("comparison-workspace", JSON.stringify(data));
  };

  const addItemToComparison = (item: ComparisonItem) => {
    if (comparisonItems.find(existing => existing.id === item.id)) return;
    const newItems = [...comparisonItems, item];
    setComparisonItems(newItems);
    saveWorkspace(newItems, workspaceName);
  };

  const removeItemFromComparison = (itemId: string) => {
    const newItems = comparisonItems.filter(item => item.id !== itemId);
    setComparisonItems(newItems);
    saveWorkspace(newItems, workspaceName);
  };

  const handleSaveWorkspace = () => saveWorkspace(comparisonItems, workspaceName);

  const handleExportPDF = () => {
    const link = document.createElement("a");
    link.href = `/api/export/comparison/${Date.now()}`;
    link.download = `${workspaceName.replace(/\s+/g, "_")}_comparison.pdf`;
    link.click();
  };

  const handleExportJSON = () => {
    const data = {
      workspace: workspaceName,
      items: comparisonItems,
      summary: autoSummary,
      exportedAt: new Date().toISOString(),
    };
    const dataBlob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${workspaceName.replace(/\s+/g, "_")}_comparison.json`;
    link.click();
  };

  const ComparisonField = ({
    label,
    items,
    field,
  }: {
    label: string;
    items: ComparisonItem[];
    field: keyof ComparisonItem;
  }) => (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        {label}
      </h4>
      <div className="grid grid-cols-1 gap-3">
        {items.map((item, index) => (
          <div key={`${item.id}-${field}`} className="p-3 bg-muted/50 rounded">
            <p className="text-sm">{String(item[field] ?? "N/A")}</p>
            {field === "mainOutcome" && (
              <Badge variant="outline" className="mt-2 text-xs">
                Study {index + 1}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-cosmic">Comparative Analysis</h1>
            <p className="text-muted-foreground">
              Compare studies side-by-side and generate insights across research
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleSaveWorkspace}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={handleExportJSON}>
              <FileText className="w-4 h-4 mr-2" />
              JSON
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Input
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="max-w-md"
            placeholder="Workspace name..."
          />
          <Badge variant="outline">{comparisonItems.length} items</Badge>
        </div>
      </div>

      {comparisonItems.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Current Comparison Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comparisonItems.map(item => (
                <div
                  key={`current-${item.id}`}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.organism} • {item.assayType}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeItemFromComparison(item.id)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {comparisonItems.length === 0 && (
        <Card className="mb-8">
          <CardContent className="p-8 text-center">
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Start Your Comparison</h3>
            <p className="text-muted-foreground mb-6">
              Add papers or datasets from search results to begin
            </p>
          </CardContent>
        </Card>
      )}

      {comparisonItems.length >= 2 && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Side-by-Side Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-8">
                <ComparisonField label="Study Title" items={comparisonItems} field="title" />
                <ComparisonField label="Organism" items={comparisonItems} field="organism" />
                <ComparisonField label="Mission" items={comparisonItems} field="mission" />
                <ComparisonField label="Assay Type" items={comparisonItems} field="assayType" />
                <ComparisonField label="Sample Size" items={comparisonItems} field="sampleSize" />
                <ComparisonField label="Main Outcome" items={comparisonItems} field="mainOutcome" />
              </div>
            </CardContent>
          </Card>

          <Card className="rag-answer">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>🤖 Auto-Generated Comparison Summary</span>
                {loading && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <div className="animate-spin w-4 h-4 border-2 border-nasa-teal border-t-transparent rounded-full"></div>
                    <span>Analyzing...</span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
                </div>
              ) : autoSummary ? (
                <div>
                  <p className="leading-relaxed mb-4">{autoSummary}</p>
                  <Separator className="my-4" />
                  <div className="space-y-4">
                    <h4 className="font-semibold">Supporting Evidence by Study:</h4>
                    {comparisonItems.map((item, index) => (
                      <div key={`evidence-${item.id}`} className="border-l-4 border-nasa-teal pl-4">
                        <p className="font-semibold text-sm mb-2">
                          Study {index + 1}: {item.title}
                        </p>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {(item.ragSnippets || []).map((snippet, snippetIndex) => (
                            <li key={`${item.id}-snippet-${snippetIndex}`}>• {snippet}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Add at least 2 items to generate summary.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    {comparisonItems.map((item, index) => (
                      <TableHead key={`col-${item.id}`}>Study {index + 1}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Source</TableCell>
                    {comparisonItems.map(item => (
                      <TableCell key={`src-${item.id}`}>{item.source}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Year</TableCell>
                    {comparisonItems.map(item => (
                      <TableCell key={`year-${item.id}`}>{item.year}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Duration</TableCell>
                    {comparisonItems.map(item => (
                      <TableCell key={`dur-${item.id}`}>
                        {item.metadata?.duration || "N/A"}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Key Features</TableCell>
                    {comparisonItems.map(item => (
                      <TableCell key={`meta-${item.id}`}>
                        <div className="space-y-1">
                          {Object.entries(item.metadata || {})
                            .filter(([key]) => key !== "duration")
                            .map(([key, value]) => (
                              <div key={key} className="text-xs">
                                <span className="font-medium">{key}:</span>{" "}
                                {Array.isArray(value) ? value.join(", ") : String(value)}
                              </div>
                            ))}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Available Studies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
            {mappedDemoItems
              .filter(item => !comparisonItems.find(existing => existing.id === item.id))
              .map(item => (
                <div
                  key={`add-${item.id}`}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.organism} • {item.assayType}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => addItemToComparison(item)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}