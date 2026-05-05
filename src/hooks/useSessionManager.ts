import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const SESSION_TOKEN_KEY = 'verto_session_token';

// Generate a unique session token
function generateSessionToken(): string {
  return crypto.randomUUID() + '-' + Date.now();
}

// Get device info for session tracking
function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[0] || 'Unknown Browser';
  const os = ua.match(/(Windows|Mac|Linux|Android|iOS)/)?.[0] || 'Unknown OS';
  return `${browser} on ${os}`;
}

export function useSessionManager(userId: string | undefined, isAuthenticated: boolean) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const sessionTokenRef = useRef<string | null>(null);
  const validationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Create or update session on login
  const createSession = useCallback(async (newUserId: string) => {
    try {
      const sessionToken = generateSessionToken();
      const deviceInfo = getDeviceInfo();

      // First, delete all other sessions for this user (force single session)
      await supabase.rpc('invalidate_other_sessions', {
        p_user_id: newUserId,
        p_current_token: sessionToken,
      });

      // Insert the new session
      const { error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: newUserId,
          session_token: sessionToken,
          device_info: deviceInfo,
        });

      if (error) {
        console.error('Error creating session:', error);
        return null;
      }

      // Store token in localStorage
      localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
      sessionTokenRef.current = sessionToken;

      return sessionToken;
    } catch (error) {
      console.error('Error in createSession:', error);
      return null;
    }
  }, []);

  // Validate current session is still active
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (!userId || !sessionTokenRef.current) return false;

    try {
      const { data, error } = await supabase.rpc('is_session_valid', {
        p_user_id: userId,
        p_session_token: sessionTokenRef.current,
      });

      if (error) {
        console.error('Error validating session:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error in validateSession:', error);
      return false;
    }
  }, [userId]);

  // Handle session invalidation (kicked out)
  const handleSessionInvalidated = useCallback(async () => {
    // Clear local storage
    localStorage.removeItem(SESSION_TOKEN_KEY);
    sessionTokenRef.current = null;

    // Sign out
    await supabase.auth.signOut();

    toast({
      title: 'Sessão encerrada',
      description: 'Você foi desconectado porque iniciou sessão em outro dispositivo.',
      variant: 'destructive',
    });

    navigate('/login');
  }, [toast, navigate]);

  // Delete session on logout
  const deleteSession = useCallback(async () => {
    const token = sessionTokenRef.current || localStorage.getItem(SESSION_TOKEN_KEY);
    
    if (token && userId) {
      try {
        await supabase
          .from('user_sessions')
          .delete()
          .eq('user_id', userId)
          .eq('session_token', token);
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }

    localStorage.removeItem(SESSION_TOKEN_KEY);
    sessionTokenRef.current = null;
  }, [userId]);

  // Update last activity
  const updateActivity = useCallback(async () => {
    const token = sessionTokenRef.current;
    if (!token || !userId) return;

    try {
      await supabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('session_token', token);
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  }, [userId]);

  // Initialize session token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (storedToken) {
      sessionTokenRef.current = storedToken;
    }
  }, []);

  // Periodically validate session (every 30 seconds)
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
        validationIntervalRef.current = null;
      }
      return;
    }

    // Initial validation after a short delay
    const initialCheck = setTimeout(async () => {
      const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
      if (storedToken) {
        sessionTokenRef.current = storedToken;
        const isValid = await validateSession();
        if (!isValid) {
          handleSessionInvalidated();
        }
      }
    }, 1000);

    // Set up interval for periodic validation
    validationIntervalRef.current = setInterval(async () => {
      const isValid = await validateSession();
      if (!isValid && sessionTokenRef.current) {
        handleSessionInvalidated();
      }
    }, 30000); // Check every 30 seconds

    return () => {
      clearTimeout(initialCheck);
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
      }
    };
  }, [isAuthenticated, userId, validateSession, handleSessionInvalidated]);

  // Update activity on user interactions
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleActivity = () => {
      updateActivity();
    };

    // Throttle activity updates
    let lastUpdate = 0;
    const throttledHandler = () => {
      const now = Date.now();
      if (now - lastUpdate > 60000) { // Update at most once per minute
        lastUpdate = now;
        handleActivity();
      }
    };

    window.addEventListener('click', throttledHandler);
    window.addEventListener('keypress', throttledHandler);

    return () => {
      window.removeEventListener('click', throttledHandler);
      window.removeEventListener('keypress', throttledHandler);
    };
  }, [isAuthenticated, updateActivity]);

  return {
    createSession,
    deleteSession,
    validateSession,
    getSessionToken: () => sessionTokenRef.current,
  };
}
