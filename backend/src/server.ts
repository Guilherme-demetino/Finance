import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = 'sua_chave_secreta_super_segura';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.use(cors());
app.use(express.json());

// Middleware de Proteção por Token JWT
function verificarToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Acesso negado. Token não fornecido." });
  }

  jwt.verify(token, JWT_SECRET, (err: any, usuario: any) => {
    if (err) {
      return res.status(403).json({ error: "Sessão expirada ou token inválido." });
    }
    req.usuario = usuario;
    next();
  });
}

// ROTA: Buscar Transações filtradas pelo usuário, mês e ano de forma exata (Protegida)
app.get('/api/dados', verificarToken, async (req: any, res) => {
  try {
    const { usuarioId, mes, ano } = req.query;
    
    if (!usuarioId) {
      return res.status(400).json({ error: "ID do usuário não fornecido." });
    }

    let filtro: any = { usuarioId: String(usuarioId) };

    if (mes && ano) {
      const anoNum = Number(ano);
      const mesNum = Number(mes);

      const primeiroDia = new Date(Date.UTC(anoNum, mesNum - 1, 1, 0, 0, 0, 0));
      const ultimoDia = new Date(Date.UTC(anoNum, mesNum, 0, 23, 59, 59, 999));

      filtro.criadoEm = {
        gte: primeiroDia,
        lte: ultimoDia
      };
    }

    const dados = await prisma.transacao.findMany({
      where: filtro,
      orderBy: { criadoEm: 'desc' }
    }); 

    res.json(dados);
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    res.status(500).json({ error: "Erro ao buscar dados" });
  }
});

// ROTA: Resumo Anual para o gráfico de tendências (Protegida)
app.get('/api/resumo-anual', verificarToken, async (req: any, res) => {
  try {
    const { usuarioId, ano } = req.query;
    
    if (!usuarioId || !ano) {
      return res.status(400).json({ error: "Usuário e ano são obrigatórios." });
    }

    const anoNum = Number(ano);
    const inicioAno = new Date(Date.UTC(anoNum, 0, 1, 0, 0, 0, 0));
    const fimAno = new Date(Date.UTC(anoNum, 11, 31, 23, 59, 59, 999));

    const transacoesAno = await prisma.transacao.findMany({
      where: {
        usuarioId: String(usuarioId),
        criadoEm: {
          gte: inicioAno,
          lte: fimAno
        }
      }
    });

    const resumoMeses = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      receita: 0,
      despesa: 0
    }));

    transacoesAno.forEach((t: any) => {
      if (!t.criadoEm) return;

      const mesIndex = new Date(t.criadoEm).getUTCMonth(); 
      const tipo = String(t.tipo).trim().toUpperCase(); 
      const valor = Number(t.valor) || 0; 

      if (tipo === 'RECEITA') {
        resumoMeses[mesIndex].receita += valor;
      } else if (tipo === 'DESPESA') {
        resumoMeses[mesIndex].despesa += valor;
      }
    });

    res.json(resumoMeses);
  } catch (error) {
    console.error("Erro ao buscar resumo anual:", error);
    res.status(500).json({ error: "Erro ao buscar resumo anual" });
  }
});

// ROTA: Criar Transação vinculada ao usuário logado (Protegida) com Suporte a Recorrência
app.post('/api/dados', verificarToken, async (req: any, res) => {
  try {
    const { 
      titulo, valor, tipo, categoria, usuarioId, data, 
      tipoRepeticao = 'UNICA', 
      quantidade = 1 
    } = req.body;
    
    if (!usuarioId) {
      return res.status(400).json({ error: "ID do usuário é obrigatório." });
    }

    const numVezes = Number(quantidade) > 0 ? Number(quantidade) : 1;
    const valorNumerico = Number(valor);
    
    const valorPorItem = tipoRepeticao === 'PARCELADA' ? (valorNumerico / numVezes) : valorNumerico;
    
    const dataBase = data ? new Date(`${data}T12:00:00.000Z`) : new Date();
    const transacoesParaSalvar = [];

    for (let i = 1; i <= numVezes; i++) {
      const dataParcela = new Date(dataBase.getTime());
      dataParcela.setUTCMonth(dataParcela.getUTCMonth() + (i - 1));

      let tituloFinal = titulo;
      if (tipoRepeticao !== 'UNICA' && numVezes > 1) {
        tituloFinal = `${titulo} (${i}/${numVezes})`;
      }

      transacoesParaSalvar.push({
        titulo: tituloFinal,
        valor: Number(valorPorItem.toFixed(2)),
        tipo: String(tipo).trim().toUpperCase(),
        categoria,
        usuarioId,
        criadoEm: dataParcela
      });
    }
    
    await Promise.all(
      transacoesParaSalvar.map(t => prisma.transacao.create({ data: t }))
    );
    
    res.status(201).json({ message: `${numVezes} transação(ões) criada(s) com sucesso!` });
  } catch (error) {
    console.error("Erro ao salvar transação:", error);
    res.status(500).json({ error: "Erro ao salvar a transação." });
  }
});

