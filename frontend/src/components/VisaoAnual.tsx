import { useState, useEffect } from 'react';
import { api } from '../api';

interface VisaoAnualProps {
  usuarioId: string | null;
  anoSelecionado: number;
  triggerAtualizacao?: any; // <-- Adicionado o gatilho aqui
}

export default function VisaoAnual({ usuarioId, anoSelecionado, triggerAtualizacao }: VisaoAnualProps) {
  const [dadosMensais, setDadosMensais] = useState<{ mes: string; receita: number; despesa: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  useEffect(() => {
    async function buscarResumoAnual() {
      if (!usuarioId) return;

      try {
        setLoading(true);
        const resposta = await api.get(`/resumo-anual`, {
          params: { usuarioId, ano: anoSelecionado }
        });
        
        const dadosServidor = resposta.data;

        const mesesMapeados = mesesNomes.map((nome, index) => {
          const mesNum = index + 1;
          const encontrado = dadosServidor.find((item: any) => Number(item.mes) === mesNum);

          return {
            mes: nome,
            receita: encontrado ? Number(encontrado.receita || 0) : 0,
            despesa: encontrado ? Number(encontrado.despesa || 0) : 0,
          };
        });

        setDadosMensais(mesesMapeados);
      } catch (erro) {
        console.error("Erro ao carregar o resumo anual:", erro);
        setDadosMensais(mesesNomes.map(mes => ({ mes, receita: 0, despesa: 0 })));
      } finally {
        setLoading(false);
      }
    }

    buscarResumoAnual();
  }, [usuarioId, anoSelecionado, triggerAtualizacao]); // <-- Gatilho adicionado nas dependências do useEffect

  // MaxValor mínimo de 10 para evitar divisões por zero e garantir a escala
  const maxValor = Math.max(...dadosMensais.flatMap(d => [d.receita, d.despesa]), 10);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="font-bold text-lg uppercase tracking-wider text-zinc-300">
          Tendência Anual ({anoSelecionado})
        </h2>
        
        <div className="flex gap-4 text-xs font-bold uppercase">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Receitas
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span> Despesas
          </div>
        </div>
      </div>

      <div className="flex justify-between h-56 md:h-64 mt-8 pt-4 border-b border-zinc-800 pb-2">
        {loading ? (
          <div className="w-full flex items-center justify-center text-zinc-500 text-xs uppercase tracking-wider">
            Carregando tendências...
          </div>
        ) : (
          dadosMensais.map((dado) => {
            const alturaReceita = maxValor > 0 ? (dado.receita / maxValor) * 100 : 0;
            const alturaDespesa = maxValor > 0 ? (dado.despesa / maxValor) * 100 : 0;

            return (
              <div key={dado.mes} className="flex-1 flex flex-col justify-end items-center h-full relative group cursor-pointer">
                
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-xs p-2 rounded-lg pointer-events-none whitespace-nowrap z-10 shadow-xl border border-zinc-700">
                  <p className="text-emerald-400 font-bold">+ R$ {dado.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-red-400 font-bold">- R$ {dado.despesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                <div className="flex items-end justify-center gap-1 w-full flex-1">
                  <div 
                    className="w-1/2 max-w-[12px] bg-emerald-500 rounded-t-md transition-all duration-700 ease-out" 
                    style={{ height: `${alturaReceita}%`, minHeight: dado.receita > 0 ? '4px' : '0' }} 
                  ></div>
                  <div 
                    className="w-1/2 max-w-[12px] bg-red-500 rounded-t-md transition-all duration-700 ease-out" 
                    style={{ height: `${alturaDespesa}%`, minHeight: dado.despesa > 0 ? '4px' : '0' }} 
                  ></div>
                </div>
                
                <span className="text-[10px] md:text-xs font-semibold text-zinc-500 uppercase mt-2">
                  {dado.mes}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}