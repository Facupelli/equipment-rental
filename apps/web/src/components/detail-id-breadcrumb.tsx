import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "@tanstack/react-router";

interface PageBreadcrumbProps {
	parent: {
		label: string;
		to: string;
	};
	current: string;
}

export function PageBreadcrumb({ parent, current }: PageBreadcrumbProps) {
	return (
		<Breadcrumb className="py-6">
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink render={<Link to={parent.to}>{parent.label}</Link>} />
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem>
					<BreadcrumbPage>{current}</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	);
}
