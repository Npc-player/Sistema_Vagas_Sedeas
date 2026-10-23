// src/lib/relatorios/pdf.ts
// Geração de PDF dos relatórios mensais.

import PDFDocument from 'pdfkit';
import path from 'node:path';
import type {
  LinhaCentralRegulacao,
  LinhaFluxoDetalhado,
} from './queries';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 35;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN_X;

const PAGE_WIDTH_L = 841.89;
const PAGE_HEIGHT_L = 595.28;
const MARGIN_X_L = 25;
const CONTENT_WIDTH_L = PAGE_WIDTH_L - 2 * MARGIN_X_L;

const CAMINHO_CABECALHO = path.join(process.cwd(), 'public', 'relatorios', 'cabecalho.jpg');
const CAMINHO_CORPO = path.join(process.cwd(), 'public', 'relatorios', 'corpo.jpg');
const CAMINHO_RODAPE = path.join(process.cwd(), 'public', 'relatorios', 'rodape.jpg');

const LABEL_MOTIVO: Record<string, string> = {
  VULNERABILIDADE_SOCIAL: 'Vulnerab. social',
  NEGLIGENCIA_FAMILIAR: 'Negligência',
  VIOLENCIA_DOMESTICA: 'Violência dom.',
  ABANDONO: 'Abandono',
  DEPENDENCIA_QUIMICA: 'Depend. quím.',
  SAUDE_MENTAL: 'Saúde mental',
  SITUACAO_RUA: 'Sit. de rua',
  DETERMINACAO_JUDICIAL: 'Det. judicial',
  OUTRO: 'Outro',
};

const LABEL_REGIME: Record<string, string> = {
  PROVISORIO: 'Provis.',
  DEFINITIVO: 'Definit.',
};

// =====================================================
// Tipos públicos
// =====================================================
export interface DadosPDFBase {
  protocolo: string;
  periodoLabel: string;
  geradoPorNome: string;
  geradoPorProntuario: string | null;
  geradoPorRole: string;
}

export interface DadosPDFCentral extends DadosPDFBase {
  tipo: 'CENTRAL';
  linhas: LinhaCentralRegulacao[];
}

export interface DadosPDFFluxo extends DadosPDFBase {
  tipo: 'FLUXO_DETALHADO';
  linhas: LinhaFluxoDetalhado[];
}

export type DadosPDF = DadosPDFCentral | DadosPDFFluxo;

// =====================================================
// Layout helpers
// =====================================================
interface Layout {
  contentTop: number;
  contentBottom: number;
}

function desenharLayoutPortrait(doc: PDFKit.PDFDocument): Layout {
  try {
    doc.image(CAMINHO_CORPO, 0, 0, { width: PAGE_WIDTH, height: PAGE_HEIGHT });
  } catch {
    /* ignora */
  }

  const hCab = 90;
  try {
    doc.image(CAMINHO_CABECALHO, 0, 0, { width: PAGE_WIDTH });
  } catch {
    doc
      .fillColor('#0F766E')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Prefeitura Municipal de Guarujá', MARGIN_X, 30, {
        width: CONTENT_WIDTH,
      });
  }

  const hRod = 40;
  try {
    doc.image(CAMINHO_RODAPE, 0, PAGE_HEIGHT - hRod, { width: PAGE_WIDTH });
  } catch {
    /* ignora */
  }

  return {
    contentTop: hCab + 20,
    contentBottom: PAGE_HEIGHT - hRod - 10,
  };
}

function desenharLayoutLandscape(doc: PDFKit.PDFDocument): Layout {
  try {
    doc.image(CAMINHO_CORPO, 0, 0, {
      width: PAGE_WIDTH_L,
      height: PAGE_HEIGHT_L,
    });
  } catch {
    /* ignora */
  }

  const hCabL = 55;
  try {
    doc.image(CAMINHO_CABECALHO, 0, 0, { width: PAGE_WIDTH_L });
  } catch {
    /* ignora */
  }

  const hRodL = 40;
  try {
    doc.image(CAMINHO_RODAPE, 0, PAGE_HEIGHT_L - hRodL, {
      width: PAGE_WIDTH_L,
    });
  } catch {
    /* ignora */
  }

  return {
    contentTop: hCabL + 20,
    contentBottom: PAGE_HEIGHT_L - hRodL - 10,
  };
}

