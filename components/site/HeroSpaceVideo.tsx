/**
 * DIGI-TEMP hero background — deep dark gradient layers only (no media fetch).
 */
export function HeroSpaceVideo() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Base: deep dark background (always visible) */}
      <div
        className="absolute inset-0 opacity-100"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 120% 90% at 25% 15%, rgb(34 211 238 / 0.16), transparent 52%), radial-gradient(ellipse 100% 80% at 85% 25%, rgb(99 102 241 / 0.12), transparent 48%), radial-gradient(circle at 50% 110%, rgb(2 6 23 / 0.95), rgb(7 10 16))",
        }}
      />

      {/* Vignette + cyan/purple haze overlay */}
      <div
        className="absolute inset-0 z-[2] bg-gradient-to-b from-[#070a10]/72 via-[#070a10]/36 to-[#070a10]/94"
        aria-hidden
      />
      <div
        className="absolute inset-0 z-[2] opacity-[0.38]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 18%, rgb(34 211 238 / 0.2), transparent 42%), radial-gradient(circle at 78% 12%, rgb(168 85 247 / 0.12), transparent 38%), linear-gradient(to bottom, rgb(7 10 16 / 0.65), rgb(15 17 20 / 0.35))",
        }}
      />

      {/* Fine HUD grid */}
      <div
        className="absolute inset-0 z-[2] opacity-[0.14] motion-reduce:opacity-[0.1]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(255 255 255 / 0.06) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.05) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
        aria-hidden
      />
    </div>
  );
}
