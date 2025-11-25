import React from 'react';

const Stats = ({ stats }) => {
  return (
    <div className="stats">
      <div className="stat-box">
        <div className="stat-number">{stats.peopleCount}</div>
        <div className="stat-label">People Detected</div>
      </div>
      <div className="stat-box">
        <div className="stat-number">{stats.confidence}%</div>
        <div className="stat-label">Avg Confidence</div>
      </div>
      <div className="stat-box">
        <div className="stat-number">{stats.fps}</div>
        <div className="stat-label">FPS</div>
      </div>
    </div>
  );
};

export default Stats;