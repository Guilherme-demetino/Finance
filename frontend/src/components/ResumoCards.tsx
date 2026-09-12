interface ResumoCardsProps {
  totalReceitas: number;
  totalDespesas: number;
  saldoTotal: number;
}

export default function ResumoCards({ totalReceitas, totalDespesas, saldoTotal }: ResumoCardsProps) {
  // Define se o saldo é positivo/zero (verde) ou negativo (vermelho)
  const saldoPositivoOuZero = saldoTotal >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col">
        <span className="font-semibold text-zinc-400 text-sm mb-2 uppercase tracking-wider">Receitas</span>
        <span className="text-3xl font-black text-emerald-400">
          R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      
      <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col">
        <span className="font-semibold text-zinc-400 text-sm mb-2 uppercase tracking-wider">Despesas</span>
        <span className="text-3xl font-black text-red-400">
          R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      
      <div className="bg-black text-white p-8 rounded-3xl border-2 border-zinc-800 shadow-2xl flex flex-col">
        <span className="font-bold text-zinc-400 text-sm mb-2 uppercase tracking-wider">Saldo do Mês</span>
        <span className={`text-3xl font-black ${saldoPositivoOuZero ? 'text-emerald-400' : 'text-red-400'}`}>
          R$ {saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}