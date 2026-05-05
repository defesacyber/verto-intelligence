import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useBlocker } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Calculator, Building2, MapPin, DollarSign, Calendar, FileText, Loader2 } from 'lucide-react';
import {
  PADRAO_OPTIONS,
  TIPO_NEGOCIACAO_OPTIONS,
  TIPO_UNIDADE_OPTIONS,
  REGIME_TRIBUTARIO_OPTIONS,
  TipoUnidadeConfig,
  calcularVGVPorTipo,
  calcularUnidadesPermuta,
  formatCurrencyBR,
} from '@/lib/project-constants';

const projectDetailsSchema = z.object({
  // Identificação
  name: z.string().min(1, 'Nome é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  uf: z.string().length(2, 'UF deve ter 2 caracteres'),
  neighborhood: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  quadra: z.string().optional(),
  lote: z.string().optional(),
  
  // Classificação
  property_type: z.string().min(1, 'Tipo de imóvel é obrigatório'),
  padrao_empreendimento: z.enum(['alto', 'medio', 'economico', 'popular']),
  
  // Terreno
  area_terreno_m2: z.number().min(0).optional(),
  tipo_negociacao: z.enum(['compra', 'permuta']),
  valor_terreno: z.number().min(0).optional(),
  permuta_percentual: z.number().min(0).max(100).optional(),
  
  // Unidades
  total_units: z.number().min(1, 'Mínimo 1 unidade'),
  tipo_unidade: z.enum(['1Q', '2Q', '3Q', '4Q', 'misto']),
  
  // Fiscal
  regime_tributario: z.enum(['lucro_real', 'lucro_presumido', 'ret_1_patrimonio_afetacao', 'ret_2_mcmv']),
  
  // Cronograma
  projecao_lancamento_meses: z.number().min(1).max(36),
  projecao_construcao_meses: z.number().min(6).max(60),
  venda_lancamento_pct: z.number().min(0).max(100),
  venda_obra_pct: z.number().min(0).max(100),
  venda_entrega_pct: z.number().min(0).max(100),
});

type ProjectDetailsFormData = z.infer<typeof projectDetailsSchema>;

interface ProjectDetailsFormProps {
  initialData?: Partial<ProjectDetailsFormData>;
  onSubmit: (data: ProjectDetailsFormData, tiposUnidade: TipoUnidadeConfig[]) => void;
  isLoading?: boolean;
}

export function ProjectDetailsForm({ initialData, onSubmit, isLoading }: ProjectDetailsFormProps) {
  const [tiposUnidade, setTiposUnidade] = useState<TipoUnidadeConfig[]>([
    { id: '1', nome: 'Tipo 1', quartos: '2Q', quantidade: 50, area_m2: 65, preco_m2: 8500 },
  ]);

  const form = useForm<ProjectDetailsFormData>({
    resolver: zodResolver(projectDetailsSchema),
    defaultValues: {
      name: '',
      city: '',
      uf: '',
      neighborhood: '',
      rua: '',
      numero: '',
      quadra: '',
      lote: '',
      property_type: 'residencial',
      padrao_empreendimento: 'medio',
      area_terreno_m2: 0,
      tipo_negociacao: 'compra',
      valor_terreno: 0,
      permuta_percentual: 0,
      total_units: 100,
      tipo_unidade: '2Q',
      regime_tributario: 'lucro_presumido',
      projecao_lancamento_meses: 3,
      projecao_construcao_meses: 24,
      venda_lancamento_pct: 30,
      venda_obra_pct: 50,
      venda_entrega_pct: 20,
      ...initialData,
    },
  });

  const { isDirty } = form.formState;

  // Prevent internal navigation if form is dirty
  useBlocker(({ nextLocation }) => {
    if (isDirty && !isLoading && !nextLocation.pathname.includes(window.location.pathname)) {
      return !window.confirm('Você tem alterações não salvas. Deseja realmente sair?');
    }
    return false;
  });

  // Prevent tab closing/refresh if form is dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isLoading) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isLoading]);

  const watchedValues = form.watch();
  const tipoNegociacao = watchedValues.tipo_negociacao;
  const tipoUnidade = watchedValues.tipo_unidade;
  const totalUnits = watchedValues.total_units;
  const permutaPercentual = watchedValues.permuta_percentual || 0;

  // Cálculos automáticos de VGV
  const vgvCalculations = useMemo(() => {
    const results = tiposUnidade.map((tipo) => {
      const { unitario, total } = calcularVGVPorTipo(tipo);
      return { ...tipo, vgv_unitario: unitario, vgv_total: total };
    });

    const vgvTotal = results.reduce((sum, r) => sum + r.vgv_total, 0);
    const totalUnidades = results.reduce((sum, r) => sum + r.quantidade, 0);

    return { results, vgvTotal, totalUnidades };
  }, [tiposUnidade]);

  // Cálculo de unidades em permuta
  const unidadesPermuta = useMemo(() => {
    if (tipoNegociacao !== 'permuta') return 0;
    return calcularUnidadesPermuta(totalUnits, permutaPercentual);
  }, [tipoNegociacao, totalUnits, permutaPercentual]);

  // Validação de projeção de vendas
  const vendasTotal = watchedValues.venda_lancamento_pct + watchedValues.venda_obra_pct + watchedValues.venda_entrega_pct;
  const vendasValido = Math.abs(vendasTotal - 100) < 0.01;

  // Adicionar tipo de unidade (para misto)
  const addTipoUnidade = () => {
    setTiposUnidade([
      ...tiposUnidade,
      {
        id: String(Date.now()),
        nome: `Tipo ${tiposUnidade.length + 1}`,
        quartos: '2Q',
        quantidade: 20,
        area_m2: 65,
        preco_m2: 8500,
      },
    ]);
  };

  // Remover tipo de unidade
  const removeTipoUnidade = (id: string) => {
    if (tiposUnidade.length > 1) {
      setTiposUnidade(tiposUnidade.filter((t) => t.id !== id));
    }
  };

  // Atualizar tipo de unidade
  const updateTipoUnidade = (id: string, field: keyof TipoUnidadeConfig, value: string | number) => {
    setTiposUnidade(
      tiposUnidade.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleSubmit = (data: ProjectDetailsFormData) => {
    onSubmit(data, tiposUnidade);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Seção: Dados Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Dados Gerais
            </CardTitle>
            <CardDescription>Identificação e localização do projeto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Projeto *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Residencial Aurora" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="padrao_empreendimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Padrão *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o padrão" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border">
                        {PADRAO_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Goiânia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="uf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UF *</FormLabel>
                    <FormControl>
                      <Input placeholder="GO" maxLength={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Setor Marista" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <FormField
                control={form.control}
                name="rua"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rua</FormLabel>
                    <FormControl>
                      <Input placeholder="Av. T-63" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input placeholder="1500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="quadra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quadra</FormLabel>
                    <FormControl>
                      <Input placeholder="Quadra 15" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lote</FormLabel>
                    <FormControl>
                      <Input placeholder="Lote 10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Seção: Terreno */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Terreno
            </CardTitle>
            <CardDescription>Dados do terreno e tipo de negociação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="area_terreno_m2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área do Terreno (m²)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2500"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tipo_negociacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Negociação *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border">
                        {TIPO_NEGOCIACAO_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {tipoNegociacao === 'compra' ? (
                <FormField
                  control={form.control}
                  name="valor_terreno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Terreno (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="5000000"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="permuta_percentual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Percentual em Permuta (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="15"
                          min={0}
                          max={100}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        {unidadesPermuta > 0 && (
                          <span className="text-primary font-medium">
                            = {unidadesPermuta} unidades em permuta (arredondado ↑)
                          </span>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Seção: Unidades e VGV */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Unidades e VGV
            </CardTitle>
            <CardDescription>Distribuição de unidades e precificação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="total_units"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total de Unidades *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tipo_unidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Unidade *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border">
                        {TIPO_UNIDADE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {tipoUnidade === 'misto' && (
              <>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Configuração por Tipo de Unidade</h4>
                    <Button type="button" variant="outline" size="sm" onClick={addTipoUnidade}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Tipo
                    </Button>
                  </div>

                  {tiposUnidade.map((tipo) => (
                    <div key={tipo.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <Input
                          value={tipo.nome}
                          onChange={(e) => updateTipoUnidade(tipo.id, 'nome', e.target.value)}
                          className="w-32 font-medium"
                        />
                        {tiposUnidade.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTipoUnidade(tipo.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-4">
                        <div>
                          <label className="text-sm text-muted-foreground">Quartos</label>
                          <Select
                            value={tipo.quartos}
                            onValueChange={(v) => updateTipoUnidade(tipo.id, 'quartos', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border">
                              <SelectItem value="1Q">1 Quarto</SelectItem>
                              <SelectItem value="2Q">2 Quartos</SelectItem>
                              <SelectItem value="3Q">3 Quartos</SelectItem>
                              <SelectItem value="4Q">4 Quartos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm text-muted-foreground">Quantidade</label>
                          <Input
                            type="number"
                            value={tipo.quantidade}
                            onChange={(e) =>
                              updateTipoUnidade(tipo.id, 'quantidade', parseInt(e.target.value) || 0)
                            }
                          />
                        </div>

                        <div>
                          <label className="text-sm text-muted-foreground">Área (m²)</label>
                          <Input
                            type="number"
                            value={tipo.area_m2}
                            onChange={(e) =>
                              updateTipoUnidade(tipo.id, 'area_m2', parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>

                        <div>
                          <label className="text-sm text-muted-foreground">Preço/m² (R$)</label>
                          <Input
                            type="number"
                            value={tipo.preco_m2}
                            onChange={(e) =>
                              updateTipoUnidade(tipo.id, 'preco_m2', parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pt-2 border-t">
                        <Badge variant="outline" className="text-xs">
                          <Calculator className="h-3 w-3 mr-1" />
                          Valor Unitário: {formatCurrencyBR(calcularVGVPorTipo(tipo).unitario)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          VGV Total: {formatCurrencyBR(calcularVGVPorTipo(tipo).total)}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">VGV Total do Empreendimento</span>
                      <span className="text-xl font-bold text-primary">
                        {formatCurrencyBR(vgvCalculations.vgvTotal)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {vgvCalculations.totalUnidades} unidades configuradas
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Seção: Fiscal e Cronograma */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Fiscal e Cronograma
            </CardTitle>
            <CardDescription>Regime tributário e projeções</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="regime_tributario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Regime Tributário *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover border">
                      {REGIME_TRIBUTARIO_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="my-4" />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="projecao_lancamento_meses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projeção de Lançamento (meses)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={36}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projecao_construcao_meses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projeção de Construção (meses)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={6}
                        max={60}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-4" />

            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Projeção de Vendas
                {!vendasValido && (
                  <Badge variant="destructive" className="text-xs">
                    Total: {vendasTotal}% (deve ser 100%)
                  </Badge>
                )}
              </h4>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="venda_lancamento_pct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No Lançamento (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="venda_obra_pct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durante a Obra (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="venda_entrega_pct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Na Entrega das Chaves (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isLoading || !vendasValido}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Salvando...' : 'Salvar Projeto'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
