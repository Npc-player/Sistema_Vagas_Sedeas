// src/lib/relatorios/pdf.ts
// Geração de PDF dos relatórios mensais.

import PDFDocument from 'pdfkit';
import path from 'node:path';
import type {
  LinhaCentralRegulacao,
  LinhaFluxoDetalhado,
} from './queries';
import { calcularTotais } from './queries';

// =====================================================
// Constantes
// =====================================================
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 35;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN_X;

// Landscape
const PAGE_WIDTH_L = 841.89;
const PAGE_HEIGHT_L = 595.28;
const MARGIN_X_L = 25;
const CONTENT_WIDTH_L = PAGE_WIDTH_L - 2 * MARGIN_X_L;

const CAMINHO_CABECALHO = path.join(
  process.cwd(), 'public', 'relatorios', 'cabecalho.jpg'
);
const CAMINHO_CORPO = path.join(
  process.cwd(), 'public', 'relatorios', 'corpo.jpg'
);
const CAMINHO_RODAPE = path.join(
  process.cwd(), 'public', 'relatorios', 'rodape.jpg'
);

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
// Tipos
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
  linhasInstitucional: LinhaCentralRegulacao[];
  linhasProvisorio: LinhaCentralRegulacao[];
}

export interface DadosPDFFluxo extends DadosPDFBase {
  tipo: 'FLUXO_DETALHADO';
  linhas: LinhaFluxoDetalhado[];
}

export type DadosPDF = DadosPDFCentral | DadosPDFFluxo;

// =====================================================
// Helpers de layout
// =====================================================
interface Layout {
  contentTop: number;
  contentBottom: number;
  hCabecalho: number;
  hRodape: number;
}

function medirImagem(doc: PDFKit.PDFDocument, caminho: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const img = (doc as any).openImage(caminho);
    return {
      largura: img.width as number,
      altura: img.height as number,
    };
  } catch {
    return null;
  }
}

function desenharLayoutPortrait(doc: PDFKit.PDFDocument): Layout {
  // Corpo de fundo
  try {
    doc.image(CAMINHO_CORPO, 0, 0, {
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
    });
  } catch {
    // ignora
  }

  // Cabeçalho — usa altura natural da imagem
  let hCabecalho = 90;
  const dimCab = medirImagem(doc, CAMINHO_CABECALHO);
  if (dimCab) {
    hCabecalho = (dimCab.altura / dimCab.largura) * PAGE_WIDTH;
    doc.image(CAMINHO_CABECALHO, 0, 0, { width: PAGE_WIDTH });
  } else {
    doc
      .fillColor('#0F766E')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Prefeitura Municipal de Guarujá', MARGIN_X, 30, {
        width: CONTENT_WIDTH,
      });
  }

  // Rodapé — usa altura natural da imagem, ancorado no fim
  let hRodape = 50;
  const dimRod = medirImagem(doc, CAMINHO_RODAPE);
  if (dimRod) {
    hRodape = (dimRod.altura / dimRod.largura) * PAGE_WIDTH;
    doc.image(CAMINHO_RODAPE, 0, PAGE_HEIGHT - hRodape, {
      width: PAGE_WIDTH,
    });
  }

  return {
    contentTop: hCabecalho + 30, // 30pt = ~2 linhas de espaço abaixo do cabeçalho
    contentBottom: PAGE_HEIGHT - hRodape - 10,
    hCabecalho,
    hRodape,
  };
}

