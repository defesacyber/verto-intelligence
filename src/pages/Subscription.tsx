import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Crown, CreditCard, Calendar, Zap, Loader2 } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardProjects } from '@/hooks/useDashboardProjects';
import { toast } from 'sonner';

export default function Subscription() {
  const { user } = useAuth();
  const { data: projects } = useDashboardProjects();
  const [currentPlan] = useState('premium');
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  const projectsCount = projects?.length || 0;
  const memberSince = user?.id ? new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'N/A';

  // Get next billing date (15th of next month)
  const getNextBillingDate = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);
    return nextMonth.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleChangePlan = async (_planId: string) => {
    setIsChangingPlan(true);
    // Simulate plan change
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.info('Para alterar seu plano, entre em contato com o suporte.');
    setIsChangingPlan(false);
  };

  const getCurrentPlanDetails = () => {
    return Object.values(SUBSCRIPTION_PLANS).find(p => p.id === currentPlan) || SUBSCRIPTION_PLANS.PREMIUM;
  };

  const planDetails = getCurrentPlanDetails();

  // Generate payment history based on current date
  const paymentHistory = [
    { 
      date: new Date(new Date().setMonth(new Date().getMonth())).toLocaleDateString('pt-BR'), 
      amount: planDetails.priceFormatted, 
      status: 'paid', 
      method: 'Pix' 
    },
    { 
      date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleDateString('pt-BR'), 
      amount: planDetails.priceFormatted, 
      status: 'paid', 
      method: 'Cartão' 
    },
    { 
      date: new Date(new Date().setMonth(new Date().getMonth() - 2)).toLocaleDateString('pt-BR'), 
      amount: planDetails.priceFormatted, 
      status: 'paid', 
      method: 'Pix' 
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assinatura</h1>
          <p className="text-muted-foreground">Gerencie seu plano e pagamentos</p>
        </div>
        
        {/* Current Plan */}
        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-primary" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Plano {planDetails.name}
                    <Badge variant="success">Ativo</Badge>
                  </CardTitle>
                  <CardDescription>Acesso completo a todas as funcionalidades</CardDescription>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{planDetails.priceFormatted}</p>
                <p className="text-sm text-muted-foreground">/{planDetails.interval}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Próxima cobrança</p>
                  <p className="font-medium">{getNextBillingDate()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Membro desde</p>
                  <p className="font-medium capitalize">{memberSince}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Zap className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Projetos ativos</p>
                  <p className="font-medium">{projectsCount} projeto{projectsCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Available Plans */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Alterar Plano</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {Object.values(SUBSCRIPTION_PLANS).map((plan) => {
              const isCurrentPlan = plan.id === currentPlan;
              
              return (
                <Card 
                  key={plan.id}
                  className={cn(
                    "relative overflow-hidden transition-all duration-300",
                    isCurrentPlan && "border-primary shadow-md",
                    plan.popular && !isCurrentPlan && "border-accent"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg">
                      Popular
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary" />
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">{plan.priceFormatted}</span>
                      <span className="text-muted-foreground text-sm">/{plan.interval}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      variant={isCurrentPlan ? 'secondary' : plan.popular ? 'hero' : 'outline'} 
                      className="w-full mt-4"
                      disabled={isCurrentPlan || isChangingPlan}
                      onClick={() => handleChangePlan(plan.id)}
                    >
                      {isChangingPlan ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isCurrentPlan ? (
                        'Plano Atual'
                      ) : (
                        'Alterar para este plano'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
        
        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Pagamentos</CardTitle>
            <CardDescription>Suas últimas transações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentHistory.map((payment, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">{payment.amount}</p>
                      <p className="text-sm text-muted-foreground">Plano {planDetails.name} - {payment.method}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="success">Pago</Badge>
                    <p className="text-sm text-muted-foreground mt-1">{payment.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
