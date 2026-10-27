export interface ProjectFile {
  name: string;
  path: string;
  category: 'docker' | 'backend' | 'frontend' | 'database' | 'docs';
  language: string;
  description: string;
  content: string;
}

export const PROJECT_FILES: ProjectFile[] = [
  {
    name: 'docker-compose.yml',
    path: 'docker-compose.yml',
    category: 'docker',
    language: 'yaml',
    description: 'Orquestração de contêineres: PostgreSQL (db), FastAPI (backend) e Streamlit (frontend).',
    content: `version: '3.8'

services:
  # 1. Banco de Dados PostgreSQL
  db:
    image: postgres:15-alpine
    container_name: postgres_funcionarios
    restart: always
    environment:
      POSTGRES_USER: \${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-postgres123}
      POSTGRES_DB: \${POSTGRES_DB:-empresa_db}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d empresa_db"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - app_network

  # 2. Backend Python (FastAPI + SQLAlchemy + psycopg2)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: backend_funcionarios
    restart: always
    depends_on:
      db:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://postgres:postgres123@db:5432/empresa_db
      - PORT=8000
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    networks:
      - app_network

  # 3. Frontend Python (Streamlit UI)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: frontend_funcionarios
    restart: always
    depends_on:
      - backend
    environment:
      - BACKEND_URL=http://backend:8000
    ports:
      - "8501:8501"
    volumes:
      - ./frontend:/app
    networks:
      - app_network

volumes:
  pgdata:
    driver: local

networks:
  app_network:
    driver: bridge
`
  },
  {
    name: 'Dockerfile (Backend)',
    path: 'backend/Dockerfile',
    category: 'backend',
    language: 'dockerfile',
    description: 'Imagem Docker Python 3.11 para o backend FastAPI com compilação de dependências C para psycopg2.',
    content: `FROM python:3.11-slim

# Evita que o Python gere arquivos .pyc e permite logs em tempo real
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instala dependências do sistema necessárias para compilar bibliotecas do PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \\
    gcc \\
    libpq-dev \\
    curl \\
    && rm -rf /var/lib/apt/lists/*

# Copia requisitos e instala pacotes Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código fonte da aplicação
COPY . .

EXPOSE 8000

# Executa o servidor ASGI Uvicorn com hot-reload ativo
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
`
  },
  {
    name: 'requirements.txt (Backend)',
    path: 'backend/requirements.txt',
    category: 'backend',
    language: 'text',
    description: 'Bibliotecas Python do backend: FastAPI, Uvicorn, SQLAlchemy e psycopg2-binary.',
    content: `fastapi==0.110.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.29
psycopg2-binary==2.9.9
pydantic==2.6.4
python-multipart==0.0.9
`
  },
  {
    name: 'database.py',
    path: 'backend/database.py',
    category: 'backend',
    language: 'python',
    description: 'Configuração do SQLAlchemy Engine, SessionLocal e injeção de dependência get_db().',
    content: `import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Lê URL do banco a partir das variáveis de ambiente
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:postgres123@localhost:5432/empresa_db"
)

# Cria engine do SQLAlchemy conectado ao PostgreSQL
engine = create_engine(
    DATABASE_URL, 
    pool_pre_ping=True, 
    pool_size=10, 
    max_overflow=20
)

# Fabrica sessões para cada requisição
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Classe Base declarativa para os modelos ORM
Base = declarative_base()

def get_db():
    """Dependência FastAPI que abre e fecha a sessão do banco por requisição."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
`
  },
  {
    name: 'models.py',
    path: 'backend/models.py',
    category: 'backend',
    language: 'python',
    description: 'Modelo ORM da tabela "funcionarios" no PostgreSQL com campos Nome e CPF único.',
    content: `from sqlalchemy import Column, Integer, String, Numeric, DateTime
from sqlalchemy.sql import func
from database import Base

class Funcionario(Base):
    """
    Tabela de Funcionários no PostgreSQL.
    Armazena nome, CPF (único e indexado), cargo, departamento e metadados.
    """
    __tablename__ = "funcionarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(120), nullable=False)
    cpf = Column(String(14), unique=True, index=True, nullable=False)
    cargo = Column(String(80), nullable=True)
    departamento = Column(String(60), nullable=True)
    email = Column(String(120), nullable=True)
    salario = Column(Numeric(10, 2), default=0.0)
    data_admissao = Column(String(10), nullable=True)
    status = Column(String(20), default="Ativo")
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Funcionario(id={self.id}, nome='{self.nome}', cpf='{self.cpf}')>"
`
  },
  {
    name: 'schemas.py',
    path: 'backend/schemas.py',
    category: 'backend',
    language: 'python',
    description: 'Esquemas Pydantic para validação e serialização com validação matemática de CPF.',
    content: `import re
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, field_validator

def validar_cpf_matematico(cpf: str) -> str:
    """Valida o cálculo dos 2 dígitos verificadores do CPF brasileiro."""
    numeros = re.sub(r'\\D', '', cpf)
    if len(numeros) != 11:
        raise ValueError("O CPF deve conter exatamente 11 dígitos numéricos.")
    
    # Rejeita dígitos repetidos (ex: 111.111.111-11)
    if numeros == numeros[0] * 11:
        raise ValueError("CPF inválido: sequência de dígitos repetidos.")
        
    # Valida 1º dígito
    soma = sum(int(numeros[i]) * (10 - i) for i in range(9))
    resto = (soma * 10) % 11
    if resto in (10, 11):
        resto = 0
    if resto != int(numeros[9]):
        raise ValueError("CPF inválido: 1º dígito verificador incorreto.")
        
    # Valida 2º dígito
    soma = sum(int(numeros[i]) * (11 - i) for i in range(10))
    resto = (soma * 10) % 11
    if resto in (10, 11):
        resto = 0
    if resto != int(numeros[10]):
        raise ValueError("CPF inválido: 2º dígito verificador incorreto.")
        
    # Retorna o CPF padronizado no formato 000.000.000-00
    return f"{numeros[:3]}.{numeros[3:6]}.{numeros[6:9]}-{numeros[9:]}"

class FuncionarioBase(BaseModel):
    nome: str = Field(..., min_length=3, max_length=120, description="Nome completo do funcionário")
    cpf: str = Field(..., description="CPF com ou sem pontuação")
    cargo: Optional[str] = Field(default="Analista", max_length=80)
    departamento: Optional[str] = Field(default="Geral", max_length=60)
    email: Optional[str] = Field(default=None, max_length=120)
    salario: Optional[Decimal] = Field(default=Decimal("0.0"), ge=0)
    data_admissao: Optional[str] = Field(default=None)
    status: Optional[str] = Field(default="Ativo")

    @field_validator('cpf')
    @classmethod
    def validar_cpf(cls, v: str) -> str:
        return validar_cpf_matematico(v)

class FuncionarioCreate(FuncionarioBase):
    pass

class FuncionarioUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=3, max_length=120)
    cpf: Optional[str] = None
    cargo: Optional[str] = None
    departamento: Optional[str] = None
    email: Optional[str] = None
    salario: Optional[Decimal] = None
    data_admissao: Optional[str] = None
    status: Optional[str] = None

    @field_validator('cpf')
    @classmethod
    def validar_cpf_opcional(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validar_cpf_matematico(v)
        return v

class FuncionarioResponse(FuncionarioBase):
    id: int
    criado_em: Optional[datetime] = None

    class Config:
        from_attributes = True
`
  },
  {
    name: 'crud.py',
    path: 'backend/crud.py',
    category: 'backend',
    language: 'python',
    description: 'Operações de banco de dados (Create, Read, Update, Delete) com SQLAlchemy.',
    content: `from sqlalchemy.orm import Session
from sqlalchemy import or_
import models
import schemas

def get_funcionarios(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    search: str = None, 
    status: str = None
):
    """Consulta funcionários com filtros opcionais de busca e status."""
    query = db.query(models.Funcionario)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.Funcionario.nome.ilike(search_filter),
                models.Funcionario.cpf.ilike(search_filter),
                models.Funcionario.cargo.ilike(search_filter)
            )
        )
    if status and status != "Todos":
        query = query.filter(models.Funcionario.status == status)
    return query.order_by(models.Funcionario.id.desc()).offset(skip).limit(limit).all()

def get_funcionario_by_id(db: Session, funcionario_id: int):
    """Busca um funcionário pela chave primária ID."""
    return db.query(models.Funcionario).filter(models.Funcionario.id == funcionario_id).first()

def get_funcionario_by_cpf(db: Session, cpf: str):
    """Verifica duplicidade de CPF."""
    return db.query(models.Funcionario).filter(models.Funcionario.cpf == cpf).first()

def create_funcionario(db: Session, funcionario: schemas.FuncionarioCreate):
    """Insere um novo funcionário no PostgreSQL."""
    db_obj = models.Funcionario(**funcionario.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_funcionario(db: Session, funcionario_id: int, dados: schemas.FuncionarioUpdate):
    """Atualiza dados cadastrais de um funcionário."""
    db_obj = get_funcionario_by_id(db, funcionario_id)
    if not db_obj:
        return None
    for field, value in dados.model_dump(exclude_unset=True).items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_funcionario(db: Session, funcionario_id: int):
    """Exclui um funcionário do PostgreSQL."""
    db_obj = get_funcionario_by_id(db, funcionario_id)
    if not db_obj:
        return False
    db.delete(db_obj)
    db.commit()
    return True
`
  },
  {
    name: 'main.py',
    path: 'backend/main.py',
    category: 'backend',
    language: 'python',
    description: 'Ponto de entrada FastAPI com rotas RESTful, CORS e documentação Swagger automática.',
    content: `from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

import models
import schemas
import crud
from database import engine, get_db

# Cria automaticamente as tabelas no PostgreSQL se não existirem
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API de Gerenciamento de Funcionários",
    description="Backend Python FastAPI conectado ao PostgreSQL para operações CRUD de funcionários (Nome e CPF).",
    version="1.0.0"
)

# Configuração de CORS para permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "service": "CRUD Funcionarios Backend",
        "database": "PostgreSQL"
    }

@app.get("/api/funcionarios/", response_model=List[schemas.FuncionarioResponse], tags=["Funcionários"])
def listar_funcionarios(
    skip: int = 0,
    limit: int = 100,
    busca: Optional[str] = Query(None, description="Filtrar por nome, CPF ou cargo"),
    status: Optional[str] = Query(None, description="Filtrar por status: Ativo ou Inativo"),
    db: Session = Depends(get_db)
):
    """Lista todos os funcionários cadastrados com paginação e busca."""
    return crud.get_funcionarios(db, skip=skip, limit=limit, search=busca, status=status)

@app.get("/api/funcionarios/{id}", response_model=schemas.FuncionarioResponse, tags=["Funcionários"])
def buscar_por_id(id: int, db: Session = Depends(get_db)):
    """Obtém detalhes de um funcionário específico pelo ID."""
    funcionario = crud.get_funcionario_by_id(db, id)
    if not funcionario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Funcionário com ID {id} não encontrado."
        )
    return funcionario

@app.post("/api/funcionarios/", response_model=schemas.FuncionarioResponse, status_code=status.HTTP_201_CREATED, tags=["Funcionários"])
def cadastrar_funcionario(funcionario: schemas.FuncionarioCreate, db: Session = Depends(get_db)):
    """Cadastra um novo funcionário com validação de CPF e unicidade."""
    # Verifica duplicidade de CPF
    existente = crud.get_funcionario_by_cpf(db, funcionario.cpf)
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Já existe um funcionário cadastrado com o CPF {funcionario.cpf}."
        )
    return crud.create_funcionario(db, funcionario)

@app.put("/api/funcionarios/{id}", response_model=schemas.FuncionarioResponse, tags=["Funcionários"])
def atualizar_funcionario(id: int, dados: schemas.FuncionarioUpdate, db: Session = Depends(get_db)):
    """Atualiza dados cadastrais de um funcionário."""
    # Se o CPF foi alterado, checa se já pertence a outro funcionário
    if dados.cpf:
        existente = crud.get_funcionario_by_cpf(db, dados.cpf)
        if existente and existente.id != id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"O CPF {dados.cpf} já está associado a outro funcionário."
            )
            
    funcionario = crud.update_funcionario(db, id, dados)
    if not funcionario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Funcionário com ID {id} não encontrado para atualização."
        )
    return funcionario

@app.delete("/api/funcionarios/{id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Funcionários"])
def excluir_funcionario(id: int, db: Session = Depends(get_db)):
    """Exclui um funcionário pelo ID."""
    sucesso = crud.delete_funcionario(db, id)
    if not sucesso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Funcionário com ID {id} não encontrado para exclusão."
        )
    return None
`
  },
  {
    name: 'Dockerfile (Frontend)',
    path: 'frontend/Dockerfile',
    category: 'frontend',
    language: 'dockerfile',
    description: 'Imagem Docker Python 3.11 para o frontend Streamlit na porta 8501.',
    content: `FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copia e instala dependências do Streamlit
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia código do frontend Python
COPY . .

EXPOSE 8501

# Executa Streamlit sem telemetria e aberto na porta 8501
CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0", "--browser.gatherUsageStats=false"]
`
  },
  {
    name: 'requirements.txt (Frontend)',
    path: 'frontend/requirements.txt',
    category: 'frontend',
    language: 'text',
    description: 'Bibliotecas Python do frontend: Streamlit, Requests e Pandas.',
    content: `streamlit==1.32.2
requests==2.31.0
pandas==2.2.1
`
  },
  {
    name: 'app.py (Frontend Streamlit)',
    path: 'frontend/app.py',
    category: 'frontend',
    language: 'python',
    description: 'Interface web interativa em Python puro com Streamlit consumindo a API FastAPI.',
    content: `import os
import streamlit as st
import requests
import pandas as pd

# Configuração da página Streamlit
st.set_page_config(
    page_title="Gestão de Funcionários",
    page_icon="👥",
    layout="wide",
    initial_sidebar_state="expanded"
)

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8000")

# Estilo visual limpo
st.title("Gestão de Funcionários (Python + PostgreSQL + Docker)")
st.caption("Arquitetura moderna: Frontend Streamlit + Backend FastAPI + Banco PostgreSQL")

# Menu Lateral de Navegação
aba = st.sidebar.radio(
    "Navegação",
    ["📋 Listar & Pesquisar", "➕ Cadastrar Novo", "✏️ Editar Cadastro", "🗑️ Excluir", "📊 Indicadores"]
)

# 1. ABA: LISTAR & PESQUISAR
if aba == "📋 Listar & Pesquisar":
    st.subheader("Lista de Funcionários")
    
    col1, col2 = st.columns([3, 1])
    with col1:
        termo = st.text_input("🔍 Buscar por Nome, CPF ou Cargo:")
    with col2:
        status_filtro = st.selectbox("Status:", ["Todos", "Ativo", "Inativo"])

    params = {}
    if termo:
        params["busca"] = termo
    if status_filtro != "Todos":
        params["status"] = status_filtro

    try:
        resp = requests.get(f"{BACKEND_URL}/api/funcionarios/", params=params, timeout=5)
        if resp.status_code == 200:
            dados = resp.json()
            if dados:
                df = pd.DataFrame(dados)
                # Formata colunas para visualização amigável
                cols = ["id", "nome", "cpf", "cargo", "departamento", "salario", "status"]
                st.dataframe(df[cols], use_container_width=True, hide_index=True)
                st.info(f"Total encontrado: {len(dados)} funcionário(s).")
            else:
                st.warning("Nenhum funcionário encontrado.")
        else:
            st.error(f"Erro ao carregar dados: {resp.text}")
    except Exception as e:
        st.error(f"Não foi possível conectar ao backend: {e}")

# 2. ABA: CADASTRAR NOVO
elif aba == "➕ Cadastrar Novo":
    st.subheader("Cadastrar Novo Funcionário")
    
    with st.form("form_cadastro", clear_on_submit=True):
        col1, col2 = st.columns(2)
        with col1:
            nome = st.text_input("Nome Completo *", placeholder="Ex: Lucas Pereira Silva")
            cpf = st.text_input("CPF *", placeholder="000.000.000-00 ou 11 dígitos")
            cargo = st.text_input("Cargo", placeholder="Ex: Analista de Sistemas")
        with col2:
            departamento = st.selectbox("Departamento", ["Tecnologia", "Recursos Humanos", "Financeiro", "Operações", "Vendas"])
            salario = st.number_input("Salário (R$)", min_value=0.0, value=4500.0, step=500.0)
            status = st.selectbox("Status", ["Ativo", "Inativo"])
            
        btn_salvar = st.form_submit_button("💾 Salvar Funcionário", type="primary")

        if btn_salvar:
            if not nome or not cpf:
                st.error("Preencha os campos obrigatórios (Nome e CPF).")
            else:
                payload = {
                    "nome": nome.strip(),
                    "cpf": cpf.strip(),
                    "cargo": cargo.strip(),
                    "departamento": departamento,
                    "salario": salario,
                    "status": status
                }
                try:
                    res = requests.post(f"{BACKEND_URL}/api/funcionarios/", json=payload, timeout=5)
                    if res.status_code == 201:
                        st.success(f"Funcionário '{nome}' cadastrado com sucesso!")
                    else:
                        erro = res.json().get("detail", res.text)
                        st.error(f"Erro ao cadastrar: {erro}")
                except Exception as e:
                    st.error(f"Erro de conexão: {e}")

# 3. ABA: EDITAR CADASTRO
elif aba == "✏️ Editar Cadastro":
    st.subheader("Atualizar Dados de Funcionário")
    id_edit = st.number_input("Informe o ID do Funcionário:", min_value=1, step=1)
    
    if st.button("Buscar Dados"):
        try:
            r = requests.get(f"{BACKEND_URL}/api/funcionarios/{id_edit}", timeout=5)
            if r.status_code == 200:
                st.session_state["edit_data"] = r.json()
            else:
                st.error("Funcionário não encontrado.")
        except Exception as e:
            st.error(f"Erro ao buscar: {e}")

    if "edit_data" in st.session_state and st.session_state["edit_data"].get("id") == id_edit:
        func = st.session_state["edit_data"]
        with st.form("form_edicao"):
            col1, col2 = st.columns(2)
            with col1:
                novo_nome = st.text_input("Nome", value=func.get("nome", ""))
                novo_cpf = st.text_input("CPF", value=func.get("cpf", ""))
                novo_cargo = st.text_input("Cargo", value=func.get("cargo", ""))
            with col2:
                novo_depto = st.text_input("Departamento", value=func.get("departamento", ""))
                novo_salario = st.number_input("Salário", value=float(func.get("salario", 0.0)))
                novo_status = st.selectbox("Status", ["Ativo", "Inativo"], index=0 if func.get("status") == "Ativo" else 1)
                
            if st.form_submit_button("Atualizar Informações", type="primary"):
                update_payload = {
                    "nome": novo_nome,
                    "cpf": novo_cpf,
                    "cargo": novo_cargo,
                    "departamento": novo_depto,
                    "salario": novo_salario,
                    "status": novo_status
                }
                res = requests.put(f"{BACKEND_URL}/api/funcionarios/{id_edit}", json=update_payload)
                if res.status_code == 200:
                    st.success("Cadastro atualizado com sucesso!")
                    st.session_state["edit_data"] = res.json()
                else:
                    st.error(f"Erro: {res.json().get('detail', res.text)}")

# 4. ABA: EXCLUIR
elif aba == "🗑️ Excluir":
    st.subheader("Excluir Cadastro")
    id_del = st.number_input("ID do Funcionário para exclusão definitiva:", min_value=1, step=1)
    
    if st.button("Excluir Definitivamente", type="secondary"):
        try:
            r = requests.delete(f"{BACKEND_URL}/api/funcionarios/{id_del}", timeout=5)
            if r.status_code == 204:
                st.success(f"Funcionário ID #{id_del} excluído com sucesso!")
            else:
                st.error(f"Erro: {r.json().get('detail', 'Não encontrado')}")
        except Exception as e:
            st.error(f"Erro de conexão: {e}")

# 5. ABA: INDICADORES
elif aba == "📊 Indicadores":
    st.subheader("Métricas do Quadro de Funcionários")
    try:
        resp = requests.get(f"{BACKEND_URL}/api/funcionarios/", timeout=5)
        if resp.status_code == 200:
            todos = resp.json()
            if todos:
                df = pd.DataFrame(todos)
                col1, col2, col3 = st.columns(3)
                col1.metric("Total de Funcionários", len(df))
                col2.metric("Funcionários Ativos", len(df[df["status"] == "Ativo"]))
                media_sal = float(df["salario"].mean()) if "salario" in df else 0.0
                col3.metric("Média Salarial", f"R$ {media_sal:,.2f}")
                
                st.write("Distribuição por Departamento:")
                st.bar_chart(df["departamento"].value_counts())
            else:
                st.info("Sem dados para exibir indicadores.")
    except Exception as e:
        st.error(f"Erro: {e}")
`
  },
  {
    name: 'init.sql (PostgreSQL)',
    path: 'db/init.sql',
    category: 'database',
    language: 'sql',
    description: 'Script DDL executado automaticamente na inicialização do contêiner PostgreSQL.',
    content: `-- Script de Inicialização automática do PostgreSQL
-- Executado pelo contêiner db na pasta /docker-entrypoint-initdb.d/

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

-- Índice para acelerar consultas e buscas pelo CPF
CREATE INDEX IF NOT EXISTS idx_funcionarios_cpf ON funcionarios(cpf);
CREATE INDEX IF NOT EXISTS idx_funcionarios_nome ON funcionarios(nome);

-- Registros iniciais de teste com CPFs válidos
INSERT INTO funcionarios (nome, cpf, cargo, departamento, email, salario, data_admissao, status)
VALUES
    ('Carlos Eduardo Oliveira', '714.283.950-48', 'Engenheiro de Software Senior', 'Tecnologia', 'carlos.oliveira@empresa.com.br', 12500.00, '2023-01-16', 'Ativo'),
    ('Mariana Santos Rodrigues', '852.963.741-25', 'Gerente de Recursos Humanos', 'Recursos Humanos', 'mariana.rodrigues@empresa.com.br', 9800.00, '2023-04-03', 'Ativo'),
    ('Lucas Almeida Ferreira', '369.258.147-36', 'Analista DBA PostgreSQL', 'Tecnologia', 'lucas.ferreira@empresa.com.br', 8400.00, '2023-07-20', 'Ativo'),
    ('Beatriz Lima Costa', '951.753.852-19', 'Coordenadora Financeira', 'Financeiro', 'beatriz.costa@empresa.com.br', 10200.00, '2023-09-11', 'Ativo'),
    ('Rafael Mendonça Ribeiro', '159.357.486-02', 'Desenvolvedor Python Pleno', 'Tecnologia', 'rafael.ribeiro@empresa.com.br', 7200.00, '2024-02-01', 'Inativo')
ON CONFLICT (cpf) DO NOTHING;
`
  },
  {
    name: '.env.example',
    path: '.env.example',
    category: 'docker',
    language: 'text',
    description: 'Variáveis de ambiente de exemplo para o Docker Compose.',
    content: `# Configurações do Banco de Dados PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
POSTGRES_DB=empresa_db

# URLs de Conexão interna do Docker
DATABASE_URL=postgresql://postgres:postgres123@db:5432/empresa_db
BACKEND_URL=http://backend:8000
`
  },
  {
    name: 'README.md',
    path: 'README.md',
    category: 'docs',
    language: 'markdown',
    description: 'Guia completo passo a passo para rodar com Docker Compose.',
    content: `# CRUD de Funcionários com Python, PostgreSQL e Docker

Aplicação completa de cadastro e gestão de funcionários (Nome e CPF) desenvolvida com:
- **Banco de Dados**: PostgreSQL 15 com persistência via Docker Volume
- **Backend**: Python 3.11 com FastAPI, SQLAlchemy ORM e validação de CPF matemática
- **Frontend**: Python 3.11 com Streamlit
- **Orquestração**: Docker Compose

---

## 🚀 Como Executar em 1 Passo com Docker

Certifique-se de ter o **Docker** e o **Docker Compose** instalados na sua máquina.

1. Abra o terminal na pasta raiz do projeto baixado:
\`\`\`bash
docker compose up --build
\`\`\`

2. Pronto! Os 3 serviços serão inicializados:
- **Frontend (Streamlit)**: [http://localhost:8501](http://localhost:8501)
- **Backend API (FastAPI)**: [http://localhost:8000](http://localhost:8000)
- **Documentação Interativa (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **PostgreSQL**: porta \`5432\`

---

## 🛠️ Estrutura do Projeto

\`\`\`text
├── docker-compose.yml       # Orquestração dos 3 contêineres
├── README.md                # Instruções de uso
├── .env.example             # Variáveis de ambiente padrão
├── db/
│   └── init.sql             # Criação da tabela e dados iniciais no Postgres
├── backend/
│   ├── Dockerfile           # Imagem Python com suporte a C/PostgreSQL
│   ├── requirements.txt     # FastAPI, Uvicorn, SQLAlchemy, psycopg2
│   ├── database.py          # Conexão e SessionLocal
│   ├── models.py            # Model ORM Funcionario
│   ├── schemas.py           # Validação matemática de CPF com Pydantic
│   ├── crud.py              # Operações de banco (SELECT, INSERT, UPDATE, DELETE)
│   └── main.py              # Rotas da API RESTful
└── frontend/
    ├── Dockerfile           # Imagem Python para Streamlit
    ├── requirements.txt     # Streamlit, Requests, Pandas
    └── app.py               # Interface gráfica completa em Python
\`\`\`

---

## 📡 Endpoints da API REST

| Método | Rota | Descrição |
|---|---|---|
| \`GET\` | \`/api/funcionarios/\` | Lista todos os funcionários (com busca e filtro de status) |
| \`POST\` | \`/api/funcionarios/\` | Cadastra novo funcionário com validação de CPF |
| \`GET\` | \`/api/funcionarios/{id}\` | Obtém dados de um funcionário específico |
| \`PUT\` | \`/api/funcionarios/{id}\` | Atualiza dados cadastrais |
| \`DELETE\` | \`/api/funcionarios/{id}\` | Exclui funcionário do banco de dados |

---

## 🛑 Como Parar os Contêineres

Para encerrar os contêineres:
\`\`\`bash
docker compose down
\`\`\`

Para encerrar e apagar os dados do banco de dados:
\`\`\`bash
docker compose down -v
\`\`\`
`
  }
];
