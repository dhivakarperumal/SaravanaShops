import React from 'react'
import Testimonials from './Testimonials'
import JewelleryBanner from './JewelleryBanner'
import Video from './Video'
import SareeBanner from './SareeBanner'
import Hero from './Hero'
import BangleBanner from './BangleBanner'
import Bangles from './Bangles'
import Jewellery from './Jewellery'
import Saree from './Saree'
import Offer from './Offer' 
import Wholesale from './Wholesale'
import CategoryItems from './CategoyItems'

function Home() {
  return (
    <div>
      <Hero/>
      <CategoryItems/>
      <Bangles/>
      <BangleBanner/>
      <Jewellery/>
      <JewelleryBanner/>
     
      <Offer/>
      
      <Testimonials/>
      <Video/>
      <Wholesale/>
    </div>
  )
}

export default Home