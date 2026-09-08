export default function HelpPopover({ selectNav }) {
  const manualItems = [
    ['Orders', 'Confirm payment, update fulfilment and save customer-visible delivery notes.', 'Open an order, verify its customer and payment reference, then advance one stage at a time. Add the delivery estimate and customer note before dispatch.'],
    ['Requests', 'Review briefs, flag quotes and approve custom work.', 'Open the brief, check its selections and estimate, mark Quote needed when pricing is incomplete, then approve or convert it to an order.'],
    ['Products', 'Add, edit, delete, price and publish catalogue items.', 'Use Add product for images, inventory, price and description. Keep incomplete items hidden; publish only after checking both images and stock.'],
    ['Shop', 'Curate storefront products and create staff-assisted orders.', 'Open All products, add items to Staff cart, enter the customer and recipient details, then create a pending order for payment follow-up.'],
    ['Gallery', 'Upload, order, publish, hide or remove storefront images.', 'Upload an image with a descriptive label, review its crop, then publish it. Use the arrows to control storefront order.'],
    ['Customers', 'Open a customer profile and jump into their order history.', 'Choose a customer to view spend and order history. Open an order from the profile when a delivery or payment needs attention.'],
    ['Delivery', 'Review recipients and move consignments through dispatch.', 'Assign a rider, confirm the destination and estimate, then mark dispatched. Mark delivered only after hand-off is confirmed.'],
    ['Careers', 'Create openings, pause applications and inspect candidates.', 'Publish only active roles. Review each application, use shortlist for interview candidates and archive records that need no further action.'],
    ['Settings', 'Manage store, team and security controls.', 'Store and team edits are saved to this browser preview. Password and production access changes require the authentication service.'],
  ];

  return (
    <>
      <small>Admin manual</small>
      <strong>Your workspace guide</strong>
      <p>Use search and section tabs to find records. Browser-backed pages identify their storage; shared requests and careers require staff sign-in.</p>
      <div className="admin-help-list">
        {manualItems.map(([label, text, steps]) => (
          <details key={label}>
            <summary>
              <b>{label}</b>
              <span>{text}</span>
            </summary>
            <p>{steps}</p>
            <button onClick={() => selectNav(label)}>Open {label}</button>
          </details>
        ))}
      </div>
    </>
  );
}
