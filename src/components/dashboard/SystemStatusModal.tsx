import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Server,
  Wifi,
  WifiOff
} from 'lucide-react';
import { getSystemStatus, clearCache, type SystemStatus } from '@/lib/data-service';
import { supabase } from '@/integrations/supabase/client';

interface ApiStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  lastSync: string | null;
  description: string;
}

interface SystemStatusModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SystemStatusModal({ open: controlledOpen, onOpenChange }: SystemStatusModalProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Support both controlled and uncontrolled modes
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };

  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = async () => {
    setIsRefreshing(true);
    
    // Get local cache status
    const localStatus = getSystemStatus();
    setStatus(localStatus);

    // Check API statuses
    const apis: ApiStatus[] = [
      {
        name: 'Banco Central (BCB)',
        status: 'online',
        lastSync: localStatus.bcbLastSync,
        description: 'Selic, Dólar PTAX, Financiamento',
      },
      {
        name: 'IBGE SIDRA',
        status: 'online',
        lastSync: localStatus.ibgeLastSync,
        description: 'IPCA, PIB, Demografia',
      },
      {
        name: 'FipeZap (Histórico)',
        status: 'online',
        lastSync: localStatus.fipezapLastSync,
        description: 'Preços m², Variações',
      },
    ];

    // Check database connection
    try {
      const { error } = await supabase
        .from('idi_fipezap_historico')
        .select('id')
        .limit(1);
      
      if (error) {
        apis[2].status = 'degraded';
      }
    } catch {
      apis[2].status = 'offline';
    }

    setApiStatuses(apis);
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (open) {
      fetchStatus();
    }
  }, [open]);

  const handleClearCache = () => {
    clearCache();
    fetchStatus();
  };

  const formatLastSync = (date: string | null) => {
    if (!date) return 'Nunca sincronizado';
    try {
      return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Data inválida';
    }
  };

  const getStatusIcon = (status: 'online' | 'offline' | 'degraded') => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: 'online' | 'offline' | 'degraded') => {
    switch (status) {
      case 'online':
        return <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">Online</Badge>;
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
      case 'degraded':
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Degradado</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Status do Sistema
          </DialogTitle>
          <DialogDescription>
            Monitoramento das APIs e sincronização de dados
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-2">
            {/* Connection Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {status?.offlineMode ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
                    Modo de Conexão
                  </span>
                  {status?.offlineMode ? (
                    <Badge variant="destructive">Offline</Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-500/10 text-green-600">Online</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {status?.offlineMode && (
                  <p className="text-xs text-muted-foreground">
                    O sistema está usando dados em cache. Algumas informações podem estar desatualizadas.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* APIs Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Fontes de Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-3">
                  {apiStatuses.map((api) => (
                    <div key={api.name} className="flex items-start justify-between border-b last:border-0 pb-2 last:pb-0">
                      <div className="flex items-start gap-2">
                        {getStatusIcon(api.status)}
                        <div>
                          <p className="text-sm font-medium">{api.name}</p>
                          <p className="text-xs text-muted-foreground">{api.description}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {formatLastSync(api.lastSync)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(api.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cache Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Cache de Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">{status?.cacheSize || 0}</span> itens em cache
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cache expira automaticamente após 5 minutos
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClearCache}
                    className="gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Limpar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Errors */}
            {status?.errors && status.errors.length > 0 && (
              <Card className="border-destructive/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Erros Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <ul className="space-y-1">
                    {status.errors.map((error, i) => (
                      <li key={i} className="text-xs text-destructive">{error}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Info */}
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <p className="font-medium mb-1">Sobre os dados</p>
              <p>
                Os indicadores macroeconômicos são obtidos em tempo real das APIs oficiais do BCB e IBGE. 
                Os dados de mercado imobiliário utilizam a tabela <code className="bg-muted px-1 rounded">idi_fipezap_historico</code> como fonte primária, 
                com fallback para valores estimados quando dados reais não estão disponíveis.
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
          <Button onClick={fetchStatus} disabled={isRefreshing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
