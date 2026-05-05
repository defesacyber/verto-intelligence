// =============================================
// AUTENTICAÇÃO CUSTOMIZADA COM JWT
// Exemplo de uso no frontend React/TypeScript
// =============================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// URLs das Edge Functions
const AUTH_CUSTOM_URL = `${supabaseUrl}/functions/v1/auth-custom`;

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthResponse {
  result: {
    data: {
      user: User;
      token: string;
      expires_in: number;
    };
  };
}

interface VerifyResponse {
  result: {
    data: {
      user: User;
      valid: boolean;
    };
  };
}

// Classe para gerenciar autenticação customizada
export class CustomAuth {
  private token: string | null = null;

  constructor() {
    // Recuperar token do localStorage se existir
    this.token = localStorage.getItem('custom_auth_token');
  }

  // Login usando autenticação customizada
  async login(email: string, password: string): Promise<User> {
    try {
      const response = await fetch(`${AUTH_CUSTOM_URL}/login-custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data: AuthResponse = await response.json();
      const { user, token } = data.result.data;

      // Salvar token
      this.token = token;
      localStorage.setItem('custom_auth_token', token);

      console.log('Login successful:', user.email, '(role:', user.role + ')');
      return user;

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Verificar se o token é válido
  async verifyToken(): Promise<User | null> {
    if (!this.token) return null;

    try {
      const response = await fetch(`${AUTH_CUSTOM_URL}/verify-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Token inválido ou expirado
        this.logout();
        return null;
      }

      const data: VerifyResponse = await response.json();
      return data.result.data.user;

    } catch (error) {
      console.error('Token verification error:', error);
      this.logout();
      return null;
    }
  }

  // Refresh token
  async refreshToken(): Promise<string | null> {
    if (!this.token) return null;

    try {
      const response = await fetch(`${AUTH_CUSTOM_URL}/refresh-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        this.logout();
        return null;
      }

      const data = await response.json();
      const newToken = data.result.data.token;

      this.token = newToken;
      localStorage.setItem('custom_auth_token', newToken);

      return newToken;

    } catch (error) {
      console.error('Token refresh error:', error);
      this.logout();
      return null;
    }
  }

  // Logout
  logout(): void {
    this.token = null;
    localStorage.removeItem('custom_auth_token');
  }

  // Obter token atual
  getToken(): string | null {
    return this.token;
  }

  // Verificar se usuário está autenticado
  isAuthenticated(): boolean {
    return this.token !== null;
  }
}

// Hook React para usar autenticação customizada
export function useCustomAuth() {
  const [auth] = useState(() => new CustomAuth());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar token ao inicializar
    const checkAuth = async () => {
      const verifiedUser = await auth.verifyToken();
      setUser(verifiedUser);
      setLoading(false);
    };

    checkAuth();
  }, [auth]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userData = await auth.login(email, password);
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    auth.logout();
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: auth.isAuthenticated(),
    refreshToken: auth.refreshToken.bind(auth),
  };
}

// Exemplo de uso em componente
export function LoginComponent() {
  const { user, login, logout, loading } = useCustomAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      console.log('Login successful!');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (user) {
    return (
      <div>
        <p>Welcome, {user.name}!</p>
        <p>Email: {user.email}</p>
        <p>Role: {user.role}</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}