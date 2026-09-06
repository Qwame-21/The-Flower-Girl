import { ORDER_STAGES } from '../utils/adminMappers';

export default function InsightsPage({
  activeTab,
  adminData,
  products,
  paidOrders,
  orderRevenue,
  overview,
}) {
  const completed = adminData.orders.filter(order => order.status === 'completed').length;
  const completion = adminData.orders.length
    ? Math.round((completed / adminData.orders.length) * 100)
    : 0;

  const insight =
    activeTab === 'Products'
      ? {
          percent: products.length
            ? Math.round(
                (products.filter(product => product.visible).length / products.length) *
                  100
              )
            : 0,
          unit: 'visible',
          title: 'Catalogue availability',
          description: `${products.filter(product => product.visible).length} of ${products.length} products are visible.`,
          metric: `${products.reduce(
            (sum, product) => sum + Number(product.stock || 0),
            0
          )} units`,
          bars: products
            .slice(0, 7)
            .map(product =>
              Math.max(12, Math.min(92, Number(product.stock || 0) * 5))
            ),
          lines: products.slice(0, 4).map(product => [product.name, product.stock]),
        }
      : activeTab === 'Delivery'
      ? {
          percent: completion,
          unit: 'delivered',
          title: 'Delivery completion',
          description: `${completed} of ${adminData.orders.length} orders are delivered.`,
          metric: `${adminData.orders.filter(order => order.status === 'delivery').length} in transit`,
          bars: ORDER_STAGES.slice(1).map(stage =>
            Math.max(
              12,
              adminData.orders.filter(order => order.status === stage).length * 22
            )
          ),
          lines: [
            ['Packed', adminData.orders.filter(order => order.status === 'ready').length],
            [
              'Dispatched',
              adminData.orders.filter(order => order.status === 'delivery').length,
            ],
            ['Delivered', completed],
            [
              'Pending',
              adminData.orders.filter(order => order.status === 'pending_payment').length,
            ],
          ],
        }
      : {
          percent: completion,
          unit: 'fulfilled',
          title: 'Order completion',
          description: `${completed} of ${adminData.orders.length} orders are complete.`,
          metric: `GHS ${orderRevenue.toLocaleString()}`,
          bars: overview.bars,
          lines: [
            ['Paid', paidOrders.length],
            [
              'Processing',
              adminData.orders.filter(order => order.status === 'packaging').length,
            ],
            ['Packed', adminData.orders.filter(order => order.status === 'ready').length],
            ['Delivered', completed],
          ],
        };

  return (
    <section className="insights-board">
      <article
        className="insights-donut"
        style={{ '--insight-percent': `${insight.percent}%` }}
      >
        <div>
          <strong>{insight.percent}%</strong>
          <span>{insight.unit}</span>
        </div>
        <h3>{insight.title}</h3>
        <p>{insight.description}</p>
      </article>
      <article>
        <small>{activeTab} metric</small>
        <strong>{insight.metric}</strong>
        <div className="insights-bars">
          {insight.bars.map((height, index) => (
            <i key={index} style={{ '--bar-height': `${height}%` }} />
          ))}
        </div>
      </article>
      <article>
        <small>{activeTab} breakdown</small>
        {insight.lines.map(([label, value]) => (
          <div className="insight-line" key={label}>
            <span>{label}</span>
            <b>{value}</b>
            <i>
              <em
                style={{
                  width: `${Math.min(100, Number(value || 0) * 12)}%`,
                }}
              />
            </i>
          </div>
        ))}
      </article>
    </section>
  );
}
