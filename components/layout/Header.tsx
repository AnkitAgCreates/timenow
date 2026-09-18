import { HeaderNav } from './HeaderNav';
import { Logo } from './Logo';

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="container-page flex h-14 items-center justify-between gap-4 md:h-16">
        <Logo />
        <HeaderNav />
      </div>
    </header>
  );
}
