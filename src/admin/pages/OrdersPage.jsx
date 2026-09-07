// TODO: Design OrdersPage — order list, status pipeline, expand details, manual order
export default function OrdersPage({
  activeTab,
  filteredOrders,
  orderQuery,
  setOrderQuery,
  selectedOrderIds,
  setSelectedOrderIds,
  expandedOrderIds,
  setExpandedOrderIds,
  setDeleteOrderIds,
  orderDrafts,
  setOrderDrafts,
  savedOrderId,
  saveOrderNotes,
  paidOrders,
  activeOrders,
  adminData,
  setManualOrderOpen,
}) {
  return (
    <div className="admin-page-stub">
      <h2>Orders</h2>
      <p>Order management, fulfilment pipeline and delivery tracking will be built here.</p>
    </div>
  );
}
