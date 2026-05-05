import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calculator, MapPin, Building, DollarSign, Clock, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { PROPERTY_TYPES, STANDARD_TYPES, TAX_REGIMES } from '@/lib/constants';
import { calculateViability, ProjectInput, ViabilityResult } from '@/lib/viability-calculator';
import { ViabilityResultCard } from '@/components/viability/ViabilityResultCard';
import { ScenarioComparison } from '@/components/viability/ScenarioComparison';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Brazilian capitals list
const BRAZILIAN_CAPITALS = [
  { city: 'Aracaju', uf: 'SE' },
  { city: 'Belém', uf: 'PA' },
  { city: 'Belo Horizonte', uf: 'MG' },
  { city: 'Boa Vista', uf: 'RR' },
  { city: 'Brasília', uf: 'DF' },
  { city: 'Campo Grande', uf: 'MS' },
  { city: 'Cuiabá', uf: 'MT' },
  { city: 'Curitiba', uf: 'PR' },
  { city: 'Florianópolis', uf: 'SC' },
  { city: 'Fortaleza', uf: 'CE' },
  { city: 'Goiânia', uf: 'GO' },
  { city: 'João Pessoa', uf: 'PB' },
  { city: 'Macapá', uf: 'AP' },
  { city: 'Maceió', uf: 'AL' },
  { city: 'Manaus', uf: 'AM' },
  { city: 'Natal', uf: 'RN' },
  { city: 'Palmas', uf: 'TO' },
  { city: 'Porto Alegre', uf: 'RS' },
  { city: 'Porto Velho', uf: 'RO' },
  { city: 'Recife', uf: 'PE' },
  { city: 'Rio Branco', uf: 'AC' },
  { city: 'Rio de Janeiro', uf: 'RJ' },
  { city: 'Salvador', uf: 'BA' },
  { city: 'São Luís', uf: 'MA' },
  { city: 'São Paulo', uf: 'SP' },
  { city: 'Teresina', uf: 'PI' },
  { city: 'Vitória', uf: 'ES' },
];

const initialFormData: ProjectInput = {
  landArea: 5000,
  landCost: 5000000,
  constructionCostPerM2: 3500,
  totalUnits: 120,
  averageUnitArea: 75,
  averageSalePrice: 450000,
  constructionMonths: 24,
  salesMonths: 18,
  financingRate: 12,
  otherCosts: 2000000,
};

