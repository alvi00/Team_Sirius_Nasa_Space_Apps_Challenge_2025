import React, { useState } from "react";
import {
  Upload,
  Database,
  RefreshCw,
  Download,
  Play,
  FileText,
  BarChart3,
  Settings,
  Terminal,
  CheckCircle,
  AlertCircle,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

import {
  getAllDemoItems,
  buildMockSystemStatus,
  generateMockQueryHistory,
  buildKGFromItems
} from "@/lib/demoData";

/* ===== Types ===== */
interface IngestionStatus {
  status: "idle" | "processing" | "complete" | "error";
  processed: number;
  total: number;
  message: string;
}

/* ===== Prompt templates (unchanged) ===== */
const promptTemplates = {
  concise: `You are an evidence-based research assistant. Answer the user's question using only the passages listed. For each sentence, append [REF:chunk_id,source]. If you cannot answer, say 'No evidence found in provided passages.' Do not invent facts.

Question: {question}
Passages: {passages}

Answer:`,
  detailed: `Provide a comprehensive answer to the research question using the provided scientific passages. Include specific details, methodology mentions, and quantitative results where available. For each claim, include inline citations [REF:chunk_id,source]. If insufficient evidence exists, clearly state limitations.

Question: {question}
Passages: {passages}

Detailed Answer:`,
  compare: `Compare the supplied documents on the research question. Provide a one-paragraph synthesis stating similarities and differences. For each claim, include [REF:chunk_id,doc_id]. Rate your confidence 0-1 at the end.

Question: {question}
Documents: {documents}

Comparison:`
};

export default function AdminPlayground(): JSX.Element {
  // ingestion UI state
  const [ingestionStatus, setIngestionStatus] = useState<IngestionStatus>({
    status: "idle",
    processed: 0,
    total: 0,
    message: "Ready to ingest data"
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPromptTemplate, setSelectedPromptTemplate] = useState<string>(
    "concise"
  );
  const [customQuery, setCustomQuery] = useState<string>("");
  const [systemLogs, setSystemLogs] = useState<string[]>(() => [
    `[${new Date().toISOString().replace("T", " ").slice(0, 19)}] System initialized`,
    `[${new Date().toISOString().replace("T", " ").slice(0, 19)}] Vector DB connection established`,
    `[${new Date().toISOString().replace("T", " ").slice(0, 19)}] Knowledge graph loaded (seed)`,
    `[${new Date().toISOString().replace("T", " ").slice(0, 19)}] Ready for queries`
  ]);

  // NOTE: buildMockSystemStatus and generateMockQueryHistory are zero-arg helpers
  // (they read demo JSON internally). Call them without passing demoItems.
  const demoItems = getAllDemoItems();
  const mockSystemStatus = buildMockSystemStatus();
  const mockQueryHistory = generateMockQueryHistory();

  /* ===== Handlers ===== */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleIngestion = async () => {
    if (!selectedFile) return;

    setIngestionStatus({
      status: "processing",
      processed: 0,
      total: 100,
      message: "Processing file..."
    });

    // Simulate ingestion progress - keep UI responsive
    for (let i = 0; i <= 100; i += 10) {
      // small delay so user sees progress
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 180));
      setIngestionStatus((prev) => ({
        ...prev,
        processed: i,
        message: i < 100 ? `Processing embeddings... ${i}%` : "Ingestion complete!"
      }));
    }

    setIngestionStatus((prev) => ({ ...prev, status: "complete" }));

    // Log a realistic ingestion summary
    const newLog = `[${new Date().toISOString().replace("T", " ").slice(0, 19)}] Ingested ${selectedFile.name}: 50 documents processed`;
    setSystemLogs((prev) => [...prev, newLog]);
  };

  const handleSeedKG = async () => {
    // build KG from demo data
    const items = getAllDemoItems();
    const kg = buildKGFromItems(items);
    setSystemLogs((prev) => [
      ...prev,
      `[${new Date().toISOString().replace("T", " ").slice(0, 19)}] Starting KG seed from sample JSON`,
      `[${new Date().toISOString().replace("T", " ").slice(0, 19)}] KG regenerated: ${kg.nodes.length} nodes, ${kg.edges.length} edges`
    ]);
  };

  const handleRegenerateAnswer = async () => {
    if (!customQuery.trim()) return;
    setSystemLogs((prev) => [
      ...prev,
      `[${new Date().toISOString().replace("T", " ").slice(0, 19)}] Testing query: "${customQuery}"`,
      `[${new Date().toISOString().replace("T", " ").slice(0, 19)}] Using template: ${selectedPromptTemplate}`,
      `[${new Date().toISOString().replace("T", " ").slice(0, 19)}] Query completed in 1.2s`
    ]);
  };

  const handleExportLogs = () => {
    const logsText = systemLogs.join("\n");
    const blob = new Blob([logsText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `system-logs-${Date.now()}.txt`;
    link.click();
  };

  /* ===== Render ===== */
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-mission">Admin Playground</h1>
            <p className="text-muted-foreground">
              Internal tools for demo: data ingestion, system monitoring, and query
              testing
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              System Healthy
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="ingestion" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ingestion">Data Ingestion</TabsTrigger>
          <TabsTrigger value="system">System Status</TabsTrigger>
          <TabsTrigger value="kg">Knowledge Graph</TabsTrigger>
          <TabsTrigger value="testing">Query Testing</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
        </TabsList>

        {/* Ingestion */}
        <TabsContent value="ingestion" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Input
                    type="file"
                    accept=".csv,.json,.xml,.txt"
                    onChange={handleFileUpload}
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports CSV, JSON, PMC XML, or TXT files
                  </p>
                </div>

                {selectedFile && (
                  <div className="p-3 bg-muted rounded border">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleIngestion}
                  disabled={!selectedFile || ingestionStatus.status === "processing"}
                  className="w-full"
                >
                  {ingestionStatus.status === "processing" ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Start Ingestion
                    </>
                  )}
                </Button>

                {ingestionStatus.status !== "idle" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{ingestionStatus.message}</span>
                      <span>{ingestionStatus.processed}%</span>
                    </div>
                    <Progress value={ingestionStatus.processed} className="w-full" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ingestion Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Vector DB Status:</span>
                    <Badge variant="outline">{mockSystemStatus.vectorDB.documents} docs indexed</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Last Ingestion:</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(mockSystemStatus.vectorDB.lastUpdated).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Index Size:</span>
                    <span className="text-sm">{mockSystemStatus.vectorDB.indexSize}</span>
                  </div>

                  <Button variant="outline" className="w-full" onClick={() => {
                    // simulate rebuild
                    setSystemLogs(prev => [...prev, `[${new Date().toISOString().replace('T',' ').slice(0,19)}] Rebuild index requested`]);
                  }}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Rebuild Index
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Database className="w-8 h-8 text-nasa-teal mx-auto mb-2" />
                <div className="text-2xl font-bold">{mockSystemStatus.vectorDB.documents}</div>
                <p className="text-sm text-muted-foreground">Documents</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="w-8 h-8 text-nasa-orange mx-auto mb-2" />
                <div className="text-2xl font-bold">{mockSystemStatus.knowledgeGraph.nodes}</div>
                <p className="text-sm text-muted-foreground">KG Nodes</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <FileText className="w-8 h-8 text-cosmos-purple mx-auto mb-2" />
                <div className="text-2xl font-bold">{mockSystemStatus.knowledgeGraph.edges}</div>
                <p className="text-sm text-muted-foreground">KG Edges</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Settings className="w-8 h-8 text-nasa-deep mx-auto mb-2" />
                <div className="text-2xl font-bold">{Object.keys(mockSystemStatus.sources).length}</div>
                <p className="text-sm text-muted-foreground">Data Sources</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Source Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Source</TableHead>
                    <TableHead>Document Count</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(mockSystemStatus.sources).map(([source, count]) => (
                    <TableRow key={source}>
                      <TableCell className="font-medium">{source}</TableCell>
                      <TableCell>{count}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KG */}
        <TabsContent value="kg" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Graph Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Current KG contains {mockSystemStatus.knowledgeGraph.nodes} nodes and {mockSystemStatus.knowledgeGraph.edges} edges.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last sync: {new Date(mockSystemStatus.knowledgeGraph.lastSync).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <Button variant="outline" className="w-full" onClick={handleSeedKG}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Seed from Sample JSON
                  </Button>

                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export KG (GraphML)
                  </Button>

                  <Button variant="outline" className="w-fulll" onClick={() => {
                    const kg = buildKGFromItems(demoItems);
                    setSystemLogs(prev => [...prev, `[${new Date().toISOString().replace('T',' ').slice(0,19)}] Regenerated all edges: ${kg.edges.length} edges`]);
                  }}>
                    <Settings className="w-4 h-4 mr-2" />
                    Regenerate All Edges
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mock Vector DB Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Embeddings:</span>
                    <span>{mockSystemStatus.vectorDB.embeddings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Index Size:</span>
                    <span>{mockSystemStatus.vectorDB.indexSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Query Time:</span>
                    <span>1.2s</span>
                  </div>
                </div>

                <div className="p-3 bg-muted rounded">
                  <p className="text-sm font-medium mb-1">Sample Embedding (first 5 dims):</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    [0.123, -0.456, 0.789, -0.234, 0.567...]
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Testing */}
        <TabsContent value="testing" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Query Testing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Test Query</label>
                  <Textarea
                    placeholder="Enter test query..."
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    className="mb-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Prompt Template</label>
                  <Select value={selectedPromptTemplate} onValueChange={setSelectedPromptTemplate}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concise">Concise Answer</SelectItem>
                      <SelectItem value="detailed">Detailed Summary</SelectItem>
                      <SelectItem value="compare">Compare Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleRegenerateAnswer} disabled={!customQuery} className="w-full">
                  <Play className="w-4 h-4 mr-2" />
                  Test Query
                </Button>

                {selectedPromptTemplate && (
                  <div className="p-3 bg-muted rounded">
                    <p className="text-xs font-medium mb-2">Template Preview:</p>
                    <p className="text-xs text-muted-foreground">
                      {promptTemplates[selectedPromptTemplate as keyof typeof promptTemplates].slice(0, 200)}...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Query History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockQueryHistory.map((record) => (
                    <div key={record.id} className="p-3 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{record.query}</p>
                        <Badge variant="outline" className="text-xs">
                          {record.responseTime}ms
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{record.resultsCount} results</span>
                        <span>{new Date(record.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {record.sources.map((source) => (
                          <Badge key={source} variant="secondary" className="text-xs">
                            {source}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Logs */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Terminal className="w-5 h-5 mr-2" />
                  System Logs
                </div>
                <Button variant="outline" size="sm" onClick={handleExportLogs}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
                {systemLogs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">47</div>
                <p className="text-sm text-muted-foreground">Successful Queries</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">2</div>
                <p className="text-sm text-muted-foreground">Warnings</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Terminal className="w-8 h-8 text-nasa-teal mx-auto mb-2" />
                <div className="text-2xl font-bold">99.2%</div>
                <p className="text-sm text-muted-foreground">Uptime</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
