import { Truck } from 'lucide-react';
import { updateAdminCollection } from '../api/adminStore';

export default function DeliveryPage({
  activeTab,
  deliveries,
  adminData,
  setSelectedItem,
}) {
  return (
    <>
      <header className="admin-page-heading">
        <div>
          <small>Fulfilment · {activeTab}</small>
          <h2>Delivery desk</h2>
          <p>See the recipient, rider, timing and destination before updating delivery progress.</p>
        </div>
      </header>
      <div className="delivery-board">
        {deliveries
          .filter(delivery =>
            activeTab === 'Out today'
              ? delivery.status === 'In transit'
              : activeTab === 'Completed'
              ? delivery.status === 'Delivered'
              : delivery.status !== 'Delivered'
          )
          .map(delivery => (
            <article key={delivery.id}>
              <button
                onClick={() =>
                  setSelectedItem({
                    type: 'delivery',
                    title: delivery.id,
                    status: delivery.status,
                    detail: `${delivery.recipient} · ${delivery.location}`,
                    delivery,
                  })
                }
              >
                <Truck size={19} />
                <span>
                  <strong>
                    {delivery.id} · {delivery.location}
                  </strong>
                  <small>
                    Recipient: {delivery.recipient} · {delivery.phone}
                  </small>
                </span>
                <span>
                  <small>Rider</small>
                  <b>{delivery.rider}</b>
                </span>
                <span>
                  <small>Estimate</small>
                  <b>{delivery.estimate}</b>
                </span>
                <em>{delivery.status}</em>
                <i>→</i>
              </button>
              <div>
                <label>
                  Rider
                  <input
                    defaultValue={delivery.rider === 'Unassigned' ? '' : delivery.rider}
                    placeholder="Assign rider"
                    onBlur={event =>
                      updateAdminCollection('orders', orders =>
                        orders.map(order =>
                          order.id === delivery.orderId
                            ? { ...order, rider: event.target.value.trim() }
                            : order
                        )
                      )
                    }
                  />
                </label>
                <label>
                  Estimate
                  <input
                    type="datetime-local"
                    defaultValue={
                      adminData.orders.find(order => order.id === delivery.orderId)
                        ?.estimatedDelivery || ''
                    }
                    onBlur={event =>
                      updateAdminCollection('orders', orders =>
                        orders.map(order =>
                          order.id === delivery.orderId
                            ? { ...order, estimatedDelivery: event.target.value }
                            : order
                        )
                      )
                    }
                  />
                </label>
                {delivery.status === 'Ready' && (
                  <button
                    onClick={() =>
                      updateAdminCollection('orders', orders =>
                        orders.map(order =>
                          order.id === delivery.orderId
                            ? {
                                ...order,
                                status: 'delivery',
                                deliveryAt: new Date().toISOString(),
                              }
                            : order
                        )
                      )
                    }
                  >
                    Mark dispatched
                  </button>
                )}
                {delivery.status === 'In transit' && (
                  <>
                    <label>
                      Received by
                      <input
                        placeholder="Recipient name"
                        defaultValue={delivery.receivedBy}
                        onBlur={event =>
                          updateAdminCollection('orders', orders =>
                            orders.map(order =>
                              order.id === delivery.orderId
                                ? { ...order, receivedBy: event.target.value.trim() }
                                : order
                            )
                          )
                        }
                      />
                    </label>
                    <label>
                      Delivery proof note
                      <input
                        placeholder="Hand-off or rider note"
                        defaultValue={delivery.proofNote}
                        onBlur={event =>
                          updateAdminCollection('orders', orders =>
                            orders.map(order =>
                              order.id === delivery.orderId
                                ? { ...order, proofNote: event.target.value.trim() }
                                : order
                            )
                          )
                        }
                      />
                    </label>
                    <button
                      disabled={!delivery.receivedBy}
                      onClick={() =>
                        updateAdminCollection('orders', orders =>
                          orders.map(order =>
                            order.id === delivery.orderId
                              ? {
                                  ...order,
                                  status: 'completed',
                                  completedAt: new Date().toISOString(),
                                }
                              : order
                          )
                        )
                      }
                    >
                      Mark delivered
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
      </div>
    </>
  );
}