// ROTA: Importação em Lote via CSV (Limpeza total prévia por usuário)
app.post('/api/dados/importar', verificarToken, async (req: any, res) => {
  try {
    const { transacoes, usuarioId } = req.body;

    if (!usuarioId) {
      return res.status(400).json({ error: "ID do usuário é obrigatório." });
    }

    if (!transacoes || !Array.isArray(transacoes) || transacoes.length === 0) {
      return res.status(400).json({ error: "Lista de transações inválida ou vazia." });
    }

    const transacoesUnicas = Array.from(
      new Map(
        transacoes.map((t: any) => [
          `${t.titulo}_${t.valor}_${t.tipo}_${t.data}`, 
          t
        ])
      ).values()
    );

    const dadosParaSalvar = transacoesUnicas.map((t: any) => ({
      titulo: t.titulo,
      valor: Number(t.valor),
      tipo: String(t.tipo).trim().toUpperCase(),
      categoria: t.categoria || 'Outros',
      usuarioId: String(usuarioId),
      criadoEm: t.data ? new Date(`${t.data}T12:00:00.000Z`) : new Date()
    }));

    await prisma.transacao.deleteMany({
      where: {
        usuarioId: String(usuarioId)
      }
    });

    await prisma.transacao.createMany({
      data: dadosParaSalvar
    });

    res.status(201).json({ message: `${dadosParaSalvar.length} transações importadas com sucesso!` });
  } catch (error) {
    console.error("Erro na importação:", error);
    res.status(500).json({ error: "Erro ao importar transações." });
  }
});

// ROTA: Atualizar Transação (Protegida)
app.put('/api/dados/:id', verificarToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { titulo, valor, tipo, categoria, data } = req.body;

    const transacaoAtualizada = await prisma.transacao.update({
      where: { id },
      data: {
        titulo,
        valor: Number(valor),
        tipo: String(tipo).trim().toUpperCase(),
        categoria,
        ...(data && { criadoEm: new Date(`${data}T12:00:00.000Z`) })
      }
    });

    res.status(200).json(transacaoAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar transação:", error);
    res.status(500).json({ error: "Erro ao atualizar a transação." });
  }
});

// ROTA: Deletar TODAS as transações do usuário (Limpeza Global Completa)
app.delete('/api/dados/todas', verificarToken, async (req: any, res) => {
  try {
    const { usuarioId } = req.query;

    if (!usuarioId) {
      return res.status(400).json({ error: "ID do usuário é obrigatório." });
    }

    const resultado = await prisma.transacao.deleteMany({
      where: {
        usuarioId: String(usuarioId)
      }
    });

    res.json({ message: `Banco limpo com sucesso! ${resultado.count} transações removidas.` });
  } catch (error) {
    console.error("Erro ao limpar banco:", error);
    res.status(500).json({ error: "Erro ao limpar dados." });
  }
});

// ROTA: Deletar Transação com verificação de existência (Protegida)
app.delete('/api/dados/:id', verificarToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    const transacaoExiste = await prisma.transacao.findUnique({
      where: { id }
    });

    if (!transacaoExiste) {
      return res.status(404).json({ error: "Transação não encontrada ou já foi excluída." });
    }

    await prisma.transacao.delete({
      where: { id }
    });

    res.json({ message: "Transação excluída com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir:", error);
    res.status(500).json({ error: "Erro ao excluir transação." });
  }
});

// ROTA: Cadastrar Usuário (Com Hash)
app.post('/api/cadastro', async (req: any, res: any) => {
  try {
    const { nome, email, senha } = req.body;
    
    if (!nome || !email || !senha) {
      return res.status(400).json({ error: "Nome, e-mail e senha são obrigatórios." });
    }

    const usuarioExiste = await prisma.usuario.findUnique({ where: { email } });
    if (usuarioExiste) {
      return res.status(400).json({ error: "E-mail já cadastrado." });
    }

    const salt = await bcrypt.genSalt(10);
    const senhaCriptografada = await bcrypt.hash(senha, salt);

    const novoUsuario = await prisma.usuario.create({
      data: { 
        id: crypto.randomUUID(),
        nome, 
        email, 
        senhaHash: senhaCriptografada,
        atualizadoEm: new Date()
      }
    });

    res.status(201).json(novoUsuario);
  } catch (error) {
    console.error("ERRO NO CADASTRO:", error);
    res.status(500).json({ error: "Erro interno ao cadastrar usuário." });
  }
});

// ROTA: Fazer Login (Com emissão de Token JWT)
app.post('/api/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash!);
    
    if (!senhaValida) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    const token = jwt.sign({ id: usuario.id, email: usuario.email }, JWT_SECRET, { expiresIn: '1d' });

    res.json({ message: "Login aprovado!", token, id: usuario.id, nome: usuario.nome });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao fazer login." });
  }
});

// ==========================================
// ROTAS DE CONFIGURAÇÕES DE CONTA (ATUALIZAR DADOS, SENHA, DELETAR)
// ==========================================

