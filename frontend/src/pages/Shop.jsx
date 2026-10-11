import React, { useContext } from 'react';

const Shop = () => {


  const featuredProducts = productData?.slice(0, 6) || [];

  return (
   <div className="min-h-screen bg-[#f7f1eb] text-[#1a1a1a]">
     <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
       <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
         <div>
           <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#8a5a2b]">
             Freshly roasted
           </p>
           <h1 className="font-serif text-4xl font-black tracking-tight text-[#1e1e1e] sm:text-5xl">
             Shop Coffee
           </h1>
         </div>

         <p className="max-w-xl text-sm leading-6 text-[#544b42] sm:text-base">
           Discover specialty beans, handpicked brews, and thoughtful coffee essentials for every routine.
         </p>
       </div>

       <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
         {featuredProducts.length > 0 ? (
           featuredProducts.map((product) => (
             <article
               key={product.id}
               className="overflow-hidden rounded-[28px] border border-[#eadfce] bg-white shadow-[0_18px_45px_rgba(90,61,32,0.08)] transition-transform duration-300 hover:-translate-y-1"
             >
               <div className="overflow-hidden">
                 <img
                   src={product.thumbnail || product.images?.[0]}
                   alt={product.title}
                   className="h-72 w-full object-cover transition-transform duration-500 hover:scale-105"
                 />
               </div>

               <div className="space-y-4 p-6">
                 <div className="flex items-center justify-between gap-3">
                   <span className="rounded-full bg-[#f5e7da] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a5a2b]">
                     {product.category}
                   </span>
                   <span className="text-sm font-medium text-[#7a6a5d]">
                     ★ {product.rating}
                   </span>
                 </div>

                 <div>
                   <h2 className="text-xl font-bold text-[#1d1d1d]">{product.title}</h2>
                   <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#605750]">
                     {product.description}
                   </p>
                 </div>

                 <div className="flex items-center justify-between border-t border-[#f0e5dc] pt-4">
                   <div>
                     <p className="text-xs uppercase tracking-[0.2em] text-[#9a8d82]">Price</p>
                     <p className="text-2xl font-black text-[#1e1e1e]">${product.price}</p>
                   </div>

                   <button className="rounded-full bg-[#1d1d1d] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3a2a20]">
                     Add to cart
                   </button>
                 </div>
               </div>
             </article>
           ))
         ) : (
           <div className="col-span-full rounded-[24px] border border-dashed border-[#d9cabd] bg-[#fffaf5] p-12 text-center text-[#5f524a]">
             No products available right now.
           </div>
         )}
       </div>
     </section>
   </div>
  );
};

export default Shop;
