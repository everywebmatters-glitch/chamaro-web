const methods = [
  { name: "VISA", className: "pay-visa" },
  { name: "Mastercard", className: "pay-mastercard" },
  { name: "RuPay", className: "pay-rupay" },
  { name: "UPI", className: "pay-upi" },
];

export default function PaymentBadges() {
  return (
    <ul className="payment-badges" aria-label="Accepted payment methods">
      {methods.map((method) => (
        <li key={method.name} className={method.className}>
          {method.name === "Mastercard" ? (
            <>
              <span className="mc-circles" aria-hidden="true">
                <i />
                <i />
              </span>
              <span className="sr-only">Mastercard</span>
            </>
          ) : (
            method.name
          )}
        </li>
      ))}
    </ul>
  );
}
