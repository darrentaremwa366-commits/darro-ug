"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealGroupProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export default function RevealGroup({
  children,
  className = "",
  staggerDelay = 0.1,
}: RevealGroupProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
