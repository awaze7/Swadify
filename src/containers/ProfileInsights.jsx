import { useSelector } from 'react-redux';
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  BarChart, Bar, Cell,
  PieChart, Pie, Tooltip as PieTooltip, Legend,
} from 'recharts';
import useOrderHistory from '../utils/useOrderHistory';
import useInsightsData from '../utils/useInsightsData';
import { useTheme } from '../utils/ThemeContext';
import { FiShoppingBag } from 'react-icons/fi';
import { HiOutlineCurrencyRupee } from 'react-icons/hi';

// Categorical palette — validated for CVD separation
const CAT_COLORS = ['#F59E0B','#3B82F6','#10B981','#EF4444','#8B5CF6','#F97316'];

const StatCard = ({ icon: Icon, label, value, sub }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-5 py-5 shadow-sm">
    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
      <Icon size={22} className="text-amber-500" aria-hidden="true" />
    </div>
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-zinc-400">{label}</p>
      <p className="mt-0.5 text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-zinc-500">{sub}</p>}
    </div>
  </div>
);

const ChartCard = ({ title, children, empty, emptyMsg }) => (
  <div className="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5 shadow-sm sm:p-6">
    <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
    {empty ? (
      <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">{emptyMsg}</p>
    ) : children}
  </div>
);

const SpendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
      <p className="tabular-nums text-amber-500">₹{payload[0].value.toFixed(2)}</p>
    </div>
  );
};

const BarTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-900 dark:text-white">{payload[0].payload.name}</p>
      <p className="tabular-nums text-blue-500">{payload[0].value}×</p>
    </div>
  );
};

const PieTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-900 dark:text-white">{payload[0].name}</p>
      <p className="tabular-nums" style={{ color: payload[0].payload.fill }}>{payload[0].value} items</p>
    </div>
  );
};

const InsightsSkeleton = () => (
  <div className="space-y-6 animate-pulse" aria-hidden="true">
    <div className="grid grid-cols-2 gap-4">
      {[0,1].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-200 dark:bg-zinc-700" />)}
    </div>
    {[0,1,2].map(i => <div key={i} className="h-64 rounded-2xl bg-gray-200 dark:bg-zinc-700" />)}
  </div>
);

const ProfileInsights = () => {
  const user = useSelector((store) => store.user.user);
  const { orders, isLoading } = useOrderHistory(user?.uid);
  const { isDark } = useTheme();
  const { totalOrders, totalSpent, monthlySpend, cuisines, topItems } = useInsightsData(orders);

  const axisColor = isDark ? '#71717A' : '#9CA3AF';
  const gridColor = isDark ? '#27272A' : '#F3F4F6';

  if (isLoading) return <InsightsSkeleton />;

  const hasData = totalOrders > 0;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <StatCard
          icon={FiShoppingBag}
          label="Total Orders"
          value={totalOrders}
          sub={hasData ? 'all time' : 'place your first order'}
        />
        <StatCard
          icon={HiOutlineCurrencyRupee}
          label="Total Spent"
          value={hasData ? `₹${totalSpent.toFixed(0)}` : '₹0'}
          sub={hasData ? `avg ₹${(totalSpent / totalOrders).toFixed(0)}/order` : ''}
        />
      </div>

      {/* Monthly spend line chart */}
      <ChartCard
        title="Monthly Spend (last 6 months)"
        empty={!hasData}
        emptyMsg="No order data yet. Your spend trend will appear here."
      >
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlySpend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => `₹${v}`}
              tick={{ fill: axisColor, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <ReTooltip content={<SpendTooltip />} cursor={{ stroke: gridColor, strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="spend"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={{ r: 4, fill: '#F59E0B', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#F59E0B', strokeWidth: 2, stroke: isDark ? '#18181B' : '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Two-column: donut + bar */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Favourite cuisines donut */}
        <ChartCard
          title="Favourite Cuisines"
          empty={cuisines.length === 0}
          emptyMsg="Order more to see your favourite cuisines."
        >
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={cuisines}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {cuisines.map((entry, i) => (
                  <Cell key={entry.name} fill={CAT_COLORS[i % CAT_COLORS.length]} strokeWidth={0} />
                ))}
              </Pie>
              <PieTooltip content={<PieTip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => <span style={{ color: axisColor, fontSize: 12 }}>{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Most ordered items bar chart */}
        <ChartCard
          title="Most Ordered Items"
          empty={topItems.length === 0}
          emptyMsg="Order items to see your top picks."
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={topItems}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              barSize={14}
            >
              <CartesianGrid stroke={gridColor} strokeDasharray="4 4" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: axisColor, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fill: axisColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v.length > 14 ? v.slice(0, 13) + '…' : v}
              />
              <ReTooltip content={<BarTip />} cursor={{ fill: gridColor }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {topItems.map((_, i) => (
                  <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default ProfileInsights;
