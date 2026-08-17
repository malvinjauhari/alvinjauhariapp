import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';
import { MinimalLoader } from '../../../components/ui/MinimalLoader';

export const LoginPage = () => {
  const { user, loading, loginWithGoogle } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (loading) return <MinimalLoader />;
  if (user) return <Navigate to="/dashboard" />;

  const handleLogin = async () => {
    try {
      setErrorMsg(null);
      await loginWithGoogle();
    } catch (error: any) {
      if (error?.code === 'auth/unauthorized-domain') {
        setErrorMsg('Domain not authorized. Please add this preview URL to your Firebase Console under Authentication -> Settings -> Authorized domains.');
      } else {
        setErrorMsg(error?.message || 'Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm premium-card p-8 text-center animate-fade-up">
        <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
        <p className="text-sm text-muted mb-6">Sign in to your AJ workspace</p>
        
        {errorMsg && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium flex items-start gap-2 text-left">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-2 premium-btn premium-btn-primary py-3 font-medium shadow-md"
        >
          <LogIn className="w-5 h-5" />
          Continue with Google
        </button>
      </div>
    </div>
  );
};
