
import ProductCategoryCard from "./ProductCategoryCard";
import category1 from "../../../assets/image/category-1.png";
import rectangle6 from "../../../assets/image/Rectangle6.png";
import category2 from "../../../assets/image/category-2.png";
import rectangle8 from "../../../assets/image/Rectangle8.png";
import rectangle10 from "../../../assets/image/Rectangle10.png";
import rectangle9 from "../../../assets/image/Rectangle9.png";
import category3 from "../../../assets/image/category-3.png";
import category4 from "../../../assets/image/category-4.png";


export default function ProductCategories() {
  const categories = [
    {
      title: "BARISTA PRODUCTS",
      image: category1,
      image2: rectangle6,
      className: "md:col-span-2 min-h-[215px]",
    },
    {
      title: "COFFEE",
      image: category2,
      image2: rectangle8,
      className: "md:col-span-1 min-h-[215px]",
    },
    {
      title: "ACCESSORIES",
      image: category3,
      image2: rectangle9,
      className: "md:col-span-1 min-h-[215px]",
    },
    {
      title: "PROFESSIONAL EQUIPMENTS",
      image: category4,
      image2: rectangle10,
      className: "md:col-span-2 min-h-[215px]",
    },
  ];

  return (
    <section className=" px-4 py-12 md:px-10 md:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="mb-9 text-center">
          <p className="mb-1 text-[9px] font-bold tracking-[0.2em] text-[#ff6375]">
            OUR PRODUCT CATEGORIES
          </p>

          <h2 className="font-serif text-3xl font-black leading-[1.05] text-[#1d1d1d] md:text-5xl">
            Taking in mind every step of
            <br />
            the <span className="text-[#f2354d]">coffee journey</span>
          </h2>
        </header>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {categories.map((category) => (
            <ProductCategoryCard
              key={category.title}
              title={category.title}
              image={category.image}
              image2={category.image2}
              className={category.className}
            />
          ))}
        </div>
      </div>
    </section>
  );
}