function formatarDataBR(iso: string): string {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR');
}

function finalizarRodape(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc
      .fillColor('#94A3B8')
      .fontSize(7)
      .font('Helvetica')
      .text(
        `Página ${i + 1} de ${range.count}`,
        MARGIN_X,
        doc.page.height - 14,
        { width: doc.page.width - 2 * MARGIN_X, align: 'center' }
      );
  }
}

function textoResponsavel(d: DadosPDFBase): string {
  if (d.geradoPorProntuario) {
    return `${d.geradoPorNome} - prontuário: ${d.geradoPorProntuario}`;
  }
  return d.geradoPorNome;
}

// =====================================================
// Agrupamento por unidade
// =====================================================
interface GrupoUnidade {
  unidadeId: string;
  unidadeNome: string;
  unidadeTipo: string;
  provisorio: LinhaCentralRegulacao | null;
  definitivo: LinhaCentralRegulacao | null;
}

function agruparPorUnidade(linhas: LinhaCentralRegulacao[]): GrupoUnidade[] {
  const map = new Map<string, GrupoUnidade>();
  for (const l of linhas) {
    let g = map.get(l.unidadeId);
    if (!g) {
      g = {
        unidadeId: l.unidadeId,
        unidadeNome: l.unidadeNome,
        unidadeTipo: l.unidadeTipo,
        provisorio: null,
        definitivo: null,
      };
      map.set(l.unidadeId, g);
    }
    if (l.tipoVaga === 'PROVISORIO') g.provisorio = l;
    else g.definitivo = l;
  }
  return Array.from(map.values());
}

interface TotaisCentral {
  meta: number;
  entradas: number;
  saidas: number;
  evasoesOutros: number;
  acolhidos: number;
  fixos: number;
  vagasDisponiveis: number;
}

function calcularTotaisGrupos(grupos: GrupoUnidade[]): TotaisCentral {
  const acc: TotaisCentral = {
    meta: 0,
    entradas: 0,
    saidas: 0,
    evasoesOutros: 0,
    acolhidos: 0,
    fixos: 0,
    vagasDisponiveis: 0,
  };
  for (const g of grupos) {
    for (const l of [g.provisorio, g.definitivo]) {
      if (!l) continue;
      acc.meta += l.meta ?? 0;
      acc.entradas += l.entradas;
      acc.saidas += l.saidas;
      acc.evasoesOutros += l.evasoesOutros;
      acc.acolhidos += l.acolhidos;
      acc.fixos += l.fixos;
      acc.vagasDisponiveis += l.vagasDisponiveis ?? 0;
    }
  }
  return acc;
}

