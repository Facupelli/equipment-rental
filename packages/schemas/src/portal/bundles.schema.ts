import { z } from "zod";
import { productTypeIncludedItemSchema } from "../catalog/product-type/product-type.schema";
import { localDateSchema } from "../shared/rental-temporal.schema";

const pricingPreviewSchema = z.object({
	pricePerUnit: z.number(),
	fromUnit: z.number().int(),
});

const comboComponentSchema = z.object({
	quantity: z.number().int().positive(),
	productType: z.object({
		id: z.uuid(),
		name: z.string(),
		description: z.string().nullable(),
		includedItems: z.array(productTypeIncludedItemSchema),
		imageUrl: z.string().nullable(),
		category: z
			.object({
				id: z.uuid(),
				name: z.string(),
			})
			.nullable(),
	}),
});

export type BundleComponent = z.infer<typeof comboComponentSchema>;

export const bundleItemResponseSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	imageUrl: z.string(),
	description: z.string().nullable(),
	isAvailable: z.boolean(),
	billingUnit: z.object({
		label: z.string(),
	}),
	pricingPreview: pricingPreviewSchema.nullable(),
	components: z.array(comboComponentSchema),
});

export const bundleListResponseSchema = z.array(bundleItemResponseSchema);

export type BundleItemResponse = z.infer<typeof bundleItemResponseSchema>;
export type BundleListResponseDto = z.infer<typeof bundleListResponseSchema>;

export const getBundleParamsSchema = z.object({
	locationId: z.uuid(),
	pickupDate: localDateSchema.optional(),
	returnDate: localDateSchema.optional(),
});

export type GetCombosParams = z.infer<typeof getBundleParamsSchema>;
