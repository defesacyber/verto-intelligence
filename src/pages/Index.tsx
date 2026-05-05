import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  BarChart3, 
  Shield, 
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Star,
  FileText,
  Play,
  Compass
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import { DemoVideoModal } from '@/components/landing/DemoVideoModal';
import { GuidedTour } from '@/components/landing/GuidedTour';

const features = [
  {
    icon: TrendingUp,
    title: 'Análise de Viabilidade',
    description: 'Calcule VGV, ROI, TIR e Payback com precisão em múltiplos cenários',
  },
  {
    icon: BarChart3,
    title: 'Relatórios Inteligentes',
    description: 'Relatórios automáticos semanais, mensais e trimestrais',
  },
  {
    icon: Shield,
    title: 'Análise de Riscos',
    description: 'Identificação automática de riscos e oportunidades do mercado',
  },
  {
    icon: FileText,
    title: 'Pesquisa Qualitativa',
    description: 'Análise de infraestrutura, concorrência e tendências com IA',
  },
];

const stats = [
  { value: '500+', label: 'Projetos Analisados' },
  { value: 'R$ 2.5B', label: 'VGV Avaliado' },
  { value: '98%', label: 'Precisão' },
  { value: '150+', label: 'Empresas' },
];

export default function Index() {
  const [showVideoDemo, setShowVideoDemo] = useState(false);
  const [showTour, setShowTour] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Modals */}
      <DemoVideoModal open={showVideoDemo} onOpenChange={setShowVideoDemo} />
      <GuidedTour open={showTour} onClose={() => setShowTour(false)} />
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-verto.png" alt="Verto Intelligence" className="h-10 w-auto" />
            <span className="font-bold text-xl">Verto Intelligence</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Funcionalidades
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Planos
            </a>
            <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sobre
            </a>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="hero">
                Começar Agora
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 animate-fade-in">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm">
              <Star className="h-3.5 w-3.5 mr-1.5 text-warning" />
              Plataforma #1 em Viabilidade Imobiliária
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Análise de Viabilidade
              <span className="block text-gradient">Imobiliária Inteligente</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Tome decisões estratégicas com análises precisas de VGV, ROI, TIR e cenários de mercado. 
              Potencialize seus empreendimentos com inteligência artificial.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/dashboard">
                <Button variant="hero" size="xl" className="gap-2">
                  Iniciar Análise Gratuita
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-2"
                onClick={() => setShowVideoDemo(true)}
              >
                <Play className="h-4 w-4" />
                Ver Demonstração
              </Button>
              <Button 
                variant="ghost" 
                size="lg" 
                className="gap-2"
                onClick={() => setShowTour(true)}
              >
                <Compass className="h-4 w-4" />
                Tour Guiado
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
            {stats.map((stat) => (
              <div 
                key={stat.label} 
                className="text-center p-6 rounded-2xl bg-card border border-border animate-slide-up"
                style={{ animationDelay: '0.1s' }}
              >
                <p className="text-3xl md:text-4xl font-bold text-gradient">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa para
              <span className="text-gradient"> decisões estratégicas</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ferramentas profissionais para análise completa de viabilidade econômica de empreendimentos imobiliários
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="px-4 py-1.5 text-sm">
                Sobre Nós
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                Transformando dados em 
                <span className="text-gradient block">Resultados Reais</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                A Verto Intelligence nasceu com a missão de democratizar o acesso a ferramentas sofisticadas de análise imobiliária. 
                Combinamos tecnologia de ponta com deep learning para oferecer insights que antes eram acessíveis apenas a grandes corporações.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Tecnologia Avançada</h3>
                    <p className="text-sm text-muted-foreground">Algoritmos proprietários de IA para análise preditiva de mercado.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Foco no Usuário</h3>
                    <p className="text-sm text-muted-foreground">Interface intuitiva projetada para agilizar seu fluxo de trabalho.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-2xl blur-3xl -z-10" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4 mt-8">
                  <div className="bg-card p-4 rounded-xl shadow-lg border border-border">
                    <TrendingUp className="h-8 w-8 text-primary mb-2" />
                    <p className="font-bold">Alta Precisão</p>
                    <p className="text-xs text-muted-foreground">Dados validados e atualizados</p>
                  </div>
                  <div className="bg-card p-4 rounded-xl shadow-lg border border-border">
                    <Shield className="h-8 w-8 text-primary mb-2" />
                    <p className="font-bold">Segurança</p>
                    <p className="text-xs text-muted-foreground">Proteção de dados enterprise</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-card p-4 rounded-xl shadow-lg border border-border">
                    <BarChart3 className="h-8 w-8 text-primary mb-2" />
                    <p className="font-bold">Analytics</p>
                    <p className="text-xs text-muted-foreground">Visualização clara de métricas</p>
                  </div>
                  <div className="bg-card p-4 rounded-xl shadow-lg border border-border">
                    <FileText className="h-8 w-8 text-primary mb-2" />
                    <p className="font-bold">Relatórios</p>
                    <p className="text-xs text-muted-foreground">Exportação em PDF e Excel</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Planos que se adaptam ao seu
              <span className="text-gradient"> crescimento</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Escolha o plano ideal para suas necessidades e escale conforme sua operação cresce
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
              <Card 
                key={plan.id}
                className={`relative overflow-hidden ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg">
                    Popular
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.priceFormatted}</span>
                    <span className="text-muted-foreground">/{plan.interval}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant={plan.popular ? 'hero' : 'outline'} 
                    className="w-full mt-6"
                  >
                    Começar Agora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-hero">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Pronto para transformar suas análises?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Junte-se a mais de 150 empresas que já otimizaram suas decisões de investimento imobiliário
          </p>
          <Link to="/dashboard">
            <Button 
              size="xl" 
              className="bg-background text-foreground hover:bg-background/90 shadow-lg"
            >
              Começar Agora - Grátis
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo-verto.png" alt="Verto Intelligence" className="h-8 w-auto" />
              <span className="font-semibold">Verto Intelligence</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Verto Intelligence. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
