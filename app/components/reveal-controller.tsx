"use client";

import { useLayoutEffect } from "react";

const revealSelectors = {
  up: [".section-heading", ".brand-proof-copy", ".accommodation-fee-card"],
  stagger: [".offer-grid", ".four-grid", ".partner-school-grid", ".benefit-grid", ".accommodation-options", ".support-card-grid"],
  mask: [".accommodation-photo", ".community-photo"],
  timeline: [".timeline"],
} as const;

export function RevealController() {
  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches || !("IntersectionObserver" in window)) return;

    const root = document.documentElement;
    const revealElements: HTMLElement[] = [];

    Object.entries(revealSelectors).forEach(([type, selectors]) => {
      document.querySelectorAll<HTMLElement>(selectors.join(",")).forEach((element) => {
        element.dataset.reveal = type;
        revealElements.push(element);

        if (type === "stagger" || type === "timeline") {
          Array.from(element.children).forEach((child, index) => {
            (child as HTMLElement).style.setProperty("--reveal-index", String(Math.min(index, 8)));
          });
        }
      });
    });

    root.classList.add("reveal-enabled");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -12% 0px" });

    revealElements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      root.classList.remove("reveal-enabled");
    };
  }, []);

  return null;
}