// =====================================================
// Tabela da Central (nova estrutura com mesclagem)
// =====================================================
function desenharTabelaCentral(
  doc: PDFKit.PDFDocument,
  yInicial: number,
  contentBottom: number,
  grupos: GrupoUnidade[],
  onNovaPagina: () => number
): number {
  let y = yInicial;

  const colRatios = [
    { key: 'unidade', label: 'UNIDADE', ratio: 0.303, align: 'left' as const },
    { key: 'tipo', label: 'TIPOS\nDE VAGAS', ratio: 0.109, align: 'left' as const },
    { key: 'meta', label: 'META', ratio: 0.059, align: 'center' as const },
    { key: 'entradas', label: 'ENTRADAS', ratio: 0.086, align: 'center' as const },
    { key: 'saidas', label: 'SAÍDAS', ratio: 0.072, align: 'center' as const },
    { key: 'evasoes', label: 'EVASÕES\nOUTROS', ratio: 0.090, align: 'center' as const },
    { key: 'acolhidos', label: 'ACOLHIDOS', ratio: 0.098, align: 'center' as const },
    { key: 'fixos', label: 'FIXOS', ratio: 0.073, align: 'center' as const },
    { key: 'vagas', label: 'VAGAS\nDISPONÍVEIS', ratio: 0.110, align: 'center' as const },
  ];

  let accX = 0;
  const cols = colRatios.map((c) => {
    const col = { ...c, x: accX, w: c.ratio * CONTENT_WIDTH };
    accX += col.w;
    return col;
  });

  const hHeader = 30;
  const hRow = 18;
  const COR_VERDE = '#E8F5E9';
  const COR_BRANCO = '#FFFFFF';

  const desenharHeader = () => {
    doc.fillColor(COR_BRANCO).rect(MARGIN_X, y, CONTENT_WIDTH, hHeader).fill();
    doc.strokeColor('#000000').lineWidth(0.5);
    doc.rect(MARGIN_X, y, CONTENT_WIDTH, hHeader).stroke();
    for (let i = 1; i < cols.length; i++) {
      doc
        .moveTo(MARGIN_X + cols[i].x, y)
        .lineTo(MARGIN_X + cols[i].x, y + hHeader)
        .stroke();
    }
    doc.fillColor('#000000').fontSize(6.5).font('Helvetica-Bold');
    for (const c of cols) {
      const altura = doc.heightOfString(c.label, {
        width: c.w - 4,
        align: c.align,
      });
      const yText = y + Math.max(2, (hHeader - altura) / 2);
      doc.text(c.label, MARGIN_X + c.x + 2, yText, {
        width: c.w - 4,
        align: c.align,
        lineBreak: true,
      });
    }
    y += hHeader;
  };

  desenharHeader();

  let indice = 0;
  for (const grupo of grupos) {
    const hGrupo = hRow * 2;
    if (y + hGrupo > contentBottom) {
      y = onNovaPagina();
      desenharHeader();
    }
    const yG = y;
    const bg = indice % 2 === 0 ? COR_VERDE : COR_BRANCO;

    doc.fillColor(bg).rect(MARGIN_X, yG, CONTENT_WIDTH, hGrupo).fill();
    doc.strokeColor('#000000').lineWidth(0.5);
    doc.rect(MARGIN_X, yG, CONTENT_WIDTH, hGrupo).stroke();
    for (let i = 1; i < cols.length; i++) {
      doc
        .moveTo(MARGIN_X + cols[i].x, yG)
        .lineTo(MARGIN_X + cols[i].x, yG + hGrupo)
        .stroke();
    }
    // Separador horizontal entre PROV e DEF (a partir da coluna 2)
    doc
      .moveTo(MARGIN_X + cols[1].x, yG + hRow)
      .lineTo(MARGIN_X + CONTENT_WIDTH, yG + hRow)
      .stroke();

    const prov = grupo.provisorio;
    const def = grupo.definitivo;

    // UNIDADE (mesclada verticalmente)
    doc.fillColor('#000000').fontSize(7).font('Helvetica');
    const alturaU = doc.heightOfString(grupo.unidadeNome, {
      width: cols[0].w - 4,
    });
    doc.text(
      grupo.unidadeNome,
      MARGIN_X + cols[0].x + 2,
      yG + (hGrupo - alturaU) / 2,
      { width: cols[0].w - 4, align: 'left', lineBreak: true }
    );

    // Linha PROVISÓRIAS
    const yP = yG + (hRow - 8) / 2;
    doc.fontSize(6.5).font('Helvetica').fillColor('#000000');
    doc.text('PROVISÓRIAS', MARGIN_X + cols[1].x + 2, yP, {
      width: cols[1].w - 4,
      align: 'left',
    });
    if (prov) {
      if (prov.meta !== null)
        doc.text(String(prov.meta), MARGIN_X + cols[2].x + 2, yP, {
          width: cols[2].w - 4,
          align: 'center',
        });
      doc.text(String(prov.entradas), MARGIN_X + cols[3].x + 2, yP, {
        width: cols[3].w - 4,
        align: 'center',
      });
      doc.text(String(prov.saidas), MARGIN_X + cols[4].x + 2, yP, {
        width: cols[4].w - 4,
        align: 'center',
      });
      doc.text(String(prov.evasoesOutros), MARGIN_X + cols[5].x + 2, yP, {
        width: cols[5].w - 4,
        align: 'center',
      });
      doc.text(String(prov.acolhidos), MARGIN_X + cols[6].x + 2, yP, {
        width: cols[6].w - 4,
        align: 'center',
      });
      doc.text(String(prov.fixos), MARGIN_X + cols[7].x + 2, yP, {
        width: cols[7].w - 4,
        align: 'center',
      });
      if (prov.vagasDisponiveis !== null)
        doc.text(
          String(prov.vagasDisponiveis),
          MARGIN_X + cols[8].x + 2,
          yP,
          { width: cols[8].w - 4, align: 'center' }
        );
    }

    // Linha DEFINITIVAS
    const yD = yG + hRow + (hRow - 8) / 2;
    doc.fontSize(6.5).font('Helvetica').fillColor('#000000');
    doc.text('DEFINITIVAS', MARGIN_X + cols[1].x + 2, yD, {
      width: cols[1].w - 4,
      align: 'left',
    });
    if (def) {
      doc.text(String(def.entradas), MARGIN_X + cols[3].x + 2, yD, {
        width: cols[3].w - 4,
        align: 'center',
      });
      doc.text(String(def.saidas), MARGIN_X + cols[4].x + 2, yD, {
        width: cols[4].w - 4,
        align: 'center',
      });
      doc.text(String(def.evasoesOutros), MARGIN_X + cols[5].x + 2, yD, {
        width: cols[5].w - 4,
        align: 'center',
      });
      doc.text(String(def.acolhidos), MARGIN_X + cols[6].x + 2, yD, {
        width: cols[6].w - 4,
        align: 'center',
      });
      doc.text(String(def.fixos), MARGIN_X + cols[7].x + 2, yD, {
        width: cols[7].w - 4,
        align: 'center',
      });
    }

    y += hGrupo;
    indice++;
  }

  // ===== TOTAL =====
  if (y + hRow > contentBottom) {
    y = onNovaPagina();
    desenharHeader();
  }

  const tot = calcularTotaisGrupos(grupos);

  doc.fillColor(COR_BRANCO).rect(MARGIN_X, y, CONTENT_WIDTH, hRow).fill();
  doc.strokeColor('#000000').lineWidth(0.5);
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, hRow).stroke();
  for (let i = 1; i < cols.length; i++) {
    doc
      .moveTo(MARGIN_X + cols[i].x, y)
      .lineTo(MARGIN_X + cols[i].x, y + hRow)
      .stroke();
  }

  const yT = y + (hRow - 8) / 2;
  doc.fillColor('#000000').fontSize(7).font('Helvetica-Bold');
  doc.text('TOTAL', MARGIN_X + cols[0].x + 2, yT, {
    width: cols[0].w - 4,
    align: 'left',
  });
  doc.text('—', MARGIN_X + cols[1].x + 2, yT, {
    width: cols[1].w - 4,
    align: 'left',
  });
  doc.text(String(tot.meta), MARGIN_X + cols[2].x + 2, yT, {
    width: cols[2].w - 4,
    align: 'center',
  });
  doc.text(String(tot.entradas), MARGIN_X + cols[3].x + 2, yT, {
    width: cols[3].w - 4,
    align: 'center',
  });
  doc.text(String(tot.saidas), MARGIN_X + cols[4].x + 2, yT, {
    width: cols[4].w - 4,
    align: 'center',
  });
  doc.text(String(tot.evasoesOutros), MARGIN_X + cols[5].x + 2, yT, {
    width: cols[5].w - 4,
    align: 'center',
  });
  doc.text(String(tot.acolhidos), MARGIN_X + cols[6].x + 2, yT, {
    width: cols[6].w - 4,
    align: 'center',
  });
  doc.text(String(tot.fixos), MARGIN_X + cols[7].x + 2, yT, {
    width: cols[7].w - 4,
    align: 'center',
  });
  doc.text(String(tot.vagasDisponiveis), MARGIN_X + cols[8].x + 2, yT, {
    width: cols[8].w - 4,
    align: 'center',
  });

  y += hRow;
  return y;
}

