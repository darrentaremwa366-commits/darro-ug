"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealItemProps {
  children: ReactNode;
  className?: string;
  y?: number;
}

export default function RevealItem({
  children,
  className = "",
  y = 24,
}: RevealItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
