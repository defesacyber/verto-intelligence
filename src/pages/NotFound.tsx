import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center animate-fade-in">
      <div className="mb-8 relative">
        <div className="text-[120px] font-black text-muted/30 absolute -top-20 left-1/2 -translate-x-1/2 select-none">
          404
        </div>
        <img src="/logo-verto.png" alt="Verto Intelligence" className="h-32 w-auto mx-auto relative z-10" />
      </div>
      
      <h1 className="text-3xl font-bold mb-3">Página não encontrada</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Desculpe, a página que você está procurando não existe ou foi movida para um novo endereço.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" asChild>
          <Link to="..">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <Button asChild variant="hero">
          <Link to="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Ir para o Dashboard
          </Link>
        </Button>
      </div>
      
      <div className="mt-16 text-sm text-muted-foreground">
        © {new Date().getFullYear()} Verto Intelligence Imobiliária
      </div>
    </div>
  );
};

export default NotFound;
