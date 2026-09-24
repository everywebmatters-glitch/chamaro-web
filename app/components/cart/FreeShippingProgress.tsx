import { Truck } from "lucide-react";
import { amountToFreeShipping, FREE_SHIPPING_THRESHOLD } from "../../lib/cart";
import { formatPrice } from "../../lib/products";

export default function FreeShippingProgress({ subtotal }: { subtotal: number }) {
  const remaining = amountToFreeShipping(subtotal);
  const percent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="free-shipping">
      <div
        className="free-shipping-track"
        role="progressbar"
        aria-label="Progress towards free shipping"
        aria-valuemin={0}
        aria-valuemax={FREE_SHIPPING_THRESHOLD}
        aria-valuenow={Math.min(subtotal, FREE_SHIPPING_THRESHOLD)}
      >
        <span className="free-shipping-fill" style={{ width: `${percent}%` }} />
        <span className="free-shipping-icon" style={{ left: `clamp(16px, ${percent}%, calc(100% - 16px))` }}>
          <Truck size={15} strokeWidth={1.8} aria-hidden="true" />
        </span>
      </div>

      <p>
        {remaining > 0 ? (
          <>
            You&apos;re <strong>{formatPrice(remaining)}</strong> away from{" "}
            <strong>FREE SHIPPING!</strong>
          </>
        ) : (
          <>
            Congratulations! Your order qualifies for <strong>FREE SHIPPING</strong>.
          </>
        )}
      </p>
    </div>
  );
}
