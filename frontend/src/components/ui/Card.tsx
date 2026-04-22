import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  isCritical?: boolean;
  animate?: boolean;
  delay?: number;
}

const Card = ({ children, className = "", isCritical = false, animate = true, delay = 0 }: CardProps) => {
  const hasPadding = className.includes("p-");
  const bgClass = className.includes("bg-") ? "" : "bg-surface text-text-primary";
  const baseClasses = isCritical ? `clay-card clay-card-critical ${bgClass}` : `clay-card ${bgClass}`;
  const paddingClass = hasPadding ? "" : "p-6";
  const animationClasses = animate ? "animate-stagger-up" : "";
  
  return (
    <div
      className={`${baseClasses} ${paddingClass} ${animationClasses} ${className}`}
      style={{
        ...(bgClass ? { background: "var(--card-gradient, var(--color-surface))" } : {}),
        ...(animate ? { animationDelay: `${delay}ms` } : {})
      }}
    >
      {children}
    </div>
  );
};

export default Card;
