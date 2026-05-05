import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

// Database user type
interface DbUser {
  id: string;
  email: string;
  name: string | null;
  login_method: string;
  role: string;
  lifetime_access: boolean;
  created_at: string;
  updated_at: string;
  last_signed_in: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

// Transform database user + Supabase user to app User type
function transformUser(supabaseUser: SupabaseUser, dbUser?: DbUser | null): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: dbUser?.name || supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
    avatarUrl: undefined,
    loginMethod: dbUser?.login_method || supabaseUser.app_metadata?.provider || 'email',
    role: (dbUser?.role as 'user' | 'admin') || 'user',
    lifetimeAccess: dbUser?.lifetime_access || false,
    createdAt: supabaseUser.created_at || new Date().toISOString(),
    updatedAt: dbUser?.updated_at || new Date().toISOString(),
    lastSignedIn: supabaseUser.last_sign_in_at,
  };
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch user from database
  const fetchDbUser = useCallback(async (userId: string): Promise<DbUser | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user from database:', error);
        return null;
      }

      return data as DbUser | null;
    } catch (error) {
      console.error('Error in fetchDbUser:', error);
      return null;
    }
  }, []);

  // Update last sign in timestamp
  const updateLastSignIn = useCallback(async (userId: string) => {
    try {
      await supabase
        .from('users')
        .update({ last_signed_in: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating last sign in:', error);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        setSession(session);

        if (session?.user) {
          const dbUser = await fetchDbUser(session.user.id);
          const user = transformUser(session.user, dbUser);

          if (mounted) {
            setState({
              user,
              isLoading: false,
              isAuthenticated: true,
            });
          }
        } else {
          if (mounted) {
            setState({
              user: null,
              isLoading: false,
              isAuthenticated: false,
            });
          }
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;

      setSession(session);

      if (session?.user) {
        const dbUser = await fetchDbUser(session.user.id);
        const user = transformUser(session.user, dbUser);

        if (mounted) {
          setState({
            user,
            isLoading: false,
            isAuthenticated: true,
          });
        }
      } else {
        if (mounted) {
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchDbUser]);

  const login = useCallback(async (input: LoginInput) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) throw error;

      // Fetch user from database
      const dbUser = await fetchDbUser(data.user.id);

      // Update last sign in
      await updateLastSignIn(data.user.id);

      const user = transformUser(data.user, dbUser);

      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });

      toast({
        title: 'Login realizado!',
        description: `Bem-vindo, ${user?.name || user?.email}!`,
      });

      // Navigate after state is set
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);

      return { success: true };
    } catch (error: unknown) {
      setState(prev => ({ ...prev, isLoading: false }));

      let errorMessage = 'Credenciais inválidas';
      const err = error as { message?: string };
      if (err.message?.includes('Invalid login credentials')) {
        errorMessage = 'E-mail ou senha incorretos';
      } else if (err.message?.includes('Email not confirmed')) {
        errorMessage = 'Por favor, confirme seu e-mail antes de fazer login';
      }

      toast({
        title: 'Erro no login',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    }
  }, [navigate, toast, fetchDbUser, updateLastSignIn]);

  const register = useCallback(async (input: RegisterInput) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: input.name,
          },
        },
      });

      if (error) throw error;

      // Check if user needs email confirmation
      if (data.user && !data.session) {
        setState(prev => ({ ...prev, isLoading: false }));
        toast({
          title: 'Conta criada!',
          description: 'Verifique seu e-mail para confirmar a conta.',
        });
        return { success: true, needsConfirmation: true };
      }

      if (data.user && data.session) {
        const dbUser = await fetchDbUser(data.user.id);
        const user = transformUser(data.user, dbUser);

        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });

        toast({
          title: 'Conta criada!',
          description: 'Sua conta foi criada com sucesso.',
        });

        navigate('/dashboard');
      }

      return { success: true };
    } catch (error: unknown) {
      setState(prev => ({ ...prev, isLoading: false }));

      let errorMessage = 'Não foi possível criar a conta';
      const err = error as { message?: string };
      
      console.error('Registration error:', err);

      if (err.message?.includes('User already registered')) {
        errorMessage = 'Este e-mail já está cadastrado';
      } else if (err.message?.match(/Password should be.*characters/i)) {
        const min = err.message.match(/Password should be (\d+)/i)?.[1] || '8';
        errorMessage = `A senha deve ter pelo menos ${min} caracteres`;
      } else if (err.message?.match(/Password must contain/i)) {
        errorMessage = 'A senha deve conter letra maiúscula, minúscula e número';
      } else if (err.message?.match(/password.*compromised|leaked/i)) {
        errorMessage = 'Senha insegura (encontrada em vazamentos). Escolha outra senha.';
      } else if (err.message?.match(/Signups not allowed/i)) {
        errorMessage = 'Cadastro desabilitado. Verifique as configurações de autenticação.';
      } else if (err.message?.match(/Invalid email/i)) {
        errorMessage = 'Email inválido. Verifique o endereço informado.';
      } else if (err.message?.includes('Failed to fetch') || err.message?.includes('Load failed')) {
        errorMessage = 'Erro de conexão. Verifique sua internet ou as variáveis de ambiente.';
      } else if (err.message) {
        // Show the actual error message for debugging
        errorMessage = `Erro: ${err.message}`;
      }

      toast({
        title: 'Erro no cadastro',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    }
  }, [navigate, toast, fetchDbUser]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      navigate('/login');
      toast({
        title: 'Logout realizado',
        description: 'Você foi desconectado.',
      });
    }
  }, [navigate, toast]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      if (!state.user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('users')
        .update({
          name: data.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.user.id);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...data } : null,
      }));

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas.',
      });

      return { success: true };
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: 'Erro ao atualizar',
        description: err.message || 'Não foi possível atualizar o perfil',
        variant: 'destructive',
      });
      return { success: false, error: err.message };
    }
  }, [toast, state.user?.id]);

  return {
    ...state,
    session,
    login,
    register,
    logout,
    updateProfile,
  };
}
