import React from "react";
import PyramidLoader from "./PyramidLoader";
import "./FullScreenLoader.css";

const FullScreenLoader = () => (
  <div className="fullscreen-loader-overlay">
    <div className="loader-stack">
      <PyramidLoader />
      <div className="loader-title">Orion</div>
    </div>
  </div>
);

export default FullScreenLoader;
