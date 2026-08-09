import { useMemo } from 'react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const useInsightsData = (orders) =>
  useMemo(() => {
    const empty = { totalOrders: 0, totalSpent: 0, monthlySpend: [], cuisines: [], topItems: [] };
    if (!orders?.length) return empty;

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((s, o) => s + (o.total || 0), 0);

    // Last 6 calendar months
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()], spend: 0 };
    });
    const bucketMap = Object.fromEntries(buckets.map((b) => [b.key, b]));
    orders.forEach((o) => {
      if (!(o.createdAt instanceof Date)) return;
      const k = `${o.createdAt.getFullYear()}-${o.createdAt.getMonth()}`;
      if (bucketMap[k]) bucketMap[k].spend = parseFloat((bucketMap[k].spend + (o.total || 0)).toFixed(2));
    });
    const monthlySpend = buckets.map(({ label, spend }) => ({ month: label, spend }));

    // Cuisines by item category
    const cuisineMap = {};
    orders.forEach((o) =>
      (o.items || []).forEach((item) => {
        const cat = item.category || 'Other';
        cuisineMap[cat] = (cuisineMap[cat] || 0) + (item.quantity || 1);
      })
    );
    const cuisines = Object.entries(cuisineMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Top ordered items by quantity
    const itemMap = {};
    orders.forEach((o) =>
      (o.items || []).forEach((item) => {
        if (!item.name) return;
        itemMap[item.name] = (itemMap[item.name] || 0) + (item.quantity || 1);
      })
    );
    const topItems = Object.entries(itemMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return { totalOrders, totalSpent, monthlySpend, cuisines, topItems };
  }, [orders]);

export default useInsightsData;
