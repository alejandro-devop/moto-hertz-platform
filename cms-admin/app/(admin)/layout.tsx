import { navLinks } from "./nav-links";
import { NavLinkItem } from "./nav-link-item";
import { LogoutButton } from "./logout-button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col gap-1 border-r bg-muted/30 p-4">
        <div className="mb-4 px-2">
          <p className="text-sm font-semibold">Yamaha Oriente</p>
          <p className="text-xs text-muted-foreground">Panel de administración</p>
        </div>
        <nav className="flex flex-col gap-1">
          {navLinks.map((link) => (
            <NavLinkItem key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>
        <div className="mt-auto px-2">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
