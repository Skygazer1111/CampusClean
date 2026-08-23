import { z } from "zod";
import { CAMPUS_LOCATIONS } from "@/features/complaints/campus-locations";

export const complaintTypeSchema = z.enum([
  "waterlogging",
  "elevator",
  "escalator",
  "washroom",
  "other",
]);

export const createComplaintSchema = z.object({
  type: complaintTypeSchema,
  title: z.string().min(4, "Title is too short").max(100),
  description: z.string().min(10, "Add a bit more detail").max(2000),
  addressText: z
    .string()
    .trim()
    .refine(
      (value) => (CAMPUS_LOCATIONS as readonly string[]).includes(value),
      "Select a campus location",
    ),
  floor: z.coerce
    .number({ error: "Select a floor" })
    .int("Select a floor")
    .min(1, "Select a floor")
    .max(15, "Campus buildings have floors 1 to 15"),
});
