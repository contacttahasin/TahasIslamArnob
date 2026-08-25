import HomeText from '@/app/components/homeComponents/homeText';
import CinematicIntro from '@/app/components/intro/CinematicIntro';
import {
  ScrollVelocityContainer,
  ScrollVelocityRow,
} from "@/app/components/homeComponents/ScrollVelocityContainer"
import DroneScrollHero from '@/app/components/homeComponents/DroneScrollHero';
import { Skiper30 } from '@/app/components/homeComponents/skiper30';
import CodeStatusBar from '@/app/components/code/CodeStatusBar';
import { Skiper19 } from '@/app/components/homeComponents/skiper19';
import Footer from '@/app/components/homeComponents/footer/Footer';
import LiveChat from '@/app/components/LiveChat/LiveChat';
import ScrollTop from '@/app/components/scrollTop/ScrollTop';






function page() {
  return (
    <div className=' bg-bg-primary text-ink'>
      <CinematicIntro/>
      <HomeText/>
     
      <ScrollVelocityContainer className="text-4xl font-bold md:text-7xl bg-bg-secondary text-ink py-3 mt-3 border-y border-line">
  <ScrollVelocityRow baseVelocity={20} direction={1}>
   TAHASIN ISLAM
  </ScrollVelocityRow>
</ScrollVelocityContainer>
<CodeStatusBar branch="main" file="tahasin/app/(site)/page.tsx" />
<DroneScrollHero/>
<Skiper30/>

<Skiper19/>
<LiveChat/>
<ScrollTop/>
<Footer/>
    </div>
  )
}

export default page