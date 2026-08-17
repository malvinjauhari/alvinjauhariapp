import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { BotMessageSquare, AlertCircle } from 'lucide-react';

export const SettingsPage = () => {
  const { profile } = useAuth();

  return (
    <div className="flex-1 overflow-y-auto w-full p-4 md:p-8 pb-28 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings / Integrations</h1>
          <p className="text-muted mt-1">Manage your workspace preferences.</p>
        </header>

        <section className="premium-card p-6 border-[var(--border)]">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[var(--primary-soft)] text-primary rounded-xl">
              <BotMessageSquare size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold">Telegram Bot Capture</h3>
              <p className="text-muted mt-1 text-sm md:text-base">
                Connect your account to save notes and links directly from Telegram. 
                Just forward messages or send links to the Alvin Jauhari bot.
              </p>
              
              <div className="mt-6 flex flex-col items-start gap-3">
                {profile?.telegram?.linked ? (
                  <div className="flex items-center gap-2 text-green-500 font-medium bg-green-500/10 px-4 py-2 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Connected as {profile.telegram.username || 'User'}
                  </div>
                ) : (
                  <>
                    <button className="premium-btn premium-btn-primary px-5 py-2.5 shadow-md">
                      Generate Connect Code
                    </button>
                    <p className="text-xs text-muted flex items-center gap-1 mt-2">
                       <AlertCircle size={14} /> The bot token is securely managed on the backend using Firebase.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
