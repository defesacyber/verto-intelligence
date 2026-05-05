import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  LayoutDashboard, 
  Calculator, 
  Map, 
  FileText,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GuidedTourProps {
  open: boolean;
  onClose: () => void;
}

const tourSteps = [
  {
    icon: LayoutDashboard,
    title: 'Bem-vindo ao Verto Intelligence',
    description: 'Sua plataforma completa de análise de viabilidade imobiliária. Vamos fazer um tour pelos principais recursos.',
    image: '📊',
    route: null,
  },
  {
    icon: TrendingUp,
    title: 'Dashboard Inteligente',
    description: 'Visualize indicadores macroeconômicos, projetos ativos e métricas de mercado em tempo real. Tudo centralizado para decisões rápidas.',
    image: '📈',
    route: '/dashboard',
  },
  {
    icon: Calculator,
    title: 'Análise de Viabilidade',
    description: 'Calcule VGV, ROI, TIR, VPL e Payback com precisão. Compare cenários otimista, realista e pessimista.',
    image: '🧮',
    route: '/viability',
  },
  {
    icon: Map,
    title: 'Pesquisa de Mercado',
    description: 'Acesse dados do FipeZAP, IDI e rankings de cidades. Compare preços por m² e tendências de valorização.',
    image: '🗺️',
    route: '/market-research',
  },
  {
    icon: FileText,
    title: 'Relatórios Profissionais',
    description: 'Gere relatórios completos em PDF com análises, gráficos e recomendações. Perfeitos para apresentações.',
    image: '📑',
    route: '/reports',
  },
  {
    icon: CheckCircle2,
    title: 'Pronto para Começar!',
    description: 'Você está pronto para transformar suas análises imobiliárias. Clique em "Ir para Dashboard" para começar.',
    image: '🚀',
    route: '/dashboard',
  },
];

export function GuidedTour({ open, onClose }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  if (!open) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      navigate('/dashboard');
      onClose();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleGoToRoute = () => {
    if (step.route) {
      navigate(step.route);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleSkip}
      />
      
      {/* Tour Card */}
      <Card className="relative z-10 w-full max-w-lg mx-4 shadow-2xl border-primary/20 animate-scale-in">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        
        <CardContent className="p-8">
          {/* Progress Bar */}
          <div className="flex gap-1.5 mb-8">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          
          {/* Icon & Emoji */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-5xl">{step.image}</span>
              </div>
              <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                <step.icon className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="text-center space-y-3 mb-8">
            <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
              Passo {currentStep + 1} de {tourSteps.length}
            </span>
            <h3 className="text-2xl font-bold">{step.title}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={isFirstStep}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            
            <div className="flex items-center gap-2">
              {step.route && !isLastStep && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGoToRoute}
                >
                  Ir para página
                </Button>
              )}
              <Button
                variant="hero"
                onClick={handleNext}
                className="gap-1"
              >
                {isLastStep ? 'Ir para Dashboard' : 'Próximo'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Skip Link */}
          <div className="text-center mt-4">
            <button
              onClick={handleSkip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Pular tour
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
