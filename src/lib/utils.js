import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes safely
 * @param {...import("clsx").ClassValue} inputs
 * @returns {string}
 */
export function cn(...inputs) {
	return twMerge(clsx(inputs));
}


export function parseVietnamesePrice(price) {
	if (!price) return 0;

	return Number(price.replace(/[^\d]/g, ""));
}

export function formatVietnamesePrice(price) {
	return price.toLocaleString("vi-VN") + "đ";
}