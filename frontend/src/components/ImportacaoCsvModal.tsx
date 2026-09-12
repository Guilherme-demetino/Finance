import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { api } from '../api';

interface ImportacaoCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportacaoSucesso: () => void;
}

export default function ImportacaoCsvModal({ isOpen, onClose, onImportacaoSucesso }: ImportacaoCsvModalProps) {
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucessoModal, setSucessoModal] = useState(false);
  
  // Dados do Arquivo
  const [arquivoNome, setArquivoNome] = useState('');
  const [cabecalhos, setCabecalhos] = useState<string[]>([]);
  const [linhas, setLinhas] = useState<any[]>([]);

  // Estado do Mapeamento (De-Para)
  const [mapData, setMapData] = useState('');
  const [mapTitulo, setMapTitulo] = useState('');
  const [mapValor, setMapValor] = useState('');
  const [categoriaPadrao] = useState('Outros');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetar = () => {
    setEtapa(1);
    setArquivoNome('');
    setCabecalhos([]);
    setLinhas([]);
    setMapData('');
    setMapTitulo('');
    setMapValor('');
    setErro('');
    setSucessoModal(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFechar = () => {
    resetar();
    onClose();
  };

  // Etapa 1: Ler o arquivo e descobrir as colunas
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setArquivoNome(file.name);
    setErro('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields && results.meta.fields.length > 0) {
          setCabecalhos(results.meta.fields);
          setLinhas(results.data);
          
          const fields = results.meta.fields.map(f => f.toLowerCase());
          const adivinhar = (palavras: string[]) => {
            const index = fields.findIndex(f => palavras.some(p => f.includes(p)));
            return index !== -1 ? results.meta.fields![index] : '';
          };
          
          setMapData(adivinhar(['data', 'date']));
          setMapTitulo(adivinhar(['descrição', 'descricao', 'título', 'titulo', 'histórico', 'historico']));
          setMapValor(adivinhar(['valor', 'amount', 'quantia']));

          setEtapa(2);
        } else {
          setErro('Não foi possível ler as colunas do arquivo.');
        }
      },
      error: () => setErro('Erro ao processar o arquivo CSV.')
    });
  };

  // Etapa 2: Processar e Salvar no Banco (Ignorando RDB/Caixinhas)
  const handleImportar = async () => {
    if (!mapData || !mapTitulo || !mapValor) {
      setErro('Por favor, mapeie as colunas obrigatórias (Data, Título e Valor).');
      return;
    }

    setLoading(true);
    setErro('');

    try {
      const transacoesLidas = linhas.map((linha) => {
        const tituloRaw = linha[mapTitulo] || 'Transação Importada';
        const dataRaw = linha[mapData];
        const valorRaw = linha[mapValor] !== undefined ? String(linha[mapValor]).trim() : '0';

        const valorNormalizado = valorRaw
          .replace(/\u2212/g, '-')
          .replace(/[−–—]/g, '-');

        let valorLimpo = valorNormalizado.replace('R$', '').trim();
        const ehNegativo = valorLimpo.includes('-');
        valorLimpo = valorLimpo.replace('-', '').trim();

        if (valorLimpo.includes(',') && valorLimpo.includes('.')) {
          valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
        } else if (valorLimpo.includes(',')) {
          valorLimpo = valorLimpo.replace(',', '.');
        }

        const valorNum = parseFloat(valorLimpo) || 0;

        let tipo = 'RECEITA';
        if (ehNegativo || valorRaw.includes('-') || valorRaw.includes('−') || valorRaw.includes('–')) {
          tipo = 'DESPESA';
        }

        let dataFormatada = dataRaw;
        if (dataRaw && dataRaw.includes('/')) {
          const partes = dataRaw.split('/');
          if (partes.length === 3 && partes[2].length === 4) {
            dataFormatada = `${partes[2]}-${partes[1]}-${partes[0]}`;
          }
        } else if (!dataRaw || !dataRaw.includes('-')) {
          dataFormatada = new Date().toISOString().split('T')[0];
        }

        return {
          titulo: tituloRaw,
          valor: valorNum,
          tipo,
          categoria: categoriaPadrao,
          data: dataFormatada
        };
      });

      // FILTRO CRUCIAL: Ignora transações de RDB / Caixinhas / Aplicação / Resgate interno
      const transacoesValidas = transacoesLidas.filter(t => {
        const tituloUpper = t.titulo.toUpperCase();
        const ehRdbOuCaixinha = tituloUpper.includes('RDB') || tituloUpper.includes('CAIXINHA') || tituloUpper.includes('GUARDADO');
        return t.valor > 0 && t.data && !ehRdbOuCaixinha;
      });

      if (transacoesValidas.length === 0) {
        setErro('Nenhuma transação válida encontrada após filtrar as aplicações/resgates de RDB.');
        setLoading(false);
        return;
      }

      const usuarioId = localStorage.getItem('usuarioId');
      await api.post('/dados/importar', { 
        transacoes: transacoesValidas,
        usuarioId 
      });

      setLoading(false);
      setSucessoModal(true);

    } catch (err) {
      console.error(err);
      setLoading(false);
      setErro('Ocorreu um erro de comunicação com o servidor ao salvar as transações.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      
      {/* MODAL PRINCIPAL */}
      {!sucessoModal ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-extrabold text-lg uppercase tracking-wider text-white">
              Importar Planilha (CSV)
            </h2>
            <button onClick={handleFechar} className="text-zinc-500 hover:text-white transition-colors">✕</button>
          </div>

          {erro && <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-xl">{erro}</p>}

          {etapa === 1 ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400 leading-relaxed">
                Faça o upload do extrato bancário. Movimentações de <strong>RDB e Caixinhas</strong> serão filtradas automaticamente.
              </p>
              <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-10 border-2 border-dashed border-zinc-700 hover:border-white rounded-2xl text-zinc-400 hover:text-white transition-all flex flex-col items-center gap-2 group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">📄</span>
                <span className="font-bold text-sm">Clique para selecionar o CSV</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl mb-4">
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">✓ Arquivo Lido</p>
                <p className="text-sm text-white font-medium">{arquivoNome} ({linhas.length} linhas)</p>
              </div>

              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Mapeamento de Colunas</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm font-bold text-zinc-300 w-1/3">Data:</label>
                  <select value={mapData} onChange={e => setMapData(e.target.value)} className="w-2/3 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-zinc-500 text-sm">
                    <option value="">Selecione...</option>
                    {cabecalhos.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm font-bold text-zinc-300 w-1/3">Título / Descrição:</label>
                  <select value={mapTitulo} onChange={e => setMapTitulo(e.target.value)} className="w-2/3 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-zinc-500 text-sm">
                    <option value="">Selecione...</option>
                    {cabecalhos.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm font-bold text-zinc-300 w-1/3">Valor (R$):</label>
                  <select value={mapValor} onChange={e => setMapValor(e.target.value)} className="w-2/3 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-zinc-500 text-sm">
                    <option value="">Selecione...</option>
                    {cabecalhos.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <button 
                onClick={handleImportar} 
                disabled={loading}
                className="w-full py-3.5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] mt-4 disabled:opacity-50"
              >
                {loading ? 'Processando...' : 'Finalizar Importação'}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* POP-UP DE SUCESSO ELEGANTE */
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 text-center animate-fade-in">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            ✓
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold tracking-tight text-white">Importação Concluída!</h3>
            <p className="text-sm text-zinc-400">
              As transações do extrato foram importadas (aplicações e resgates de RDB foram ignorados com sucesso).
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => {
                onImportacaoSucesso();
                handleFechar();
              }}
              className="w-full bg-white text-black hover:bg-zinc-200 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              Continuar para o Dashboard
            </button>
          </div>
        </div>
      )}

    </div>
  );
}