import React, { useState } from 'react';
import { Funcionario } from '../types';
import { Send, CheckCircle, Copy, Check, Terminal, ExternalLink, Code } from 'lucide-react';
import { generateValidCPF } from '../utils/cpf';

interface ApiTesterProps {
  funcionarios: Funcionario[];
  onCreateMock: (nome: string, cpf: string) => void;
  onDeleteMock: (id: number) => void;
}

export const ApiTester: React.FC<ApiTesterProps> = ({
  funcionarios,
  onCreateMock,
  onDeleteMock,
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('GET_ALL');
  const [targetId, setTargetId] = useState<number>(1);
  const [postNome, setPostNome] = useState('Mariana Teixeira Santos');
  const [postCpf, setPostCpf] = useState(() => generateValidCPF());
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<unknown | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const endpoints = [
    {
      id: 'GET_ALL',
      method: 'GET',
      path: '/api/funcionarios/',
      desc: 'Lista todos os funcionários cadastrados',
    },
    {
      id: 'GET_ONE',
      method: 'GET',
      path: '/api/funcionarios/{id}',
      desc: 'Busca funcionário por ID',
    },
    {
      id: 'POST_ONE',
      method: 'POST',
      path: '/api/funcionarios/',
      desc: 'Cadastra novo funcionário com validação de CPF',
    },
    {
      id: 'PUT_ONE',
      method: 'PUT',
      path: '/api/funcionarios/{id}',
      desc: 'Atualiza dados de um funcionário existente',
    },
    {
      id: 'DELETE_ONE',
      method: 'DELETE',
      path: '/api/funcionarios/{id}',
      desc: 'Exclui funcionário pelo ID',
    },
  ];

  const getCurlCommand = () => {
    switch (selectedEndpoint) {
      case 'GET_ALL':
        return `curl -X GET "http://localhost:8000/api/funcionarios/" -H "accept: application/json"`;
      case 'GET_ONE':
        return `curl -X GET "http://localhost:8000/api/funcionarios/${targetId}" -H "accept: application/json"`;
      case 'POST_ONE':
        return `curl -X POST "http://localhost:8000/api/funcionarios/" \\
  -H "Content-Type: application/json" \\
  -d '{"nome": "${postNome}", "cpf": "${postCpf}", "cargo": "Desenvolvedor Python", "departamento": "Tecnologia", "salario": 7500.00, "status": "Ativo"}'`;
      case 'PUT_ONE':
        return `curl -X PUT "http://localhost:8000/api/funcionarios/${targetId}" \\
  -H "Content-Type: application/json" \\
  -d '{"cargo": "Líder Técnico", "salario": 9200.00}'`;
      case 'DELETE_ONE':
        return `curl -X DELETE "http://localhost:8000/api/funcionarios/${targetId}" -H "accept: application/json"`;
      default:
        return '';
    }
  };

  const handleExecute = () => {
    if (selectedEndpoint === 'GET_ALL') {
      setResponseStatus(200);
      setResponseBody(funcionarios);
    } else if (selectedEndpoint === 'GET_ONE') {
      const found = funcionarios.find((f) => f.id === Number(targetId));
      if (found) {
        setResponseStatus(200);
        setResponseBody(found);
      } else {
        setResponseStatus(404);
        setResponseBody({ detail: `Funcionário com ID ${targetId} não encontrado.` });
      }
    } else if (selectedEndpoint === 'POST_ONE') {
      onCreateMock(postNome, postCpf);
      setResponseStatus(201);
      setResponseBody({
        id: funcionarios.length + 1,
        nome: postNome,
        cpf: postCpf,
        cargo: 'Desenvolvedor Python',
        departamento: 'Tecnologia',
        salario: 7500.0,
        status: 'Ativo',
        criado_em: new Date().toISOString(),
      });
      // Gera novo CPF para a próxima requisição
      setPostCpf(generateValidCPF());
    } else if (selectedEndpoint === 'PUT_ONE') {
      const found = funcionarios.find((f) => f.id === Number(targetId));
      if (found) {
        setResponseStatus(200);
        setResponseBody({
          ...found,
          cargo: 'Líder Técnico',
          salario: 9200.0,
        });
      } else {
        setResponseStatus(404);
        setResponseBody({ detail: `Funcionário com ID ${targetId} não encontrado.` });
      }
    } else if (selectedEndpoint === 'DELETE_ONE') {
      const found = funcionarios.find((f) => f.id === Number(targetId));
      if (found) {
        onDeleteMock(Number(targetId));
        setResponseStatus(204);
        setResponseBody(null);
      } else {
        setResponseStatus(404);
        setResponseBody({ detail: `Funcionário com ID ${targetId} não encontrado.` });
      }
    }
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(getCurlCommand());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              Documentação Swagger & Testador da API FastAPI
            </h2>
            <p className="text-xs text-slate-400">
              No Docker, esta documentação interativa fica disponível em{' '}
              <span className="text-emerald-400 font-mono">http://localhost:8000/docs</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Lista de Endpoints */}
        <div className="lg:col-span-5 space-y-2">
          {endpoints.map((ep) => {
            const isSelected = selectedEndpoint === ep.id;
            return (
              <button
                key={ep.id}
                onClick={() => {
                  setSelectedEndpoint(ep.id);
                  setResponseStatus(null);
                  setResponseBody(null);
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500/60 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900/90'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                      ep.method === 'GET'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : ep.method === 'POST'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : ep.method === 'PUT'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs text-slate-200 font-medium">
                    {ep.path}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 pl-0.5">{ep.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Painel de Execução & Resposta */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                Parâmetros da Requisição
              </span>
              <button
                onClick={handleCopyCurl}
                className="inline-flex items-center gap-1 text-[11px] text-slate-300 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition-colors"
              >
                {copiedCurl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    Copiar cURL
                  </>
                )}
              </button>
            </div>

            {/* Inputs dinâmicos dependendo do endpoint */}
            {(selectedEndpoint === 'GET_ONE' ||
              selectedEndpoint === 'PUT_ONE' ||
              selectedEndpoint === 'DELETE_ONE') && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  ID do Funcionário (Path Parameter):
                </label>
                <input
                  type="number"
                  min="1"
                  value={targetId}
                  onChange={(e) => setTargetId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            )}

            {selectedEndpoint === 'POST_ONE' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">Nome:</label>
                  <input
                    type="text"
                    value={postNome}
                    onChange={(e) => setPostNome(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    CPF (Validação Pydantic):
                  </label>
                  <input
                    type="text"
                    value={postCpf}
                    onChange={(e) => setPostCpf(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Comando cURL gerado */}
            <div className="bg-slate-950 rounded-md p-3 border border-slate-800/80 font-mono text-[11px] text-slate-300 overflow-x-auto">
              <pre>{getCurlCommand()}</pre>
            </div>

            {/* Botão de Enviar Requisição */}
            <div className="flex justify-end">
              <button
                onClick={handleExecute}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Testar Requisição
              </button>
            </div>
          </div>

          {/* Resposta HTTP */}
          {responseStatus !== null && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
              <div className="p-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Resposta do Servidor</span>
                <span
                  className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                    responseStatus >= 200 && responseStatus < 300
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  HTTP {responseStatus}
                </span>
              </div>
              <div className="p-4 bg-slate-950 font-mono text-xs overflow-x-auto max-h-72">
                <pre className="text-emerald-300">
                  {responseBody ? JSON.stringify(responseBody, null, 2) : '204 No Content (Sem corpo)'}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
