interface FiltroHistoricoProps {
  busca: string;
  setBusca: (val: string) => void;
  tipoFiltro: string;
  setTipoFiltro: (val: string) => void;
  ordenacao?: string;
  setOrdenacao?: (val: string) => void;
}

export default function FiltroHistorico({ busca, setBusca, tipoFiltro, setTipoFiltro, ordenacao, setOrdenacao }: FiltroHistoricoProps) {
  return (
    <div className="flex flex-col md:flex-row gap-3 w-full">
      <input 
        type="text"
        placeholder="Buscar transação..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
      />
      <div className="flex gap-3 w-full md:w-auto">
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className="flex-1 md:flex-none bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer appearance-none"
        >
          <option value="TUDO">Todas</option>
          <option value="RECEITA">Receitas</option>
          <option value="DESPESA">Despesas</option>
        </select>

        {setOrdenacao && (
          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value)}
            className="flex-1 md:flex-none bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer appearance-none"
          >
            <option value="data-desc">Mais recentes</option>
            <option value="data-asc">Mais antigas</option>
            <option value="valor-desc">Maior valor</option>
            <option value="valor-asc">Menor valor</option>
          </select>
        )}
      </div>
    </div>
  );
}