import React, { useState, useEffect } from 'react';
import { Funcionario, CreateFuncionarioDTO } from '../types';
import { formatCPF, isValidCPF, generateValidCPF, cleanCPF } from '../utils/cpf';
import { X, CheckCircle2, AlertTriangle, Sparkles, Building, User, CreditCard } from 'lucide-react';

interface FuncionarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateFuncionarioDTO, id?: number) => void;
  funcionarioToEdit?: Funcionario | null;
  existingCpfs: string[];
}

export const FuncionarioModal: React.FC<FuncionarioModalProps> = ({
  isOpen,
  onClose,
  onSave,
  funcionarioToEdit,
  existingCpfs,
}) => {
  const isEditing = Boolean(funcionarioToEdit);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [cargo, setCargo] = useState('');
  const [departamento, setDepartamento] = useState('Tecnologia');
  const [email, setEmail] = useState('');
  const [salario, setSalario] = useState<number>(5000);
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (funcionarioToEdit) {
      setNome(funcionarioToEdit.nome);
      setCpf(funcionarioToEdit.cpf);
      setCargo(funcionarioToEdit.cargo || '');
      setDepartamento(funcionarioToEdit.departamento || 'Tecnologia');
      setEmail(funcionarioToEdit.email || '');
      setSalario(Number(funcionarioToEdit.salario) || 0);
      setDataAdmissao(funcionarioToEdit.data_admissao || '');
      setStatus(funcionarioToEdit.status || 'Ativo');
    } else {
      setNome('');
      setCpf('');
      setCargo('');
      setDepartamento('Tecnologia');
      setEmail('');
      setSalario(5000);
      setDataAdmissao(new Date().toISOString().split('T')[0]);
      setStatus('Ativo');
    }
    setErrorMsg(null);
  }, [funcionarioToEdit, isOpen]);

  // Sugestão automática de e-mail ao digitar o nome
  const handleNomeChange = (val: string) => {
    setNome(val);
    if (!isEditing && (!email || email.includes('@empresa.com.br'))) {
      const parts = val.toLowerCase().trim().split(' ').filter(Boolean);
      if (parts.length >= 2) {
        setEmail(`${parts[0]}.${parts[parts.length - 1]}@empresa.com.br`);
      } else if (parts.length === 1) {
        setEmail(`${parts[0]}@empresa.com.br`);
      }
    }
  };

  const handleCpfChange = (val: string) => {
    const formatted = formatCPF(val);
    setCpf(formatted);
    setErrorMsg(null);
  };

  const handleGenerateCpf = () => {
    const newCpf = generateValidCPF();
    setCpf(newCpf);
    setErrorMsg(null);
  };

  const cpfClean = cleanCPF(cpf);
  const isCpfComplete = cpfClean.length === 11;
  const isCpfValid = isCpfComplete && isValidCPF(cpf);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validação básica do Nome
    if (!nome.trim() || nome.trim().length < 3) {
      setErrorMsg('O nome deve ter no mínimo 3 caracteres.');
      return;
    }

    // Validação matemática do CPF
    if (!isValidCPF(cpf)) {
      setErrorMsg('CPF inválido de acordo com a validação oficial dos dígitos verificadores.');
      return;
    }

    // Verificação de unicidade do CPF (PostgreSQL UNIQUE constraint)
    const formattedCpf = formatCPF(cpf);
    const isDuplicate = existingCpfs.some(
      (existing) =>
        existing === formattedCpf &&
        (!isEditing || existing !== funcionarioToEdit?.cpf)
    );

    if (isDuplicate) {
      setErrorMsg('Erro PostgreSQL (Unique Violation): Este CPF já está cadastrado no banco de dados.');
      return;
    }

    const payload: CreateFuncionarioDTO = {
      nome: nome.trim(),
      cpf: formattedCpf,
      cargo: cargo.trim() || 'Colaborador',
      departamento: departamento || 'Geral',
      email: email.trim() || `${cleanCPF(cpf)}@empresa.com.br`,
      salario: Number(salario) || 0,
      data_admissao: dataAdmissao || new Date().toISOString().split('T')[0],
      status: status,
    };

    onSave(payload, funcionarioToEdit?.id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                {isEditing ? `Editar Funcionário #${funcionarioToEdit?.id}` : 'Novo Funcionário'}
              </h2>
              <p className="text-xs text-slate-400">
                Persistência no banco PostgreSQL (tabela <code className="text-emerald-400 font-mono">funcionarios</code>)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com validação em tempo real */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nome Completo (Obrigatório) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Nome Completo <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Ex: Amanda Silva Santos"
                value={nome}
                onChange={(e) => handleNomeChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
              />
            </div>
          </div>

          {/* CPF (Obrigatório e Validado) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-300">
                CPF <span className="text-emerald-400">*</span> (Chave Única no PostgreSQL)
              </label>
              <button
                type="button"
                onClick={handleGenerateCpf}
                className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                Gerar CPF Válido
              </button>
            </div>

            <div className="relative">
              <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                maxLength={14}
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => handleCpfChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md pl-9 pr-24 py-2 text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCpfComplete ? (
                  isCpfValid ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Válido
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Inválido
                    </span>
                  )
                ) : (
                  <span className="text-[11px] text-slate-500 font-mono">11 dígitos</span>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Valida matematicamente os dois dígitos verificadores via módulo 11.
            </p>
          </div>

          {/* Cargo e Departamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Cargo</label>
              <input
                type="text"
                placeholder="Ex: Desenvolvedor Python"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Departamento</label>
              <select
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
              >
                <option value="Tecnologia">Tecnologia</option>
                <option value="Recursos Humanos">Recursos Humanos</option>
                <option value="Financeiro">Financeiro</option>
                <option value="Marketing">Marketing</option>
                <option value="Operações">Operações</option>
                <option value="Vendas">Vendas</option>
                <option value="Jurídico">Jurídico</option>
                <option value="Logística">Logística</option>
              </select>
            </div>
          </div>

          {/* E-mail e Salário */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">E-mail Corporativo</label>
              <input
                type="email"
                placeholder="nome@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Salário (R$)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={salario}
                onChange={(e) => setSalario(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Data de Admissão e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Data de Admissão</label>
              <input
                type="date"
                value={dataAdmissao}
                onChange={(e) => setDataAdmissao(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Status</label>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStatus('Ativo')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    status === 'Ativo'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  Ativo
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('Inativo')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    status === 'Inativo'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  Inativo
                </button>
              </div>
            </div>
          </div>

          {/* Rodapé do Modal */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors shadow-sm"
            >
              {isEditing ? 'Salvar Alterações' : 'Cadastrar no Banco'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
