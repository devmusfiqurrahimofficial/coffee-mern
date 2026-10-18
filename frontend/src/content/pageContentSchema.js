import hero1 from "../assets/image/hero-1.png";
import hero2 from "../assets/image/hero-2.png";
import hero3 from "../assets/image/hero-3.png";
import vertical1 from "../assets/image/verticals-1.png";
import vertical2 from "../assets/image/verticals-2.png";
import vertical3 from "../assets/image/verticals-3.png";
import category1 from "../assets/image/category-1.png";
import category2 from "../assets/image/category-2.png";
import category3 from "../assets/image/category-3.png";
import category4 from "../assets/image/category-4.png";
import rectangle6 from "../assets/image/Rectangle6.png";
import rectangle8 from "../assets/image/Rectangle8.png";
import rectangle9 from "../assets/image/Rectangle9.png";
import rectangle10 from "../assets/image/Rectangle10.png";
import coffeeBag from "../assets/image/coffee-bag.png";
import coffeeCup from "../assets/image/coffee-cup.jpg";
import productThree from "../assets/image/product-three.jpg";
import post1 from "../assets/image/instagram-1.png";
import post2 from "../assets/image/instagram-2.png";
import post3 from "../assets/image/instagram-3.png";
import post4 from "../assets/image/instagram-4.png";
import footerBg from "../assets/image/Footer-bg.png";

// Single source of truth for admin-editable page content.
//
// Every public page section is described here: the field labels shown in the
// dashboard editor, the field type (text/textarea/lines/image), and the
// built-in default that renders when the admin hasn't saved an override.
// Saved values live in the backend "pageContent" collection; image overrides
// are "content/<id>" references to dashboard-uploaded files (imported from
// disk — never typed as a URL).
//
// Field types:
//   text     -> single-line input
//   textarea -> multi-line input (supports \n line breaks in the rendered page)
//   lines    -> one list item per line (e.g. footer link columns)
//   image    -> file import field with preview + "use default" reset

