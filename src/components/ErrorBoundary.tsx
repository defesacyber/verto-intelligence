import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
          <div className="bg-destructive/10 p-6 rounded-full mb-6">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Ops! Algo deu errado.</h1>
          <p className="text-muted-foreground max-w-md mb-8">
            Ocorreu um erro inesperado na aplicação. Nossa equipe técnica já foi notificada (simulação).
          </p>
          <div className="flex gap-4">
            <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Tentar Novamente
            </Button>
            <Button onClick={this.handleReset}>
              Voltar ao Início
            </Button>
          </div>
          {process.env.NODE_ENV === "development" && (
            <pre className="mt-8 p-4 bg-muted rounded text-left text-xs overflow-auto max-w-full">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
