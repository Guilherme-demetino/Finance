import { useState } from 'react';
import NovaTransacaoModal from '../components/NovaTransacaoModal';
import FiltroPeriodo from '../components/FiltroPeriodo';
import FiltroHistorico from '../components/FiltroHistorico';
import MetaOrcamento from '../components/MetaOrcamento';
import ResumoCards from '../components/ResumoCards';
import PainelAnalise from '../components/PainelAnalise';
import ListaHistorico from '../components/ListaHistorico';
import VisaoAnual from '../components/VisaoAnual';
import { useDashboard } from '../hooks/useDashboard';
import { exportarParaExcel } from '../utils/exportarExcel';
import ImportacaoCsvModal from '../components/ImportacaoCsvModal';
import SidebarConfiguracoes from '../components/SidebarConfiguracoes';

export default function Dashboard() {
  const {
    nomeUsuario,
    dadosFinanceiros,
    transacoesFiltradas,
    isModalOpen,
    modoEdicao,
    transacaoSelecionada,
    isDeleteAllModalOpen,
    busca,
    tipoFiltro,
    mesSelecionado,
    anoSelecionado,
    totalReceitas,
    totalDespesas,
    saldoTotal,
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
    fazerLogout,
    buscarDados
  } = useDashboard();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ordenacao, setOrdenacao] = useState('data-desc');

  const transacoesOrdenadas = [...(transacoesFiltradas || [])].sort((a, b) => {
    if (ordenacao === 'valor-desc') return Number(b.valor || 0) - Number(a.valor || 0);
    if (ordenacao === 'valor-asc') return Number(a.valor || 0) - Number(b.valor || 0);
    
    const dataA = new Date(a.criadoEm || a.createdAt || a.data || a.created_at || 0).getTime();
    const dataB = new Date(b.criadoEm || b.createdAt || b.data || b.created_at || 0).getTime();
    
    return ordenacao === 'data-asc' ? dataA - dataB : dataB - dataA;
  });

  return (
    /* CONTÊINER PRINCIPAL ATUALIZADO: Fundo claro no modo light e preto no dark mode */
    <div className="min-h-screen bg-slate-100 dark:bg-black text-slate-900 dark:text-white p-6 md:p-10 font-sans selection:bg-zinc-800 selection:text-white transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Cabeçalho */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-300 dark:border-zinc-800 pb-6 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">Olá, <span className="text-slate-900 dark:text-white font-bold">{nomeUsuario || 'Usuário'}</span></p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <FiltroPeriodo 
              mes={mesSelecionado}
              ano={anoSelecionado}
              onChangeMes={setMesSelecionado}
              onChangeAno={setAnoSelecionado}
            />

            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all hidden md:block shadow-sm"
            >
              Importar CSV
            </button>

            <button 
              onClick={() => exportarParaExcel(dadosFinanceiros || [], mesSelecionado, anoSelecionado)}
              className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
            >
              Baixar Excel
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={abrirModalCriacao}
              className="bg-black text-white dark:bg-white dark:text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 shadow-md"
            >
              + Nova Transação
            </button>
            
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white shadow-sm"
              title="Configurações"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Resumo */}
        <ResumoCards 
          totalReceitas={totalReceitas || 0} 
          totalDespesas={totalDespesas || 0} 
          saldoTotal={saldoTotal || 0} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-bold text-lg uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Histórico do Período</h2>
                
                <div className="flex items-center gap-2">
                  {modoEdicao && dadosFinanceiros?.length > 0 && (
                    <button 
                      onClick={confirmarDeletarTodas} 
                      className="bg-red-950/40 border border-red-900/50 text-red-400 hover:bg-red-900/40 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Excluir Todas
                    </button>
                  )}

                  <button 
                    onClick={() => setModoEdicao(!modoEdicao)} 
                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors ${
                      modoEdicao ? 'bg-black text-white dark:bg-white dark:text-black font-extrabold' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white border border-zinc-300 dark:border-zinc-800 shadow-sm'
                    }`}
                  >
                    {modoEdicao ? 'Concluir Edição' : 'Editar'}
                  </button>
                </div>
              </div>
              
              <FiltroHistorico 
                busca={busca || ''}
                setBusca={setBusca}
                tipoFiltro={tipoFiltro || 'TUDO'}
                setTipoFiltro={setTipoFiltro}
                ordenacao={ordenacao}
                setOrdenacao={setOrdenacao}
              />

              <ListaHistorico 
                transacoes={transacoesOrdenadas}
                modoEdicao={modoEdicao}
                onEditar={abrirModalEdicao}
                onDeletar={deletarTransacao}
              />
            </div>

            <div className="pt-4">
              <MetaOrcamento 
                totalDespesas={totalDespesas || 0} 
                totalReceitas={totalReceitas || 0} 
              />
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <PainelAnalise transacoes={dadosFinanceiros || []} />
          </div>
        </div>

        <VisaoAnual 
          usuarioId={typeof window !== 'undefined' ? localStorage.getItem('usuarioId') : null} 
          anoSelecionado={Number(anoSelecionado) || new Date().getFullYear()} 
          triggerAtualizacao={dadosFinanceiros} 
        />
      </div>

      <NovaTransacaoModal 
        isOpen={isModalOpen} 
        onClose={fecharModal} 
        transacaoEditando={transacaoSelecionada}
        mesSelecionado={mesSelecionado}
        anoSelecionado={anoSelecionado}
        onTransacaoSalva={() => {
          fecharModal();
          buscarDados();
        }} 
      />

      {/* COMPONENTE DE IMPORTAÇÃO CSV */}
      <ImportacaoCsvModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportacaoSucesso={(primeiraData?: string) => {
          if (primeiraData) {
            const [ano, mes] = primeiraData.split('-');
            if (ano && mes) {
              setAnoSelecionado(ano);
              setMesSelecionado(String(parseInt(mes, 10)));
            }
          }
          buscarDados(); 
        }}
      />

      {/* MODAL PERSONALIZADO DE EXCLUSÃO EM MASSA */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Excluir todas as transações?</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Esta ação é irreversível e apagará permanentemente todos os registros financeiros salvos para este período.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={executarDeletarTodas}
                className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)]"
              >
                Sim, excluir tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR DE CONFIGURAÇÕES */}
      <SidebarConfiguracoes 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onLogout={fazerLogout}
      />
    </div>
  );
}