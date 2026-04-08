type BundleComponentGroupable = {
	category: {
		id: string;
		name: string;
	} | null;
};

export function groupBundleComponents<T extends BundleComponentGroupable>(
	components: T[],
) {
	const uncategorized: T[] = [];
	const categorized = new Map<
		string,
		{
			categoryName: string;
			components: T[];
		}
	>();

	for (const component of components) {
		if (!component.category) {
			uncategorized.push(component);
			continue;
		}

		const group = categorized.get(component.category.id);

		if (group) {
			group.components.push(component);
			continue;
		}

		categorized.set(component.category.id, {
			categoryName: component.category.name,
			components: [component],
		});
	}

	return {
		uncategorized,
		categorized: Array.from(categorized.values()),
	};
}
