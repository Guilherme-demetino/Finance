import { useState, useEffect } from 'react';

interface MetaOrcamentoProps {
  totalDespesas: number;
  totalReceitas: number;
}

export default function MetaOrcamento({ totalDespesas, totalReceitas }: MetaOrcamentoProps) {
  const [meta, setMeta] = useState<number>(() => {
    const salva = localStorage.getItem('meta_orcamento_customizada');
    return salva ? Number(salva) : totalReceitas;
  });

  const [editando, setEditando] = useState(false);
  
  // Inicializa o input já formatado em moeda
  const [valorInput, setValorInput] = useState<string>(() => {
    const salva = localStorage.getItem('meta_orcamento_customizada');
    const valorInicial = salva ? Number(salva) : totalReceitas;
    return valorInicial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  });

  // Se o usuário não alterou manualmente, atualiza a meta automaticamente quando a receita mudar
  useEffect(() => {
    const salva = localStorage.getItem('meta_orcamento_customizada');
    if (!salva && totalReceitas > 0) {
      setMeta(totalReceitas);
      setValorInput(totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
  }, [totalReceitas]);

  // Função para criar a máscara de dinheiro (R$) em tempo real
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, ''); // Remove tudo que não é número
    if (valor === '') {
      setValorInput('');
      return;
    }
    const numero = Number(valor) / 100;
    setValorInput(numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const salvarMeta = () => {
    // Converte de volta para número limpo na hora de salvar
    const valorLimpo = Number(valorInput.replace(/\./g, '').replace(',', '.'));
    const novoValor = isNaN(valorLimpo) ? 0 : valorLimpo;
    
    setMeta(novoValor);
    localStorage.setItem('meta_orcamento_customizada', String(novoValor));
    setEditando(false);
  };

  const resetarMeta = () => {
    localStorage.removeItem('meta_orcamento_customizada');
    setMeta(totalReceitas);
    setValorInput(totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setEditando(false);
  };

  const progresso = meta > 0 ? Math.min(Number(((totalDespesas / meta) * 100).toFixed(1)), 100) : 0;

  return (
    <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 shadow-2xl space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-300">Orçamento Mensal (Meta)</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {localStorage.getItem('meta_orcamento_customizada') ? 'Meta personalizada' : 'Sincronizado com suas Receitas'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!editando ? (
            <button
              onClick={() => {
                // Garante que o input mostre o valor atual formatado ao abrir
                setValorInput(meta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                setEditando(true);
              }}
              className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl transition-colors"
            >
              Alterar Meta
            </button>
          ) : (
            <button
              onClick={resetarMeta}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-wider bg-emerald-950/40 border border-emerald-900/50 px-3 py-1.5 rounded-xl transition-colors"
            >
              Usar Receita
            </button>
          )}
        </div>
      </div>

      {!editando ? (
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-2xl font-black text-white">
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-zinc-500">gastos</span>
            </span>
            <span className="text-sm font-bold text-zinc-400">
              Meta: R$ {meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden border border-zinc-800">
            <div 
              className={`h-full transition-all duration-500 ${progresso >= 100 ? 'bg-red-500' : progresso > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${progresso}%` }}
            />
          </div>
          <p className="text-right text-xs font-bold text-zinc-500">{progresso}% do orçamento utilizado</p>
        </div>
      ) : (
        <div className="flex items-center gap-3 pt-2">
          <div className="relative flex items-center w-full">
            <span className="absolute left-4 text-zinc-500 font-bold text-sm">R$</span>
            <input
              type="text"
              value={valorInput}
              onChange={handleValorChange}
              className="w-full pl-11 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-zinc-500 text-sm font-bold"
              placeholder="0,00"
              autoFocus
            />
          </div>
          <button
            onClick={salvarMeta}
            className="bg-white text-black hover:bg-zinc-200 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap"
          >
            Salvar
          </button>
        </div>
      )}
    </div>
  );
}