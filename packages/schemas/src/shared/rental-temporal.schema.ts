import { z } from "zod";

export const localDateSchema = z.iso.date();

export const minutesFromMidnightSchema = z.number().int().min(0).max(1439);
