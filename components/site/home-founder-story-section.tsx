import { getTranslations } from "next-intl/server";
import { StorefrontImage } from "@/components/site/storefront-image";
import { founderStoryHomePoolWebpUrl } from "@/lib/r2";

export async function HomeFounderStorySection() {
  const tHome = await getTranslations("Home");
  const tAbout = await getTranslations("AboutPage");
  const imageSrc = founderStoryHomePoolWebpUrl();

  return (
    <section
      className="border-b border-line bg-paper"
      aria-labelledby="home-founder-story-heading"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-16 lg:py-20">
        <div className="mx-auto w-full max-w-4xl">
          <h2
            id="home-founder-story-heading"
            className="text-center font-serif text-3xl tracking-tight text-ink sm:text-4xl"
          >
            {tAbout("storyKicker")}
          </h2>

          <div className="mt-10 flex w-full flex-col items-center gap-10 lg:mt-12 lg:flex-row lg:items-center lg:justify-center lg:gap-12 xl:gap-16">
          <div className="relative aspect-[4/5] w-full max-w-[20rem] shrink-0 overflow-hidden rounded-2xl border border-line bg-white shadow-sm sm:max-w-[22rem] lg:w-[26rem]">
            <StorefrontImage
              src={imageSrc}
              alt={tHome("founderStoryImageAlt")}
              fill
              sizes="(max-width: 1024px) 352px, 416px"
              className="object-cover object-center"
            />
          </div>

          <div className="w-full max-w-[20rem] sm:max-w-[22rem] lg:max-w-[24rem]">
            <div className="space-y-5 text-center text-base leading-relaxed text-muted sm:text-lg sm:leading-relaxed lg:text-left">
              <p>{tAbout("storyP1")}</p>
              <p>{tAbout("storyP2")}</p>
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
