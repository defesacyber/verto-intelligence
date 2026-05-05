import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Mail, MailX, Clock } from 'lucide-react';
import { useAlertHistory } from '@/hooks/useAlertHistory';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AlertHistoryCardProps {
  className?: string;
}

export function AlertHistoryCard({ className }: AlertHistoryCardProps) {
  const { history, isLoading } = useAlertHistory();

  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR,
    });
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      threshold: 'Limite atingido',
      increase: 'Alta detectada',
      decrease: 'Queda detectada',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-secondary" />
            Histórico de Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-secondary" />
          Histórico de Alertas
        </CardTitle>
        <CardDescription>Últimos 50 alertas disparados</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>Nenhum alerta disparado ainda</p>
            <p className="text-sm">Configure alertas de IDI para receber notificações</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {history.map(item => (
                <div
                  key={item.id}
                  className={cn(
                    "p-3 rounded-lg border",
                    "bg-card hover:bg-accent/50 transition-colors"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">
                          {item.cidade} - {item.uf}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {getAlertTypeLabel(item.alert_type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(item.sent_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          {item.email_sent ? (
                            <>
                              <Mail className="h-3 w-3 text-success" />
                              Email enviado
                            </>
                          ) : (
                            <>
                              <MailX className="h-3 w-3 text-muted-foreground" />
                              Sem email
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-semibold text-primary">
                        {(item.triggered_value ?? 0).toFixed(1)}
                      </div>
                      {item.threshold_value && (
                        <div className="text-xs text-muted-foreground">
                          Limite: {item.threshold_value}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
