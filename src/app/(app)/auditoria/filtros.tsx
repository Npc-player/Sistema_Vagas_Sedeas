// src/app/(app)/auditoria/filtros.tsx
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X } from 'lucide-react';

interface Opcoes {
  actions: string[];
  entities: string[];
  users: Array<{ id: string; email: string; role: string | null }>;
}

interface FiltrosProps {
  opcoes: Opcoes;
}

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

export function FiltrosAuditoria({ opcoes }: FiltrosProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Estado dos filtros (inicializa com a URL atual)
  const [action, setAction] = useState(searchParams.get('action') ?? '');
  const [entity, setEntity] = useState(searchParams.get('entity') ?? '');
  const [userId, setUserId] = useState(searchParams.get('userId') ?? '');
  const [dataInicio, setDataInicio] = useState(
    searchParams.get('dataInicio') ?? ''
  );
  const [dataFim, setDataFim] = useState(searchParams.get('dataFim') ?? '');

  function aplicar() {
    const params = new URLSearchParams();
    if (action) params.set('action', action);
    if (entity) params.set('entity', entity);
    if (userId) params.set('userId', userId);
    if (dataInicio) params.set('dataInicio', dataInicio);
    if (dataFim) params.set('dataFim', dataFim);
    params.set('pagina', '1');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function limpar() {
    setAction('');
    setEntity('');
    setUserId('');
    setDataInicio('');
    setDataFim('');
    startTransition(() => {
      router.push(pathname);
    });
  }

  const temFiltro =
    action || entity || userId || dataInicio || dataFim;

  return (
    <Card className="border-slate-200 mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="filtro-action">Ação</Label>
            <Select
              value={action || '__all__'}
              onValueChange={(v) => setAction(v === '__all__' ? '' : v)}
            >
              <SelectTrigger id="filtro-action">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {opcoes.actions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {LABEL_ACTION[a] ?? a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="filtro-entity">Entidade</Label>
            <Select
              value={entity || '__all__'}
              onValueChange={(v) => setEntity(v === '__all__' ? '' : v)}
            >
              <SelectTrigger id="filtro-entity">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {opcoes.entities.map((e) => (
                  <SelectItem key={e} value={e}>
                    {LABEL_ENTITY[e] ?? e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="filtro-user">Usuário</Label>
            <Select
              value={userId || '__all__'}
              onValueChange={(v) => setUserId(v === '__all__' ? '' : v)}
            >
              <SelectTrigger id="filtro-user">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {opcoes.users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="filtro-inicio">Data início</Label>
            <Input
              id="filtro-inicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="filtro-fim">Data fim</Label>
            <Input
              id="filtro-fim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          {temFiltro && (
            <Button
              variant="ghost"
              onClick={limpar}
              disabled={isPending}
              size="sm"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Limpar
            </Button>
          )}
          <Button onClick={aplicar} disabled={isPending} size="sm">
            <Search className="w-3.5 h-3.5 mr-1" />
            {isPending ? 'Filtrando...' : 'Aplicar filtros'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}