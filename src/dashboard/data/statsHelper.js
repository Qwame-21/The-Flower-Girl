// Shared calculation helper for dashboard statistics
// Used by Overview, Insights, Log, and Customers to ensure consistency

/**
 * Calculate consistent statistics from orders
 * 
 * Definitions:
 * - revenue: sum of `total` of orders with `payment_status = 'paid'` and not cancelled
 * - orders count: number of orders (cancelled excluded)
 * - awaiting payment: orders not yet paid and not cancelled
 * - average order value: revenue ÷ paid orders
 * - category revenue: revenue by category from paid orders
 * - product units: units sold per product
 * 
 * @param {Array} orders - Array of order objects
 * @param {Object} options - Optional filters
 * @param {Date} options.cutoffDate - Only include orders on or after this date
 * @returns {Object} stats object
 */
export function calculateOrderStats(orders, options = {}) {
  const { cutoffDate = null } = options;
  const cutoffStr = cutoffDate ? cutoffDate.toISOString().split('T')[0] : '0000-00-00';

  let totalRevenue = 0;
  let totalOrdersCount = 0;
  let paidNonCancelledCount = 0;
  let awaitingPaymentCount = 0;

  const categoryRevenue = { hampers: 0, personalized: 0, bundles: 0, care: 0, flowers: 0 };
  const productUnits = {};

  orders.forEach(order => {
    const oDateStr = (order.orderDate || '').split('T')[0];
    if (cutoffStr && oDateStr < cutoffStr) return;

    // Exclude cancelled orders from all counts
    if (order.fulfillmentStatus === 'cancelled') return;

    totalOrdersCount++;

    if (order.paymentStatus === 'paid') {
      totalRevenue += order.total || 0;
      paidNonCancelledCount++;

      // Sum category revenue from paid orders
      (order.items || []).forEach(item => {
        const catKey = (item.category || '').toLowerCase();
        if (categoryRevenue[catKey] !== undefined) {
          categoryRevenue[catKey] += (item.unitPrice * item.qty);
        }

        // Track product units
        const productId = item.productId || item.name;
        if (!productUnits[productId]) {
          productUnits[productId] = {
            id: productId,
            name: item.name,
            units: 0,
            revenue: 0
          };
        }
        productUnits[productId].units += item.qty || 1;
        productUnits[productId].revenue += (item.unitPrice || 0) * (item.qty || 1);
      });
    } else if (order.paymentStatus === 'pending') {
      awaitingPaymentCount++;
    }
  });

  const avgOrderValue = paidNonCancelledCount > 0 ? totalRevenue / paidNonCancelledCount : 0;

  return {
    totalRevenue,
    totalOrdersCount,
    paidNonCancelledCount,
    awaitingPaymentCount,
    avgOrderValue,
    categoryRevenue,
    productUnits
  };
}

/**
 * Calculate daily trend data for charts
 * 
 * @param {Array} orders - Array of order objects
 * @param {string} mode - 'revenue' or 'orders'
 * @param {number} days - Number of days to include (default 30)
 * @returns {Object} { dates: string[], currentValues: number[], previousValues: number[] }
 */
export function calculateDailyTrend(orders, mode = 'revenue', days = 30) {
  const now = new Date();
  const startDate = new Date(now.getTime() - (days - 1) * 86400000);
  
  // Initialize daily buckets
  const dailyData = {};
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 86400000);
    const dateStr = date.toISOString().split('T')[0];
    dailyData[dateStr] = { revenue: 0, orders: 0 };
  }

  // Fill buckets from orders
  orders.forEach(order => {
    if (order.fulfillmentStatus === 'cancelled') return;
    
    const oDateStr = (order.orderDate || '').split('T')[0];
    if (dailyData[oDateStr]) {
      if (order.paymentStatus === 'paid') {
        dailyData[oDateStr].revenue += order.total || 0;
      }
      dailyData[oDateStr].orders += 1;
    }
  });

  // Convert to arrays
  const dates = Object.keys(dailyData).sort();
  const currentValues = dates.map(date => {
    return mode === 'revenue' ? dailyData[date].revenue : dailyData[date].orders;
  });

  // Previous period (same days, previous period) for comparison
  const prevStartDate = new Date(startDate.getTime() - days * 86400000);
  const prevDailyData = {};
  for (let i = 0; i < days; i++) {
    const date = new Date(prevStartDate.getTime() + i * 86400000);
    const dateStr = date.toISOString().split('T')[0];
    prevDailyData[dateStr] = { revenue: 0, orders: 0 };
  }

  orders.forEach(order => {
    if (order.fulfillmentStatus === 'cancelled') return;
    
    const oDateStr = (order.orderDate || '').split('T')[0];
    if (prevDailyData[oDateStr]) {
      if (order.paymentStatus === 'paid') {
        prevDailyData[oDateStr].revenue += order.total || 0;
      }
      prevDailyData[oDateStr].orders += 1;
    }
  });

  const prevDates = Object.keys(prevDailyData).sort();
  const previousValues = prevDates.map(date => {
    return mode === 'revenue' ? prevDailyData[date].revenue : prevDailyData[date].orders;
  });

  return {
    dates: dates.map(d => {
      const date = new Date(d);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    currentValues,
    previousValues
  };
}
