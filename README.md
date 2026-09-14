# 💰 Dashboard Financeiro Fullstack

<div align="center">
  <p><b>Sistema web de gestão financeira pessoal de alta performance com controle inteligente de fluxo de caixa, tendências anuais e segurança avançada.</b></p>
</div>

<br>

## 🚀 Sobre o Projeto

O **Dashboard Financeiro** é uma aplicação fullstack desenvolvida para proporcionar um controle completo, ágil e visual das finanças pessoais. O sistema oferece suporte à criação de receitas e despesas, gestão de categorias customizáveis, parcelamentos/recorrências automáticas, importação em lote via arquivos CSV, exportação para Excel e análises detalhadas de tendências mensais e anuais.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando uma stack moderna compatível com os padrões exigidos pelo mercado de desenvolvimento web:

### **Frontend**
* **React** com **TypeScript** (Tipagem estática e componentização escalável)
* **Tailwind CSS** (Estilização moderna e design responsivo)
* **React Router DOM** (Gerenciamento de rotas protegidas)
* **Axios** (Comunicação HTTP com interceptadores de token JWT)

### **Backend**
* **Node.js** com **Express** (API REST robusta)
* **Prisma ORM** (Mapeamento objeto-relacional seguro e migrações eficientes)
* **SQLite** (Banco de dados embutido, configurado para facilitar a execução no ambiente de desenvolvimento)
* **JWT (JSON Web Tokens)** & **Bcrypt.js** (Autenticação segura e criptografia de senhas)
* **Nodemailer** (Serviço automatizado de envio de e-mails para recuperação de senha)

---

## ✨ Principais Funcionalidades

- **Autenticação Completa & Segurança:** Sistema seguro de cadastro, login com JWT, redefinição de senha via código enviado por e-mail e gerenciamento de perfil com reautenticação obrigatória para alteração de e-mail/exclusão de conta.
- **Gestão de Transações Dinâmica:** Adição, edição e remoção de receitas e despesas com suporte a transações parceladas ou recorrentes.
- **Filtros e Histórico Avançado:** Filtragem precisa por período (mês e ano), busca textual e ordenação inteligente.
- **Gráficos e Indicadores Visuais:** Painel analítico de distribuição de gastos e visão anual consolidadada por mês.
- **Importação e Exportação de Dados:** Capacidade de importar dados em massa via planilhas CSV e exportar relatórios diretamente para Excel.
- **Gerenciamento de Categorias:** Criação de categorias customizadas salvas localmente para agilizar o lançamento de despesas e receitas.

---

## ⚙️ Como Executar o Projeto Localmente

Certifique-se de ter o **Node.js** e o **Git** instalados em sua máquina.

### 1. Clonar o Repositório
```bash
git clone https://github.com/Guilherme-demetino/Finance.git


### 2. Inicialize o banco de dados executando as migrações do Prisma:
npx prisma migrate dev

### 3. Configurar e Executar o Backend
Abra o terminal, acesse a pasta do servidor e instale as dependências:
```bash
cd Finance/backend
npm install 
inicie o servidor backend 
cd Finance/backend 
npm run dev

### 4. Configurar e Iniciar o Frontend
Abra um **novo terminal** (mantenha o terminal do backend rodando), acesse a pasta do frontend e instale as dependências:
```bash
cd frontend
# ou 'cd ../frontend' caso ainda esteja dentro da pasta backend
npm install
inicie o servidor frontend 
cd Finance/frontend 
npm run dev


### 5. Acesso à Aplicação
Com o banco de dados configurado, o backend rodando em um terminal e o frontend rodando em outro, abra o seu navegador e acesse a URL local fornecida pelo Vite:
* 👉 **Acessar o Dashboard:** `http://localhost:5173`