export const CONTENT_SCHEMAS = {
  home: {
    label: "Home Page",
    sections: [
      {
        id: "hero1",
        label: "Hero banner (top)",
        fields: [
          { key: "eyebrow", label: "Eyebrow text", type: "text", default: "Elevate your coffee experience" },
          { key: "title", label: "Title", type: "textarea", default: "Taking in mind every step of the coffee journey" },
          { key: "buttonText", label: "Button label", type: "text", default: "Shop Now" },
          { key: "buttonPath", label: "Button link", type: "text", default: "/shop" },
          { key: "image", label: "Background image", type: "image", default: hero1 },
        ],
      },
      {
        id: "featured",
        label: "Featured products heading",
        fields: [
          { key: "eyebrow", label: "Eyebrow text", type: "text", default: "From our shop" },
          { key: "title", label: "Title", type: "textarea", default: "Fresh picks, handpicked for you" },
          { key: "accent", label: "Highlighted word(s) in title", type: "text", default: "handpicked" },
        ],
      },
      {
        id: "verticals",
        label: "Our verticals",
        fields: [
          { key: "eyebrow", label: "Eyebrow text", type: "text", default: "Our verticals" },
          { key: "title", label: "Title (line break with Enter)", type: "textarea", default: "Taking in mind every step of\nthe coffee journey" },
          { key: "accent", label: "Highlighted word(s) in title", type: "text", default: "coffee journey" },
          { key: "card1Title", label: "Card 1 title", type: "text", default: "COFFEE ROASTER" },
          { key: "card1Subtitle", label: "Card 1 subtitle", type: "text", default: "Elevate your coffee experience" },
          { key: "card1Image", label: "Card 1 image", type: "image", default: vertical1 },
          { key: "card2Title", label: "Card 2 title", type: "text", default: "CAFE" },
          { key: "card2Subtitle", label: "Card 2 subtitle", type: "text", default: "Elevate your coffee experience" },
          { key: "card2Image", label: "Card 2 image", type: "image", default: vertical2 },
          { key: "card3Title", label: "Card 3 title", type: "text", default: "RETAIL" },
          { key: "card3Subtitle", label: "Card 3 subtitle", type: "text", default: "Elevate your coffee experience" },
          { key: "card3Image", label: "Card 3 image", type: "image", default: vertical3 },
        ],
      },
      {
        id: "hero2",
        label: "About Caffeine Lab banner",
        fields: [
          { key: "eyebrow", label: "Eyebrow text", type: "text", default: "About Caffeine Lab" },
          { key: "title", label: "Title", type: "textarea", default: "Taking in mind every step of the coffee journey" },
          { key: "accent", label: "Highlighted word(s) in title", type: "text", default: "coffee journey" },
          { key: "description", label: "Description", type: "textarea", default: "Caffeine Lab is a specialty coffee company based in Saudi Arabia that is passionate about providing exceptional and ethical coffee experiences.." },
          { key: "buttonText", label: "Button label", type: "text", default: "Learn More" },
          { key: "buttonPath", label: "Button link", type: "text", default: "/blog" },
          { key: "image", label: "Background image", type: "image", default: hero2 },
        ],
      },
      {
        id: "categories",
        label: "Product categories",
        fields: [
          { key: "eyebrow", label: "Eyebrow text", type: "text", default: "OUR PRODUCT CATEGORIES" },
          { key: "title", label: "Title (line break with Enter)", type: "textarea", default: "Taking in mind every step of\nthe coffee journey" },
          { key: "accent", label: "Highlighted word(s) in title", type: "text", default: "coffee journey" },
          { key: "card1Title", label: "Card 1 title", type: "text", default: "BARISTA PRODUCTS" },
          { key: "card1Image", label: "Card 1 image", type: "image", default: category1 },
          { key: "card1Image2", label: "Card 1 secondary image", type: "image", default: rectangle6 },
          { key: "card2Title", label: "Card 2 title", type: "text", default: "COFFEE" },
          { key: "card2Image", label: "Card 2 image", type: "image", default: category2 },
          { key: "card2Image2", label: "Card 2 secondary image", type: "image", default: rectangle8 },
          { key: "card3Title", label: "Card 3 title", type: "text", default: "ACCESSORIES" },
          { key: "card3Image", label: "Card 3 image", type: "image", default: category3 },
          { key: "card3Image2", label: "Card 3 secondary image", type: "image", default: rectangle9 },
          { key: "card4Title", label: "Card 4 title", type: "text", default: "PROFESSIONAL EQUIPMENTS" },
          { key: "card4Image", label: "Card 4 image", type: "image", default: category4 },
          { key: "card4Image2", label: "Card 4 secondary image", type: "image", default: rectangle10 },
        ],
      },
      {
        id: "explore",
        label: "Explore premium products",
        fields: [
          { key: "eyebrow", label: "Eyebrow text", type: "text", default: "Explore now" },
          { key: "title", label: "Title (line break with Enter)", type: "textarea", default: "Discover our\npremium products" },
          { key: "accent", label: "Highlighted word(s) in title", type: "text", default: "premium products" },
          { key: "description", label: "Description", type: "textarea", default: "Carefully selected coffee beans, brewing equipment, and accessories for every coffee enthusiast." },
          { key: "buttonText", label: "Button label", type: "text", default: "Shop all products" },
          { key: "image1", label: "Carousel image 1", type: "image", default: coffeeBag },
          { key: "image2", label: "Carousel image 2", type: "image", default: coffeeCup },
          { key: "image3", label: "Carousel image 3", type: "image", default: productThree },
        ],
      },
      {
        id: "b2b",
        label: "B2B equipment banner",
        fields: [
          { key: "title", label: "Title (line break with Enter)", type: "textarea", default: "PROFESSIONAL EQUIPMENT\nAND B2B SOLUTIONS" },
          { key: "buttonText", label: "Button label", type: "text", default: "Send an Inquiry" },
          { key: "buttonPath", label: "Button link", type: "text", default: "/contact" },
          { key: "image", label: "Background image", type: "image", default: hero3 },
        ],
      },
      {
        id: "instagram",
        label: "Instagram section",
        fields: [
          { key: "title", label: "Title (line break with Enter)", type: "textarea", default: "Checkout Our\nInstagram Posts" },
          { key: "link", label: "Post link", type: "text", default: "https://instagram.com" },
          { key: "image1", label: "Post image 1", type: "image", default: post1 },
          { key: "image2", label: "Post image 2", type: "image", default: post2 },
          { key: "image3", label: "Post image 3", type: "image", default: post3 },
          { key: "image4", label: "Post image 4", type: "image", default: post4 },
        ],
      },
    ],
  },
  about: {
    label: "About Page",
    sections: [
      {
        id: "hero",
        label: "Intro section",
        fields: [
          { key: "eyebrow", label: "Eyebrow text", type: "text", default: "About Us" },
          { key: "title", label: "Title", type: "textarea", default: "A coffee experience rooted in comfort and quality." },
          { key: "description", label: "Description", type: "textarea", default: "We believe great coffee brings people together. From bean to cup, every detail is designed to feel cozy, fresh, and memorable." },
        ],
      },
      {
        id: "story",
        label: "Our story box",
        fields: [
          { key: "label", label: "Label", type: "text", default: "Our Story" },
          { key: "text", label: "Story text", type: "textarea", default: "Founded with a love for slow mornings, handcrafted drinks, and warm conversations, our cafe continues to inspire both regulars and newcomers." },
        ],
      },
      {
        id: "values",
        label: "Value cards",
        fields: [
          { key: "value1Title", label: "Card 1 title", type: "text", default: "Crafted with Care" },
          { key: "value1Description", label: "Card 1 description", type: "textarea", default: "Every cup is prepared with premium beans and a passion for detail." },
          { key: "value2Title", label: "Card 2 title", type: "text", default: "Warm Atmosphere" },
          { key: "value2Description", label: "Card 2 description", type: "textarea", default: "We create a welcoming space where each visit feels like home." },
          { key: "value3Title", label: "Card 3 title", type: "text", default: "Community First" },
          { key: "value3Description", label: "Card 3 description", type: "textarea", default: "We support local growers and make every sip a shared experience." },
        ],
      },
    ],
  },
  contact: {
    label: "Contact Page",
    sections: [
      {
        id: "intro",
        label: "Intro section",
        fields: [
          { key: "eyebrow", label: "Eyebrow text", type: "text", default: "Contact Us" },
          { key: "title", label: "Title", type: "textarea", default: "We would love to hear from you." },
          { key: "description", label: "Description", type: "textarea", default: "Whether you have a question about our menu, events, or special orders, we are here to help." },
        ],
      },
      {
        id: "info",
        label: "Contact details",
        fields: [
          { key: "visitTitle", label: "Visit block title", type: "text", default: "Visit Us" },
          { key: "visitText", label: "Visit block text", type: "textarea", default: "Banasree,Dhaka-1219" },
          { key: "callTitle", label: "Call block title", type: "text", default: "Call Us" },
          { key: "callText", label: "Call block text", type: "textarea", default: "+8801632911828" },
          { key: "emailTitle", label: "Email block title", type: "text", default: "Email" },
          { key: "emailText", label: "Email block text", type: "textarea", default: "devmusfiqurrahimofficial@gmail.com" },
        ],
      },
      {
        id: "form",
        label: "Message form & feedback",
        fields: [
          { key: "formTitle", label: "Form title", type: "text", default: "Send a Message" },
          { key: "feedbackEyebrow", label: "Feedback eyebrow text", type: "text", default: "Community Voices" },
          { key: "feedbackTitle", label: "Feedback title", type: "text", default: "Customer Feedback" },
          { key: "feedbackDescription", label: "Feedback description", type: "textarea", default: "Messages from our customers and answers from the Coffee Bloom team." },
        ],
      },
    ],
  },
  blog: {
    label: "Blog Page",
    sections: [
      {
        id: "hero",
        label: "Hero banner",
        fields: [
          { key: "eyebrow", label: "Eyebrow text", type: "text", default: "Caffeine Lab Journal" },
          { key: "title", label: "Title", type: "text", default: "Good coffee." },
          { key: "accentTitle", label: "Highlighted title line", type: "text", default: "Better stories." },
          { key: "description", label: "Description", type: "textarea", default: "Discover the people, places, and rituals behind every cup—from the first pour to the last sip." },
          { key: "buttonText", label: "Primary button label", type: "text", default: "Explore stories" },
          { key: "secondaryText", label: "Secondary link label", type: "text", default: "Share your story" },
          { key: "note", label: "Bottom note", type: "text", default: "Brewed from the community" },
          { key: "image", label: "Background image", type: "image", default: hero2 },
        ],
      },
      {
        id: "stories",
        label: "All stories heading",
        fields: [
          { key: "eyebrow", label: "Eyebrow text", type: "text", default: "Notes from the coffee table" },
          { key: "title", label: "Title", type: "text", default: "Stories worth savoring." },
          { key: "accent", label: "Highlighted word(s) in title", type: "text", default: "savoring." },
        ],
      },
    ],
  },
  footer: {
    label: "Footer (all pages)",
    sections: [
      {
        id: "about",
        label: "Brand blurb",
        fields: [
          { key: "description", label: "Description", type: "textarea", default: "Coffie4 is a specialty coffee company based in United States that is passionate about exceptional and ethical coffee experiences." },
          { key: "socialLabel", label: "Social media label", type: "text", default: "Our social media:" },
          { key: "image", label: "Background image", type: "image", default: footerBg },
        ],
      },
      {
        id: "column1",
        label: "Link column 1",
        fields: [
          { key: "title", label: "Column title", type: "text", default: "Quick Links" },
          { key: "links", label: "Links (one per line)", type: "lines", default: "About\nContact\nLocations\nProducts\nBrands\nBlogs" },
        ],
      },
      {
        id: "column2",
        label: "Link column 2",
        fields: [
          { key: "title", label: "Column title", type: "text", default: "Featured" },
          { key: "links", label: "Links (one per line)", type: "lines", default: "New Products\nBest Selling\nGift Shop\nCoffee\nDiscount Coupons" },
        ],
      },
      {
        id: "column3",
        label: "Link column 3",
        fields: [
          { key: "title", label: "Column title", type: "text", default: "Products" },
          { key: "links", label: "Links (one per line)", type: "lines", default: "Espresso Machines\nManual Grinders\nCeramic Cups\nBaristas Tools\nCoffee Brewers" },
        ],
      },
      {
        id: "bottom",
        label: "Bottom bar",
        fields: [
          { key: "copyright", label: "Copyright text", type: "text", default: "All rights reserved 2023" },
          { key: "policyLinks", label: "Policy links (one per line)", type: "lines", default: "Privacy Policy\nShipping Policy\nTerms and Conditions" },
        ],
      },
    ],
  },
};

// Ordered list for the dashboard tab bar.
export const CONTENT_PAGE_LIST = [
  { id: "home", label: CONTENT_SCHEMAS.home.label },
  { id: "about", label: CONTENT_SCHEMAS.about.label },
  { id: "contact", label: CONTENT_SCHEMAS.contact.label },
  { id: "blog", label: CONTENT_SCHEMAS.blog.label },
  { id: "footer", label: CONTENT_SCHEMAS.footer.label },
];

export const getPageSchema = (page) => CONTENT_SCHEMAS[page] || null;