import { HeartIcon } from "@heroicons/react/24/solid";
import { useDispatch, useSelector } from "react-redux";
import {
  selectIsWishlisted,
  toggleWishlist,
} from "../../redux/features/wishlistSlice/wishlistSlice";

const WishlistButton = ({ product, className = "" }) => {
  const dispatch = useDispatch();
  const isWishlisted = useSelector(selectIsWishlisted(product._id || product.id));

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        dispatch(
          toggleWishlist({
            id: product._id || product.id,
            name: product.name,
            price: product.price,
            image: product.image,
          })
        );
      }}
      aria-label={
        isWishlisted
          ? `Remove ${product.name} from wishlist`
          : `Add ${product.name} to wishlist`
      }
      aria-pressed={isWishlisted}
      className={`grid h-9 w-9 place-items-center rounded-full shadow-sm backdrop-blur transition ${
        isWishlisted
          ? "bg-[#e11d48] text-white"
          : "bg-white/90 text-neutral-500 hover:text-[#e11d48]"
      } ${className}`}
    >
      <HeartIcon className="h-5 w-5" />
    </button>
  );
};

export default WishlistButton;
