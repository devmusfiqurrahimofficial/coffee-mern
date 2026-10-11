import HeroArea from "../components/uiElements/HeroArea"
import bg from '../assets/image/hero-1.png'
import bg2 from '../assets/image/hero-2.png'
import CoffeeVerticals from "../components/uiElements/CoffeeVerticals"
import ProductCategories from "../components/uiElements/ProductCategory/ProductCategories"
import post1 from "../assets/image/instagram-1.png";
import post2 from "../assets/image/instagram-2.png";
import post3 from "../assets/image/instagram-3.png";
import post4 from "../assets/image/instagram-4.png";


import ExploreProducts from "../components/uiElements/ExploreProducts"
import HeroArea2 from "../components/uiElements/HeroArea2"
import InstagramCarousel from "../components/uiElements/InstagramCarousel"

const Home = () => {
const instagramPosts = [
  { id: 1, image: post1, link: "https://instagram.com" },
  { id: 2, image: post2, link: "https://instagram.com" },
  { id: 3, image: post3, link: "https://instagram.com" },
  { id: 4, image: post4, link: "https://instagram.com" },
  { id: 5, image: post1, link: "https://instagram.com" },
  { id: 6, image: post2, link: "https://instagram.com" },
  { id: 7, image: post3, link: "https://instagram.com" },
  { id: 8, image: post4, link: "https://instagram.com" },
];
  return (
    <div>
       <HeroArea p="Elevate your coffee experience" bg={bg}
        title="Taking in mind every step of the coffee journey"
        buttonText="Shop Now" />
        <CoffeeVerticals/>
       <HeroArea p="About Caffeine Lab" bg={bg2}
        title="Taking in mind every step of the coffee journey"
        description="Caffeine Lab is a specialty coffee company based in Saudi Arabia that is passionate about providing exceptional and ethical coffee experiences.."
         accentText
         buttonText="Learn More" />
         <ProductCategories/>
         <ExploreProducts  />
         <HeroArea2/>
        <InstagramCarousel posts={instagramPosts} />;
    </div>
  )
}

export default Home
