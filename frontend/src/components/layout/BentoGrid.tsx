import React from "react";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

const bentoGradients = [
  "linear-gradient(135deg, #F0EFFF, #F5F2FA)", // Card 1 (Lavender)
  "linear-gradient(135deg, #F2F8FD, #EBF4FA)", // Card 2 (Ice Blue)
  "linear-gradient(135deg, #FFF0F0, #FCE8E8)", // Card 3 (Blush Pink)
  "linear-gradient(135deg, #FEFCF4, #FDF8ED)", // Card 4 (Warm Ivory)
  "linear-gradient(135deg, #EAF8F3, #E0F4ED)", // Card 5 (Mint Green)
  "linear-gradient(135deg, #F8EDF1, #F3E3EA)", // Card 6 (Dusty Rose)
];

export const BentoGrid = ({ children, className = "" }: BentoGridProps) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-12 gap-6 w-full mx-auto ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            // @ts-expect-error - Inline CSS variable mapping
            style: { ...child.props.style, "--card-gradient": bentoGradients[index % 6] }
          });
        }
        return child;
      })}
    </div>
  );
};

interface BentoGridItemProps {
  children: React.ReactNode;
  className?: string;
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  rowSpan?: number;
}

const spanMap = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
  9: "lg:col-span-9",
  10: "lg:col-span-10",
  11: "lg:col-span-11",
  12: "lg:col-span-12",
};

const rowSpanMap: Record<number, string> = {
  1: "lg:row-span-1",
  2: "lg:row-span-2",
  3: "lg:row-span-3",
  4: "lg:row-span-4",
};

export const BentoGridItem = ({ children, className = "", span = 4, rowSpan = 1 }: BentoGridItemProps) => {
  const spanClass = spanMap[span] || "lg:col-span-4";
  const rowSpanClass = rowSpanMap[rowSpan] || "lg:row-span-1";

  return (
    <div
      className={`col-span-1 md:col-span-1 ${spanClass} row-span-1 ${rowSpanClass} ${className}`}
    >
      {children}
    </div>
  );
};