// ROTA: Atualizar Nome ou E-mail (Exige senha atual se o e-mail mudar)
app.put('/api/usuarios/:id', verificarToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { nome, email, senhaAtual } = req.body;

    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    if (email && email !== usuario.email) {
      if (!senhaAtual) {
        return res.status(400).json({ error: "Digite sua senha atual para alterar o e-mail." });
      }
      const senhaValida = await bcrypt.compare(senhaAtual, usuario.senhaHash!);
      if (!senhaValida) {
        return res.status(400).json({ error: "Senha atual incorreta." });
      }

      const emailEmUso = await prisma.usuario.findUnique({ where: { email } });
      if (emailEmUso) {
        return res.status(400).json({ error: "Este e-mail já está cadastrado por outro usuário." });
      }
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(email && { email }),
        atualizadoEm: new Date()
      }
    });

    res.json({ message: "Dados atualizados com sucesso!", usuario: usuarioAtualizado });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ error: "Erro interno ao atualizar dados." });
  }
});

// ROTA: Alterar Senha de Acesso
app.put('/api/usuarios/:id/senha', verificarToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { senhaAtual, senhaAntiga, novaSenha } = req.body;

    const senhaParaTestar = senhaAtual || senhaAntiga;

    if (!senhaParaTestar || !novaSenha) {
      return res.status(400).json({ error: "Preencha a senha atual e a nova senha." });
    }

    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const senhaValida = await bcrypt.compare(senhaParaTestar, usuario.senhaHash!);
    if (!senhaValida) {
      return res.status(400).json({ error: "Senha atual incorreta." });
    }

    const salt = await bcrypt.genSalt(10);
    const senhaCriptografada = await bcrypt.hash(novaSenha, salt);

    await prisma.usuario.update({
      where: { id },
      data: { 
        senhaHash: senhaCriptografada,
        atualizadoEm: new Date()
      }
    });

    res.json({ message: "Senha alterada com sucesso!" });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    res.status(500).json({ error: "Erro interno ao alterar senha." });
  }
});

// ROTA: Deletar Conta do Usuário
app.delete('/api/usuarios/:id', verificarToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const senhaDigitada = req.body.senha || req.body.senhaAtual || req.body.senhaAntiga;

    if (!senhaDigitada) {
      return res.status(400).json({ error: "Digite sua senha para confirmar a exclusão." });
    }

    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const senhaValida = await bcrypt.compare(senhaDigitada, usuario.senhaHash!);
    if (!senhaValida) {
      return res.status(400).json({ error: "Senha incorreta." });
    }

    await prisma.transacao.deleteMany({ where: { usuarioId: id } });
    await prisma.usuario.delete({ where: { id } });

    res.json({ message: "Conta excluída com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar conta:", error);
    res.status(500).json({ error: "Erro interno ao excluir conta." });
  }
});

// ==========================================

// ROTA: Solicitar recuperação de senha (Gera o código e envia e-mail)
app.post('/api/esqueci-senha', async (req, res) => {
  try {
    const { email } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      return res.json({ message: "Se o e-mail existir, um código será enviado." });
    }

    const codigoReset = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracao = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        resetToken: codigoReset,
        resetTokenExpiracao: expiracao
      }
    });

    const mailOptions = {
      from: 'seusistema.app@gmail.com',
      to: email, 
      subject: 'Recuperação de Senha - Dashboard Financeiro',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #10b981;">Recuperação de Senha</h2>
          <p>Olá, ${usuario.nome}!</p>
          <p>Você solicitou a redefinição da sua senha. Aqui está o seu código de segurança:</p>
          <div style="background-color: #f4f4f5; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; border-radius: 8px; margin: 20px 0;">
            ${codigoReset}
          </div>
          <p>Este código é válido por <strong>15 minutos</strong>.</p>
          <p style="font-size: 12px; color: #71717a; margin-top: 40px;">Se você não solicitou isso, pode ignorar este e-mail.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Código enviado com sucesso para o seu e-mail!" });
  } catch (error) {
    console.error("Erro no esqueci-senha:", error);
    res.status(500).json({ error: "Erro ao processar sua solicitação." });
  }
});

// ROTA: Redefinir a senha usando o código
app.post('/api/redefinir-senha', async (req, res) => {
  try {
    const { email, codigo, novaSenha } = req.body;

    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario || usuario.resetToken !== codigo || !usuario.resetTokenExpiracao) {
      return res.status(400).json({ error: "Código inválido ou incorreto." });
    }

    if (new Date() > usuario.resetTokenExpiracao) {
      return res.status(400).json({ error: "O código expirou. Solicite um novo." });
    }

    const salt = await bcrypt.genSalt(10);
    const senhaCriptografada = await bcrypt.hash(novaSenha, salt);

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        senhaHash: senhaCriptografada,
        resetToken: null,
        resetTokenExpiracao: null
      }
    });

    res.json({ message: "Senha redefinida com sucesso!" });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    res.status(500).json({ error: "Erro ao redefinir senha." });
  }
});

// Inicialização do Servidor
app.listen(3333, () => {
  console.log('🚀 Servidor rodando na porta 3333');
});