"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

interface Props {
  src: string;
  alt: string;
  className?: string;
  speed?: number;
  priority?: boolean;
}

export default function ParallaxImage({
  src,
  alt,
  className = "",
  speed = 0.15,
  priority = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [`-${speed * 100}%`, `${speed * 100}%`]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div style={{ y }} className="relative w-full h-[120%] -mt-[10%]">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className="object-cover"
          sizes="100vw"
        />
      </motion.div>
    </div>
  );
}
