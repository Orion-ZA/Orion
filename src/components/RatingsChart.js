import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import useFeedback from "./hooks/useFeedback";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28CFF"];

export default function RatingsChart() {
  const { feedbacks, loading } = useFeedback();

  if(loading) return <p>Loading charts...</p>;
  // Count ratings 1–5
  const ratingsCount = [1,2,3,4,5].map(r => ({
    rating: r,
    count: feedbacks.filter(f => f.rating === r).length
  }));

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h3 className="text-lg font-bold mb-2">Ratings Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={ratingsCount}
            dataKey="count"
            nameKey="rating"
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            label
          >
            {ratingsCount.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
