export interface Funcionario {
  id: number;
  nome: string;
  cpf: string;
  cargo: string;
  departamento: string;
  email: string;
  salario: number;
  data_admissao: string;
  status: 'Ativo' | 'Inativo';
  criado_em: string;
}

export type CreateFuncionarioDTO = Omit<Funcionario, 'id' | 'criado_em'>;

export type UpdateFuncionarioDTO = Partial<CreateFuncionarioDTO>;

export interface SQLLogEntry {
  id: string;
  timestamp: string;
  query: string;
  params?: Record<string, unknown> | unknown[];
  executionTimeMs: number;
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'DDL';
  rowsAffected?: number;
}

export interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  status: number;
  durationMs: number;
  payload?: unknown;
  response?: unknown;
}
