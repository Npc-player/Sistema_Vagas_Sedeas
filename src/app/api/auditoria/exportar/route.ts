// src/app/api/auditoria/exportar/route.ts
// Route Handler que:
//   1. Valida permissão (ADMIN_MUNICIPAL)
//   2. Exige justificativa (>= 30 caracteres)
//   3. Busca os registros conforme filtros
//   4. Gera PDF
//   5. Registra auditoria (EXPORT) com justificativa
//   6. Devolve o PDF como stream

import { NextResponse, type NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { getSession, can } from '@/lib/rbac';
import { listarAuditoria, type FiltrosAuditoria } from '@/lib/audit/queries';
import { gerarPDFAuditoria } from '@/lib/audit/pdf';
import { audit } from '@/lib/audit/log';

export async function POST(request: NextRequest) {
  // 1. Sessão + RBAC
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  if (!can.verAuditoria(session.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  // 2. Body
  let body: {
    justificativa?: string;
    action?: string;
    entity?: string;
    userId?: string;
    dataInicio?: string;
    dataFim?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const justificativa = (body.justificativa ?? '').trim();
  if (justificativa.length < 30) {
    return NextResponse.json(
      {
        error:
          'A justificativa deve ter pelo menos 30 caracteres (exigência LGPD).',
      },
      { status: 400 }
    );
  }
  if (justificativa.length > 2000) {
    return NextResponse.json(
      { error: 'Justificativa muito longa (máximo 2000 caracteres).' },
      { status: 400 }
    );
  }

  // 3. Filtros — sem paginação, exporta TODOS os registros que casam com os filtros
  const filtros: FiltrosAuditoria = {
    action: body.action || undefined,
    entity: body.entity || undefined,
    userId: body.userId || undefined,
    dataInicio: body.dataInicio || undefined,
    dataFim: body.dataFim || undefined,
    pagina: 1,
    porPagina: 5000, // limite alto para exportação
  };

  // 4. Protocolo de exportação (usa o mesmo gerador do acolhimento? não —
  //    vamos usar formato próprio: EXP-YYYY-<timestamp>)
  const agora = new Date();
  const protocoloExportacao = `EXP-${agora.getFullYear()}-${String(
    agora.getTime()
  ).slice(-8)}`;

  // 5. Busca + Gera PDF
  let pdf: Buffer;
  let totalRegistros: number;
  try {
    const resultado = await listarAuditoria(filtros);
    totalRegistros = resultado.total;

    pdf = await gerarPDFAuditoria({
      registros: resultado.registros,
      total: resultado.total,
      filtros,
      justificativa,
      solicitanteEmail: session.userEmail,
      solicitanteRole: session.role,
      protocoloExportacao,
    });
  } catch (error) {
    console.error('[exportar auditoria] erro ao gerar PDF:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar PDF. Tente novamente.' },
      { status: 500 }
    );
  }

  // 6. Auditoria do evento EXPORT
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
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
        entity: 'audit_log',
        entityId: null,
        metadata: {
          protocoloExportacao,
          totalRegistros,
          justificativa,
          filtros: {
            action: filtros.action ?? null,
            entity: filtros.entity ?? null,
            userId: filtros.userId ?? null,
            dataInicio: filtros.dataInicio ?? null,
            dataFim: filtros.dataFim ?? null,
          },
        },
      }
    );
  } catch (error) {
    // Falha ao auditar não deve impedir a entrega — mas registra no servidor
    console.error('[exportar auditoria] falha ao auditar EXPORT:', error);
  }

  // 7. Devolve o PDF
  const filename = `${protocoloExportacao}-trilha-auditoria.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdf.length),
      'Cache-Control': 'no-store',
    },
  });
}