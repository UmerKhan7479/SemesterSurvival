import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell } from 'recharts';

const TopicCluster = ({ data }) => {
    // data format: [{ name, x, y, z, risk }]
    // x: syllabus match, y: frequency, z: importance

    const COLORS = {
        high: '#ef4444',
        medium: '#eab308',
        low: '#22c55e'
    };

    return (
        <div className="w-full h-[300px] glass-panel rounded-2xl p-4 flex flex-col items-center justify-center relative">
            <h3 className="absolute top-4 left-6 text-slate-400 text-sm font-semibold uppercase tracking-wider">Cluster Analysis</h3>

            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 40, right: 20, bottom: 20, left: 0 }}>
                    <XAxis type="number" dataKey="x" name="Syllabus Match" unit="%" hide />
                    <YAxis type="number" dataKey="y" name="Frequency" unit="%" hide />
                    <ZAxis type="number" dataKey="z" range={[50, 400]} name="Importance" />
                    <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    />
                    <Scatter name="Topics" data={data || []} fill="#8884d8">
                        {(data || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(entry.risk || '').toLowerCase()] || COLORS.medium} />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>

            <div className="absolute bottom-4 right-6 flex gap-3 text-xs">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-danger"></div>High Risk</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-warning"></div>Med Risk</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-success"></div>Low Risk</div>
            </div>
        </div>
    );
};

export default TopicCluster;
