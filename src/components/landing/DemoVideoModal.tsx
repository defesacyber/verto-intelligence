import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Maximize2, SkipForward, SkipBack } from 'lucide-react';
import { useState } from 'react';

interface DemoVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const demoSteps = [
  {
    title: 'Dashboard Inteligente',
    description: 'Visualize todos os seus projetos e indicadores macroeconômicos em tempo real.',
    duration: '0:00 - 0:15',
  },
  {
    title: 'Análise de Viabilidade',
    description: 'Calcule VGV, ROI, TIR e Payback com precisão em múltiplos cenários.',
    duration: '0:15 - 0:35',
  },
  {
    title: 'Pesquisa de Mercado',
    description: 'Acesse dados do FipeZAP e IDI para análise comparativa de cidades.',
    duration: '0:35 - 0:55',
  },
  {
    title: 'Relatórios Automáticos',
    description: 'Gere relatórios profissionais em PDF com um clique.',
    duration: '0:55 - 1:10',
  },
];

export function DemoVideoModal({ open, onOpenChange }: DemoVideoModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleMute = () => setIsMuted(!isMuted);
  
  const handleNext = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold">
            Demonstração do Verto Intelligence
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 space-y-6">
          {/* Video Player Area */}
          <div className="relative aspect-video bg-gradient-to-br from-primary/20 via-primary/10 to-background rounded-lg overflow-hidden border border-border">
            {/* Animated Demo Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4 animate-fade-in">
                <div className="h-20 w-20 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center">
                  <img src="/logo-verto.png" alt="Verto Intelligence" className="h-12 w-auto" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{demoSteps[currentStep].title}</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {demoSteps[currentStep].description}
                  </p>
                  <span className="inline-block text-xs text-primary font-medium bg-primary/10 px-3 py-1 rounded-full">
                    {demoSteps[currentStep].duration}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Animated Background Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-10 left-10 h-32 w-32 bg-primary/5 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-10 right-10 h-40 w-40 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>

            {/* Play Button Overlay */}
            {!isPlaying && (
              <button
                onClick={handlePlayPause}
                className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm transition-opacity hover:opacity-90"
              >
                <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                  <Play className="h-8 w-8 text-primary-foreground ml-1" />
                </div>
              </button>
            )}
          </div>
          
          {/* Video Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                disabled={currentStep === 0}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePlayPause}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                disabled={currentStep === demoSteps.length - 1}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMute}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Progress Dots */}
            <div className="flex items-center gap-2">
              {demoSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep 
                      ? 'w-6 bg-primary' 
                      : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>
            
            <Button variant="ghost" size="icon">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {demoSteps.map((step, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`p-3 rounded-lg text-left transition-all ${
                  index === currentStep 
                    ? 'bg-primary/10 border border-primary/30' 
                    : 'bg-muted/50 hover:bg-muted border border-transparent'
                }`}
              >
                <span className={`text-xs font-medium ${index === currentStep ? 'text-primary' : 'text-muted-foreground'}`}>
                  {step.duration}
                </span>
                <p className={`text-sm font-medium mt-1 ${index === currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.title}
                </p>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
