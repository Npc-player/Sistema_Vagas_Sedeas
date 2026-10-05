// src/app/api/relatorios/exportar/route.ts
// Gera o PDF do relatório selecionado e devolve como stream.

import { NextResponse, type NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { getSession, can } from '@/lib/rbac';
import {
  getCentralRegulacao,
  getFluxoDetalhado,
  calcularPeriodo,
  type TipoPeriodo,
} from '@/lib/relatorios/queries';
import {
  gerarPDF,
  gerarProtocoloExportacao,
  type DadosPDF,
} from '@/lib/relatorios/pdf';
import { audit } from '@/lib/audit/log';

function formatarDataBR(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR');
}

function allRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === 'object' && 'rows' in result) {
    const rows = (result as { rows: unknown[] }).rows;
    if (Array.isArray(rows)) return rows as T[];
  }
  return [];
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  if (!can.cadastrarAcolhido(session.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  let body: {
    tipoRelatorio?: string;
    tipoPeriodo?: string;
    dataBase?: string;
    dataInicio?: string;
    dataFim?: string;
    unidadeId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const tipoRelatorio = body.tipoRelatorio ?? 'CENTRAL_INSTITUCIONAL';
  const tipoPeriodo = (body.tipoPeriodo ?? 'MENSAL') as TipoPeriodo;
  const dataBase = body.dataBase ?? new Date().toISOString().split('T')[0];

  const periodo = calcularPeriodo(
    tipoPeriodo,
    dataBase,
    body.dataInicio,
    body.dataFim
  );

  const periodoLabel = `${formatarDataBR(periodo.inicio)} a ${formatarDataBR(periodo.fim)}`;
  const protocolo = gerarProtocoloExportacao();

  // Busca nome + prontuário do usuário para exibir no PDF
  let nomeCompleto = session.userEmail;
  let prontuario: string | null = null;
  try {
    const rows = await db.execute(sql`
      SELECT nome_completo AS "nomeCompleto", prontuario
      FROM profiles
      WHERE id = ${session.userId}
      LIMIT 1
    `);
    const row = allRows<{ nomeCompleto: string; prontuario: string | null }>(
      rows
    )[0];
    if (row) {
      nomeCompleto = row.nomeCompleto;
      prontuario = row.prontuario;
    }
  } catch (error) {
    console.error('[exportar relatorio] erro ao buscar perfil:', error);
  }

  let dadosPDF: DadosPDF;

  try {
    if (
      tipoRelatorio === 'CENTRAL_INSTITUCIONAL' ||
      tipoRelatorio === 'CENTRAL_PROVISAO'
    ) {
      // Para o PDF consolidado, buscamos SEMPRE as duas categorias
      const linhasInstitucional = await getCentralRegulacao(
        periodo,
        'INSTITUCIONAL'
      );
      const linhasProvisorio = await getCentralRegulacao(
        periodo,
        'PROVISAO'
      );

      dadosPDF = {
        tipo: 'CENTRAL',
        protocolo,
        periodoLabel,
        geradoPorNome: nomeCompleto,
        geradoPorProntuario: prontuario,
        geradoPorRole: session.role,
        linhasInstitucional,
        linhasProvisorio,
      };
    } else if (tipoRelatorio === 'FLUXO_DETALHADO') {
      const linhas = await getFluxoDetalhado(periodo, body.unidadeId);
      dadosPDF = {
        tipo: 'FLUXO_DETALHADO',
        protocolo,
        periodoLabel,
        geradoPorNome: nomeCompleto,
        geradoPorProntuario: prontuario,
        geradoPorRole: session.role,
        linhas,
      };
    } else {
      return NextResponse.json(
        { error: 'Tipo de relatório inválido' },
        { status: 400 }
      );
    }

    const pdf = await gerarPDF(dadosPDF);

    // Auditoria EXPORT
    const h = await headers();
    const forwarded = h.get('x-forwarded-for');
    const totalRegistros =
      dadosPDF.tipo === 'CENTRAL'
        ? dadosPDF.linhasInstitucional.length +
          dadosPDF.linhasProvisorio.length
        : dadosPDF.linhas.length;

    try {
      await audit(
        {
          userId: session.userId,
          userEmail: session.userEmail,
          userRole: session.role,
          ipAddress: forwarded?.split(',')[0].trim() ?? null,
          userAgent: h.get('user-agent'),
        },
        {
          action: 'EXPORT',
          entity: 'acolhimentos',
          entityId: null,
          metadata: {
            protocoloExportacao: protocolo,
            tipoRelatorio,
            periodoLabel,
            totalRegistros,
            unidadeId: body.unidadeId ?? null,
          },
        }
      );
    } catch (err) {
      console.error('[exportar relatorio] falha ao auditar:', err);
    }

    const filename = `${protocolo}-relatorio.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdf.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[exportar relatorio] erro:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar PDF. Tente novamente.' },
      { status: 500 }
    );
  }
}