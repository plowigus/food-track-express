import Image from "next/image";
import { MENU_ITEMS } from "./constants/menu";
import { MenuCard } from "./components/MenuCard";

export const dynamic = "force-static";

export default function HomePage() {
  const burgers = MENU_ITEMS.filter((item) => item.category === "burgers");
  const sidesAndDrinks = MENU_ITEMS.filter((item) => item.category !== "burgers");

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-lime-400/30">
      {/* 
        HERO SECTION
        Breaking Bad aesthetic: stark typography, glowing gradients.
      */}
      <header className="relative min-h-svh lg:min-h-screen w-full flex items-center justify-center overflow-hidden bg-zinc-950">

        {/* Background image - full size, darker to let text and neon shine */}
        <Image
          src="/images/chemik.png"
          alt="Chemik Burger Background"
          fill
          priority
          className="object-cover opacity-40 z-0"
        />

        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none z-0" />

        {/* Glowing orb effect (Neon Green) */}
        <div className="absolute top-0 right-1/4 -translate-y-1/2 w-120 h-120 bg-lime-500/20 blur-[120px] rounded-full pointer-events-none z-0" />

        {/* Dark overlay just in case image is too bright at the edges */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-zinc-950/50 to-zinc-950 z-0" />

        <div className="relative z-10 mx-auto max-w-5xl flex flex-col items-center text-center gap-4 mt-8 pt-safe-top pb-safe-bottom px-[max(1rem,var(--sal))] pr-[max(1rem,var(--sar))]">
          <div className="inline-flex items-center rounded-md border border-lime-400/30 bg-lime-400/10 px-3 py-1 text-sm font-bold tracking-wide text-lime-400 uppercase">
            100% Gluten-Free
          </div>

          <h1 className="mt-2 text-5xl font-black tracking-tight sm:text-7xl">
            <span className="text-white">Chem</span>
            <span className="text-lime-400 drop-shadow-[0_0_15px_rgba(163,230,53,0.3)]">
              Burger
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-lg text-zinc-300 sm:text-xl">
            Eksperymentalna kuchnia. Reakcje pełne smaku, absolutne 0% glutenu.
            Gotujemy specjalnie dla Ciebie.
          </p>
        </div>
      </header>

      {/* 
        MENU SECTION
        Bento-box / Vertical Mobile Optimized Menu
      */}
      <section className="mx-auto max-w-5xl px-6 py-12 lg:px-12 lg:py-24">

        <div className="mb-10">
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <span className="text-lime-400">#01</span> Gęste Elementy (Burgery)
          </h2>
          <div className="h-px w-full bg-linear-to-r from-lime-400/50 to-transparent mt-4" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-16">
          {burgers.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>

        <div className="mb-10">
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <span className="text-lime-400">#02</span> Związki Poboczne (Dodatki)
          </h2>
          <div className="h-px w-full bg-linear-to-r from-lime-400/50 to-transparent mt-4" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sidesAndDrinks.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>

      </section>
    </main>
  );
}
