// src/lib/audit/pdf.ts
// Geração de PDF da trilha de auditoria.
// Roda apenas no servidor (Node runtime).

import PDFDocument from 'pdfkit';
import type { AuditLogRow, FiltrosAuditoria } from './queries';

const LABEL_ACTION: Record<string, string> = {
  LOGIN: 'Login',
  LOGIN_FAILED: 'Login falho',
  LOGOUT: 'Logout',
  CREATE: 'Criação',
  READ: 'Leitura',
  UPDATE: 'Atualização',
  DELETE: 'Exclusão',
  EXPORT: 'Exportação',
};

const LABEL_ENTITY: Record<string, string> = {
  profiles: 'Perfis',
  unidades: 'Unidades',
  acolhidos: 'Acolhidos',
  acolhimentos: 'Acolhimentos',
  vagas: 'Vagas',
  audit_log: 'Auditoria',
};

export interface DadosPDF {
  registros: AuditLogRow[];
  total: number;
  filtros: FiltrosAuditoria;
  justificativa: string;
  solicitanteEmail: string;
  solicitanteRole: string;
  protocoloExportacao: string;
}

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function resumoFiltros(f: FiltrosAuditoria): string {
  const partes: string[] = [];
  if (f.action) partes.push(`Ação: ${LABEL_ACTION[f.action] ?? f.action}`);
  if (f.entity) partes.push(`Entidade: ${LABEL_ENTITY[f.entity] ?? f.entity}`);
  if (f.userId) partes.push(`Usuário (ID): ${f.userId}`);
  if (f.dataInicio) partes.push(`De: ${f.dataInicio}`);
  if (f.dataFim) partes.push(`Até: ${f.dataFim}`);
  return partes.length > 0 ? partes.join(' · ') : 'Sem filtros aplicados';
}

export async function gerarPDFAuditoria(dados: DadosPDF): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Trilha de Auditoria — ${dados.protocoloExportacao}`,
          Author: 'Sistema de Controle de Vagas — Assistência Social',
          Subject: 'Exportação de trilha de auditoria',
          Creator: 'Sistema de Controle de Vagas',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const larguraPagina =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;

      // ==================== Cabeçalho institucional ====================
      doc
        .fillColor('#0F766E')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('Secretaria de Desenvolvimento e Assistência Social', { align: 'left' });

      doc
        .fillColor('#0F172A')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('Trilha de Auditoria — Exportação Oficial', { align: 'left' });

      doc.moveDown(0.5);

      doc
        .fillColor('#475569')
        .fontSize(9)
        .font('Helvetica')
        .text(`Protocolo de exportação: ${dados.protocoloExportacao}`)
        .text(
          `Gerado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`
        )
        .text(`Solicitante: ${dados.solicitanteEmail} (${dados.solicitanteRole})`)
        .text(`Total de registros exportados: ${dados.total}`)
        .text(`Filtros aplicados: ${resumoFiltros(dados.filtros)}`);

      doc.moveDown(1);

      // ==================== Justificativa ====================
      doc
        .fillColor('#0F766E')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Justificativa legal');

      doc
        .fillColor('#0F172A')
        .fontSize(10)
        .font('Helvetica')
        .text(dados.justificativa, { align: 'justify' });

      doc.moveDown(1.5);

      // ==================== Tabela de registros ====================
      doc
        .fillColor('#0F766E')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Registros');

      doc.moveDown(0.5);

      const colX = {
        data: doc.page.margins.left,
        acao: doc.page.margins.left + 110,
        entidade: doc.page.margins.left + 175,
        usuario: doc.page.margins.left + 245,
      };

      // Cabeçalho da tabela
      const alturaCabecalho = 18;
      doc
        .fillColor('#F1F5F9')
        .rect(doc.page.margins.left, doc.y, larguraPagina, alturaCabecalho)
        .fill();

      doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold');
      const yCab = doc.y + 5;
      doc.text('DATA/HORA', colX.data + 4, yCab);
      doc.text('AÇÃO', colX.acao + 4, yCab);
      doc.text('ENTIDADE', colX.entidade + 4, yCab);
      doc.text('USUÁRIO', colX.usuario + 4, yCab);

      doc.y += alturaCabecalho;

      // Linhas
      doc.font('Helvetica').fontSize(8).fillColor('#0F172A');

      for (const log of dados.registros) {
        // Se estiver perto do fim da página, adiciona nova
        if (doc.y > doc.page.height - 80) {
          doc.addPage();
          // Repete cabeçalho da tabela na nova página
          doc
            .fillColor('#F1F5F9')
            .rect(doc.page.margins.left, doc.y, larguraPagina, alturaCabecalho)
            .fill();
          doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold');
          const yNovo = doc.y + 5;
          doc.text('DATA/HORA', colX.data + 4, yNovo);
          doc.text('AÇÃO', colX.acao + 4, yNovo);
          doc.text('ENTIDADE', colX.entidade + 4, yNovo);
          doc.text('USUÁRIO', colX.usuario + 4, yNovo);
          doc.y += alturaCabecalho;
          doc.font('Helvetica').fontSize(8).fillColor('#0F172A');
        }

        const yLinha = doc.y + 3;
        const alturaLinha = 14;

        // Separador (linha sutil)
        doc
          .strokeColor('#E2E8F0')
          .lineWidth(0.5)
          .moveTo(doc.page.margins.left, doc.y + alturaLinha)
          .lineTo(doc.page.margins.left + larguraPagina, doc.y + alturaLinha)
          .stroke();

        doc.text(formatarDataHora(log.createdAt), colX.data + 4, yLinha, {
          width: 105,
          lineBreak: false,
        });
        doc.text(
          LABEL_ACTION[log.action] ?? log.action,
          colX.acao + 4,
          yLinha,
          { width: 60, lineBreak: false }
        );
        doc.text(
          LABEL_ENTITY[log.entity] ?? log.entity,
          colX.entidade + 4,
          yLinha,
          { width: 68, lineBreak: false }
        );
        doc.text(log.userEmail ?? '—', colX.usuario + 4, yLinha, {
          width: larguraPagina - (colX.usuario - doc.page.margins.left) - 8,
          lineBreak: false,
        });

        doc.y += alturaLinha;
      }

      // ==================== Rodapé em todas as páginas ====================
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc
          .fillColor('#94A3B8')
          .fontSize(7)
          .font('Helvetica')
          .text(
            `Protocolo ${dados.protocoloExportacao} · Página ${i + 1} de ${range.count} · Documento auditável`,
            doc.page.margins.left,
            doc.page.height - 30,
            { width: larguraPagina, align: 'center' }
          );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}