import { useMemo } from 'react';

interface Transacao {
  id: string;
  titulo: string;
  valor: number;
  tipo: 'RECEITA' | 'DESPESA';
  categoria: string;
}

interface PainelAnaliseProps {
  transacoes: Transacao[];
}

export default function PainelAnalise({ transacoes }: PainelAnaliseProps) {
  const despesas = transacoes.filter(t => t.tipo === 'DESPESA');
  const receitas = transacoes.filter(t => t.tipo === 'RECEITA');

  const totalReceitas = receitas.reduce((acc, t) => acc + Number(t.valor), 0);
  const totalDespesas = despesas.reduce((acc, t) => acc + Number(t.valor), 0);
  
  // Calcula o saldo restante da receita (se despesas forem maiores que receita, o saldo livre é 0)
  const saldoRestante = Math.max(totalReceitas - totalDespesas, 0);

  // Agrupa despesas por categoria
  const despesasPorCategoria: { [key: string]: number } = {};
  despesas.forEach(t => {
    const cat = t.categoria || 'Outros';
    despesasPorCategoria[cat] = (despesasPorCategoria[cat] || 0) + Number(t.valor);
  });

  const coresCategorias: { [key: string]: string } = {
    'Alimentação': '#f59e0b', // amber-500
    'Moradia': '#3b82f6',     // blue-500
    'Transporte': '#a855f7',  // purple-500
    'Lazer': '#ec4899',       // pink-500
    'Outros': '#71717a',      // zinc-500
  };

  const categoriasLista = useMemo(() => {
    return Object.keys(despesasPorCategoria).map(categoria => {
      const valor = despesasPorCategoria[categoria];
      // Percentual baseado na receita total para o gráfico preencher proporcionalmente o todo
      const pctDaReceita = totalReceitas > 0 ? (valor / totalReceitas) * 100 : 0;
      const pctDaDespesa = totalDespesas > 0 ? (valor / totalDespesas) * 100 : 0;

      return {
        categoria,
        valor,
        pctDaReceita: pctDaReceita > 100 ? 100 : pctDaReceita,
        pctDaReceitaStr: pctDaReceita.toFixed(1),
        pctDaDespesa,
        corClass: coresCategorias[categoria] || '#a1a1aa',
        tailwindBg: 
          categoria === 'Alimentação' ? 'bg-amber-500' :
          categoria === 'Moradia' ? 'bg-blue-500' :
          categoria === 'Transporte' ? 'bg-purple-500' :
          categoria === 'Lazer' ? 'bg-pink-500' : 'bg-zinc-500'
      };
    }).sort((a, b) => b.valor - a.valor);
  }, [despesasPorCategoria, totalDespesas, totalReceitas]);

  // Porcentagem do saldo restante em relação à receita total
  const pctSaldoRestante = totalReceitas > 0 ? (saldoRestante / totalReceitas) * 100 : 0;

  // Monta o conic-gradient dinâmico para a rosca considerando as despesas + saldo restante (verde)
  const conicGradientStyle = useMemo(() => {
    if (totalReceitas === 0) return 'conic-gradient(#27272a 0deg 360deg)';
    
    let acumulado = 0;
    const gradientes: string[] = [];

    // Adiciona cada categoria de despesa ao gráfico proporcionalmente à receita
    categoriasLista.forEach(item => {
      const inicio = acumulado;
      const angulo = (item.pctDaReceita / 100) * 360;
      acumulado += angulo;
      gradientes.push(`${item.corClass} ${inicio}deg ${acumulado}deg`);
    });

    // Adiciona o saldo restante (verde) completando o ciclo até 360°
    if (saldoRestante > 0) {
      const inicio = acumulado;
      gradientes.push(`#10b981 ${inicio}deg 360deg`); // emerald-500 (verde)
    }

    return `conic-gradient(${gradientes.join(', ')})`;
  }, [categoriasLista, totalReceitas, saldoRestante]);

  const totalComprometidoPct = totalReceitas > 0 ? (totalDespesas / totalReceitas) * 100 : 0;

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-bold text-lg uppercase tracking-wider text-zinc-300">Análise de Gastos</h2>
          <p className="text-zinc-500 text-xs mt-1">Distribuição de despesas e saldo livre</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Comprometido</span>
          <span className={`text-sm font-black ${totalComprometidoPct > 100 ? 'text-red-500' : 'text-zinc-200'}`}>
            {totalComprometidoPct.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Gráfico em Rosca (Donut Chart) com Saldo Restante em Verde */}
      <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
        <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
          <div 
            className="w-full h-full rounded-full shadow-inner transition-all duration-700"
            style={{ background: conicGradientStyle }}
          ></div>
          {/* Círculo central da rosca */}
          <div className="absolute w-24 h-24 bg-zinc-950 rounded-full flex flex-col items-center justify-center border border-zinc-900 shadow">
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Saldo Livre</span>
            <span className={`text-xs font-black ${saldoRestante > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              R$ {saldoRestante > 999 ? `${(saldoRestante/1000).toFixed(1)}k` : saldoRestante.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Lista Resumida incluindo o Saldo Livre em destaque */}
        <div className="flex-1 w-full space-y-2">
          {/* Item de Saldo Restante (Verde) */}
          {totalReceitas > 0 && (
            <div className="flex justify-between items-center text-xs pb-1.5 border-b border-zinc-900">
              <span className="text-emerald-400 flex items-center gap-2 font-bold uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Saldo Livre
              </span>
              <span className="text-emerald-400 font-bold">
                {pctSaldoRestante.toFixed(1)}% <span className="text-zinc-600 font-normal">da receita</span>
              </span>
            </div>
          )}

          {categoriasLista.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-2 uppercase tracking-wider">
              Nenhuma despesa registrada
            </p>
          ) : (
            categoriasLista.slice(0, 3).map(item => (
              <div key={item.categoria} className="flex justify-between items-center text-xs">
                <span className="text-zinc-300 flex items-center gap-2 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.corClass }}></span>
                  {item.categoria}
                </span>
                <span className="text-zinc-400 font-semibold">
                  {item.pctDaReceitaStr}% <span className="text-zinc-600 font-normal">da receita</span>
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Barras de Progresso Detalhadas (Incluindo o Saldo Livre em Verde) */}
      <div className="space-y-4 pt-2 border-t border-zinc-900">
        {/* Barra de Saldo Livre */}
        {totalReceitas > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
              <span className="text-emerald-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Saldo Livre Restante
              </span>
              <span className="text-emerald-400">
                R$ {saldoRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                <span className="text-zinc-500 ml-1.5 font-normal">({pctSaldoRestante.toFixed(1)}% da receita)</span>
              </span>
            </div>
            <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-zinc-800/60">
              <div 
                className="h-full rounded-full transition-all duration-700 ease-out bg-emerald-500" 
                style={{ width: `${pctSaldoRestante > 100 ? 100 : pctSaldoRestante}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Barras das Categorias de Despesas */}
        {categoriasLista.map((item) => (
          <div key={item.categoria} className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
              <span className="text-zinc-300 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${item.tailwindBg}`}></span>
                {item.categoria}
              </span>
              <span className="text-zinc-400">
                R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                <span className="text-zinc-500 ml-1.5 font-normal">({item.pctDaReceitaStr}% da receita)</span>
              </span>
            </div>

            <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-zinc-800/60">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out ${item.tailwindBg}`} 
                style={{ width: `${item.pctDaReceita}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}