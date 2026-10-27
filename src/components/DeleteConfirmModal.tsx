import React from 'react';
import { Funcionario } from '../types';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  funcionario: Funcionario | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  funcionario,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !funcionario) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Trash2 className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-semibold text-slate-100">Excluir Funcionário</h3>
          <p className="text-xs text-slate-400 mt-1">
            Esta operação executará uma instrução <code className="text-rose-400 font-mono">DELETE</code> no banco de dados PostgreSQL.
          </p>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">ID:</span>
            <span className="text-slate-200 font-mono">#{funcionario.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Nome:</span>
            <span className="text-slate-100 font-medium">{funcionario.nome}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">CPF:</span>
            <span className="text-emerald-400 font-mono">{funcionario.cpf}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Cargo:</span>
            <span className="text-slate-300">{funcionario.cargo || '—'}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md transition-colors shadow-sm"
          >
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  );
};