function desenharLayoutLandscape(doc: PDFKit.PDFDocument): Layout {
  try {
    doc.image(CAMINHO_CORPO, 0, 0, {
      width: PAGE_WIDTH_L,
      height: PAGE_HEIGHT_L,
    });
  } catch {
    // ignora
  }

  let hCabecalho = 55;
  const dimCab = medirImagem(doc, CAMINHO_CABECALHO);
  if (dimCab) {
    hCabecalho = (dimCab.altura / dimCab.largura) * PAGE_WIDTH_L;
    doc.image(CAMINHO_CABECALHO, 0, 0, { width: PAGE_WIDTH_L });
  }

  let hRodape = 40;
  const dimRod = medirImagem(doc, CAMINHO_RODAPE);
  if (dimRod) {
    hRodape = (dimRod.altura / dimRod.largura) * PAGE_WIDTH_L;
    doc.image(CAMINHO_RODAPE, 0, PAGE_HEIGHT_L - hRodape, {
      width: PAGE_WIDTH_L,
    });
  }

  return {
    contentTop: hCabecalho + 20,
    contentBottom: PAGE_HEIGHT_L - hRodape - 10,
    hCabecalho,
    hRodape,
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
// Tabela da Central
// =====================================================
function desenharTabelaCentral(
  doc: PDFKit.PDFDocument,
  yInicial: number,
  contentBottom: number,
  linhas: LinhaCentralRegulacao[],
  onNovaPagina: () => number
): number {
  let y = yInicial;

  const cols = [
    { label: 'UNIDADE', x: 0, w: 140, align: 'left', key: 'unidade' },
    { label: 'META\nCONVENIADA', x: 140, w: 55, align: 'center', key: 'meta' },
    { label: 'ENTRADAS', x: 195, w: 42, align: 'center', key: 'entradas' },
    { label: 'SAÍDAS', x: 237, w: 40, align: 'center', key: 'saidas' },
    { label: 'EVASÕES/\nOUTROS', x: 277, w: 55, align: 'center', key: 'evasoes' },
    { label: 'ACOLHIDOS', x: 332, w: 45, align: 'center', key: 'acolhidos' },
    { label: 'PERMANECENTES', x: 377, w: 65, align: 'center', key: 'perm' },
    { label: 'VAGAS\nDISPONÍVEIS', x: 442, w: 83, align: 'center', key: 'vagas' },
  ] as const;

  const desenharHeader = () => {
    const hHeader = 24;
    doc
      .fillColor('#0F766E')
      .rect(MARGIN_X, y, CONTENT_WIDTH, hHeader)
      .fill();
    doc.fillColor('#FFFFFF').fontSize(6.5).font('Helvetica-Bold');
    for (const c of cols) {
      const alturaTexto = doc.heightOfString(c.label, {
        width: c.w - 4,
        align: c.align,
      });
      const yTexto = y + Math.max(2, (hHeader - alturaTexto) / 2);
      doc.text(c.label, MARGIN_X + c.x + 2, yTexto, {
        width: c.w - 4,
        align: c.align,
        lineBreak: true,
      });
    }
    y += hHeader;
  };

  desenharHeader();

  const totais = calcularTotais(linhas);

  const desenharLinha = (
    valores: Record<string, string>,
    negrito = false
  ) => {
    if (y + 18 > contentBottom) {
      y = onNovaPagina();
      desenharHeader();
    }

    if (negrito) {
      doc
        .fillColor('#F1F5F9')
        .rect(MARGIN_X, y, CONTENT_WIDTH, 18)
        .fill();
    }
    doc
      .fillColor('#0F172A')
      .font(negrito ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(7.5);

    for (const c of cols) {
      const texto = valores[c.key] ?? '';
      doc.text(texto, MARGIN_X + c.x + 2, y + 6, {
        width: c.w - 4,
        align: c.align,
        lineBreak: false,
        ellipsis: true,
      });
    }

    y += 18;
    doc
      .strokeColor('#E2E8F0')
      .lineWidth(0.3)
      .moveTo(MARGIN_X, y)
      .lineTo(MARGIN_X + CONTENT_WIDTH, y)
      .stroke();
  };

  for (const l of linhas) {
    desenharLinha({
      unidade: l.unidadeNome,
      meta: String(l.metaConveniada),
      entradas: String(l.entradas),
      saidas: String(l.saidas),
      evasoes: String(l.evasoesOutros),
      acolhidos: String(l.acolhidos),
      perm: String(l.permanecentes),
      vagas: String(l.vagasDisponiveis),
    });
  }

  // Linha de total
  desenharLinha(
    {
      unidade: 'TOTAL',
      meta: String(totais.metaConveniada),
      entradas: String(totais.entradas),
      saidas: String(totais.saidas),
      evasoes: String(totais.evasoesOutros),
      acolhidos: String(totais.acolhidos),
      perm: String(totais.permanecentes),
      vagas: String(totais.vagasDisponiveis),
    },
    true
  );

  return y;
}

// =====================================================
// PDF Central de Regulação (2 tabelas)
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

      // ===== Cabeçalho institucional =====
      doc
        .fillColor('#0F172A')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('DEPARTAMENTO DE PROTEÇÃO SOCIAL ESPECIAL', MARGIN_X, y, {
          width: CONTENT_WIDTH,
          align: 'center',
        });
      y += 14;

      doc
        .fillColor('#0F766E')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('CENTRAL DE REGULAÇÃO DE VAGAS', MARGIN_X, y, {
          width: CONTENT_WIDTH,
          align: 'center',
        });
      y += 14;

      doc
        .fillColor('#0F172A')
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .text(
          'SERVIÇOS DE ACOLHIMENTO INSTITUCIONAL PARA CRIANÇAS, ADOLESCENTES E JOVENS DO MUNICÍPIO',
          MARGIN_X,
          y,
          { width: CONTENT_WIDTH, align: 'center' }
        );
      y += 18;

      // Metadados
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica');
      doc.text(`Período: ${dados.periodoLabel}`, MARGIN_X, y, {
        width: CONTENT_WIDTH,
        align: 'center',
      });
      y += 10;
      doc.text(
        `Protocolo: ${dados.protocolo} · Gerado em ${new Date().toLocaleString('pt-BR')}`,
        MARGIN_X,
        y,
        { width: CONTENT_WIDTH, align: 'center' }
      );
      y += 10;
      doc.text(
        `Responsável: ${textoResponsavel(dados)}`,
        MARGIN_X,
        y,
        { width: CONTENT_WIDTH, align: 'center' }
      );
      y += 20;

      // ===== Tabela 1: Institucional =====
      doc
        .fillColor('#0F172A')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Serviços de Acolhimento Institucional', MARGIN_X, y);
      y += 14;

      y = desenharTabelaCentral(
        doc,
        y,
        layout.contentBottom,
        dados.linhasInstitucional,
        novaPagina
      );
      y += 20;

      // ===== Tabela 2: Provisório =====
      // Se não couber, nova página
      if (y + 40 > layout.contentBottom) {
        y = novaPagina();
      }

      doc
        .fillColor('#0F172A')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(
          'Serviço de Acolhimento Institucional Provisório',
          MARGIN_X,
          y
        );
      y += 14;

      y = desenharTabelaCentral(
        doc,
        y,
        layout.contentBottom,
        dados.linhasProvisorio,
        novaPagina
      );
      y += 16;

      // ===== Notas =====
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

      // Cabeçalho
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
        .text(
          'FLUXO MENSAL DE ACOLHIMENTO — RELAÇÃO NOMINAL',
          MX,
          y,
          { width: CW, align: 'center' }
        );
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

      // Colunas
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
          nome:
            l.nomeCompleto + (l.nomeMae ? `\nMãe: ${l.nomeMae}` : ''),
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