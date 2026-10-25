import { Truck } from "lucide-react";
import { chairsToFreeShipping, FREE_SHIPPING_CHAIR_COUNT } from "../../lib/cart";

export default function FreeShippingProgress({ chairCount }: { chairCount: number }) {
  const remaining = chairsToFreeShipping(chairCount);
  const percent = Math.min(100, (chairCount / FREE_SHIPPING_CHAIR_COUNT) * 100);

  return (
    <div className="free-shipping">
      <div
        className="free-shipping-track"
        role="progressbar"
        aria-label="Progress towards free standard delivery"
        aria-valuemin={0}
        aria-valuemax={FREE_SHIPPING_CHAIR_COUNT}
        aria-valuenow={Math.min(chairCount, FREE_SHIPPING_CHAIR_COUNT)}
      >
        <span className="free-shipping-fill" style={{ width: `${percent}%` }} />
        <span className="free-shipping-icon" style={{ left: `clamp(16px, ${percent}%, calc(100% - 16px))` }}>
          <Truck size={15} strokeWidth={1.8} aria-hidden="true" />
        </span>
      </div>

      <p>
        {remaining > 0 ? (
          <>
            Add <strong>{remaining} more {remaining === 1 ? "chair" : "chairs"}</strong> for{" "}
            <strong>FREE STANDARD DELIVERY!</strong>
          </>
        ) : (
          <>
            Congratulations! Your order qualifies for <strong>FREE STANDARD DELIVERY</strong>.
          </>
        )}
      </p>
    </div>
  );
}
