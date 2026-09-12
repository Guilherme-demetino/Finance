interface ListaHistoricoProps {
  transacoes: any[];
  modoEdicao: boolean;
  onEditar: (item: any) => void;
  onDeletar: (id: string) => void;
}

export default function ListaHistorico({ transacoes, modoEdicao, onEditar, onDeletar }: ListaHistoricoProps) {
  if (transacoes.length === 0) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 text-center">
        <p className="text-zinc-500 font-semibold uppercase text-sm">Nenhuma transação encontrada.</p>
      </div>
    );
  }

  return (
    <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
      {transacoes.map((item) => {
        const dataBruta = item.criadoEm || item.createdAt || item.data || item.created_at;
        const dataFormatada = dataBruta ? new Date(dataBruta).toLocaleDateString('pt-BR') : '';

        return (
          <div key={item.id} className="flex justify-between items-center p-5 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-zinc-600 transition-colors">
            <div>
              <p className="font-bold text-lg text-white">{item.titulo}</p>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-xs font-semibold text-zinc-500 uppercase">{item.categoria}</p>
                {dataFormatada && (
                  <span className="text-xs font-medium text-zinc-600">• {dataFormatada}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className={`font-black text-xl ${item.tipo === 'DESPESA' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {item.tipo === 'DESPESA' ? '-' : '+'} R$ {Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              {modoEdicao && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onEditar(item)}
                    className="bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => onDeletar(item.id)}
                    className="bg-red-950/40 border border-red-900/60 text-red-400 hover:bg-red-900/50 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                  >
                    Excluir
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}