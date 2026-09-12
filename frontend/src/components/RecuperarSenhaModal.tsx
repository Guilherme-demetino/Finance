import { useState } from 'react';
import { api } from '../api'; // Ajuste o caminho se a sua configuração da API estiver em outro lugar

interface RecuperarSenhaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RecuperarSenhaModal({ isOpen, onClose }: RecuperarSenhaModalProps) {
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  if (!isOpen) return null;

  const handleSolicitarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await api.post('/esqueci-senha', { email });
      // Mude para uma mensagem informando que o e-mail foi enviado:
      setMensagemSucesso('o código foi enviado para sua caixa de entrada!');
      setEtapa(2);
    } catch (err: any) {
      setErro(err.response?.data?.error || 'Erro ao solicitar código.');
    } finally {
      setLoading(false);
    }
  };

  const handleRedefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await api.post('/redefinir-senha', { email, codigo, novaSenha });
      setMensagemSucesso('Senha alterada com sucesso! Você já pode fazer login.');
      // Aguarda 3 segundos para o usuário ler a mensagem e fecha o modal
      setTimeout(() => fecharModal(), 3000);
    } catch (err: any) {
      setErro(err.response?.data?.error || 'Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  const fecharModal = () => {
    setEtapa(1);
    setEmail('');
    setCodigo('');
    setNovaSenha('');
    setErro('');
    setMensagemSucesso('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
        <button 
          onClick={fecharModal}
          className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors text-lg"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-white mb-2">Recuperar Senha</h2>
        
        {erro && <p className="text-red-400 text-sm mb-4 bg-red-400/10 p-3 rounded-xl border border-red-400/20">{erro}</p>}
        {mensagemSucesso && <p className="text-emerald-400 text-sm mb-4 bg-emerald-400/10 p-3 rounded-xl border border-emerald-400/20">{mensagemSucesso}</p>}

        {etapa === 1 ? (
          <form onSubmit={handleSolicitarCodigo} className="space-y-4 mt-6">
            <p className="text-zinc-400 text-sm">Digite seu e-mail cadastrado. Enviaremos um código de 6 dígitos para você.</p>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">E-mail</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                placeholder="seu@email.com"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 mt-4"
            >
              {loading ? 'Enviando...' : 'Enviar Código'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRedefinirSenha} className="space-y-4 mt-6">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Código de 6 dígitos</label>
              <input 
                type="text" 
                required
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-zinc-500 text-center tracking-[0.5em] font-mono text-lg"
                placeholder="000000"
                maxLength={6}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Nova Senha</label>
              <input 
                type="password" 
                required
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-zinc-500"
                placeholder="Sua nova senha segura"
                minLength={6}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 mt-4"
            >
              {loading ? 'Salvando...' : 'Redefinir Senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}