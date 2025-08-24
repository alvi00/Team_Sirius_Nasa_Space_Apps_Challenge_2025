import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Database, 
  Filter, 
  Download, 
  ExternalLink, 
  FileText,
  Image as ImageIcon,
  BarChart3,
  Search,
  Eye,
  Calendar,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllDemoItems, mapToDataset } from "@/lib/demoData";

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

export default function DatasetExplorer() {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [filters, setFilters] = useState({
    mission: "all",
    dataType: "all",
    instrument: "all",
    fileType: "all"
  });

  useEffect(() => {
    const fetchDatasets = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      const allItems = getAllDemoItems();
      const mapped = allItems.map(mapToDataset).filter((d): d is Dataset => d !== null);
      setDatasets(mapped);
      setFilteredDatasets(mapped);
      setLoading(false);
    };

    fetchDatasets();
  }, []);

  useEffect(() => {
    let filtered = datasets;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(dataset =>
        dataset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dataset.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filters
    if (filters.mission !== "all") {
      filtered = filtered.filter(dataset => dataset.mission.includes(filters.mission));
    }
    if (filters.dataType !== "all") {
      filtered = filtered.filter(dataset => dataset.dataType === filters.dataType);
    }
    if (filters.instrument !== "all") {
      filtered = filtered.filter(dataset => dataset.instrument.includes(filters.instrument));
    }
    if (filters.fileType !== "all") {
      filtered = filtered.filter(dataset => 
        dataset.fileTypes.some(type => type.toLowerCase() === filters.fileType.toLowerCase())
      );
    }

    setFilteredDatasets(filtered);
  }, [datasets, searchTerm, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const DatasetPreview = ({ dataset }: { dataset: Dataset }) => {
    if (!dataset.previewData) return <p className="text-muted-foreground">No preview available</p>;

    if (dataset.previewData.type === "csv") {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gene ID</TableHead>
              <TableHead>Gene Name</TableHead>
              <TableHead>Flight FPKM</TableHead>
              <TableHead>Control FPKM</TableHead>
              <TableHead>Fold Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataset.previewData.rows.map((row: any, index: number) => (
              <TableRow key={index}>
                <TableCell className="font-mono text-xs">{row.gene_id}</TableCell>
                <TableCell>{row.gene_name}</TableCell>
                <TableCell>{row.flight_fpkm}</TableCell>
                <TableCell>{row.control_fpkm}</TableCell>
                <TableCell className={row.fold_change > 0 ? "text-green-600" : "text-red-600"}>
                  {row.fold_change.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (dataset.previewData.type === "taxonomy") {
      return (
        <div className="space-y-4">
          {dataset.previewData.data.map((item: any, index: number) => (
            <div key={index} className="border rounded p-3">
              <h4 className="font-semibold mb-2">{item.taxon}</h4>
              <div className="flex justify-between text-sm">
                <span>Pre: {item.abundance_pre}%</span>
                <span>Flight: {item.abundance_flight}%</span>
                <span>Post: {item.abundance_post}%</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (dataset.previewData.type === "images") {
      return (
        <div className="space-y-4">
          {dataset.previewData.images.map((img: any, index: number) => (
            <div key={index} className="border rounded p-3">
              <p className="font-semibold mb-2">{img.filename}</p>
              <p className="text-sm text-muted-foreground">Dimensions: {img.dimensions}</p>
              {img.channels && <p className="text-sm text-muted-foreground">Channels: {img.channels}</p>}
            </div>
          ))}
        </div>
      );
    }

    return <p className="text-muted-foreground">Preview not supported for this type</p>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-nasa-deep">Dataset Explorer</h1>
            <p className="text-muted-foreground">
              Browse space biology datasets from OSDR, GeneLab, and NASA repositories
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Catalog
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search datasets..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={filters.dataType} onValueChange={(v) => handleFilterChange('dataType', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Data Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Transcriptomics">Transcriptomics</SelectItem>
              <SelectItem value="Metagenomics">Metagenomics</SelectItem>
              <SelectItem value="Imaging">Imaging</SelectItem>
              <SelectItem value="Proteomics">Proteomics</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.mission} onValueChange={(v) => handleFilterChange('mission', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Mission" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Missions</SelectItem>
              <SelectItem value="ISS Expedition 61">ISS Expedition 61</SelectItem>
              <SelectItem value="ISS Expedition 62">ISS Expedition 62</SelectItem>
              <SelectItem value="Tissue Chips in Space">Tissue Chips in Space</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Datasets Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Mission</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Samples</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDatasets.map((dataset) => (
                <TableRow key={dataset.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p>{dataset.title}</p>
                      <p className="text-sm text-muted-foreground">{dataset.description.slice(0, 80)}...</p>
                    </div>
                  </TableCell>
                  <TableCell>{dataset.mission}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{dataset.dataType}</Badge>
                  </TableCell>
                  <TableCell>{dataset.sampleCount}</TableCell>
                  <TableCell>{dataset.size}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" 
                            size="sm"
                            onClick={() => setSelectedDataset(dataset)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{dataset.title}</DialogTitle>
                          </DialogHeader>
                          
                          <Tabs defaultValue="overview" className="mt-4">
                            <TabsList>
                              <TabsTrigger value="overview">Overview</TabsTrigger>
                              <TabsTrigger value="preview">Preview</TabsTrigger>
                              <TabsTrigger value="metadata">Metadata</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-4">
                              <p>{dataset.description}</p>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <p><span className="font-semibold">Mission:</span> {dataset.mission}</p>
                                  <p><span className="font-semibold">Data Type:</span> {dataset.dataType}</p>
                                  <p><span className="font-semibold">Instrument:</span> {dataset.instrument}</p>
                                </div>
                                <div className="space-y-2">
                                  <p><span className="font-semibold">Samples:</span> {dataset.sampleCount}</p>
                                  <p><span className="font-semibold">Size:</span> {dataset.size}</p>
                                  <p><span className="font-semibold">License:</span> {dataset.license}</p>
                                </div>
                              </div>

                              <div>
                                <p className="font-semibold mb-2">File Types:</p>
                                <div className="flex flex-wrap gap-2">
                                  {dataset.fileTypes.map(type => (
                                    <Badge key={type} variant="secondary">{type}</Badge>
                                  ))}
                                </div>
                              </div>

                              {dataset.associatedPapers.length > 0 && (
                                <div>
                                  <p className="font-semibold mb-2">Associated Papers:</p>
                                  <div className="space-y-1">
                                    {dataset.associatedPapers.map(paperId => (
                                      <Button
                                        key={paperId}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate(`/paper/${paperId}`)}
                                      >
                                        <FileText className="w-4 h-4 mr-2" />
                                        View Paper {paperId}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </TabsContent>

                            <TabsContent value="preview">
                              <DatasetPreview dataset={dataset} />
                            </TabsContent>

                            <TabsContent value="metadata" className="space-y-4">
                              <Table>
                                <TableBody>
                                  <TableRow>
                                    <TableCell className="font-semibold">Dataset ID</TableCell>
                                    <TableCell>{dataset.id}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell className="font-semibold">Created</TableCell>
                                    <TableCell>{new Date(dataset.dateCreated).toLocaleDateString()}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell className="font-semibold">Last Modified</TableCell>
                                    <TableCell>{new Date(dataset.lastModified).toLocaleDateString()}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell className="font-semibold">Download URL</TableCell>
                                    <TableCell>
                                      <a 
                                        href={dataset.downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-nasa-teal hover:underline"
                                      >
                                        {dataset.downloadUrl}
                                      </a>
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TabsContent>
                          </Tabs>
                        </DialogContent>
                      </Dialog>

                      <Button variant="outline" size="sm" asChild>
                        <a href={dataset.downloadUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dataset Statistics */}
      <div className="mt-8 grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Database className="w-8 h-8 text-nasa-teal mx-auto mb-2" />
            <div className="text-2xl font-bold">{datasets.length}</div>
            <p className="text-sm text-muted-foreground">Total Datasets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-nasa-orange mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {datasets.reduce((sum, d) => sum + d.sampleCount, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Total Samples</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-8 h-8 text-cosmos-purple mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {new Set(datasets.map(d => d.dataType)).size}
            </div>
            <p className="text-sm text-muted-foreground">Data Types</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-nasa-deep mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {new Set(datasets.map(d => d.mission)).size}
            </div>
            <p className="text-sm text-muted-foreground">Missions</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}