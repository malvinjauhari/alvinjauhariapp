import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full flex flex-col items-center text-center animate-fade-up">
        <h1 className="text-8xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
          404
        </h1>
        <h2 className="text-2xl font-semibold mb-3">Page Not Found</h2>
        <p className="text-muted mb-8 text-center max-w-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-6 py-3 flex items-center justify-center gap-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-colors font-medium"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-6 py-3 flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-colors font-medium shadow-lg shadow-primary/25"
          >
            <Home size={18} />
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
};
