import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import useFeedback from "./hooks/useFeedback";

const TYPE_COLORS = {
  praise: "#06D6A0",
  bug: "#EF476F", 
  suggestion: "#118AB2",
  general: "#FFD166"
};

const TYPE_LABELS = {
  praise: "Praise",
  bug: "Bug Report", 
  suggestion: "Suggestion",
  general: "General"
};

export default function FeedbackTypeChart() {
  const { feedbacks, loading } = useFeedback();

  if (loading) return (
    <div className="p-4 bg-white shadow rounded-lg mt-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    </div>
  );

  // Enhanced type data with percentages and trends
  const totalFeedbacks = feedbacks.length;
  const typeData = ["praise", "bug", "suggestion", "general"].map(type => {
    const count = feedbacks.filter(f => f.type === type).length;
    const percentage = totalFeedbacks > 0 ? (count / totalFeedbacks * 100) : 0;
    
    return {
      type,
      label: TYPE_LABELS[type],
      count,
      percentage: Math.round(percentage),
      fill: TYPE_COLORS[type]
    };
  }).sort((a, b) => b.count - a.count); // Sort by count descending

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
          <p className="font-medium">{data.label}</p>
          <p className="text-sm text-gray-600">Count: {data.count}</p>
          <p className="text-sm text-gray-600">Percentage: {data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  // Custom label for bars
  const renderCustomBarLabel = ({ x, y, width, value }) => {
    return (
      <text 
        x={x + width / 2} 
        y={y - 8} 
        fill="#374151" 
        textAnchor="middle" 
        fontSize={12}
        fontWeight="500"
      >
        {value}
      </text>
    );
  };

  return (
    <div className="p-6 bg-white shadow rounded-lg mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Feedback Types</h3>
        <div className="text-center sm:text-right mt-2 sm:mt-0">
          <p className="text-2xl font-bold text-purple-600">{totalFeedbacks}</p>
          <p className="text-sm text-gray-500">Total Feedback</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={typeData} 
          margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
          barSize={50}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis 
            dataKey="label" 
            axisLine={false}
            tickLine={false}
            fontSize={12}
            fontWeight="500"
          />
          <YAxis 
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            fontSize={12}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="count" 
            radius={[6, 6, 0, 0]}
            label={renderCustomBarLabel}
          >
            {typeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Type breakdown */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {typeData.map((item, index) => (
          <div key={index} className="text-center p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.fill }}
              ></div>
              <span className="text-sm font-medium text-gray-700">{item.count} {item.label} Count</span>
            </div>
            <div className="text-sm text-gray-500">{item.percentage}% of total</div>
          </div>
        ))}
      </div>
    </div>
  );
}