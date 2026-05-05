import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Target, Plus, Trash2, Search, Loader2, Globe, Sparkles, CheckCircle } from 'lucide-react';
import { firecrawlApi, EnrichedSearchResult } from '@/lib/api/firecrawl';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Competitor {
  name: string;
  developer: string;
  avg_price_m2: number;
  total_units: number;
  sold_units?: number;
  source: string;
  source_url?: string;
}

interface CompetitorBlockProps {
  competitors: Competitor[];
  onAddCompetitor: (competitor: Competitor) => void;
  onRemoveCompetitor: (index: number) => void;
  city?: string;
  uf?: string;
  neighborhood?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function CompetitorBlock({ 
  competitors, 
  onAddCompetitor, 
  onRemoveCompetitor,
  city,
  uf,
  neighborhood
}: CompetitorBlockProps) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<EnrichedSearchResult[]>([]);
  const [form, setForm] = useState({ 
    name: '', 
    developer: '', 
    avg_price_m2: '', 
    total_units: '', 
    sold_units: '' 
  });

  const handleAdd = () => {
    onAddCompetitor({
      name: form.name,
      developer: form.developer,
      avg_price_m2: parseFloat(form.avg_price_m2) || 0,
      total_units: parseInt(form.total_units) || 0,
      sold_units: parseInt(form.sold_units) || 0,
      source: 'manual'
    });
    setForm({ name: '', developer: '', avg_price_m2: '', total_units: '', sold_units: '' });
    setShowForm(false);
  };

  const handleWebSearch = async () => {
    if (!city || !uf) {
      toast({
        title: "Localização necessária",
        description: "Selecione uma cidade para buscar concorrentes.",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      const response = await firecrawlApi.searchCompetitors(city, uf, neighborhood);
      
      if (response.success && response.data) {
        setSearchResults(response.data);
        const withData = response.data.filter(r => r.extractedData?.confidence !== 'low');
        toast({
          title: "Busca concluída",
          description: `${response.data.length} resultados, ${withData.length} com dados extraídos automaticamente.`
        });
      } else {
        toast({
          title: "Erro na busca",
          description: response.error || "Não foi possível buscar concorrentes.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Erro",
        description: "Falha ao buscar concorrentes na web.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const parseAndAddFromSearch = (result: EnrichedSearchResult) => {
    const extracted = result.extractedData;
    
    onAddCompetitor({
      name: extracted?.name || result.title?.substring(0, 100) || 'Empreendimento',
      developer: extracted?.developer || '',
      avg_price_m2: extracted?.avg_price_m2 || 0,
      total_units: extracted?.total_units || 0,
      source: 'web_search',
      source_url: result.url
    });
    
    const hasData = extracted && (extracted.avg_price_m2 || extracted.total_units || extracted.developer);
    toast({
      title: "Adicionado",
      description: hasData 
        ? "Dados extraídos automaticamente. Verifique e ajuste se necessário."
        : "Complete os dados do empreendimento manualmente."
    });
  };

  const getConfidenceBadge = (confidence?: 'high' | 'medium' | 'low') => {
    if (!confidence || confidence === 'low') return null;
    
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "text-xs",
          confidence === 'high' ? "border-success/50 text-success" : "border-warning/50 text-warning"
        )}
      >
        <Sparkles className="h-3 w-3 mr-1" />
        {confidence === 'high' ? 'Alta' : 'Média'} confiança
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-secondary" />
            Concorrência ({competitors.length})
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleWebSearch}
              disabled={isSearching || !city}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-1" />
              )}
              Buscar na Web
            </Button>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Manual Form */}
        {showForm && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label>Nome</Label>
              <Input 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                placeholder="Nome do empreendimento"
              />
            </div>
            <div>
              <Label>Incorporadora</Label>
              <Input 
                value={form.developer} 
                onChange={e => setForm({...form, developer: e.target.value})} 
                placeholder="Nome da incorporadora"
              />
            </div>
            <div>
              <Label>Preço/m²</Label>
              <Input 
                type="number" 
                value={form.avg_price_m2} 
                onChange={e => setForm({...form, avg_price_m2: e.target.value})} 
                placeholder="12000"
              />
            </div>
            <div>
              <Label>Total Unid.</Label>
              <Input 
                type="number" 
                value={form.total_units} 
                onChange={e => setForm({...form, total_units: e.target.value})} 
                placeholder="100"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAdd} disabled={!form.name}>Salvar</Button>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Resultados da Busca ({searchResults.length})
            </h4>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {searchResults.map((result, i) => {
                const extracted = result.extractedData;
                const hasExtractedData = extracted && extracted.confidence !== 'low';
                
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "flex flex-col p-3 bg-background rounded border transition-colors",
                      hasExtractedData ? "border-success/30 hover:border-success/50" : "hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {extracted?.name || result.title}
                          </p>
                          {getConfidenceBadge(extracted?.confidence)}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{result.url}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant={hasExtractedData ? "default" : "outline"}
                        onClick={() => parseAndAddFromSearch(result)}
                      >
                        {hasExtractedData ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Plus className="h-3 w-3 mr-1" />
                        )}
                        Adicionar
                      </Button>
                    </div>
                    
                    {/* Show extracted data preview */}
                    {hasExtractedData && (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {extracted.developer && (
                          <Badge variant="secondary" className="text-xs">
                            {extracted.developer}
                          </Badge>
                        )}
                        {extracted.avg_price_m2 && (
                          <Badge variant="outline" className="text-xs">
                            {formatCurrency(extracted.avg_price_m2)}/m²
                          </Badge>
                        )}
                        {extracted.total_units && (
                          <Badge variant="outline" className="text-xs">
                            {extracted.total_units} unidades
                          </Badge>
                        )}
                        {extracted.min_ticket && extracted.max_ticket && (
                          <Badge variant="outline" className="text-xs">
                            {formatCurrency(extracted.min_ticket)} - {formatCurrency(extracted.max_ticket)}
                          </Badge>
                        )}
                        {extracted.neighborhood && (
                          <Badge variant="outline" className="text-xs">
                            {extracted.neighborhood}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2"
              onClick={() => setSearchResults([])}
            >
              Limpar resultados
            </Button>
          </div>
        )}

        {/* Competitor List */}
        {competitors.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum concorrente cadastrado. Use a busca na web ou adicione manualmente.
          </p>
        ) : (
          <div className="space-y-3">
            {competitors.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.name}</span>
                    {c.source === 'web_search' && (
                      <Badge variant="secondary" className="text-xs">
                        <Globe className="h-3 w-3 mr-1" /> Web
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {c.developer || 'Incorporadora não informada'}
                  </div>
                  {c.source_url && (
                    <a 
                      href={c.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Ver fonte
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {c.avg_price_m2 > 0 && (
                    <Badge variant="outline">
                      R$ {c.avg_price_m2?.toLocaleString('pt-BR')}/m²
                    </Badge>
                  )}
                  {c.total_units > 0 && (
                    <Badge variant="outline">{c.total_units} un.</Badge>
                  )}
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => onRemoveCompetitor(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
