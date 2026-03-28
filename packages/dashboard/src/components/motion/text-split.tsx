"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface TextSplitProps {
  text: string;
  splitBy?: "word" | "char";
  className?: string;
  staggerDelay?: number;
  trigger?: "mount" | "inView";
}

const containerVariants = {
  hidden: {},
  visible: (staggerDelay: number) => ({
    transition: { staggerChildren: staggerDelay },
  }),
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

export function TextSplit({
  text,
  splitBy = "word",
  className,
  staggerDelay = 0.04,
  trigger = "inView",
}: TextSplitProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const shouldAnimate = trigger === "mount" ? true : isInView;
  const parts = splitBy === "word" ? text.split(" ") : text.split("");

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate={shouldAnimate ? "visible" : "hidden"}
      custom={staggerDelay}
      aria-label={text}
      role="text"
    >
      {parts.map((part, i) => (
        <motion.span
          key={`${part}-${i}`}
          variants={itemVariants}
          style={{
            display: "inline-block",
            whiteSpace: splitBy === "word" ? "pre" : undefined,
          }}
        >
          {splitBy === "word" ? (i < parts.length - 1 ? `${part}\u00A0` : part) : part}
        </motion.span>
      ))}
    </motion.div>
  );
}
