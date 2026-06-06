export function generateStaticParams() { return [{ id: 'fallback' }]; }
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
