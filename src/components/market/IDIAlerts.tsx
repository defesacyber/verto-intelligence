import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, BellOff, Plus, Trash2, Target, AlertTriangle, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { useIDIAlerts } from '@/hooks/useIDIAlerts';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { TestEmailAlertButton } from './TestEmailAlertButton';

interface CityScore {
  cidade: string;
  uf: string;
  score_idi: number;
}

interface IDIAlertsProps {
  className?: string;
}

export function IDIAlerts({ className }: IDIAlertsProps) {
  const { user } = useAuth();
  const { alerts, isLoading, addAlert, toggleAlert, deleteAlert } = useIDIAlerts();
  const [cities, setCities] = useState<CityScore[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [alertType, setAlertType] = useState<'threshold' | 'increase' | 'decrease'>('threshold');
  const [threshold, setThreshold] = useState<string>('70');
  const [isLoadingCities, setIsLoadingCities] = useState(true);

  // Fetch available cities
  useEffect(() => {
    async function fetchCities() {
      setIsLoadingCities(true);
      const { data } = await supabase
        .from('idi_score_cache')
        .select('cidade, uf, score_idi')
        .order('score_idi', { ascending: false });

      if (data) {
        const uniqueCities: CityScore[] = [];
        const seen = new Set<string>();
        
        data.forEach(item => {
          const key = `${item.cidade}|${item.uf}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueCities.push({
              cidade: item.cidade,
              uf: item.uf,
              score_idi: item.score_idi || 0,
            });
          }
        });
        
        setCities(uniqueCities);
      }
      setIsLoadingCities(false);
    }

    fetchCities();
  }, []);

  const handleAddAlert = async () => {
    if (!selectedCity) return;

    const [cidade, uf] = selectedCity.split('|');
    
    await addAlert({
      cidade,
      uf,
      alert_type: alertType,
      threshold_value: parseFloat(threshold) || 70,
    });
    
    setSelectedCity('');
    setThreshold('70');
  };

  // Check for triggered alerts
  const triggeredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (!alert.enabled) return false;
      
      const city = cities.find(c => c.cidade === alert.cidade && c.uf === alert.uf);
      if (!city) return false;

      const score = city.score_idi;

      if (alert.alert_type === 'threshold') {
        return score >= alert.threshold_value;
      }
      // For increase/decrease, we'd need historical data
      // For now, just check threshold-based alerts
      return false;
    });
  }, [alerts, cities]);

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'threshold': return 'Acima de';
      case 'increase': return 'Subida';
      case 'decrease': return 'Queda';
      default: return type;
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'threshold': return <Target className="h-4 w-4 text-primary" />;
      case 'increase': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decrease': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Alertas IDI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Faça login para configurar alertas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Alertas IDI
        </CardTitle>
        <CardDescription>
          Receba notificações por email quando cidades atingirem thresholds de IDI
        </CardDescription>
        <TestEmailAlertButton className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Alert Form */}
        <div className="flex flex-wrap gap-2 p-4 rounded-lg bg-muted/50">
          <Select value={selectedCity} onValueChange={setSelectedCity} disabled={isLoadingCities}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={isLoadingCities ? "Carregando..." : "Selecione cidade"} />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {cities.map((city) => (
                <SelectItem key={`${city.cidade}|${city.uf}`} value={`${city.cidade}|${city.uf}`}>
                  {city.cidade} - {city.uf} ({city.score_idi.toFixed(0)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={alertType} onValueChange={(v) => setAlertType(v as 'threshold' | 'increase' | 'decrease')}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="threshold">Acima de</SelectItem>
              <SelectItem value="increase">Subida</SelectItem>
              <SelectItem value="decrease">Queda</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-20"
              min="0"
              max="100"
            />
            <span className="text-sm text-muted-foreground">pts</span>
          </div>

          <Button onClick={handleAddAlert} size="sm" disabled={!selectedCity}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>

        {/* Triggered Alerts */}
        {triggeredAlerts.length > 0 && (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold text-emerald-600">
                {triggeredAlerts.length} cidade(s) atingiram o threshold!
              </span>
            </div>
            <div className="space-y-2">
              {triggeredAlerts.map(alert => {
                const city = cities.find(c => c.cidade === alert.cidade && c.uf === alert.uf);
                return (
                  <div key={alert.id} className="flex items-center justify-between p-2 rounded bg-background">
                    <div className="flex items-center gap-2">
                      {getAlertTypeIcon(alert.alert_type)}
                      <span className="font-medium">{alert.cidade}/{alert.uf}</span>
                      <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-600">
                        IDI: {city?.score_idi.toFixed(1)}
                      </Badge>
                    </div>
                    <Badge variant="outline">
                      ≥ {alert.threshold_value}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Alert List */}
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum alerta configurado</p>
            <p className="text-sm mt-2">Configure alertas para monitorar scores IDI</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Alertas configurados ({alerts.length})
            </p>
            {alerts.map(alert => {
              const city = cities.find(c => c.cidade === alert.cidade && c.uf === alert.uf);
              const isTriggered = city && city.score_idi >= alert.threshold_value;
              
              return (
                <div 
                  key={alert.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    alert.enabled 
                      ? isTriggered 
                        ? 'bg-emerald-500/5 border-emerald-500/30' 
                        : 'bg-background' 
                      : 'bg-muted/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getAlertTypeIcon(alert.alert_type)}
                    <div>
                      <span className="font-medium">{alert.cidade}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">{alert.uf}</Badge>
                      {city && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (atual: {city.score_idi.toFixed(1)})
                        </span>
                      )}
                    </div>
                    <Badge variant="outline">
                      {getAlertTypeLabel(alert.alert_type)} {alert.threshold_value}
                    </Badge>
                    {isTriggered && alert.enabled && (
                      <Badge className="bg-emerald-500 text-white">Atingido!</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => toggleAlert(alert.id)}
                    >
                      {alert.enabled ? (
                        <Bell className="h-4 w-4 text-primary" />
                      ) : (
                        <BellOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}