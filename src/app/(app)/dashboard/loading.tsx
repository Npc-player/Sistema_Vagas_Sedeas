// src/app/(app)/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Cabeçalho */}
      <div className="mb-8">
        <div className="h-3 w-32 bg-slate-200 rounded mb-2" />
        <div className="h-8 w-64 bg-slate-200 rounded mb-3" />
        <div className="h-4 w-96 bg-slate-100 rounded" />
      </div>

      {/* Filtros */}
      <div className="bg-white border border-slate-200 rounded-lg py-3 px-4 mb-6">
        <div className="h-9 w-full bg-slate-100 rounded" />
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="border border-slate-200 rounded-lg p-5 bg-white"
          >
            <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
            <div className="h-8 w-16 bg-slate-100 rounded mb-2" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Taxa + Tempo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="border border-slate-200 rounded-lg p-6 bg-white"
          >
            <div className="h-4 w-40 bg-slate-200 rounded mb-4" />
            <div className="h-4 w-full bg-slate-100 rounded mb-2" />
            <div className="h-3 w-3/4 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Distribuição */}
      <div className="border border-slate-200 rounded-lg p-6 bg-white mb-6">
        <div className="h-4 w-48 bg-slate-200 rounded mb-6" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mb-4">
            <div className="h-3 w-32 bg-slate-100 rounded mb-2" />
            <div className="h-2 w-full bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-400 mt-6">
        Carregando indicadores...
      </p>
    </div>
  );
}