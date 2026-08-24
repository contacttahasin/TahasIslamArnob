import Menu from '@/app/components/menu/menu'
import Naveber from '@/app/components/naveber/nave'
import NaveContext from '@/app/naveContext/NaveContext'
import TransitionProvider from '@/app/components/transition/TransitionProvider'
import PageTransitionOutlet from '@/app/components/transition/PageTransitionOutlet'
import { UiSoundProvider } from '@/app/lib/uiSoundContext'
import GlobalClickSound from '@/app/components/shared/GlobalClickSound'
import { ThemeProvider } from '@/app/lib/themeContext'
import PageBlurWrapper from '@/app/components/shared/PageBlurWrapper'
import { LocaleProvider } from '@/app/lib/LocaleProvider'
import ThemedRibbons from '@/app/components/shared/ThemedRibbons'
import NavGlow from '@/app/components/naveber/NavGlow'

/**
 * Public-site chrome (nav, menu, liquid page transitions, locale/theme/sound
 * providers) — split out from the root layout so /admin (a sibling route
 * group) can have its own minimal shell instead of inheriting all of this.
 * The no-FOUC ThemeInitScript stays in the root layout's <head> since it
 * has to run before first paint regardless of which route group renders.
 */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LocaleProvider>
      <ThemeProvider>
        <UiSoundProvider>
          <ThemedRibbons />
          <GlobalClickSound />
          <TransitionProvider>
            <NaveContext>
              {/* The glow sits above this wrapper's own dark gradient but
                  below the nav content, so the bar reads as lit from
                  behind rather than washed out. */}
              <div className="fixed top-0 z-99999 w-full bg-linear-to-b from-black/55 via-black/20 to-transparent text-white backdrop-blur-[2px]">
                <NavGlow />
                <div className="relative z-10"><Naveber/></div>
              </div>
              <Menu/>
              <PageBlurWrapper>
                <PageTransitionOutlet>{children}</PageTransitionOutlet>
              </PageBlurWrapper>
            </NaveContext>
          </TransitionProvider>
        </UiSoundProvider>
      </ThemeProvider>
    </LocaleProvider>
  );
}
