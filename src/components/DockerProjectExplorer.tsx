import React, { useState } from 'react';
import { PROJECT_FILES, ProjectFile } from '../data/projectFiles';
import {
  Download,
  Copy,
  Check,
  FileCode,
  Folder,
  Terminal,
  Layers,
  Server,
  Database,
  Monitor,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { downloadProjectZip } from '../utils/zipExport';

export const DockerProjectExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadProjectZip();
    } finally {
      setDownloading(false);
    }
  };

  const filteredFiles = activeCategory === 'all'
    ? PROJECT_FILES
    : PROJECT_FILES.filter(f => f.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Banner de Arquitetura Docker */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Arquitetura em Contêineres Docker
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              Ambiente Python + PostgreSQL com Docker Compose
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Projeto pronto para execução local com 3 serviços orquestrados via <code className="text-emerald-400 font-mono">docker-compose.yml</code>:
              banco PostgreSQL com volume persistente, backend FastAPI com validação de CPF e frontend Python Streamlit.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Gerando .zip...' : 'Baixar Projeto Completo (.zip)'}
            </button>
          </div>
        </div>

        {/* Diagrama de Fluxo dos Serviços */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-200">Frontend (Streamlit)</div>
              <div className="text-[11px] text-slate-400 font-mono">Porta 8501 · Python 3.11</div>
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-200">Backend (FastAPI)</div>
              <div className="text-[11px] text-slate-400 font-mono">Porta 8000 · SQLAlchemy</div>
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-200">Banco de Dados (PostgreSQL)</div>
              <div className="text-[11px] text-slate-400 font-mono">Porta 5432 · postgres:15</div>
            </div>
          </div>
        </div>
      </div>

      {/* Instruções de Execução Terminal */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Comando para Executar no seu Computador</span>
        </div>
        <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-md p-3 font-mono text-xs text-emerald-300 overflow-x-auto">
          <code>docker compose up --build</code>
        </div>
        <p className="text-[11px] text-slate-400">
          Após rodar o comando acima, acesse a interface web em <span className="text-slate-200 font-mono">http://localhost:8501</span> e a documentação interativa Swagger da API em <span className="text-slate-200 font-mono">http://localhost:8000/docs</span>.
        </p>
      </div>

      {/* Explorador de Código e Arquivos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Lista de Arquivos à Esquerda */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
          <div className="p-3 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Folder className="w-4 h-4 text-emerald-400" />
              <span>Arquivos do Projeto ({PROJECT_FILES.length})</span>
            </div>
          </div>

          {/* Filtro por Categoria */}
          <div className="flex items-center gap-1 p-2 bg-slate-950/80 border-b border-slate-800 overflow-x-auto text-[11px]">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'docker', label: 'Docker' },
              { id: 'backend', label: 'Backend' },
              { id: 'frontend', label: 'Frontend' },
              { id: 'database', label: 'Postgres' },
              { id: 'docs', label: 'Docs' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2 py-0.5 rounded whitespace-nowrap shrink-0 transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Itens de Arquivo */}
          <div className="divide-y divide-slate-800/60 overflow-y-auto max-h-[540px]">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-3 flex items-start gap-2.5 transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/10 border-l-2 border-emerald-400 text-slate-100'
                      : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <FileCode className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium font-mono truncate">{file.path}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{file.description}</div>
                  </div>
                  {isSelected && <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 self-center" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Visualizador do Código do Arquivo Selecionado */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
          {/* Header do Arquivo */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs font-medium text-emerald-400 truncate">
                {selectedFile.path}
              </span>
              <span className="text-[11px] text-slate-400">
                · {selectedFile.content.split('\n').length} linhas
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded transition-colors whitespace-nowrap shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    Copiar Código
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Descrição do Arquivo */}
          <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/60 text-xs text-slate-400">
            {selectedFile.description}
          </div>

          {/* Conteúdo do Código com Numeração de Linhas */}
          <div className="relative bg-slate-950 p-4 font-mono text-xs overflow-x-auto max-h-[500px]">
            <pre className="text-slate-200 leading-relaxed">
              {selectedFile.content.split('\n').map((line, idx) => (
                <div key={idx} className="table-row">
                  <span className="table-cell select-none text-slate-600 text-right pr-4 tabular-nums w-8">
                    {idx + 1}
                  </span>
                  <span className="table-cell whitespace-pre">{line}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
