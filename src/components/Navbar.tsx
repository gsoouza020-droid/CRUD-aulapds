import React from 'react';
import { Database, Plus, Download, Terminal } from 'lucide-react';

interface NavbarProps {
  activeTab: 'crud' | 'docker' | 'postgres' | 'api';
  onSelectTab: (tab: 'crud' | 'docker' | 'postgres' | 'api') => void;
  onOpenCreateModal: () => void;
  onDownloadZip: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenCreateModal,
  onDownloadZip,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <a
              href="#crud"
              onClick={(e) => {
                e.preventDefault();
                onSelectTab('crud');
              }}
              className="text-base font-semibold tracking-tight text-white hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0"
            >
              PyPostgres CRUD
            </a>
          </div>

          {/* Zone 2: 4 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => onSelectTab('crud')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'crud'
                  ? 'text-emerald-400 border-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              Gestão de Funcionários
            </button>
            <button
              onClick={() => onSelectTab('docker')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'docker'
                  ? 'text-emerald-400 border-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              Projeto Docker & Python
            </button>
            <button
              onClick={() => onSelectTab('postgres')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'postgres'
                  ? 'text-emerald-400 border-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              PostgreSQL Schema & Logs
            </button>
            <button
              onClick={() => onSelectTab('api')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'api'
                  ? 'text-emerald-400 border-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              API REST & Swagger
            </button>
          </nav>

          {/* Zone 3: Primary action button + Quick Download */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onDownloadZip}
              title="Baixar projeto completo com Docker Compose (.zip)"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-md hover:bg-slate-700 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar ZIP Docker
            </button>
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-md hover:bg-emerald-300 transition-colors whitespace-nowrap shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Novo Funcionário
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav strip */}
      <div className="md:hidden flex overflow-x-auto border-t border-slate-800 px-4 py-2 gap-3 text-xs">
        <button
          onClick={() => onSelectTab('crud')}
          className={`whitespace-nowrap shrink-0 px-2.5 py-1 rounded ${
            activeTab === 'crud' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400'
          }`}
        >
          Funcionários
        </button>
        <button
          onClick={() => onSelectTab('docker')}
          className={`whitespace-nowrap shrink-0 px-2.5 py-1 rounded ${
            activeTab === 'docker' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400'
          }`}
        >
          Docker & Python
        </button>
        <button
          onClick={() => onSelectTab('postgres')}
          className={`whitespace-nowrap shrink-0 px-2.5 py-1 rounded ${
            activeTab === 'postgres' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400'
          }`}
        >
          Postgres Schema
        </button>
        <button
          onClick={() => onSelectTab('api')}
          className={`whitespace-nowrap shrink-0 px-2.5 py-1 rounded ${
            activeTab === 'api' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400'
          }`}
        >
          API REST
        </button>
      </div>
    </header>
  );
};
