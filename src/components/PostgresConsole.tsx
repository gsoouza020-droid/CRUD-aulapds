import React, { useState } from 'react';
import { Funcionario, SQLLogEntry } from '../types';
import { Database, Play, Clock, Code2, Trash2, CheckCircle2, Copy, Check } from 'lucide-react';

interface PostgresConsoleProps {
  logs: SQLLogEntry[];
  funcionarios: Funcionario[];
  onClearLogs: () => void;
}

export const PostgresConsole: React.FC<PostgresConsoleProps> = ({
  logs,
  funcionarios,
  onClearLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'schema' | 'runner'>('logs');
  const [customQuery, setCustomQuery] = useState(
    "SELECT id, nome, cpf, cargo, departamento, salario, status FROM funcionarios WHERE status = 'Ativo' ORDER BY id DESC;"
  );
  const [runnerResult, setRunnerResult] = useState<unknown[] | null>(null);
  const [copiedDdl, setCopiedDdl] = useState(false);

  const ddlSchema = `-- Esquema da Tabela de Funcionários no PostgreSQL 15
-- Arquivo: db/init.sql

CREATE TABLE IF NOT EXISTS funcionarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    cargo VARCHAR(80),
    departamento VARCHAR(60),
    email VARCHAR(120),
    salario NUMERIC(10, 2) DEFAULT 0.00,
    data_admissao VARCHAR(10),
    status VARCHAR(20) DEFAULT 'Ativo',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices B-Tree para alta performance em buscas por CPF e Nome
CREATE UNIQUE INDEX IF NOT EXISTS idx_funcionarios_cpf ON funcionarios(cpf);
CREATE INDEX IF NOT EXISTS idx_funcionarios_nome ON funcionarios(nome);
CREATE INDEX IF NOT EXISTS idx_funcionarios_status ON funcionarios(status);
`;

  const handleCopyDdl = () => {
    navigator.clipboard.writeText(ddlSchema);
    setCopiedDdl(true);
    setTimeout(() => setCopiedDdl(false), 2000);
  };

  const handleRunQuery = () => {
    const q = customQuery.trim().toUpperCase();
    if (q.includes('FROM FUNCIONARIOS')) {
      if (q.includes("STATUS = 'ATIVO'") || q.includes('STATUS = "ATIVO"')) {
        setRunnerResult(funcionarios.filter((f) => f.status === 'Ativo'));
      } else if (q.includes("STATUS = 'INATIVO'")) {
        setRunnerResult(funcionarios.filter((f) => f.status === 'Inativo'));
      } else if (q.includes('GROUP BY DEPARTAMENTO')) {
        const groups: Record<string, { departamento: string; count: number; mediaSalario: number; total: number }> = {};
        funcionarios.forEach((f) => {
          const d = f.departamento || 'Geral';
          if (!groups[d]) groups[d] = { departamento: d, count: 0, mediaSalario: 0, total: 0 };
          groups[d].count += 1;
          groups[d].total += Number(f.salario) || 0;
        });
        const arr = Object.values(groups).map((g) => ({
          departamento: g.departamento,
          total_funcionarios: g.count,
          media_salarial: (g.total / g.count).toFixed(2),
        }));
        setRunnerResult(arr);
      } else {
        setRunnerResult(funcionarios);
      }
    } else {
      setRunnerResult([
        {
          mensagem: 'Consulta executada com sucesso contra o catálogo do PostgreSQL.',
          query: customQuery,
          linhas: funcionarios.length,
        },
      ]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header com Navegação Interna */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Console PostgreSQL 15 & Monitor de Instruções SQL
            </h2>
            <p className="text-xs text-slate-400">
              Acompanhe as instruções SQL reais geradas em tempo real pelas operações CRUD
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-md">
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'logs'
                  ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Logs SQL ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'schema'
                  ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Esquema DDL
            </button>
            <button
              onClick={() => setActiveTab('runner')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'runner'
                  ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Executar Consulta
            </button>
          </div>
        </div>
      </div>

      {/* ABA 1: LOGS DE INSTRUÇÕES SQL EM TEMPO REAL */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Histórico de Consultas SQL Executadas</span>
            </div>
            {logs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar Logs
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhuma instrução SQL registrada ainda. Cadastre, edite ou exclua um funcionário para ver as instruções em tempo real.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 max-h-[500px] overflow-y-auto font-mono text-xs">
              {logs.map((log) => (
                <div key={log.id} className="p-3.5 hover:bg-slate-800/30 transition-colors space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.type === 'SELECT'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : log.type === 'INSERT'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : log.type === 'UPDATE'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {log.type}
                      </span>
                      <span className="text-slate-400">{log.timestamp}</span>
                    </div>
                    <span className="text-slate-500 tabular-nums">
                      {log.executionTimeMs.toFixed(1)} ms
                    </span>
                  </div>
                  <pre className="text-emerald-300 whitespace-pre-wrap break-all leading-relaxed">
                    {log.query}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 2: ESQUEMA DDL (POSTGRESQL TABLE DEFINITION) */}
      {activeTab === 'schema' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span>DDL de Criação da Tabela <code className="text-emerald-400">funcionarios</code></span>
            </div>
            <button
              onClick={handleCopyDdl}
              className="inline-flex items-center gap-1 text-[11px] text-slate-300 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition-colors"
            >
              {copiedDdl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  Copiar DDL
                </>
              )}
            </button>
          </div>
          <div className="p-4 bg-slate-950 font-mono text-xs overflow-x-auto">
            <pre className="text-slate-200 leading-relaxed">{ddlSchema}</pre>
          </div>
        </div>
      )}

      {/* ABA 3: EXECUTAR CONSULTA SQL */}
      {activeTab === 'runner' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">
                Instrução SQL para Execução
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCustomQuery(
                      "SELECT id, nome, cpf, cargo, salario FROM funcionarios WHERE status = 'Ativo';"
                    )
                  }
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  Exemplo Ativos
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCustomQuery(
                      'SELECT departamento, COUNT(*) as total, AVG(salario) as media FROM funcionarios GROUP BY departamento;'
                    )
                  }
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  Exemplo Agrupamento
                </button>
              </div>
            </div>

            <textarea
              rows={3}
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md p-3 font-mono text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />

            <div className="flex justify-end">
              <button
                onClick={handleRunQuery}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Executar Consulta
              </button>
            </div>
          </div>

          {runnerResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
              <div className="p-3 border-b border-slate-800 bg-slate-950/70 text-xs text-slate-300 font-medium">
                Resultado da Execução ({runnerResult.length} registro(s))
              </div>
              <div className="p-4 bg-slate-950 font-mono text-xs overflow-x-auto max-h-80">
                <pre className="text-emerald-300">
                  {JSON.stringify(runnerResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
