export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mesh-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-6 md:py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-8%] h-72 w-72 rounded-full bg-primary/15 blur-[120px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-6%] h-80 w-80 rounded-full bg-cyan-400/12 blur-[140px] animate-float-reverse" />
      </div>
      <div className="relative z-10 flex w-full justify-center">{children}</div>
    </div>
  );
}
