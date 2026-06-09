// Simple className combiner used across components
export function cn(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(' ');
}

export default cn;
