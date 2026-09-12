import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import RecuperarSenhaModal from '../components/RecuperarSenhaModal';

export default function Login() {
  const navigate = useNavigate();
  const [modalSenhaAberta, setModalSenhaAberta] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function fazerLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

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
      const resposta = await api.post('/login', { email, senha });
      
      if (!resposta.data || !resposta.data.token) {
        setErro('E-mail ou senha incorretos.');
        setCarregando(false);
        return;
      }

      localStorage.setItem('token', resposta.data.token);
      localStorage.setItem('usuarioId', resposta.data.id);
      localStorage.setItem('usuarioNome', resposta.data.nome);
      localStorage.setItem('usuarioEmail', email);

      navigate('/dashboard');
    } catch (error: any) {
      console.error("Erro no login:", error);
      // Tratamento seguro para extrair a mensagem de erro do backend ou exibir padrão
      const mensagemDoServidor = error.response?.data?.error || error.response?.data?.message;
      setErro(mensagemDoServidor || 'E-mail ou senha incorretos.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 font-sans text-white">
      <div className="bg-zinc-950 p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-zinc-800">
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Acessar Conta
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Bem-vindo de volta ao seu controle financeiro.
          </p>
        </div>

        {/* ALERTA DE ERRO EM VERMELHO FIXO NO TOPO */}
        {erro && (
          <div className="bg-red-950/50 text-red-400 p-4 rounded-xl mb-6 text-sm font-medium border border-red-900 flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{erro}</span>
          </div>
        )}
        
        <form onSubmit={fazerLogin} className="space-y-5">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1.5 text-sm">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (erro) setErro(''); // Limpa o erro ao digitar novamente
              }}
              placeholder="seu@email.com" 
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:bg-zinc-800 focus:border-white focus:ring-2 focus:ring-white/10 outline-none transition-all duration-200"
            />
          </div>
          
          <div>
            <label className="block text-zinc-300 font-semibold mb-1.5 text-sm">Senha</label>
            <input 
              type="password" 
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value);
                if (erro) setErro(''); // Limpa o erro ao digitar novamente
              }}
              placeholder="••••••••" 
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:bg-zinc-800 focus:border-white focus:ring-2 focus:ring-white/10 outline-none transition-all duration-200"
            />
            
            <div className="flex justify-end mt-2">
              <button 
                type="button" 
                onClick={() => setModalSenhaAberta(true)}
                className="text-xs font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={carregando}
            className="w-full bg-white text-black font-bold py-3.5 mt-4 rounded-xl hover:bg-zinc-200 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] focus:ring-4 focus:ring-zinc-600 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-zinc-400">
            Não tem uma conta?{' '}
            <Link 
              to="/cadastro" 
              className="text-white font-bold hover:underline transition-colors"
            >
              Cadastrar-se
            </Link>
          </p>
        </div>
      </div>

      <RecuperarSenhaModal 
        isOpen={modalSenhaAberta} 
        onClose={() => setModalSenhaAberta(false)} 
      />
    </div>
  );
}