export default function NewProject() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState(initialFormData);
  const [projectName, setProjectName] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [customUf, setCustomUf] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [standardType, setStandardType] = useState('');
  const [bairro, setBairro] = useState('');
  const [street, setStreet] = useState('');
  const [cep, setCep] = useState('');
  const [taxRegime, setTaxRegime] = useState('lucro_presumido');
  const [estimatedLaunchVelocity, setEstimatedLaunchVelocity] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<ViabilityResult | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  
  const handleInputChange = (field: keyof ProjectInput, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  const getLocationData = () => {
    if (selectedCity === 'other') {
      return {
        city: customCity,
        uf: customUf.toUpperCase(),
        location: `${customCity}, ${customUf.toUpperCase()}`,
        isCapital: false,
      };
    }
    const capital = BRAZILIAN_CAPITALS.find(c => `${c.city}-${c.uf}` === selectedCity);
    if (capital) {
      return {
        city: capital.city,
        uf: capital.uf,
        location: `${capital.city}, ${capital.uf}`,
        isCapital: true,
      };
    }
    return null;
  };
  
  const handleCalculate = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      const viabilityResult = calculateViability(formData);
      setResult(viabilityResult);
      setActiveTab('result');
      setIsCalculating(false);
      toast.success('Análise de viabilidade concluída!');
    }, 1500);
  };
  
  const handleSave = async () => {
    if (!projectName) {
      toast.error('Preencha o nome do projeto');
      return;
    }
    
    const locationData = getLocationData();
    if (!locationData || !locationData.city || !locationData.uf) {
      toast.error('Selecione ou preencha a localização do projeto');
      return;
    }

    if (!propertyType) {
      toast.error('Selecione o tipo de imóvel');
      return;
    }

    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsSaving(true);
    
    try {
      const vgv = formData.totalUnits * formData.averageSalePrice;
      
      const { error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: projectName,
          location: locationData.location,
          city: locationData.city,
          uf: locationData.uf,
          is_capital: locationData.isCapital,
          property_type: propertyType,
          status: 'draft',
          vgv: vgv,
          roi: result?.projected.roi || 0,
          margin: result?.projected.margin || 0,
          // Novos campos
          bairro: bairro || null,
          street: street || null,
          cep: cep || null,
          regime_tributario: taxRegime,
        });

      if (error) throw error;

      toast.success('Projeto salvo com sucesso!');
      navigate('/projects');
    } catch (error: unknown) {
      console.error('Error saving project:', error);
      const message = error instanceof Error ? error.message : 'Erro ao salvar projeto';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nova Análise de Viabilidade</h1>
            <p className="text-muted-foreground">Preencha os dados do empreendimento</p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="result" disabled={!result}>Resultado</TabsTrigger>
          </TabsList>
          
          {/* Project Info Tab */}
          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Dados do Empreendimento
                </CardTitle>
                <CardDescription>Informações básicas do projeto</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Projeto *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Residencial Villa Nova"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Localização *</Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger>
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Selecione a cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_CAPITALS.map(capital => (
                        <SelectItem key={`${capital.city}-${capital.uf}`} value={`${capital.city}-${capital.uf}`}>
                          {capital.city} - {capital.uf}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">Outra cidade...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedCity === 'other' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="customCity">Cidade</Label>
                      <Input
                        id="customCity"
                        placeholder="Nome da cidade"
                        value={customCity}
                        onChange={(e) => setCustomCity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customUf">UF</Label>
                      <Input
                        id="customUf"
                        placeholder="Ex: SP"
                        value={customUf}
                        onChange={(e) => setCustomUf(e.target.value.toUpperCase())}
                        maxLength={2}
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label>Tipo de Imóvel *</Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Padrão do Empreendimento *</Label>
                  <Select value={standardType} onValueChange={setStandardType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o padrão" />
                    </SelectTrigger>
                    <SelectContent>
                      {STANDARD_TYPES.filter(t => !t.value.includes('legado') && !['economic','standard','high','luxury'].includes(t.value)).map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Regime Tributário *</Label>
                  <Select value={taxRegime} onValueChange={setTaxRegime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o regime" />
                    </SelectTrigger>
                    <SelectContent>
                      {TAX_REGIMES.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro *</Label>
                  <Input
                    id="bairro"
                    placeholder="Ex: Jardins"
                    value={bairro}
                    onChange={e => setBairro(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street">Endereço / Rua</Label>
                  <Input
                    id="street"
                    placeholder="Ex: Rua das Flores, 123"
                    value={street}
                    onChange={e => setStreet(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    value={cep}
                    maxLength={9}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '');
                      setCep(v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5, 8)}` : v);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="launchVelocity">Qtd. Unidades no Lançamento (estimativa)</Label>
                  <Input
                    id="launchVelocity"
                    type="number"
                    placeholder="Ex: 30"
                    value={estimatedLaunchVelocity || ''}
                    onChange={e => setEstimatedLaunchVelocity(+e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Quantidade estimada de unidades vendidas no evento de lançamento</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Dados do Terreno
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="landArea">Área do Terreno (m²)</Label>
                  <Input
                    id="landArea"
                    type="number"
                    value={formData.landArea}
                    onChange={(e) => handleInputChange('landArea', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="landCost">Custo do Terreno (R$)</Label>
                  <Input
                    id="landCost"
                    type="number"
                    value={formData.landCost}
                    onChange={(e) => handleInputChange('landCost', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
              <Button onClick={() => setActiveTab('financial')} size="lg">
                Próximo: Dados Financeiros
              </Button>
            </div>
          </TabsContent>
          
          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Unidades e Construção
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="totalUnits">Total de Unidades</Label>
                  <Input
                    id="totalUnits"
                    type="number"
                    value={formData.totalUnits}
                    onChange={(e) => handleInputChange('totalUnits', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="averageUnitArea">Área Média (m²)</Label>
                  <Input
                    id="averageUnitArea"
                    type="number"
                    value={formData.averageUnitArea}
                    onChange={(e) => handleInputChange('averageUnitArea', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="constructionCostPerM2">Custo Construção (R$/m²)</Label>
                  <Input
                    id="constructionCostPerM2"
                    type="number"
                    value={formData.constructionCostPerM2}
                    onChange={(e) => handleInputChange('constructionCostPerM2', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Vendas e Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="averageSalePrice">Preço Médio de Venda (R$)</Label>
                  <Input
                    id="averageSalePrice"
                    type="number"
                    value={formData.averageSalePrice}
                    onChange={(e) => handleInputChange('averageSalePrice', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="financingRate">Taxa de Financiamento (% a.a.)</Label>
                  <Input
                    id="financingRate"
                    type="number"
                    value={formData.financingRate}
                    onChange={(e) => handleInputChange('financingRate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherCosts">Outros Custos (R$)</Label>
                  <Input
                    id="otherCosts"
                    type="number"
                    value={formData.otherCosts}
                    onChange={(e) => handleInputChange('otherCosts', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Cronograma
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="constructionMonths">Prazo de Construção (meses)</Label>
                  <Input
                    id="constructionMonths"
                    type="number"
                    value={formData.constructionMonths}
                    onChange={(e) => handleInputChange('constructionMonths', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salesMonths">Prazo de Vendas (meses)</Label>
                  <Input
                    id="salesMonths"
                    type="number"
                    value={formData.salesMonths}
                    onChange={(e) => handleInputChange('salesMonths', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab('info')}>
                Voltar
              </Button>
              <Button 
                variant="hero" 
                size="lg" 
                onClick={handleCalculate}
                disabled={isCalculating}
                className="gap-2"
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Calculando...
                  </>
                ) : (
                  <>
                    <Calculator className="h-5 w-5" />
                    Calcular Viabilidade
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          {/* Result Tab */}
          <TabsContent value="result" className="space-y-6">
            {result && (
              <>
                <ViabilityResultCard result={result} />
                <ScenarioComparison result={result} />
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('financial')}>
                    Voltar e Ajustar
                  </Button>
                  <Button 
                    variant="hero" 
                    size="lg" 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Projeto'
                    )}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
