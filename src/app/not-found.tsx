import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container py-28 text-center">
      <p className="text-sm font-extrabold text-accent">404</p>
      <h1 className="mt-3 text-4xl font-extrabold">This page could not be found</h1>
      <p className="lead mx-auto max-w-md">The page may have moved. Head back home or run a free audit of your own site.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-brand">Back to home</Link>
        <Link href="/free-seo-audit" className="btn-ghost">Free SEO audit</Link>
      </div>
    </section>
  );
}
