import React, { useState, useMemo } from 'react';
import { Funcionario } from '../types';
import {
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  FileSpreadsheet,
  FileCode,
  UserPlus,
  RefreshCw,
  AlertCircle,
  Briefcase,
  Calendar,
  Eye
} from 'lucide-react';
import { exportToCSV, exportToJSON } from '../utils/zipExport';

interface FuncionarioListProps {
  funcionarios: Funcionario[];
  onEdit: (funcionario: Funcionario) => void;
  onDelete: (funcionario: Funcionario) => void;
  onAddNew: () => void;
  onAddSample: () => void;
  onResetData: () => void;
  onViewQuery: (query: string) => void;
}

type SortField = 'id' | 'nome' | 'cpf' | 'cargo' | 'departamento' | 'salario' | 'status';
type SortOrder = 'asc' | 'desc';

export const FuncionarioList: React.FC<FuncionarioListProps> = ({
  funcionarios,
  onEdit,
  onDelete,
  onAddNew,
  onAddSample,
  onResetData,
  onViewQuery,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Inativo'>('Todos');
  const [departmentFilter, setDepartmentFilter] = useState<string>('Todos');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Departamentos únicos para o filtro
  const departments = useMemo(() => {
    const list = Array.from(new Set(funcionarios.map((f) => f.departamento).filter(Boolean)));
    return ['Todos', ...list];
  }, [funcionarios]);

  // Filtragem e Ordenação
  const filteredFuncionarios = useMemo(() => {
    return funcionarios
      .filter((f) => {
        const matchesSearch =
          searchTerm === '' ||
          f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.cpf.includes(searchTerm) ||
          f.cargo.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'Todos' || f.status === statusFilter;
        const matchesDept = departmentFilter === 'Todos' || f.departamento === departmentFilter;

        return matchesSearch && matchesStatus && matchesDept;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === 'string') {
          return sortOrder === 'asc'
            ? valA.localeCompare(valB as string, 'pt-BR')
            : (valB as string).localeCompare(valA, 'pt-BR');
        }

        return sortOrder === 'asc'
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      });
  }, [funcionarios, searchTerm, statusFilter, departmentFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros & Ações Rápidas */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-md pl-9 pr-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
            />
          </div>

          {/* Filtro de Status Segmentado */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-md">
            {(['Todos', 'Ativo', 'Inativo'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === st
                    ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Filtro de Departamento */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'Todos' ? 'Todos os Deptos' : dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toolbar de Exportação e Utilidades */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Exibindo <strong className="text-slate-200 font-mono tabular-nums">{filteredFuncionarios.length}</strong> de{' '}
              <strong className="text-slate-200 font-mono tabular-nums">{funcionarios.length}</strong> registros
            </span>
            {(searchTerm || statusFilter !== 'Todos' || departmentFilter !== 'Todos') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('Todos');
                  setDepartmentFilter('Todos');
                }}
                className="text-xs text-emerald-400 hover:underline ml-2"
              >
                Limpar filtros
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onAddSample}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors whitespace-nowrap shrink-0"
              title="Gera um funcionário brasileiro com CPF válido gerado aleatoriamente"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
              + Amostra
            </button>
            <button
              onClick={() => exportToCSV(filteredFuncionarios as unknown as Record<string, unknown>[])}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors whitespace-nowrap shrink-0"
              title="Exportar dados filtrados para CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
              CSV
            </button>
            <button
              onClick={() => exportToJSON(filteredFuncionarios)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors whitespace-nowrap shrink-0"
              title="Exportar dados filtrados para JSON"
            >
              <FileCode className="w-3.5 h-3.5 text-slate-400" />
              JSON
            </button>
            <button
              onClick={onResetData}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors whitespace-nowrap shrink-0"
              title="Restaurar dados iniciais padrão do banco"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Dados PostgreSQL */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        {filteredFuncionarios.length === 0 ? (
          <div className="text-center py-12 px-4">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-200">Nenhum funcionário encontrado</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Não foram encontrados registros para os critérios informados. Ajuste os filtros ou cadastre um novo funcionário.
            </p>
            <button
              onClick={onAddNew}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Cadastrar Novo Funcionário
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th
                    onClick={() => handleSort('id')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-200 w-16"
                  >
                    <div className="flex items-center gap-1">
                      <span>ID</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('nome')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-200"
                  >
                    <div className="flex items-center gap-1">
                      <span>Nome</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('cpf')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-200"
                  >
                    <div className="flex items-center gap-1">
                      <span>CPF (PostgreSQL Unique)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('cargo')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-200"
                  >
                    <div className="flex items-center gap-1">
                      <span>Cargo</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('departamento')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-200"
                  >
                    <div className="flex items-center gap-1">
                      <span>Departamento</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('salario')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-200 text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Salário (R$)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-200 text-center w-24"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {filteredFuncionarios.map((func) => (
                  <tr
                    key={func.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* ID */}
                    <td className="py-2.5 px-4 font-mono tabular-nums text-slate-400">
                      #{func.id}
                    </td>

                    {/* Nome + Email */}
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-slate-100">{func.nome}</div>
                      {func.email && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {func.email}
                        </div>
                      )}
                    </td>

                    {/* CPF */}
                    <td className="py-2.5 px-4 font-mono tabular-nums text-emerald-400/90 font-medium">
                      {func.cpf}
                    </td>

                    {/* Cargo */}
                    <td className="py-2.5 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3 h-3 text-slate-500" />
                        <span>{func.cargo || '—'}</span>
                      </div>
                    </td>

                    {/* Departamento */}
                    <td className="py-2.5 px-4 text-slate-300">
                      <span className="text-slate-300">{func.departamento || 'Geral'}</span>
                    </td>

                    {/* Salário */}
                    <td className="py-2.5 px-4 font-mono tabular-nums text-right text-slate-200 font-medium">
                      {(Number(func.salario) || 0).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded ${
                          func.status === 'Ativo'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {func.status}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            onViewQuery(`SELECT * FROM funcionarios WHERE id = ${func.id};`)
                          }
                          className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
                          title="Ver consulta SQL deste registro"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEdit(func)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 rounded hover:bg-slate-800 transition-colors"
                          title="Editar funcionário"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(func)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                          title="Excluir funcionário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
