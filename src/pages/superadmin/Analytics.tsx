import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Loader2, TrendingUp, PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon } from "lucide-react";
import { useState, useEffect } from "react";

const SuperAdminAnalytics = () => {
  const { ui, companies, loading } = useAnalytics();
  const [isMobile, setIsMobile] = useState(false);
  const [activeChart, setActiveChart] = useState<'volume' | 'market' | 'revenue'>('volume');

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (loading.monthly && loading.marketShare && loading.revenue) {
    return (
      <div className="animate-fade-in flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Generate colors for dynamic companies
  const getBarColor = (index: number) => {
    const colors = [
      "hsl(220,70%,18%)",   // Dark blue
      "hsl(38,95%,52%)",    // Orange
      "hsl(142,71%,38%)",   // Green
      "hsl(220,15%,70%)",   // Light gray
      "hsl(0,70%,50%)",     // Red
      "hsl(280,70%,50%)",   // Purple
      "hsl(180,70%,40%)",   // Teal
      "hsl(30,70%,50%)",    // Brown
    ];
    return colors[index % colors.length];
  };

  // Mobile tab navigation for charts
  const MobileChartTabs = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={() => setActiveChart('volume')}
        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
          activeChart === 'volume' 
            ? 'bg-navy text-white' 
            : 'bg-muted text-muted-foreground'
        }`}
      >
        <BarChart3 className="w-3.5 h-3.5" />
        Volume
      </button>
      <button
        onClick={() => setActiveChart('market')}
        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
          activeChart === 'market' 
            ? 'bg-navy text-white' 
            : 'bg-muted text-muted-foreground'
        }`}
      >
        <PieChartIcon className="w-3.5 h-3.5" />
        Market
      </button>
      <button
        onClick={() => setActiveChart('revenue')}
        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
          activeChart === 'revenue' 
            ? 'bg-navy text-white' 
            : 'bg-muted text-muted-foreground'
        }`}
      >
        <LineChartIcon className="w-3.5 h-3.5" />
        Revenue
      </button>
    </div>
  );

  // Desktop layout (original structure but responsive)
  const DesktopLayout = () => (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Parcel Volume by Company Chart */}
        <div className="lg:col-span-2 form-section p-4 sm:p-6">
          <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1">Parcel Volume by Company</h3>
          <p className="text-xs text-muted-foreground mb-4">Top companies comparison</p>
          <div className="h-[200px] sm:h-[250px] -mx-2 sm:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ui.chartData} barSize={isMobile ? 8 : 14}>
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: isMobile ? 10 : 11 }} 
                  axisLine={false} 
                  tickLine={false} 
                  interval={isMobile ? 1 : 0}
                />
                <YAxis 
                  tick={{ fontSize: isMobile ? 10 : 11 }} 
                  axisLine={false} 
                  tickLine={false} 
                  width={isMobile ? 30 : 40}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    const company = companies.find(c => c.dataKey === name);
                    return [value.toLocaleString(), company?.name || name];
                  }}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                {companies.map((company, index) => (
                  <Bar 
                    key={company.id}
                    dataKey={company.dataKey}
                    name={company.name}
                    fill={getBarColor(index)}
                    radius={[3, 3, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Market Share Pie Chart */}
        <div className="form-section p-4 sm:p-6">
          <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1">Market Share</h3>
          <p className="text-xs text-muted-foreground mb-4">
            {isMobile ? 'Current month' : `By parcel volume ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`}
          </p>
          <div className="flex justify-center">
            <PieChart width={isMobile ? 150 : 180} height={isMobile ? 150 : 180}>
              <Pie 
                data={ui.marketShareData} 
                cx={isMobile ? 75 : 90} 
                cy={isMobile ? 75 : 90} 
                innerRadius={isMobile ? 40 : 50} 
                outerRadius={isMobile ? 65 : 80} 
                dataKey="value" 
                paddingAngle={3}
                labelLine={false}
              >
                {ui.marketShareData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </div>
          <div className="space-y-1.5 sm:space-y-2 mt-3 sm:mt-4">
            {ui.marketShareData.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-muted-foreground flex-1 truncate">{d.name}</span>
                <span className="font-semibold text-foreground">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Revenue Trend */}
      <div className="form-section p-4 sm:p-6">
        <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1">Platform Revenue Trend</h3>
        <p className="text-xs text-muted-foreground mb-4">KES 5 per parcel</p>
        <div className="h-[150px] sm:h-[200px] -mx-2 sm:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ui.revenueData}>
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: isMobile ? 10 : 11 }} 
                axisLine={false} 
                tickLine={false} 
                interval={isMobile ? 1 : 0}
              />
              <YAxis 
                tick={{ fontSize: isMobile ? 10 : 11 }} 
                axisLine={false} 
                tickLine={false} 
                width={isMobile ? 35 : 45}
              />
              <Tooltip 
                formatter={(v: number) => [`KES ${v.toLocaleString()}`, "Revenue"]}
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(38,95%,52%)" 
                strokeWidth={isMobile ? 2 : 3} 
                dot={{ fill: "hsl(38,95%,52%)", r: isMobile ? 3 : 5 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );

  // Mobile layout with tab navigation
  const MobileLayout = () => (
    <>
      <MobileChartTabs />
      
      {activeChart === 'volume' && (
        <div className="form-section p-4 mb-4">
          <h3 className="font-semibold text-foreground text-sm mb-1">Parcel Volume by Company</h3>
          <p className="text-xs text-muted-foreground mb-3">Top companies comparison</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ui.chartData} barSize={10}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    const company = companies.find(c => c.dataKey === name);
                    return [value.toLocaleString(), company?.name || name];
                  }}
                  contentStyle={{ borderRadius: '8px', fontSize: '11px' }}
                />
                {companies.map((company, index) => (
                  <Bar 
                    key={company.id}
                    dataKey={company.dataKey}
                    name={company.name}
                    fill={getBarColor(index)}
                    radius={[3, 3, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeChart === 'market' && (
        <div className="form-section p-4 mb-4">
          <h3 className="font-semibold text-foreground text-sm mb-1">Market Share</h3>
          <p className="text-xs text-muted-foreground mb-3">Current month distribution</p>
          <div className="flex flex-col items-center">
            <PieChart width={200} height={200}>
              <Pie 
                data={ui.marketShareData} 
                cx={100} 
                cy={100} 
                innerRadius={60} 
                outerRadius={90} 
                dataKey="value" 
                paddingAngle={3}
                labelLine={false}
              >
                {ui.marketShareData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {ui.marketShareData.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-muted-foreground flex-1 truncate">{d.name}</span>
                <span className="font-semibold text-foreground">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeChart === 'revenue' && (
        <div className="form-section p-4 mb-4">
          <h3 className="font-semibold text-foreground text-sm mb-1">Platform Revenue Trend</h3>
          <p className="text-xs text-muted-foreground mb-3">KES 5 per parcel</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ui.revenueData}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                <Tooltip 
                  formatter={(v: number) => [`KES ${v.toLocaleString()}`, "Revenue"]}
                  contentStyle={{ borderRadius: '8px', fontSize: '11px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(38,95%,52%)" 
                  strokeWidth={2.5} 
                  dot={{ fill: "hsl(38,95%,52%)", r: 4 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Summary Stats for Mobile */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Total Companies</div>
          <div className="text-lg font-bold text-foreground">{companies.length}</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-xs text-muted-foreground">This Month</div>
          <div className="text-lg font-bold text-foreground">
            {ui.marketShareData.reduce((sum, d) => sum + (d.parcels || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="animate-fade-in px-4 sm:px-0">
      {/* Page Header */}
      <div className="page-header mb-4">
        <div>
          <h1 className="page-title text-xl sm:text-2xl">Platform Analytics</h1>
          <p className="page-subtitle text-xs sm:text-sm">
            {isMobile ? 'Performance metrics' : 'Growth trends and company performance'}
          </p>
        </div>
      </div>

      {/* Conditional Layout */}
      {isMobile ? <MobileLayout /> : <DesktopLayout />}

      {/* Data Freshness Indicator */}
      <div className="mt-4 text-center text-xs text-muted-foreground border-t border-border pt-4">
        <p>Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default SuperAdminAnalytics;