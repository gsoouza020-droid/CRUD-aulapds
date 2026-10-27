import React from 'react';
import { Funcionario } from '../types';
import { Users, CheckCircle2, Building2, DollarSign, UserMinus } from 'lucide-react';

interface StatsBarProps {
  funcionarios: Funcionario[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ funcionarios }) => {
  const total = funcionarios.length;
  const ativos = funcionarios.filter((f) => f.status === 'Ativo').length;
  const inativos = funcionarios.filter((f) => f.status === 'Inativo').length;
  const departamentos = new Set(funcionarios.map((f) => f.departamento).filter(Boolean)).size;

  const mediaSalarial =
    total > 0
      ? funcionarios.reduce((acc, curr) => acc + (Number(curr.salario) || 0), 0) / total
      : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300">
          <Users className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Total de Funcionários</p>
          <p className="text-lg font-semibold text-slate-100 font-mono tabular-nums">{total}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Ativos no Quadro</p>
          <p className="text-lg font-semibold text-emerald-400 font-mono tabular-nums">{ativos}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-amber-950/60 border border-amber-800/50 flex items-center justify-center text-amber-400">
          <UserMinus className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Inativos / Desligados</p>
          <p className="text-lg font-semibold text-amber-300 font-mono tabular-nums">{inativos}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-indigo-400">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Departamentos</p>
          <p className="text-lg font-semibold text-slate-100 font-mono tabular-nums">{departamentos}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 col-span-2 md:col-span-1">
        <div className="w-9 h-9 rounded-md bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-emerald-400">
          <DollarSign className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Média Salarial</p>
          <p className="text-lg font-semibold text-slate-100 font-mono tabular-nums">
            {mediaSalarial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>
    </div>
  );
};
