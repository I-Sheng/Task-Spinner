'use client';
import { forwardRef } from 'react';

const WheelCanvas = forwardRef(function WheelCanvas(_, ref) {
  return (
    <div className="wheel-wrapper">
      <div className="pointer" />
      <canvas ref={ref} width={400} height={400} />
    </div>
  );
});

export default WheelCanvas;
