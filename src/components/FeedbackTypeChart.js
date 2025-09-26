import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

import useFeedback from "./hooks/useFeedback";

export default function FeedbackTypeChart() {
  const { feedbacks, loading } = useFeedback();
  if(loading) return <p>Loading charts...</p>;
  const typeCounts = ["praise", "bug", "suggestion", "general"].map(type => ({
    type,
    count: feedbacks.filter(f => f.type === type).length
  }));

  return (
    <div className="p-4 bg-white shadow rounded-lg mt-4">
      <h3 className="text-lg font-bold mb-2">Feedback Type Count</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={typeCounts} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="type" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
