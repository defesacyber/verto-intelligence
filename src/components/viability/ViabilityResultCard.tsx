import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/constants';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ViabilityResult, getRecommendationLabel } from '@/lib/viability-calculator';

interface ViabilityResultCardProps {
  result: ViabilityResult;
}

export function ViabilityResultCard({ result }: ViabilityResultCardProps) {
  const { projected, recommendation, score, highlights, risks } = result;
  
  return (
    <div className="space-y-6">
      {/* Score and Recommendation */}
      <Card className="overflow-hidden">
        <div 
          className={cn(
            "h-2",
            recommendation === 'approved' && "bg-gradient-success",
            recommendation === 'conditional' && "bg-warning",
            recommendation === 'rejected' && "bg-destructive"
          )}
        />
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Recomendação</p>
              <div className="flex items-center gap-3">
                {recommendation === 'approved' && <CheckCircle2 className="h-8 w-8 text-success" />}
                {recommendation === 'conditional' && <AlertTriangle className="h-8 w-8 text-warning" />}
                {recommendation === 'rejected' && <XCircle className="h-8 w-8 text-destructive" />}
                <span className="text-2xl font-bold">{getRecommendationLabel(recommendation)}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Score de Viabilidade</p>
              <p className={cn(
                "text-4xl font-bold",
                score >= 70 ? "text-success" : score >= 45 ? "text-warning" : "text-destructive"
              )}>
                {score}
                <span className="text-lg text-muted-foreground">/100</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">VGV</p>
          <p className="text-xl font-bold">{formatCurrency(projected.vgv)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Lucro Estimado</p>
          <p className={cn("text-xl font-bold", projected.profit >= 0 ? "text-success" : "text-destructive")}>
            {formatCurrency(projected.profit)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">ROI</p>
          <p className={cn(
            "text-xl font-bold flex items-center gap-1",
            projected.roi >= 25 ? "text-success" : projected.roi >= 15 ? "text-warning" : "text-destructive"
          )}>
            {projected.roi >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {projected.roi.toFixed(1)}%
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">TIR</p>
          <p className={cn(
            "text-xl font-bold",
            projected.tir >= 18 ? "text-success" : projected.tir >= 12 ? "text-warning" : "text-destructive"
          )}>
            {projected.tir.toFixed(1)}% a.a.
          </p>
        </Card>
      </div>
      
      {/* Highlights and Risks */}
      <div className="grid md:grid-cols-2 gap-6">
        {highlights.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Pontos Fortes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        
        {risks.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Riscos Identificados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {risks.map((risk, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
