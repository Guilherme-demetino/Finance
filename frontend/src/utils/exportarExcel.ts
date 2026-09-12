import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Mapeamento de cores das categorias (ARGB: 'FF' + Hexadecimal)
const coresCategorias: Record<string, string> = {
  'Salário': 'FF10B981',       // Verde
  'Investimentos': 'FF3B82F6', // Azul
  'Alimentação': 'FFF59E0B',   // Amarelo
  'Moradia': 'FF8B5CF6',       // Roxo
  'Transporte': 'FF06B6D4',    // Ciano
  'Lazer': 'FFEC4899',         // Rosa
  'Outros': 'FF71717A'         // Cinza
};

export async function exportarParaExcel(transacoes: any[], mes: string, ano: string) {
  if (!transacoes || transacoes.length === 0) {
    alert('Não há dados para exportar neste período.');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Relatório Financeiro');

  worksheet.columns = [
    { header: 'Data', key: 'data', width: 15 },
    { header: 'Título', key: 'titulo', width: 30 },
    { header: 'Categoria', key: 'categoria', width: 25 },
    { header: 'Tipo', key: 'tipo', width: 15 },
    { header: 'Valor', key: 'valor', width: 20 }
  ];

  // Borda padrão para usar em todas as células
  const bordaCompleta: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF52525B' } },    // Cinza médio
    left: { style: 'thin', color: { argb: 'FF52525B' } },
    bottom: { style: 'thin', color: { argb: 'FF52525B' } },
    right: { style: 'thin', color: { argb: 'FF52525B' } }
  };

  // Cabeçalho
  const cabecalho = worksheet.getRow(1);
  cabecalho.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF18181B' } }; // Cinza quase preto
    cell.alignment = { horizontal: 'center' };
    cell.border = bordaCompleta;
  });

  // Linhas
  transacoes.forEach(t => {
    const dataObj = new Date(t.criadoEm || t.data || t.createdAt);
    const dataFormatada = dataObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    const row = worksheet.addRow({
      data: dataFormatada,
      titulo: t.titulo,
      categoria: t.categoria,
      tipo: t.tipo === 'RECEITA' ? 'Receita' : 'Despesa',
      valor: Number(t.valor)
    });

    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF27272A' } }; // Fundo Cinza
      cell.font = { color: { argb: 'FFFFFFFF' } }; // Texto Branco
      cell.border = bordaCompleta; // Borda em todos os lados
    });

    row.getCell('data').alignment = { horizontal: 'center' };
    row.getCell('tipo').alignment = { horizontal: 'center' };
    row.getCell('valor').numFmt = '"R$" #,##0.00';

    // Cores específicas
    const cellCategoria = row.getCell('categoria');
    const corCategoria = coresCategorias[t.categoria] || 'FFFFFFFF';
    cellCategoria.font = { color: { argb: corCategoria }, bold: true };

    const cellTipo = row.getCell('tipo');
    cellTipo.font = { 
      color: { argb: t.tipo === 'RECEITA' ? 'FF10B981' : 'FFEF4444' }, 
      bold: true 
    };
  });

  worksheet.addRow([]); 

  const totalReceitas = transacoes.filter(t => t.tipo === 'RECEITA').reduce((acc, t) => acc + Number(t.valor), 0);
  const totalDespesas = transacoes.filter(t => t.tipo === 'DESPESA').reduce((acc, t) => acc + Number(t.valor), 0);
  const saldo = totalReceitas - totalDespesas;

  // Resumo
  const addTotais = (label: string, valor: number, corValor: string) => {
    const r = worksheet.addRow(['', '', '', label, valor]);
    r.eachCell((cell, colNumber) => {
      if (colNumber >= 4) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF18181B' } }; 
        cell.border = bordaCompleta;
      }
    });
    r.getCell(4).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    r.getCell(4).alignment = { horizontal: 'right' };
    r.getCell(5).numFmt = '"R$" #,##0.00';
    r.getCell(5).font = { color: { argb: corValor }, bold: true };
  };

  addTotais('Total Receitas:', totalReceitas, 'FF10B981');
  addTotais('Total Despesas:', totalDespesas, 'FFEF4444');
  addTotais('Saldo Final:', saldo, saldo >= 0 ? 'FF10B981' : 'FFEF4444');

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Relatorio_Financeiro_${mes}_${ano}.xlsx`);
}