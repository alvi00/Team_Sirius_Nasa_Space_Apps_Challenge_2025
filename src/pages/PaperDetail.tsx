import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Download, 
  Save, 
  Share2, 
  ChevronLeft,
  FileText,
  Database,
  Image as ImageIcon,
  Expand
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { getAllDemoItems, mapToPaper } from "@/lib/demoData";

// --- Type Definitions ---
interface PaperFigure {
  id: string;
  caption: string;
  pmcid?: string;
}

interface RelatedStudy {
  id: string;
  title: string;
  similarity: number;
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
    missions: string[];
    organisms: string[];
    assayTypes: string[];
    instruments: string[];
    samplePrep: string;
    datasets: string[];
  };
  figures: PaperFigure[];
  relatedStudies: RelatedStudy[];
  ragExpansion: {
    relevantPassages: { chunkId: string; text: string; confidence: number }[];
    extractionTrace: string[];
  };
}

// --- Component ---
export default function PaperDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paperData, setPaperData] = useState<PaperData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaperData = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      const allItems = getAllDemoItems();
      const item = allItems.find((item) => item.id === id);
      if (item) setPaperData(mapToPaper(item));
      setLoading(false);
    };
    fetchPaperData();
  }, [id]);

  const handleExportPDF = () => {
    const link = document.createElement("a");
    link.href = `/api/export/pdf/${id}`;
    link.download = `${paperData?.title.slice(0, 50)}.pdf`;
    link.click();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!paperData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Paper not found. This ID might correspond to a dataset instead.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Results
        </Button>

        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-4 leading-tight">{paperData.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <Badge variant="outline" className="px-3 py-1">{paperData.source}</Badge>
              <span className="text-muted-foreground">{paperData.year}</span>
              {paperData.doi && (
                <a 
                  href={`https://doi.org/${paperData.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-nasa-teal hover:underline"
                >
                  DOI: {paperData.doi}
                </a>
              )}
            </div>
            <p className="text-muted-foreground">{paperData.authors.join(", ")}</p>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" /> Export PDF
            </Button>
            <Button variant="outline">
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
            <Button variant="outline">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
          </div>
        </div>

        {/* Missions Badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          {paperData.metadata.missions.map((mission) => (
            <Badge key={mission} variant="outline">{mission}</Badge>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="figures">Figures</TabsTrigger>
            <TabsTrigger value="data">Data & Methods</TabsTrigger>
            <TabsTrigger value="insights">RAG Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" /> Abstract
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed">{paperData.abstract}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Related Studies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paperData.relatedStudies.map((study) => (
                    <div 
                      key={study.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => navigate(`/paper/${study.id}`)}
                    >
                      <span className="font-medium">{study.title}</span>
                      <Badge variant="outline">{Math.round(study.similarity * 100)}% similar</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Figures Tab */}
          <TabsContent value="figures" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paperData.figures.map((figure) => (
                <Card key={figure.id} className="overflow-hidden">
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="cursor-pointer group relative aspect-video bg-muted flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-muted-foreground group-hover:text-nasa-teal transition-colors" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Expand className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <div className="space-y-4">
                        <div className="aspect-video bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="w-24 h-24 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">{figure.caption}</p>
                        {figure.pmcid && (
                          <p className="text-xs text-muted-foreground mt-2">Source: PMC {figure.pmcid}</p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <CardContent className="p-4 flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">{figure.caption}</p>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Data & Methods Tab */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" /> Study Metadata
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Organisms</TableCell>
                      <TableCell>{paperData.metadata.organisms.join(", ")}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Assay Types</TableCell>
                      <TableCell>{paperData.metadata.assayTypes.join(", ")}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Instruments</TableCell>
                      <TableCell>{paperData.metadata.instruments.join(", ")}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Sample Preparation</TableCell>
                      <TableCell>{paperData.metadata.samplePrep}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Datasets</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {paperData.metadata.datasets.map((dataset) => (
                            <Badge key={dataset} variant="outline">{dataset}</Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* RAG Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card className="rag-answer">
              <CardHeader>
                <CardTitle>RAG Expansion: Query-Relevant Passages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {paperData.ragExpansion.relevantPassages.map((passage) => (
                  <div key={passage.chunkId} className="border-l-4 border-nasa-teal pl-4">
                    <p className="mb-2">{passage.text}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Chunk ID: {passage.chunkId}</span>
                      <Badge variant="outline">Confidence: {Math.round(passage.confidence * 100)}%</Badge>
                    </div>
                  </div>
                ))}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Extraction Trace</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Chunks used by retriever: {paperData.ragExpansion.extractionTrace.join(", ")}
                  </p>
                  <Button variant="outline" size="sm">Show Full Extraction Trace</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
