import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { MessageSquare, BarChart3 } from "lucide-react";
import useFeedback from "./useFeedback";
import "./FeedbackTypeChart.css";

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
    <div className="feedback-type-chart-loading">
      <div className="feedback-type-chart-loading-pulse">
        <div className="feedback-type-chart-loading-title"></div>
        <div className="feedback-type-chart-loading-chart"></div>
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
        <div className="feedback-type-chart-tooltip">
          <p className="feedback-type-chart-tooltip-title">{data.label}</p>
          <p className="feedback-type-chart-tooltip-text">Count: {data.count}</p>
          <p className="feedback-type-chart-tooltip-text">Percentage: {data.percentage}%</p>
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
        fill="#a0a0a0" 
        textAnchor="middle" 
        fontSize={12}
        fontWeight="500"
      >
        {value}
      </text>
    );
  };

  return (
    <div className="feedback-type-chart">
      <div className="feedback-type-chart-header">
        <div className="feedback-type-chart-title-section">
          <MessageSquare className="feedback-type-chart-title-icon" />
          <h3 className="feedback-type-chart-title">Feedback Types</h3>
        </div>
        <div className="feedback-type-chart-stats">
          <div className="feedback-type-chart-stat">
            <p className="feedback-type-chart-stat-value">{totalFeedbacks}</p>
            <p className="feedback-type-chart-stat-label">Total Feedback</p>
          </div>
        </div>
      </div>

      <div className="feedback-type-chart-content">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={typeData} 
            margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
            barSize={50}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" vertical={false} />
            <XAxis 
              dataKey="label" 
              axisLine={false}
              tickLine={false}
              fontSize={12}
              fontWeight="500"
              stroke="#a0a0a0"
            />
            <YAxis 
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              fontSize={12}
              stroke="#a0a0a0"
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
      </div>

      {/* Type breakdown */}
      <div className="feedback-type-chart-breakdown">
        {typeData.map((item, index) => (
          <div key={index} className="feedback-type-chart-breakdown-item">
            <div className="feedback-type-chart-breakdown-header">
              <div 
                className="feedback-type-chart-breakdown-color" 
                style={{ backgroundColor: item.fill }}
              ></div>
              <span className="feedback-type-chart-breakdown-label">{item.count} {item.label} Count</span>
            </div>
            <div className="feedback-type-chart-breakdown-percentage feedback-type-chart-breakdown-percentage-hover">{item.percentage}% of total</div>
          </div>
        ))}
      </div>
    </div>
  );
}