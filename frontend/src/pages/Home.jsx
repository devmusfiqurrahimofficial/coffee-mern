import HeroArea from "../components/uiElements/HeroArea";
import CoffeeVerticals from "../components/uiElements/CoffeeVerticals";
import FeaturedProducts from "../components/uiElements/FeaturedProducts";
import ProductCategories from "../components/uiElements/ProductCategory/ProductCategories";
import ExploreProducts from "../components/uiElements/ExploreProducts";
import HeroArea2 from "../components/uiElements/HeroArea2";
import InstagramCarousel from "../components/uiElements/InstagramCarousel";
import { useSection } from "../hooks/useSection";

const Home = () => {
  const hero1 = useSection("home", "hero1");
  const featured = useSection("home", "featured");
  const verticals = useSection("home", "verticals");
  const hero2 = useSection("home", "hero2");
  const categories = useSection("home", "categories");
  const explore = useSection("home", "explore");
  const b2b = useSection("home", "b2b");
  const instagram = useSection("home", "instagram");

  const verticalCards = [
    {
      title: verticals.card1Title,
      subtitle: verticals.card1Subtitle,
      image: verticals.card1Image,
      className: "md:row-span-2 min-h-[520px]",
    },
    {
      title: verticals.card2Title,
      subtitle: verticals.card2Subtitle,
      image: verticals.card2Image,
      className: "min-h-[260px]",
    },
    {
      title: verticals.card3Title,
      subtitle: verticals.card3Subtitle,
      image: verticals.card3Image,
      className: "min-h-[260px]",
    },
  ];

  const categoryCards = [
    { title: categories.card1Title, image: categories.card1Image, image2: categories.card1Image2, className: "md:col-span-2 min-h-[215px]" },
    { title: categories.card2Title, image: categories.card2Image, image2: categories.card2Image2, className: "md:col-span-1 min-h-[215px]" },
    { title: categories.card3Title, image: categories.card3Image, image2: categories.card3Image2, className: "md:col-span-1 min-h-[215px]" },
    { title: categories.card4Title, image: categories.card4Image, image2: categories.card4Image2, className: "md:col-span-2 min-h-[215px]" },
  ];

  const exploreImages = [explore.image1, explore.image2, explore.image3].filter(Boolean);

  const instagramPosts = [
    { id: 1, image: instagram.image1, link: instagram.link },
    { id: 2, image: instagram.image2, link: instagram.link },
    { id: 3, image: instagram.image3, link: instagram.link },
    { id: 4, image: instagram.image4, link: instagram.link },
  ];

  return (
    <div>
       <HeroArea p={hero1.eyebrow} title={hero1.title} path={hero1.buttonPath}
         buttonText={hero1.buttonText} bg={hero1.image} />
        <FeaturedProducts
          eyebrow={featured.eyebrow}
          title={featured.title}
          accent={featured.accent}
        />
        <CoffeeVerticals
          eyebrow={verticals.eyebrow}
          title={verticals.title}
          accent={verticals.accent}
          cards={verticalCards}
        />
       <HeroArea2
         eyebrow={hero2.eyebrow}
         title={hero2.title}
         accent={hero2.accent}
         description={hero2.description}
         buttonText={hero2.buttonText}
         buttonPath={hero2.buttonPath}
         image={hero2.image}
       />
          <ProductCategories
            eyebrow={categories.eyebrow}
            title={categories.title}
            accent={categories.accent}
            cards={categoryCards}
          />
          <ExploreProducts
            eyebrow={explore.eyebrow}
            title={explore.title}
            accent={explore.accent}
            description={explore.description}
            buttonText={explore.buttonText}
            images={exploreImages}
          />
         <HeroArea2
           title={b2b.title}
           accent={b2b.accent}
           buttonText={b2b.buttonText}
           buttonPath={b2b.buttonPath}
           image={b2b.image}
         />
        <InstagramCarousel posts={instagramPosts} />;
    </div>
  )
}

export default Home