// =====================================================
// PDF Central de Regulação
// =====================================================
function gerarPDFCentral(dados: DadosPDFCentral): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        autoFirstPage: false,
        info: {
          Title: 'Central de Regulação de Vagas',
          Author: 'Sistema de Controle de Vagas — SEDEAS',
          Creator: 'Sistema de Controle de Vagas',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      let layout: Layout;
      const novaPagina = (): number => {
        doc.addPage();
        layout = desenharLayoutPortrait(doc);
        return layout.contentTop;
      };

      doc.addPage();
      layout = desenharLayoutPortrait(doc);
      let y = layout.contentTop;

      doc
        .fillColor('#000000')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Serviços de Acolhimento Institucional', MARGIN_X, y, {
          width: CONTENT_WIDTH,
        });
      y += 16;

      doc.fillColor('#475569').fontSize(7.5).font('Helvetica');
      doc.text(
        `Período: ${dados.periodoLabel} · Protocolo: ${dados.protocolo} · Gerado em ${new Date().toLocaleString('pt-BR')}`,
        MARGIN_X,
        y,
        { width: CONTENT_WIDTH }
      );
      y += 10;
      doc.text(`Responsável: ${textoResponsavel(dados)}`, MARGIN_X, y, {
        width: CONTENT_WIDTH,
      });
      y += 16;

      const grupos = agruparPorUnidade(dados.linhas);
      y = desenharTabelaCentral(
        doc,
        y,
        layout.contentBottom,
        grupos,
        novaPagina
      );
      y += 16;

      if (y + 40 > layout.contentBottom) {
        y = novaPagina();
      }
      doc.fillColor('#64748B').fontSize(6.5).font('Helvetica');
      doc.text(
        '* O número de vagas disponíveis será contabilizado de acordo com o número de acolhidos com guia de acolhimento e não com o número de permanecentes.',
        MARGIN_X,
        y,
        { width: CONTENT_WIDTH, align: 'justify' }
      );
      y += 18;
      doc.text(
        '* Outros: Crianças e adolescentes que estão com família extensa ou substituta aguardando parecer/decisão judicial para desacolhimento.',
        MARGIN_X,
        y,
        { width: CONTENT_WIDTH, align: 'justify' }
      );

      finalizarRodape(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// =====================================================
// PDF Fluxo Detalhado
// =====================================================
function gerarPDFFluxo(dados: DadosPDFFluxo): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 0,
        autoFirstPage: false,
        info: {
          Title: 'Fluxo Mensal Detalhado de Acolhimento',
          Author: 'Sistema de Controle de Vagas — SEDEAS',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const MX = MARGIN_X_L;
      const CW = CONTENT_WIDTH_L;

      let layout: Layout;
      const novaPagina = (): number => {
        doc.addPage();
        layout = desenharLayoutLandscape(doc);
        return layout.contentTop;
      };

      doc.addPage();
      layout = desenharLayoutLandscape(doc);
      let y = layout.contentTop;

      doc
        .fillColor('#0F172A')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('DEPARTAMENTO DE PROTEÇÃO SOCIAL ESPECIAL', MX, y, {
          width: CW,
          align: 'center',
        });
      y += 12;
      doc
        .fillColor('#0F766E')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('FLUXO MENSAL DE ACOLHIMENTO — RELAÇÃO NOMINAL', MX, y, {
          width: CW,
          align: 'center',
        });
      y += 16;

      doc.fillColor('#475569').fontSize(7).font('Helvetica');
      doc.text(
        `Período: ${dados.periodoLabel} · Protocolo: ${dados.protocolo} · Gerado em ${new Date().toLocaleString('pt-BR')}`,
        MX,
        y,
        { width: CW, align: 'center' }
      );
      y += 10;
      doc.text(`Responsável: ${textoResponsavel(dados)}`, MX, y, {
        width: CW,
        align: 'center',
      });
      y += 14;

      const cols = [
        { label: 'GRUPO', x: 0, w: 38, key: 'grupo' },
        { label: 'NOME / FILIAÇÃO', x: 38, w: 130, key: 'nome' },
        { label: 'NASC.', x: 168, w: 48, key: 'nasc' },
        { label: 'ACOLH.', x: 216, w: 48, key: 'acolh' },
        { label: 'DOC.', x: 264, w: 65, key: 'doc' },
        { label: 'PROCESSO / GUIA', x: 329, w: 85, key: 'proc' },
        { label: 'TERRITÓRIO', x: 414, w: 70, key: 'terr' },
        { label: 'EQUIPE TÉCNICA', x: 484, w: 95, key: 'equipe' },
        { label: 'MOTIVO / REGIME', x: 579, w: 75, key: 'motivo' },
        { label: 'STATUS', x: 654, w: 127, key: 'status' },
      ] as const;

      const desenharHeader = () => {
        doc.fillColor('#0F766E').rect(MX, y, CW, 16).fill();
        doc.fillColor('#FFFFFF').fontSize(6.5).font('Helvetica-Bold');
        for (const c of cols) {
          doc.text(c.label, MX + c.x + 3, y + 5, {
            width: c.w - 6,
            lineBreak: false,
          });
        }
        y += 16;
      };

      desenharHeader();
      doc.font('Helvetica').fontSize(6.5).fillColor('#0F172A');

      for (const l of dados.linhas) {
        const alturaLinha = 22;
        if (y + alturaLinha > layout.contentBottom) {
          y = novaPagina();
          desenharHeader();
          doc.font('Helvetica').fontSize(6.5).fillColor('#0F172A');
        }
        if (l.grupoFamiliar) {
          doc.fillColor('#F0FDFA').rect(MX, y, CW, alturaLinha).fill();
        }
        const valores: Record<string, string> = {
          grupo: l.grupoFamiliar ?? '—',
          nome: l.nomeCompleto + (l.nomeMae ? `\nMãe: ${l.nomeMae}` : ''),
          nasc: `${formatarDataBR(l.dataNascimento)}\n${l.idade} anos`,
          acolh: formatarDataBR(l.dataAcolhimento),
          doc:
            [l.cpf ? `CPF: ${l.cpf}` : '', l.rg ? `RG: ${l.rg}` : '']
              .filter(Boolean)
              .join('\n') || '—',
          proc:
            [
              l.numeroProcesso ? `Proc: ${l.numeroProcesso}` : '',
              l.numeroMedidaProtetiva ? `MP: ${l.numeroMedidaProtetiva}` : '',
              l.numeroGuiaAcolhimento ? `Guia: ${l.numeroGuiaAcolhimento}` : '',
            ]
              .filter(Boolean)
              .join('\n') || '—',
          terr: l.territorio ?? '—',
          equipe:
            [
              l.asVaraInfancia ? `AS Vara: ${l.asVaraInfancia}` : '',
              l.psicVaraInfancia ? `Psic: ${l.psicVaraInfancia}` : '',
              l.asCreas ? `AS CREAS: ${l.asCreas}` : '',
            ]
              .filter(Boolean)
              .join('\n') || '—',
          motivo: `${LABEL_MOTIVO[l.motivo] ?? l.motivo}\n${LABEL_REGIME[l.regime] ?? l.regime}`,
          status: l.ativo
            ? 'ATIVO'
            : `${l.situacaoEspecial ? l.situacaoEspecial + ' — ' : ''}ENCERRADO\n${formatarDataBR(l.dataDesacolhimento ?? '')}`,
        };
        for (const c of cols) {
          doc.fillColor('#0F172A');
          doc.text(valores[c.key] ?? '', MX + c.x + 3, y + 3, {
            width: c.w - 6,
            height: alturaLinha - 4,
            lineBreak: true,
          });
        }
        y += alturaLinha;
        doc
          .strokeColor('#E2E8F0')
          .lineWidth(0.3)
          .moveTo(MX, y)
          .lineTo(MX + CW, y)
          .stroke();
      }

      finalizarRodape(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// =====================================================
// API pública
// =====================================================
export async function gerarPDF(dados: DadosPDF): Promise<Buffer> {
  if (dados.tipo === 'FLUXO_DETALHADO') {
    return gerarPDFFluxo(dados);
  }
  return gerarPDFCentral(dados);
}

export function gerarProtocoloExportacao(): string {
  const agora = new Date();
  return `REL-${agora.getFullYear()}-${String(agora.getTime()).slice(-8)}`;
}