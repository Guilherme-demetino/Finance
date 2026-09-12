interface FiltroPeriodoProps {
  mes: string;
  ano: string;
  onChangeMes: (mes: string) => void;
  onChangeAno: (ano: string) => void;
}

export default function FiltroPeriodo({ mes, ano, onChangeMes, onChangeAno }: FiltroPeriodoProps) {
  return (
    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 p-1.5 rounded-2xl">
      <select 
        value={mes} 
        onChange={e => onChangeMes(e.target.value)}
        className="bg-zinc-900 text-xs font-bold uppercase tracking-wider text-white px-4 py-2.5 rounded-xl border border-zinc-800 focus:border-zinc-600 outline-none cursor-pointer transition-all"
      >
        <option value="1" className="bg-zinc-900 text-white">Janeiro</option>
        <option value="2" className="bg-zinc-900 text-white">Fevereiro</option>
        <option value="3" className="bg-zinc-900 text-white">Março</option>
        <option value="4" className="bg-zinc-900 text-white">Abril</option>
        <option value="5" className="bg-zinc-900 text-white">Maio</option>
        <option value="6" className="bg-zinc-900 text-white">Junho</option>
        <option value="7" className="bg-zinc-900 text-white">Julho</option>
        <option value="8" className="bg-zinc-900 text-white">Agosto</option>
        <option value="9" className="bg-zinc-900 text-white">Setembro</option>
        <option value="10" className="bg-zinc-900 text-white">Outubro</option>
        <option value="11" className="bg-zinc-900 text-white">Novembro</option>
        <option value="12" className="bg-zinc-900 text-white">Dezembro</option>
      </select>

      <span className="text-zinc-600 font-bold px-1">/</span>

      <select 
        value={ano} 
        onChange={e => onChangeAno(e.target.value)}
        className="bg-zinc-900 text-xs font-bold text-white px-4 py-2.5 rounded-xl border border-zinc-800 focus:border-zinc-600 outline-none cursor-pointer transition-all"
      >
        <option value="2025" className="bg-zinc-900 text-white">2025</option>
        <option value="2026" className="bg-zinc-900 text-white">2026</option>
        <option value="2027" className="bg-zinc-900 text-white">2027</option>
      </select>
    </div>
  );
}