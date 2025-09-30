import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge class names with Tailwind CSS class deduplication
 *
 * @param inputs - Class names to merge
 * @returns Merged and deduplicated class string
 *
 * @example
 * cn("px-2 py-1", "px-4") // Returns "py-1 px-4" (px-2 is overridden)
 * cn("text-red-500", condition && "text-blue-500") // Conditional classes
 * cn({ "bg-red-500": isError, "bg-green-500": isSuccess }) // Object syntax
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Create a variant-based className utility
 *
 * @param base - Base classes to always apply
 * @param variants - Object of variant configurations
 * @returns Function that accepts variant props and returns merged classes
 *
 * @example
 * const buttonVariants = cva("px-4 py-2 rounded", {
 *   variants: {
 *     variant: {
 *       primary: "bg-blue-500 text-white",
 *       secondary: "bg-gray-200 text-gray-900"
 *     },
 *     size: {
 *       sm: "text-sm",
 *       lg: "text-lg"
 *     }
 *   },
 *   defaultVariants: {
 *     variant: "primary",
 *     size: "sm"
 *   }
 * });
 */
export function cva(
  base: string,
  config?: {
    variants?: Record<string, Record<string, string>>;
    compoundVariants?: Array<{
      [key: string]: string | undefined;
      class: string;
    }>;
    defaultVariants?: Record<string, string>;
  },
) {
  return (props?: Record<string, string | undefined>) => {
    if (!config) return base;

    const { variants, compoundVariants, defaultVariants } = config;

    // Start with base classes
    const classes = [base];

    // Apply variant classes
    if (variants && props) {
      for (const [variantKey, variantValue] of Object.entries(props)) {
        const variant = variants[variantKey];
        if (variant && variantValue && variant[variantValue]) {
          classes.push(variant[variantValue]);
        }
      }
    }

    // Apply default variants for unspecified props
    if (defaultVariants) {
      for (const [variantKey, variantValue] of Object.entries(defaultVariants)) {
        if (!props?.[variantKey] && variants?.[variantKey]?.[variantValue]) {
          classes.push(variants[variantKey][variantValue]);
        }
      }
    }

    // Apply compound variants
    if (compoundVariants && props) {
      for (const compoundVariant of compoundVariants) {
        const { class: compoundClass, ...conditions } = compoundVariant;
        const matches = Object.entries(conditions).every(([key, value]) => props[key] === value);
        if (matches) {
          classes.push(compoundClass);
        }
      }
    }

    return cn(classes);
  };
}
