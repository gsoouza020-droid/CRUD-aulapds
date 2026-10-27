import React, { useState, useEffect } from 'react';
import { Funcionario, CreateFuncionarioDTO, SQLLogEntry } from './types';
import { INITIAL_FUNCIONARIOS } from './data/initialData';
import { generateValidCPF } from './utils/cpf';
import { downloadProjectZip } from './utils/zipExport';
import { Navbar } from './components/Navbar';
import { StatsBar } from './components/StatsBar';
import { FuncionarioList } from './components/FuncionarioList';
import { FuncionarioModal } from './components/FuncionarioModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { DockerProjectExplorer } from './components/DockerProjectExplorer';
import { PostgresConsole } from './components/PostgresConsole';
import { ApiTester } from './components/ApiTester';
import { ToastContainer, ToastMessage } from './components/Toast';

export default function App() {
  const [activeTab, setActiveTab] = useState<'crud' | 'docker' | 'postgres' | 'api'>('crud');

  // Estado dos Funcionários com persistência local
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>(() => {
    try {
      const stored = localStorage.getItem('postgres_funcionarios_data');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Erro ao ler localStorage', e);
    }
    return INITIAL_FUNCIONARIOS;
  });

  // Salva alterações no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('postgres_funcionarios_data', JSON.stringify(funcionarios));
    } catch (e) {
      console.warn('Erro ao salvar no localStorage', e);
    }
  }, [funcionarios]);

  // Histórico de Consultas SQL (PostgreSQL Statement Monitor)
  const [sqlLogs, setSqlLogs] = useState<SQLLogEntry[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      query: `SELECT * FROM funcionarios ORDER BY id DESC LIMIT 100;`,
      executionTimeMs: 1.4,
      type: 'SELECT',
      rowsAffected: INITIAL_FUNCIONARIOS.length,
    },
  ]);

  // Estados dos Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const [deletingFuncionario, setDeletingFuncionario] = useState<Funcionario | null>(null);

  // Notificações Toast
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const newToast: ToastMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      title,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper para adicionar log SQL
  const logSql = (
    query: string,
    type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'DDL',
    rows = 1
  ) => {
    const entry: SQLLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      query,
      executionTimeMs: Number((Math.random() * 2.5 + 0.8).toFixed(2)),
      type,
      rowsAffected: rows,
    };
    setSqlLogs((prev) => [entry, ...prev.slice(0, 49)]); // Guarda até 50 logs
  };

  // Cadastrar ou Editar Funcionário
  const handleSaveFuncionario = (dto: CreateFuncionarioDTO, idToEdit?: number) => {
    if (idToEdit) {
      // Operação UPDATE
      setFuncionarios((prev) =>
        prev.map((item) =>
          item.id === idToEdit
            ? {
                ...item,
                ...dto,
              }
            : item
        )
      );

      const sql = `UPDATE funcionarios 
SET nome = '${dto.nome.replace(/'/g, "''")}',
    cpf = '${dto.cpf}',
    cargo = '${dto.cargo.replace(/'/g, "''")}',
    departamento = '${dto.departamento.replace(/'/g, "''")}',
    email = '${dto.email.replace(/'/g, "''")}',
    salario = ${dto.salario.toFixed(2)},
    data_admissao = '${dto.data_admissao}',
    status = '${dto.status}'
WHERE id = ${idToEdit};`;

      logSql(sql, 'UPDATE', 1);
      addToast('success', 'Funcionário atualizado', `Registro #${idToEdit} (${dto.nome}) atualizado no banco.`);
    } else {
      // Operação INSERT
      const nextId =
        funcionarios.length > 0 ? Math.max(...funcionarios.map((f) => f.id)) + 1 : 1;
      const novo: Funcionario = {
        id: nextId,
        ...dto,
        criado_em: new Date().toISOString(),
      };

      setFuncionarios((prev) => [novo, ...prev]);

      const sql = `INSERT INTO funcionarios (nome, cpf, cargo, departamento, email, salario, data_admissao, status)
VALUES ('${dto.nome.replace(/'/g, "''")}', '${dto.cpf}', '${dto.cargo.replace(/'/g, "''")}', '${dto.departamento.replace(/'/g, "''")}', '${dto.email.replace(/'/g, "''")}', ${dto.salario.toFixed(2)}, '${dto.data_admissao}', '${dto.status}')
RETURNING id;`;

      logSql(sql, 'INSERT', 1);
      addToast('success', 'Funcionário cadastrado', `${dto.nome} inserido com ID #${nextId} no PostgreSQL.`);
    }

    setIsModalOpen(false);
    setEditingFuncionario(null);
  };

  // Excluir Funcionário
  const handleConfirmDelete = () => {
    if (!deletingFuncionario) return;

    const id = deletingFuncionario.id;
    const nome = deletingFuncionario.nome;

    setFuncionarios((prev) => prev.filter((f) => f.id !== id));

    const sql = `DELETE FROM funcionarios WHERE id = ${id};`;
    logSql(sql, 'DELETE', 1);

    addToast('info', 'Funcionário excluído', `Registro #${id} (${nome}) removido da tabela.`);
    setDeletingFuncionario(null);
  };

  // Gerar Amostra com CPF Válido
  const handleAddSample = () => {
    const sampleNames = [
      'Thiago Henrique Barbosa',
      'Fernanda Guimarães Rocha',
      'Gabriel Azevedo Santos',
      'Camila Nogueira Lima',
      'Matheus Pires de Castro',
      'Larissa Fonseca Ribeiro',
      'Rodrigo Antunes Maia',
    ];
    const sampleCargos = [
      'Desenvolvedor Python Pleno',
      'Engenheira de Dados',
      'Analista Financeiro',
      'Product Owner',
      'Especialista em Segurança',
      'Designer de Produto',
    ];
    const sampleDeptos = [
      'Tecnologia',
      'Recursos Humanos',
      'Financeiro',
      'Marketing',
      'Operações',
    ];

    const nome = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const cargo = sampleCargos[Math.floor(Math.random() * sampleCargos.length)];
    const departamento = sampleDeptos[Math.floor(Math.random() * sampleDeptos.length)];
    const cpf = generateValidCPF();
    const salario = Math.floor(Math.random() * 9000 + 4000);
    const emailParts = nome.toLowerCase().split(' ');
    const email = `${emailParts[0]}.${emailParts[emailParts.length - 1]}@empresa.com.br`;

    handleSaveFuncionario({
      nome,
      cpf,
      cargo,
      departamento,
      email,
      salario,
      data_admissao: new Date().toISOString().split('T')[0],
      status: 'Ativo',
    });
  };

  // Restaurar dados padrão
  const handleResetData = () => {
    setFuncionarios(INITIAL_FUNCIONARIOS);
    logSql(`TRUNCATE TABLE funcionarios RESTART IDENTITY; -- Restaurando registros padrão`, 'DDL', INITIAL_FUNCIONARIOS.length);
    addToast('info', 'Banco restaurado', 'Os registros padrão do PostgreSQL foram recarregados.');
  };

  const handleDownloadZip = async () => {
    try {
      await downloadProjectZip();
      addToast('success', 'Download iniciado', 'Arquivo crud-funcionario-docker-python.zip pronto para descompactar!');
    } catch (e) {
      addToast('error', 'Erro ao baixar ZIP', 'Não foi possível empacotar o projeto.');
    }
  };

  const handleViewQuery = (query: string) => {
    logSql(query, 'SELECT', 1);
    setActiveTab('postgres');
    addToast('info', 'Consulta SQL', 'Instrução visualizada no console PostgreSQL.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Barra de Navegação Superior (Top Bar Contract) */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenCreateModal={() => {
          setEditingFuncionario(null);
          setIsModalOpen(true);
        }}
        onDownloadZip={handleDownloadZip}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner Kicker do Projeto */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              CRUD de Funcionários · Nome &amp; CPF
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Backend em Python (FastAPI + SQLAlchemy) · Frontend em Python (Streamlit) · Banco PostgreSQL 15 · Docker Compose
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>PostgreSQL: <strong className="text-emerald-400 font-mono">porta 5432</strong></span>
            <span aria-hidden="true">·</span>
            <span>API: <strong className="text-emerald-400 font-mono">porta 8000</strong></span>
            <span aria-hidden="true">·</span>
            <span>UI: <strong className="text-emerald-400 font-mono">porta 8501</strong></span>
          </div>
        </div>

        {/* Renderização Condicional da Aba Ativa */}
        {activeTab === 'crud' && (
          <div className="space-y-6">
            {/* Métricas e Estatísticas do Quadro */}
            <StatsBar funcionarios={funcionarios} />

            {/* Lista Principal de Funcionários com Tabela e Filtros */}
            <FuncionarioList
              funcionarios={funcionarios}
              onEdit={(f) => {
                setEditingFuncionario(f);
                setIsModalOpen(true);
              }}
              onDelete={(f) => setDeletingFuncionario(f)}
              onAddNew={() => {
                setEditingFuncionario(null);
                setIsModalOpen(true);
              }}
              onAddSample={handleAddSample}
              onResetData={handleResetData}
              onViewQuery={handleViewQuery}
            />
          </div>
        )}

        {activeTab === 'docker' && <DockerProjectExplorer />}

        {activeTab === 'postgres' && (
          <PostgresConsole
            logs={sqlLogs}
            funcionarios={funcionarios}
            onClearLogs={() => setSqlLogs([])}
          />
        )}

        {activeTab === 'api' && (
          <ApiTester
            funcionarios={funcionarios}
            onCreateMock={(nome, cpf) => {
              handleSaveFuncionario({
                nome,
                cpf,
                cargo: 'Desenvolvedor Python',
                departamento: 'Tecnologia',
                email: `${nome.toLowerCase().replace(/\s+/g, '.')}@empresa.com.br`,
                salario: 7500.0,
                data_admissao: new Date().toISOString().split('T')[0],
                status: 'Ativo',
              });
            }}
            onDeleteMock={(id) => {
              const target = funcionarios.find((f) => f.id === id);
              if (target) {
                setFuncionarios((prev) => prev.filter((f) => f.id !== id));
                logSql(`DELETE FROM funcionarios WHERE id = ${id};`, 'DELETE', 1);
                addToast('info', 'Excluído via API', `Funcionário #${id} removido.`);
              }
            }}
          />
        )}
      </main>

      {/* Rodapé Simples e Limpo */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            CRUD Funcionários · Python, PostgreSQL &amp; Docker
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('docker')}
              className="hover:text-slate-300 transition-colors"
            >
              Ver Arquivos Docker
            </button>
            <button
              onClick={() => setActiveTab('postgres')}
              className="hover:text-slate-300 transition-colors"
            >
              Schema PostgreSQL
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className="hover:text-slate-300 transition-colors"
            >
              Swagger Docs
            </button>
          </div>
        </div>
      </footer>

      {/* Modal de Criação / Edição */}
      <FuncionarioModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingFuncionario(null);
        }}
        onSave={handleSaveFuncionario}
        funcionarioToEdit={editingFuncionario}
        existingCpfs={funcionarios.map((f) => f.cpf)}
      />

      {/* Modal de Confirmação de Exclusão */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingFuncionario)}
        funcionario={deletingFuncionario}
        onClose={() => setDeletingFuncionario(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Container de Toasts de Notificação */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
