import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Brain, Zap, Layers } from 'lucide-react';

export const LandingPage = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative blurred background */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] opacity-50 pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] opacity-50 pointer-events-none" />
      
      <nav className="w-full flex justify-between items-center px-6 md:px-12 py-6 relative z-10">
        <div className="text-xl font-bold font-sans tracking-tight">AJ Workspace</div>
        <Link to="/auth/login" className="px-5 py-2.5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.05)] transition-all font-medium text-sm">Log In</Link>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-24 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--primary-soft)] text-primary text-sm font-medium mb-8 border border-[rgba(142,162,255,0.22)] shadow-[0_0_12px_rgba(142,162,255,0.05)]">
          <Brain className="w-4 h-4" /> AI-powered productivity workspace
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Capture <span className="text-primary italic">everything.</span> <br /> 
          Organize seamlessly.
        </h1>
        <p className="text-lg md:text-xl text-muted max-w-2xl mb-12 leading-relaxed">
          The personal intelligence system that helps you save resources, capture temporary thoughts, organize notes, and manage tasks through a minimalist dashboard.
        </p>
        
        <Link to="/auth/login" className="premium-btn premium-btn-primary px-8 py-4 rounded-xl flex items-center gap-2 text-lg shadow-[0_0_24px_rgba(142,162,255,0.25)]">
          Start Capturing <ArrowRight className="w-5 h-5" />
        </Link>
      </main>
    </div>
  );
};
