import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TestEmailAlertButtonProps {
  className?: string;
}

export function TestEmailAlertButton({ className }: TestEmailAlertButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const handleTestEmail = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('idi-alert-email');

      if (error) {
        console.error('Error invoking edge function:', error);
        setResult({ success: false, message: error.message });
        toast({
          title: 'Erro ao processar alertas',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      console.log('Alert processing result:', data);
      
      const message = data.emails_sent > 0 
        ? `${data.emails_sent} email(s) enviado(s) para ${data.triggered} alerta(s) acionado(s)`
        : data.triggered > 0 
          ? `${data.triggered} alerta(s) acionado(s), mas nenhum email enviado`
          : 'Nenhum alerta acionado no momento';

      setResult({ 
        success: true, 
        message 
      });
      
      toast({
        title: 'Alertas processados',
        description: message,
      });
    } catch (error) {
      console.error('Error testing email alerts:', error);
      setResult({ success: false, message: error.message || 'Erro desconhecido' });
      toast({
        title: 'Erro',
        description: 'Falha ao processar alertas de email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      <Button 
        onClick={handleTestEmail} 
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        Testar Envio de Emails
      </Button>
      
      {result && (
        <div className={`mt-2 flex items-center gap-2 text-sm ${result.success ? 'text-success' : 'text-destructive'}`}>
          {result.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <span>{result.message}</span>
        </div>
      )}
    </div>
  );
}
