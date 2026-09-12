import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

export default function Cadastro() {
  const navigate = useNavigate();
  
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false); 

  async function fazerCadastro(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    if (nome.length < 3) {
      setErro('O nome deve ter pelo menos 3 letras.');
      setCarregando(false);
      return;
    }
    if (!email.includes('@')) {
      setErro('Por favor, digite um e-mail válido.');
      setCarregando(false);
      return;
    }
    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      setCarregando(false);
      return;
    }

    try {
      await api.post('/cadastro', { nome, email, senha });
      
      // Ativa o pop-up de sucesso e espera 2.5 segundos
      setSucesso(true);
      setTimeout(() => {
        navigate('/');
      }, 2500);
      
    } catch (error: any) {
      console.error("ERRO DETALHADO:", error);
      setErro(error.response?.data?.error || 'Erro ao cadastrar. Tente novamente.');
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 font-sans text-white relative">
      
      {/* FORMULÁRIO PRINCIPAL */}
      <div className="bg-zinc-950 p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-zinc-800">
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">Criar Conta</h1>
          <p className="text-zinc-400 mt-2 text-sm">Preencha seus dados para gerenciar suas finanças.</p>
        </div>

        {erro && (
          <div className="bg-red-950/50 text-red-400 p-4 rounded-xl mb-6 text-sm font-medium border border-red-900 flex items-center gap-2 animate-in fade-in">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {erro}
          </div>
        )}
        
        <form onSubmit={fazerCadastro} className="space-y-5">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1.5 text-sm">Nome Completo</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João Silva" className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:bg-zinc-800 focus:border-white focus:ring-2 focus:ring-white/10 outline-none transition-all duration-200" />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1.5 text-sm">E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:bg-zinc-800 focus:border-white focus:ring-2 focus:ring-white/10 outline-none transition-all duration-200" />
          </div>
          
          <div>
            <label className="block text-zinc-300 font-semibold mb-1.5 text-sm">Senha</label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:bg-zinc-800 focus:border-white focus:ring-2 focus:ring-white/10 outline-none transition-all duration-200" />
          </div>
          
          <button type="submit" disabled={carregando} className="w-full bg-white text-black font-bold py-3.5 mt-4 rounded-xl hover:bg-zinc-200 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] focus:ring-4 focus:ring-zinc-600 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
            {carregando ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-zinc-400">
            Já tem uma conta?{' '}
            <Link to="/" className="text-white font-bold hover:underline transition-colors">
              Fazer login
            </Link>
          </p>
        </div>
      </div>

      {/* POP-UP DE SUCESSO (Modal) */}
      {sucesso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 p-10 rounded-3xl shadow-2xl border border-zinc-800 text-center w-full max-w-sm relative animate-in zoom-in-95 duration-300">
            
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-extrabold tracking-tight mb-2 text-white">Conta Criada!</h2>
            <p className="text-zinc-400 text-sm">
              Seu cadastro foi realizado com sucesso. Redirecionando para o login...
            </p>
            
            {/* Barrinha de carregamento estilosa embaixo (Opcional) */}
            <div className="w-full bg-zinc-900 h-1 mt-6 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full animate-[progress_2.5s_ease-in-out_forwards]"></div>
            </div>

          </div>
        </div>
      )}

      {/* Pequeno CSS extra embutido apenas para a barra de progresso rodar */}
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}