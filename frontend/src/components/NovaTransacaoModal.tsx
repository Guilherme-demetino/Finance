import { useState, useEffect } from 'react';
import { api } from '../api';

interface NovaTransacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransacaoSalva: () => void;
  transacaoEditando?: any | null;
  mesSelecionado: string;
  anoSelecionado: string;
}

const CATEGORIAS_DESPESAS_PADRAO = ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Outros'];
const CATEGORIAS_RECEITAS_PADRAO = ['Salário', 'Investimentos'];

export default function NovaTransacaoModal({ 
  isOpen, 
  onClose, 
  onTransacaoSalva, 
  transacaoEditando,
  mesSelecionado,
  anoSelecionado
}: NovaTransacaoModalProps) {
  const [titulo, setTitulo] = useState('');
  const [valorInput, setValorInput] = useState('');
  const [tipo, setTipo] = useState('RECEITA');
  const [categoria, setCategoria] = useState('');
  const [dataInput, setDataInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados de Categorias
  const [categoriasDespesas, setCategoriasDespesas] = useState<string[]>(CATEGORIAS_DESPESAS_PADRAO);
  const [categoriasReceitas, setCategoriasReceitas] = useState<string[]>(CATEGORIAS_RECEITAS_PADRAO);

  // Estados de Recorrência/Parcelamento
  const [isRepetitivo, setIsRepetitivo] = useState(false);
  const [tipoRepeticao, setTipoRepeticao] = useState<'FIXA' | 'PARCELADA'>('PARCELADA');
  const [quantidade, setQuantidade] = useState(''); 

  const [criandoNovaCategoria, setCriandoNovaCategoria] = useState(false);
  const [novaCategoriaInput, setNovaCategoriaInput] = useState('');

  const categoriasDisponiveis = tipo === 'RECEITA' ? categoriasReceitas : categoriasDespesas;
  
  // Verifica se a categoria atual é customizada (para exibir o botão de apagar)
  const isCategoriaCustom = tipo === 'RECEITA' 
    ? !CATEGORIAS_RECEITAS_PADRAO.includes(categoria)
    : !CATEGORIAS_DESPESAS_PADRAO.includes(categoria);

  // Busca as categorias salvas no LocalStorage assim que o modal abre
  useEffect(() => {
    const salvasDespesas = localStorage.getItem('categorias_despesas_custom');
    const salvasReceitas = localStorage.getItem('categorias_receitas_custom');

    if (salvasDespesas) setCategoriasDespesas([...CATEGORIAS_DESPESAS_PADRAO, ...JSON.parse(salvasDespesas)]);
    if (salvasReceitas) setCategoriasReceitas([...CATEGORIAS_RECEITAS_PADRAO, ...JSON.parse(salvasReceitas)]);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (transacaoEditando) {
      setTitulo(transacaoEditando.titulo);
      const valorFormatado = Number(transacaoEditando.valor).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      setValorInput(valorFormatado);
      setTipo(transacaoEditando.tipo);
      
      const dataOriginal = transacaoEditando.criadoEm || transacaoEditando.createdAt || transacaoEditando.data || transacaoEditando.created_at;
      if (dataOriginal) {
        setDataInput(dataOriginal.split('T')[0]);
      } else {
        const mesFormatado = String(mesSelecionado).padStart(2, '0');
        setDataInput(`${anoSelecionado}-${mesFormatado}-01`);
      }

      if (transacaoEditando.tipo === 'RECEITA' && !categoriasReceitas.includes(transacaoEditando.categoria)) {
        setCategoriasReceitas(prev => [...prev, transacaoEditando.categoria]);
      } else if (transacaoEditando.tipo === 'DESPESA' && !categoriasDespesas.includes(transacaoEditando.categoria)) {
        setCategoriasDespesas(prev => [...prev, transacaoEditando.categoria]);
      }
      
      setCategoria(transacaoEditando.categoria);
      setIsRepetitivo(false);
    } else {
      setTitulo('');
      setValorInput('');
      setTipo('RECEITA'); 
      setCategoria(categoriasReceitas[0] || 'Salário'); 
      
      const mesFormatado = String(mesSelecionado).padStart(2, '0');
      const anoFormatado = String(anoSelecionado);
      setDataInput(`${anoFormatado}-${mesFormatado}-01`);

      setIsRepetitivo(false);
      setTipoRepeticao('PARCELADA');
      setQuantidade('');
    }
    setCriandoNovaCategoria(false);
  }, [transacaoEditando, isOpen, mesSelecionado, anoSelecionado]); 

  function handleTipoChange(novoTipo: string) {
    setTipo(novoTipo);
    if (novoTipo === 'RECEITA') {
      setCategoria(categoriasReceitas[0]);
    } else {
      setCategoria(categoriasDespesas[0]);
    }
    setCriandoNovaCategoria(false);
  }

  function handleValorChange(e: React.ChangeEvent<HTMLInputElement>) {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor === '') {
      setValorInput('');
      return;
    }
    const numero = Number(valor) / 100;
    setValorInput(numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }

  function handleQuantidadeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const apenasNumeros = e.target.value.replace(/\D/g, '');
    setQuantidade(apenasNumeros);
  }

  function handleAdicionarCategoria(e: React.FormEvent) {
    e.preventDefault();
    const catFormatada = novaCategoriaInput.trim();
    if (!catFormatada) return;

    if (tipo === 'RECEITA') {
      if (!categoriasReceitas.includes(catFormatada)) {
        const novas = [...categoriasReceitas, catFormatada];
        setCategoriasReceitas(novas);
        const apenasCustom = novas.filter(c => !CATEGORIAS_RECEITAS_PADRAO.includes(c));
        localStorage.setItem('categorias_receitas_custom', JSON.stringify(apenasCustom));
      }
    } else {
      if (!categoriasDespesas.includes(catFormatada)) {
        const novas = [...categoriasDespesas, catFormatada];
        setCategoriasDespesas(novas);
        const apenasCustom = novas.filter(c => !CATEGORIAS_DESPESAS_PADRAO.includes(c));
        localStorage.setItem('categorias_despesas_custom', JSON.stringify(apenasCustom));
      }
    }

    setCategoria(catFormatada);
    setNovaCategoriaInput('');
    setCriandoNovaCategoria(false);
  }

  // LÓGICA PARA EXCLUIR CATEGORIA CUSTOMIZADA
  function handleExcluirCategoria() {
    if (tipo === 'RECEITA') {
      const novas = categoriasReceitas.filter(c => c !== categoria);
      setCategoriasReceitas(novas);
      const apenasCustom = novas.filter(c => !CATEGORIAS_RECEITAS_PADRAO.includes(c));
      localStorage.setItem('categorias_receitas_custom', JSON.stringify(apenasCustom));
      setCategoria(novas[0]);
    } else {
      const novas = categoriasDespesas.filter(c => c !== categoria);
      setCategoriasDespesas(novas);
      const apenasCustom = novas.filter(c => !CATEGORIAS_DESPESAS_PADRAO.includes(c));
      localStorage.setItem('categorias_despesas_custom', JSON.stringify(apenasCustom));
      setCategoria(novas[0]);
    }
  }

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const usuarioId = localStorage.getItem('usuarioId');
    
    if (!titulo.trim()) {
      alert('Por favor, informe um título válido para a transação.');
      return;
    }

    const valorLimpo = Number(valorInput.replace(/\./g, '').replace(',', '.'));

    if (isNaN(valorLimpo) || valorLimpo <= 0) {
      alert('Por favor, informe um valor maior que zero.');
      return;
    }

    if (!categoria) {
      alert('Por favor, selecione uma categoria.');
      return;
    }

    if (!dataInput) {
      alert('Por favor, informe a data da transação.');
      return;
    }

    if (isRepetitivo && !transacaoEditando) {
      const qtd = Number(quantidade);
      if (isNaN(qtd) || qtd < 2) {
        alert('Por favor, informe um número válido de parcelas/meses (mínimo de 2).');
        return;
      }
    }

    setLoading(true);

    try {
      const dadosEnvio = {
        titulo: titulo.trim(),
        valor: valorLimpo,
        tipo,
        categoria,
        usuarioId,
        data: dataInput,
        criadoEm: dataInput,
        tipoRepeticao: isRepetitivo ? tipoRepeticao : 'UNICA',
        quantidade: isRepetitivo ? Number(quantidade) : 1
      };

      if (transacaoEditando) {
        await api.put(`/dados/${transacaoEditando.id}`, dadosEnvio);
      } else {
        await api.post('/dados', dadosEnvio);
      }

      onTransacaoSalva();
    } catch (erro) {
      console.error("Erro ao salvar transação:", erro);
      alert('Erro ao salvar transação.');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center">
          <h2 className="font-extrabold text-lg uppercase tracking-wider text-white">
            {transacaoEditando ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-zinc-500 hover:text-white font-bold text-sm uppercase tracking-wider transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <button
              type="button"
              onClick={() => handleTipoChange('RECEITA')}
              className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                tipo === 'RECEITA' ? 'bg-emerald-500 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => handleTipoChange('DESPESA')}
              className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                tipo === 'DESPESA' ? 'bg-red-500 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Despesa
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-zinc-400 uppercase tracking-wider">Título</label>
            <input 
              type="text" 
              required
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Aluguel, Conta de Luz, Supermercado..."
              className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-zinc-600 transition-all text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-zinc-400 uppercase tracking-wider">Valor (R$)</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-zinc-500 font-bold text-sm">R$</span>
              <input 
                type="text" 
                required
                value={valorInput}
                onChange={handleValorChange}
                placeholder="0,00"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-zinc-600 transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-zinc-400 uppercase tracking-wider">Data</label>
            <input 
              type="date" 
              required
              value={dataInput}
              onChange={e => setDataInput(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-zinc-600 transition-all text-sm font-medium [color-scheme:dark] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Categoria</label>
              {!criandoNovaCategoria && (
                <button 
                  type="button" 
                  onClick={() => setCriandoNovaCategoria(true)}
                  className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider transition-colors"
                >
                  + Nova Categoria
                </button>
              )}
            </div>

            {criandoNovaCategoria ? (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={novaCategoriaInput}
                  onChange={e => setNovaCategoriaInput(e.target.value)}
                  placeholder="Nome..."
                  className="flex-1 px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-zinc-600 text-sm font-medium"
                  autoFocus
                />
                <button 
                  type="button"
                  onClick={handleAdicionarCategoria}
                  className="px-4 py-3 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-2xl hover:bg-zinc-200"
                >
                  Salvar
                </button>
                <button 
                  type="button"
                  onClick={() => setCriandoNovaCategoria(false)}
                  className="px-3 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-2xl text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select 
                  value={categoria}
                  onChange={e => setCategoria(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-zinc-600 transition-all text-sm font-medium cursor-pointer"
                >
                  {categoriasDisponiveis.map(cat => (
                    <option key={cat} value={cat} className="bg-zinc-900 text-white">
                      {cat}
                    </option>
                  ))}
                </select>
                
                {isCategoriaCustom && (
                  <button 
                    type="button"
                    onClick={handleExcluirCategoria}
                    title="Excluir categoria selecionada"
                    className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-colors flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {!transacaoEditando && (
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer group mb-2">
                <input 
                  type="checkbox" 
                  checked={isRepetitivo} 
                  onChange={(e) => setIsRepetitivo(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0 focus:ring-offset-0 accent-white cursor-pointer"
                />
                <span className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors">
                  Repetir ou Parcelar
                </span>
              </label>

              {isRepetitivo && (
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" name="tipoRepeticao" value="PARCELADA"
                        checked={tipoRepeticao === 'PARCELADA'}
                        onChange={() => setTipoRepeticao('PARCELADA')}
                        className="accent-white"
                      />
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Parcelada (Divide)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" name="tipoRepeticao" value="FIXA"
                        checked={tipoRepeticao === 'FIXA'}
                        onChange={() => setTipoRepeticao('FIXA')}
                        className="accent-white"
                      />
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Fixa (Repete)</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-zinc-400 uppercase tracking-wider">Em quantas vezes?</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={quantidade} 
                      onChange={handleQuantidadeChange}
                      placeholder="Ex: 2, 5, 12..."
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-zinc-600 transition-all text-sm font-medium"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? 'Salvando...' : 'Salvar Transação'}
          </button>
        </form>

      </div>
    </div>
  );
}