import React from 'react';
import { NavLink } from 'react-router-dom';
import { Tags, Database, Link as LinkIcon, Settings, ChevronRight } from 'lucide-react';
import { ContentHeader } from '../../../components/layout/ContentHeader';

export const ManagementPage = () => {
  return (
    <div className="flex-1 overflow-y-auto w-full p-4 md:p-8 pb-32">
      <div className="max-w-4xl mx-auto">
        <ContentHeader 
          title="Tools & Management" 
          subtitle="Manage your settings, data, and workspace configurations."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Categories */}
          <NavLink to="/dashboard/categories" className="group p-5 rounded-2xl bg-[rgba(20,24,32,0.4)] hover:bg-[rgba(20,24,32,0.6)] border border-transparent hover:border-white/5 transition-all text-left flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Tags size={24} />
              </div>
              <ChevronRight size={20} className="text-muted group-hover:text-text-main transition-colors" />
            </div>
            <div>
               <h3 className="font-semibold text-lg text-text-main">Categories</h3>
               <p className="text-sm text-muted mt-1 leading-relaxed">Manage tags and categories used across notes and tasks.</p>
            </div>
          </NavLink>

          {/* Data */}
          <NavLink to="/dashboard/data" className="group p-5 rounded-2xl bg-[rgba(20,24,32,0.4)] hover:bg-[rgba(20,24,32,0.6)] border border-transparent hover:border-white/5 transition-all text-left flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-[#a3b6fc]/10 text-[#a3b6fc] flex items-center justify-center">
                <Database size={24} />
              </div>
              <ChevronRight size={20} className="text-muted group-hover:text-text-main transition-colors" />
            </div>
            <div>
               <h3 className="font-semibold text-lg text-text-main">Data Management</h3>
               <p className="text-sm text-muted mt-1 leading-relaxed">Export your data to JSON and import backups safely.</p>
            </div>
          </NavLink>

          {/* Links */}
          <NavLink to="/dashboard/links" className="group p-5 rounded-2xl bg-[rgba(20,24,32,0.4)] hover:bg-[rgba(20,24,32,0.6)] border border-transparent hover:border-white/5 transition-all text-left flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
                <LinkIcon size={24} />
              </div>
              <ChevronRight size={20} className="text-muted group-hover:text-text-main transition-colors" />
            </div>
            <div>
               <h3 className="font-semibold text-lg text-text-main">Saved Links</h3>
               <p className="text-sm text-muted mt-1 leading-relaxed">Manage all your saved URLs and web references.</p>
            </div>
          </NavLink>

          {/* Settings */}
          <NavLink to="/dashboard/settings" className="group p-5 rounded-2xl bg-[rgba(20,24,32,0.4)] hover:bg-[rgba(20,24,32,0.6)] border border-transparent hover:border-white/5 transition-all text-left flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <Settings size={24} />
              </div>
              <ChevronRight size={20} className="text-muted group-hover:text-text-main transition-colors" />
            </div>
            <div>
               <h3 className="font-semibold text-lg text-text-main">Settings</h3>
               <p className="text-sm text-muted mt-1 leading-relaxed">Update your profile, theme, and application preferences.</p>
            </div>
          </NavLink>
        </div>
      </div>
    </div>
  );
};
