export default function ContainerPage({ params }: { params: { code: string } }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <h1 className="text-lg font-semibold">Контейнер: {params.code}</h1>
      <p className="mt-2 text-sm text-slate-600">
        Тут буде стан, дії (fill/empty/reminder) та історія.
      </p>
    </div>
  );
}
