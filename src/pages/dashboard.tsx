/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Filter,
  Grid,
  List,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import useSharedWorkerData from "../hooks/use-shared-worker-data";
import Chart from "../components/chart";

export default function Dashboard() {
  const {
    data,
    loading,
    error,
    lastUpdated,
    source,
    connections,
    refresh,
    getChartsByCategory,
  } = useSharedWorkerData();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<
    "name" | "category" | "updated"
  >("name");

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [
      ...new Set(data.map((chart) => chart.category)),
    ].sort();
    return ["all", ...cats];
  }, [data]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (chart) =>
          chart.chart_name.toLowerCase().includes(term) ||
          chart.category.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (chart) => chart.category === selectedCategory
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.chart_name.localeCompare(b.chart_name);
        case "category":
          return a.category.localeCompare(b.category);
        case "updated":
          return (
            new Date(b.lastUpdated || 0).getTime() -
            new Date(a.lastUpdated || 0).getTime()
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [data, searchTerm, selectedCategory, sortBy]);

  // Stats for dashboard header
  const stats = useMemo(() => {
    const categoryStats = categories.slice(1).map((category) => ({
      category,
      count: getChartsByCategory(category).length,
    }));

    return {
      total: data.length,
      categories: categoryStats,
      filtered: filteredData.length,
    };
  }, [
    data.length,
    categories,
    getChartsByCategory,
    filteredData.length,
  ]);

  const handleRefresh = useCallback(() => {
    refresh(true);
  }, [refresh]);

  const formatLastUpdated = (timestamp: number | null) => {
    if (!timestamp) return "Never";
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading && data.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900">
            Loading Charts...
          </h2>
          <p className="text-gray-600">Fetching data from Supabase</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Performance Dashboard
              </h1>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                <span>
                  {connections > 0 ? (
                    <>
                      <Wifi className="inline w-4 h-4 mr-1 text-green-500" />{" "}
                      {connections} connections
                    </>
                  ) : (
                    <>
                      <WifiOff className="inline w-4 h-4 mr-1 text-red-500" />{" "}
                      Disconnected
                    </>
                  )}
                </span>
                <span>Updated: {formatLastUpdated(lastUpdated)}</span>
                {source && (
                  <span className="capitalize">Source: {source}</span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${
                    loading ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </button>

              <div className="flex rounded-md border border-gray-300">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 text-sm font-medium ${
                    viewMode === "grid"
                      ? "bg-blue-50 text-blue-700 border-r border-blue-200"
                      : "text-gray-700 border-r border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 text-sm font-medium ${
                    viewMode === "list"
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <div>
              <p className="text-red-800 font-medium">
                Error loading data
              </p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total}
                </div>
                <div className="text-sm text-gray-600">
                  Total Charts
                </div>
              </div>
              {stats.filtered !== stats.total && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.filtered}
                  </div>
                  <div className="text-sm text-gray-600">
                    Filtered
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {stats.categories.map(({ category, count }) => (
                <span
                  key={category}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {category}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search charts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="category">Sort by Category</option>
              <option value="updated">Sort by Updated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Charts Grid/List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {searchTerm || selectedCategory !== "all"
                ? "No charts match your filters"
                : "No charts available"}
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }
          >
            {filteredData.map((chart) => (
              <div
                key={chart.id}
                className={`
                  bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border
                  ${
                    viewMode === "list"
                      ? "p-4 flex items-center space-x-4"
                      : "p-4"
                  }
                `}
              >
                {viewMode === "grid" ? (
                  <>
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {chart.chart_name}
                      </h3>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 capitalize">
                          {chart.category}
                        </span>
                        <span className="text-gray-500">
                          {chart.pointCount} pts
                        </span>
                      </div>
                    </div>
                    <Chart data={chart} width={300} height={150} />
                  </>
                ) : (
                  <>
                    <div className="flex-shrink-0">
                      <Chart
                        data={chart}
                        width={200}
                        height={100}
                        animate={false}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">
                        {chart.chart_name}
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {chart.category} • {chart.pointCount} data
                        points
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Type: {chart.chart_type} • Unit:{" "}
                        {chart.metadata.unit}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
