import { HeartIcon } from "@heroicons/react/24/solid";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { selectIsWishlisted, toggleWishlist } from "../../redux/features/wishlistSlice/wishlistSlice";
import { useAuth } from "../../hooks/auth";
import Tooltip from "./Tooltip";

const WishlistButton = ({ product, className = "" }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isWishlisted = useSelector(selectIsWishlisted(product._id || product.id));

  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (loading || !user) {
      navigate("/auth/login");
      return;
    }

    dispatch(
      toggleWishlist({
        id: product._id || product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      })
    );
  };

  const tipText = isWishlisted ? "Remove from wishlist" : "Add to wishlist";

  return (
    <Tooltip text={tipText} placement="top">
      <button
        type="button"
        onClick={handleClick}
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
    </Tooltip>
  );
};

export default WishlistButton;
