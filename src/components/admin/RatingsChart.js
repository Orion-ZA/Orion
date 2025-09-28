import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Star, BarChart3 } from "lucide-react";
import useFeedback from "./useFeedback";
import "./RatingsChart.css";

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
    <div className="ratings-chart-loading">
      <div className="ratings-chart-loading-pulse">
        <div className="ratings-chart-loading-title"></div>
        <div className="ratings-chart-loading-chart"></div>
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
        <div className="ratings-chart-tooltip">
          <p className="ratings-chart-tooltip-title">{data.rating}</p>
          <p className="ratings-chart-tooltip-text">Count: {data.count}</p>
          <p className="ratings-chart-tooltip-text">Percentage: {data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="ratings-chart">
      <div className="ratings-chart-header">
        <div className="ratings-chart-title-section">
          <Star className="ratings-chart-title-icon" />
          <h3 className="ratings-chart-title">Ratings Distribution</h3>
        </div>
        <div className="ratings-chart-stats">
          <div className="ratings-chart-stat">
            <p className="ratings-chart-stat-value blue">{averageRating}</p>
            <p className="ratings-chart-stat-label">Average Rating</p>
          </div>
          <div className="ratings-chart-stat">
            <p className="ratings-chart-stat-value green">{totalWithRatings}</p>
            <p className="ratings-chart-stat-label">Total Ratings</p>
          </div>
        </div>
      </div>

      <div className="ratings-chart-grid">
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis 
                dataKey="rating" 
                angle={-45}
                textAnchor="end"
                height={60}
                fontSize={12}
                stroke="#a0a0a0"
              />
              <YAxis fontSize={12} stroke="#a0a0a0" />
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
      <div className="ratings-chart-legend">
        {ratingsData.map((item, index) => (
          <div key={index} className="ratings-chart-legend-item">
            <div className="ratings-chart-legend-item-header">
              <div 
                className="ratings-chart-legend-color" 
                style={{ backgroundColor: item.fill }}
              ></div>
              <span className="ratings-chart-legend-label">{item.rating}</span>
            </div>
            <div className="ratings-chart-legend-stats">
              <span className="ratings-chart-legend-count">{item.count}</span>
              <span className="ratings-chart-legend-percentage ratings-chart-legend-percentage-hover">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}