import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, BellOff, Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle, Loader2 } from 'lucide-react';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';
import { useAuth } from '@/hooks/useAuth';

interface CityData {
  city: string;
  uf: string;
  avg_price_m2: number;
  price_variation_12m: number;
}

interface PriceAlertsProps {
  cities: CityData[];
}

export function PriceAlerts({ cities }: PriceAlertsProps) {
  const { user } = useAuth();
  const { alerts, isLoading, addAlert, toggleAlert, deleteAlert } = usePriceAlerts();
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [alertType, setAlertType] = useState<'increase' | 'decrease' | 'any'>('any');
  const [threshold, setThreshold] = useState<string>('5');

  const handleAddAlert = async () => {
    if (!selectedCity) return;

    const [city, uf] = selectedCity.split('-');
    const existingAlert = alerts.find(a => a.city === city && a.uf === uf && a.alert_type === alertType);
    if (existingAlert) return;

    await addAlert({
      city,
      uf,
      alert_type: alertType,
      threshold: parseFloat(threshold) || 5,
    });
    
    setSelectedCity('');
    setThreshold('5');
  };

  // Check for triggered alerts
  const triggeredAlerts = alerts.filter(alert => {
    const city = cities.find(c => c.city === alert.city && c.uf === alert.uf);
    if (!city || !alert.enabled) return false;

    const variation = city.price_variation_12m;
    const absVariation = Math.abs(variation);

    if (alert.alert_type === 'increase' && variation > 0 && absVariation >= alert.threshold) return true;
    if (alert.alert_type === 'decrease' && variation < 0 && absVariation >= alert.threshold) return true;
    if (alert.alert_type === 'any' && absVariation >= alert.threshold) return true;

    return false;
  });

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'increase': return 'Alta';
      case 'decrease': return 'Queda';
      default: return 'Qualquer';
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'increase': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decrease': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Alertas de Preço
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Alertas de Preço
        </CardTitle>
        <CardDescription>
          Configure alertas para variações significativas de preço (persistidos no banco)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Alert Form */}
        <div className="flex flex-wrap gap-2 p-4 rounded-lg bg-muted/50">
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione cidade" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {cities.map((city) => (
                <SelectItem key={`${city.city}-${city.uf}`} value={`${city.city}-${city.uf}`}>
                  {city.city} - {city.uf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={alertType} onValueChange={(v) => setAlertType(v as 'increase' | 'decrease' | 'any')}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Qualquer</SelectItem>
              <SelectItem value="increase">Alta</SelectItem>
              <SelectItem value="decrease">Queda</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-20"
              min="1"
              max="100"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>

          <Button onClick={handleAddAlert} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>

        {/* Triggered Alerts */}
        {triggeredAlerts.length > 0 && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="font-semibold text-destructive">
                {triggeredAlerts.length} alerta(s) ativo(s)
              </span>
            </div>
            <div className="space-y-2">
              {triggeredAlerts.map(alert => {
                const city = cities.find(c => c.city === alert.city && c.uf === alert.uf);
                return (
                  <div key={alert.id} className="flex items-center justify-between p-2 rounded bg-background">
                    <div className="flex items-center gap-2">
                      {getAlertTypeIcon(alert.alert_type)}
                      <span className="font-medium">{alert.city}/{alert.uf}</span>
                      <Badge variant="destructive">
                        {city?.price_variation_12m && city.price_variation_12m > 0 ? '+' : ''}
                        {city?.price_variation_12m.toFixed(1)}%
                      </Badge>
                    </div>
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
            <p className="text-sm mt-2">Configure alertas para monitorar variações de preço</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Alertas configurados ({alerts.length})
            </p>
            {alerts.map(alert => (
              <div 
                key={alert.id} 
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  alert.enabled ? 'bg-background' : 'bg-muted/50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getAlertTypeIcon(alert.alert_type)}
                  <div>
                    <span className="font-medium">{alert.city}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">{alert.uf}</Badge>
                  </div>
                  <Badge variant="outline">
                    {getAlertTypeLabel(alert.alert_type)} ≥ {alert.threshold}%
                  </Badge>
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
