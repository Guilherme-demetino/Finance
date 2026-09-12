import { useState, useEffect } from 'react';
import { api } from '../api';

interface SidebarConfiguracoesProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export default function SidebarConfiguracoes({ isOpen, onClose, onLogout }: SidebarConfiguracoesProps) {
  const [telaAtiva, setTelaAtiva] = useState<'MENU' | 'SOBRE' | 'DADOS'>('MENU');
  
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [emailOriginal, setEmailOriginal] = useState('');
  const [senhaConfirmacaoEmail, setSenhaConfirmacaoEmail] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Estados para alteração de senha
  const [alterandoSenha, setAlterandoSenha] = useState(false);
  const [senhaAntiga, setSenhaAntiga] = useState('');
  const [novaSenha, setNovaSenha] = useState('');

  // Estados para exclusão de conta (Modal Centralizado)
  const [modalDeletarAberto, setModalDeletarAberto] = useState(false);
  const [senhaConfirmacaoDeletar, setSenhaConfirmacaoDeletar] = useState('');
  const [deletando, setDeletando] = useState(false);

  // Sistema de Notificação Visual Personalizada
  const [mensagemFeedback, setMensagemFeedback] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);

  const dispararMensagem = (texto: string, tipo: 'sucesso' | 'erro') => {
    setMensagemFeedback({ texto, tipo });
    setTimeout(() => {
      setMensagemFeedback(null);
    }, 4000);
  };

  useEffect(() => {
    if (isOpen) {
      setTelaAtiva('MENU');
      const nomeSalvo = localStorage.getItem('usuarioNome') || '';
      const emailSalvo = localStorage.getItem('usuarioEmail') || '';
      setNome(nomeSalvo);
      setEmail(emailSalvo);
      setEmailOriginal(emailSalvo);
      setSenhaConfirmacaoEmail('');
      setAlterandoSenha(false);
      setSenhaAntiga('');
      setNovaSenha('');
      setModalDeletarAberto(false);
      setSenhaConfirmacaoDeletar('');
      setMensagemFeedback(null);
    }
  }, [isOpen]);

  const handleSalvarDados = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemFeedback(null);

    const emailMudou = email !== emailOriginal;
    if (emailMudou && !senhaConfirmacaoEmail) {
      dispararMensagem('Digite sua senha atual para autorizar a alteração do e-mail.', 'erro');
      return;
    }

    setSalvando(true);

    try {
      const userId = localStorage.getItem('usuarioId');
      
      await api.put(`/usuarios/${userId}`, {
        nome,
        email,
        ...(emailMudou ? { senhaAtual: senhaConfirmacaoEmail } : {})
      });

      localStorage.setItem('usuarioNome', nome);
      localStorage.setItem('usuarioEmail', email);
      setEmailOriginal(email);
      setSenhaConfirmacaoEmail('');
      
      dispararMensagem('Dados atualizados com sucesso!', 'sucesso');
      setTimeout(() => setTelaAtiva('MENU'), 1200);
    } catch (error: any) {
      dispararMensagem(error.response?.data?.error || 'Erro ao atualizar os dados. Verifique a senha.', 'erro');
    } finally {
      setSalvando(false);
    }
  };

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemFeedback(null);

    if (!senhaAntiga || !novaSenha) {
      dispararMensagem('Preencha a senha atual e a nova senha.', 'erro');
      return;
    }
    if (novaSenha.length < 6) {
      dispararMensagem('A nova senha deve ter pelo menos 6 caracteres.', 'erro');
      return;
    }

    setSalvando(true);
    try {
      const userId = localStorage.getItem('usuarioId');
      
      await api.put(`/usuarios/${userId}/senha`, {
        senhaAtual: senhaAntiga,
        senhaAntiga: senhaAntiga,
        novaSenha
      });

      dispararMensagem('Senha alterada com sucesso!', 'sucesso');
      setSenhaAntiga('');
      setNovaSenha('');
      setTimeout(() => setAlterandoSenha(false), 1200);
    } catch (error: any) {
      dispararMensagem(error.response?.data?.error || 'Senha atual incorreta.', 'erro');
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletarConta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senhaConfirmacaoDeletar) {
      dispararMensagem('Digite sua senha para confirmar a exclusão.', 'erro');
      return;
    }

    setDeletando(true);
    try {
      const userId = localStorage.getItem('usuarioId');
      
      await api.delete(`/usuarios/${userId}`, {
        headers: {
          'Content-Type': 'application/json'
        },
        data: { 
          senha: senhaConfirmacaoDeletar,
          senhaAtual: senhaConfirmacaoDeletar,
          senhaAntiga: senhaConfirmacaoDeletar
        }
      });
      
      localStorage.clear();
      onLogout();
    } catch (error: any) {
      dispararMensagem(error.response?.data?.error || 'Senha incorreta.', 'erro');
      setDeletando(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* PAINEL LATERAL DE CONFIGURAÇÕES */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-zinc-950 border-l border-zinc-900 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            {telaAtiva !== 'MENU' && (
              <button 
                onClick={() => { setTelaAtiva('MENU'); setAlterandoSenha(false); setMensagemFeedback(null); }} 
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-white">
              {telaAtiva === 'MENU' ? 'Configurações' : telaAtiva === 'DADOS' ? 'Alterar Dados' : 'Sobre'}
            </h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* FEEDBACK VISUAL */}
        {mensagemFeedback && (
          <div className={`mx-6 mt-4 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 border shadow-xl animate-fade-in ${
            mensagemFeedback.tipo === 'sucesso' 
              ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400' 
              : 'bg-red-950/40 border-red-900/50 text-red-400'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mensagemFeedback.tipo === 'sucesso' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              )}
            </svg>
            <span>{mensagemFeedback.texto}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          
          {telaAtiva === 'MENU' && (
            <div className="space-y-3 flex-1">
              <button 
                onClick={() => { setTelaAtiva('DADOS'); setMensagemFeedback(null); }}
                className="w-full flex items-center justify-between p-4 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-900 rounded-2xl transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">Alterar Dados</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button 
                onClick={() => { setTelaAtiva('SOBRE'); setMensagemFeedback(null); }}
                className="w-full flex items-center justify-between p-4 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-900 rounded-2xl transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">Sobre o Sistema</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="pt-4 mt-4 border-t border-zinc-900">
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-sm font-bold text-red-500 group-hover:text-red-400 transition-colors">Sair da Conta</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {telaAtiva === 'DADOS' && (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              
              {!alterandoSenha ? (
                <form onSubmit={handleSalvarDados} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-zinc-400 uppercase tracking-wider">Nome</label>
                    <input 
                      type="text" value={nome} onChange={e => setNome(e.target.value)} required
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-zinc-500 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-zinc-400 uppercase tracking-wider">E-mail</label>
                    <input 
                      type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-zinc-500 text-sm font-medium"
                    />
                  </div>

                  {email !== emailOriginal && (
                    <div className="bg-amber-950/20 border border-amber-900/40 p-3.5 rounded-2xl space-y-2 animate-fade-in">
                      <p className="text-xs font-bold text-amber-400">Você alterou seu e-mail. Digite sua senha atual para autorizar:</p>
                      <input 
                        type="password"
                        value={senhaConfirmacaoEmail}
                        onChange={e => setSenhaConfirmacaoEmail(e.target.value)}
                        placeholder="Sua senha atual"
                        required
                        className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-amber-900/50 text-white text-xs outline-none focus:border-amber-500"
                      />
                    </div>
                  )}

                  <button 
                    type="submit" disabled={salvando}
                    className="w-full py-3.5 mt-2 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all disabled:opacity-50 shadow-lg"
                  >
                    {salvando ? 'Salvando...' : 'Salvar Alterações'}
                  </button>

                  <button 
                    type="button" 
                    onClick={() => { setAlterandoSenha(true); setMensagemFeedback(null); }}
                    className="w-full py-3 mt-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    Alterar Senha de Acesso
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAlterarSenha} className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Redefinição de Senha</h3>
                    <button 
                      type="button" 
                      onClick={() => { setAlterandoSenha(false); setMensagemFeedback(null); }}
                      className="text-xs text-zinc-500 hover:text-white underline"
                    >
                      Voltar
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-zinc-400 uppercase tracking-wider">Senha Atual</label>
                    <input 
                      type="password" value={senhaAntiga} onChange={e => setSenhaAntiga(e.target.value)} placeholder="Digite sua senha atual" required
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-zinc-500 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-zinc-400 uppercase tracking-wider">Nova Senha</label>
                    <input 
                      type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="Mínimo de 6 caracteres" required
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-zinc-500 text-sm font-medium"
                    />
                  </div>

                  <button 
                    type="submit" disabled={salvando}
                    className="w-full py-3.5 mt-2 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all disabled:opacity-50 shadow-lg"
                  >
                    {salvando ? 'Alterando...' : 'Confirmar Nova Senha'}
                  </button>
                </form>
              )}

              {/* BOTÃO QUE DISPARA O MODAL CENTRALIZADO DE EXCLUSÃO */}
              <div className="pt-6 border-t border-zinc-900 mt-6">
                <button
                  type="button"
                  onClick={() => { setModalDeletarAberto(true); setSenhaConfirmacaoDeletar(''); }}
                  className="w-full py-3 px-4 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-red-400 rounded-2xl font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Excluir Minha Conta
                </button>
              </div>
            </div>
          )}

          {telaAtiva === 'SOBRE' && (
            <div className="space-y-6 mt-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl mx-auto flex items-center justify-center shadow-xl mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-black text-white text-lg">Dashboard Financeiro</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mt-2">
                  Sistema de gestão financeira pessoal desenvolvido para controle inteligente de receitas e despesas.
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-left">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Informações da Conta
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-zinc-500">Nome cadastrado</p>
                    <p className="text-sm font-bold text-white mt-0.5">{nome || 'Não informado'}</p>
                  </div>
                  <div className="pt-3 border-t border-zinc-800">
                    <p className="text-xs font-medium text-zinc-500">E-mail de acesso</p>
                    <p className="text-sm font-bold text-white mt-0.5 break-all">{email || 'Não informado'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-900 text-center">
                <p className="text-xs text-zinc-600 font-bold tracking-widest uppercase">Versão 1.0.0</p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* MODAL CENTRALIZADO PROFISSIONAL DE EXCLUSÃO DE CONTA */}
      {modalDeletarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-950 border border-red-950/80 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6">
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-950/50 border border-red-900/50 rounded-2xl flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">Excluir Conta Permanentemente</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Esta ação é irreversível e apagará todos os seus dados financeiros.</p>
              </div>
            </div>

            <form onSubmit={handleDeletarConta} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-zinc-400 uppercase tracking-wider">Confirme sua senha atual</label>
                <input 
                  type="password"
                  value={senhaConfirmacaoDeletar}
                  onChange={e => setSenhaConfirmacaoDeletar(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalDeletarAberto(false)}
                  className="w-1/2 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-2xl transition-colors border border-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={deletando}
                  className="w-1/2 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] disabled:opacity-50"
                >
                  {deletando ? 'Excluindo...' : 'Sim, Excluir'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}