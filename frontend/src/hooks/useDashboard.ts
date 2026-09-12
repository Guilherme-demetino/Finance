import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export function useDashboard() {
  const navigate = useNavigate();
  const [dadosFinanceiros, setDadosFinanceiros] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [transacaoSelecionada, setTransacaoSelecionada] = useState<any | null>(null);

  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  const [busca, setBusca] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('TUDO');

  const dataAtual = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(String(dataAtual.getMonth() + 1));
  const [anoSelecionado, setAnoSelecionado] = useState(String(dataAtual.getFullYear()));

  const nomeUsuario = localStorage.getItem('usuarioNome') || 'Usuário';

  const buscarDados = useCallback(async () => {
    const usuarioId = localStorage.getItem('usuarioId');
    try {
      const resposta = await api.get(`/dados?usuarioId=${usuarioId}&mes=${mesSelecionado}&ano=${anoSelecionado}`);
      setDadosFinanceiros(resposta.data);
    } catch (erro) {
      console.error("Erro ao buscar dados:", erro);
    }
  }, [mesSelecionado, anoSelecionado]);

  useEffect(() => {
    const usuarioId = localStorage.getItem('usuarioId');
    if (!usuarioId) {
      navigate('/');
    } else {
      buscarDados();
    }
  }, [navigate, buscarDados]);

  function abrirModalCriacao() {
    setTransacaoSelecionada(null);
    setIsModalOpen(true);
  }

  function abrirModalEdicao(item: any) {
    setTransacaoSelecionada(item);
    setIsModalOpen(true);
  }

  function fecharModal() {
    setIsModalOpen(false);
    setTransacaoSelecionada(null);
  }

  async function deletarTransacao(id: string) {
    try {
      await api.delete(`/dados/${id}`);
      buscarDados();
    } catch (erro) {
      console.error("Erro ao deletar transação:", erro);
    }
  }

  function confirmarDeletarTodas() {
    if (dadosFinanceiros.length === 0) return;
    setIsDeleteAllModalOpen(true);
  }

  async function executarDeletarTodas() {
    const usuarioId = localStorage.getItem('usuarioId');
    try {
      await api.delete(`/dados/todas?usuarioId=${usuarioId}`);
      setIsDeleteAllModalOpen(false);
      buscarDados();
    } catch (erro) {
      console.error("Erro ao deletar todas as transações:", erro);
      setIsDeleteAllModalOpen(false);
      setMensagemErro("Não foi possível excluir todas as transações. Tente novamente.");
    }
  }

  function fazerLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('usuarioNome');
    navigate('/');
  }

  const totalReceitas = dadosFinanceiros
    .filter(item => String(item.tipo || '').trim().toUpperCase() === 'RECEITA')
    .reduce((acc, item) => acc + Number(item.valor || 0), 0);

  const totalDespesas = dadosFinanceiros
    .filter(item => String(item.tipo || '').trim().toUpperCase() === 'DESPESA')
    .reduce((acc, item) => acc + Number(item.valor || 0), 0);

  const saldoTotal = totalReceitas - totalDespesas;
  const totalMovimentado = totalReceitas + totalDespesas;
  
  const pctReceita = 100;
  const pctDespesa = totalReceitas === 0 ? 0 : Number(((totalDespesas / totalReceitas) * 100).toFixed(1));

  const pctDespesaVisual = pctDespesa > 100 ? 100 : pctDespesa;
  const pctReceitaVisual = Number((100 - pctDespesaVisual).toFixed(1));

  const transacoesFiltradas = dadosFinanceiros.filter(item => {
    const correspondeBusca = item.titulo.toLowerCase().includes(busca.toLowerCase()) || 
                             item.categoria.toLowerCase().includes(busca.toLowerCase());
                           
    const tipoItemUpper = String(item.tipo || '').trim().toUpperCase();
    const tipoFiltroUpper = String(tipoFiltro || '').trim().toUpperCase();

    const correspondeTipo = tipoFiltroUpper === 'TUDO' || tipoFiltroUpper === 'TODOS' || tipoFiltroUpper === 'TODAS' || tipoItemUpper === tipoFiltroUpper;
    
    return correspondeBusca && correspondeTipo;
  });

  return {
    nomeUsuario,
    dadosFinanceiros,
    transacoesFiltradas,
    isModalOpen,
    modoEdicao,
    transacaoSelecionada,
    isDeleteAllModalOpen,
    mensagemErro,
    busca,
    tipoFiltro,
    mesSelecionado,
    anoSelecionado,
    totalReceitas,
    totalDespesas,
    saldoTotal,
    totalMovimentado,
    pctReceita,
    pctDespesa,
    pctReceitaVisual,
    setBusca,
    setTipoFiltro,
    setMesSelecionado,
    setAnoSelecionado,
    setModoEdicao,
    abrirModalCriacao,
    abrirModalEdicao,
    fecharModal,
    deletarTransacao,
    confirmarDeletarTodas,
    executarDeletarTodas,
    setIsDeleteAllModalOpen,
    setMensagemErro,
    fazerLogout,
    buscarDados
  };
}