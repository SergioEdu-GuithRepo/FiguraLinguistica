import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl">🧭</div>
      <h1 className="mt-4 text-2xl font-extrabold">Página não encontrada</h1>
      <p className="mt-1 text-[var(--color-muted)]">Pardon? Sorry? すみません？</p>
      <Link href="/inicio" className="btn btn-primary mt-6">
        Voltar ao início
      </Link>
    </main>
  );
}
