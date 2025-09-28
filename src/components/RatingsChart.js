import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import useFeedback from "./hooks/useFeedback";

const RATING_COLORS = ["#FF6B6B", "#FF9E6D", "#FFD166", "#06D6A0", "#118AB2"];
const TYPE_COLORS = {
  praise: "#06D6A0",
  bug: "#EF476F", 
  suggestion: "#118AB2",
  general: "#FFD166"
};

export default function RatingsChart() {
  const { feedbacks, loading } = useFeedback();

  if (loading) return (
    <div className="p-4 bg-white shadow rounded-lg">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    </div>
  );

  // Enhanced ratings data with percentages
  const totalWithRatings = feedbacks.filter(f => f.rating).length;
  const ratingsData = [1, 2, 3, 4, 5].map(rating => {
    const count = feedbacks.filter(f => f.rating === rating).length;
    const percentage = totalWithRatings > 0 ? (count / totalWithRatings * 100) : 0;
    
    return {
      rating: `${rating} Star${rating > 1 ? 's' : ''}`,
      count,
      percentage: Math.round(percentage),
      fill: RATING_COLORS[rating - 1]
    };
  });

  const averageRating = totalWithRatings > 0 
    ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / totalWithRatings).toFixed(1)
    : 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
          <p className="font-medium">{data.rating}</p>
          <p className="text-sm text-gray-600">Count: {data.count}</p>
          <p className="text-sm text-gray-600">Percentage: {data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 bg-white shadow rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Ratings Distribution</h3>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{averageRating}</p>
            <p className="text-sm text-gray-500">Average Rating</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{totalWithRatings}</p>
            <p className="text-sm text-gray-500">Total Ratings</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={ratingsData}
                dataKey="count"
                nameKey="rating"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                label={({ rating, percentage }) => `${percentage}%`}
                labelLine={false}
              >
                {ratingsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ratingsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="rating" 
                angle={-45}
                textAnchor="end"
                height={60}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                radius={[4, 4, 0, 0]}
              >
                {ratingsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend with details */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-2">
        {ratingsData.map((item, index) => (
          <div key={index} className="flex flex-col items-center p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.fill }}
              ></div>
              <span className="text-sm font-medium">{item.count} {item.rating.split(' ')[0]}⭐ Count</span>
            </div>
            <span className="text-xs text-gray-500">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}