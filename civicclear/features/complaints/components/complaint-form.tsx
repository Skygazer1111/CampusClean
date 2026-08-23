"use client";

import { useActionState, useId } from "react";
import { createComplaintAction } from "@/features/complaints/actions";
import { CAMPUS_LOCATIONS } from "@/features/complaints/campus-locations";
import { PhotoPicker } from "@/features/complaints/components/photo-picker";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { FormErrorBanner } from "@/shared/ui/field-error";
import { COMPLAINT_TYPE_LABELS, ACTIVE_COMPLAINT_TYPES } from "@/features/complaints/labels";

export function ComplaintForm() {
  const formErrorId = useId();
  const [state, formAction, pending] = useActionState(
    createComplaintAction,
    undefined,
  );

  return (
    <form
      action={formAction}
      className="space-y-6"
      aria-describedby={state?.error ? formErrorId : undefined}
      noValidate
    >
      <div>
        <Label htmlFor="type">Issue type</Label>
        <select
          id="type"
          name="type"
          required
          className="field"
          defaultValue="waterlogging"
        >
          {ACTIVE_COMPLAINT_TYPES.map((value) => (
            <option key={value} value={value}>
              {COMPLAINT_TYPE_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="title">Short title</Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g. Elevator stuck on floor 3"
          required
          maxLength={100}
          autoComplete="off"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          maxLength={2000}
          placeholder="What is wrong, how long it has been there, and any nearby landmark inside the building."
          className="field h-auto min-h-[8rem] py-3"
        />
      </div>

      <div>
        <Label htmlFor="addressText">Campus location</Label>
        <select id="addressText" name="addressText" required className="field" defaultValue="">
          <option value="" disabled>
            Select a location
          </option>
          {CAMPUS_LOCATIONS.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="floor">Floor</Label>
        <select id="floor" name="floor" required className="field" defaultValue="">
          <option value="" disabled>
            Select a floor
          </option>
          {Array.from({ length: 15 }, (_, index) => index + 1).map((floor) => (
            <option key={floor} value={floor}>
              Floor {floor}
            </option>
          ))}
        </select>
      </div>

      <PhotoPicker />

      <div id={formErrorId}>
        <FormErrorBanner message={state?.error} />
      </div>

      <div className="sticky bottom-20 z-20 -mx-1 bg-gradient-to-t from-white/95 via-white/90 to-transparent pb-2 pt-4 md:static md:bottom-auto md:mx-0 md:bg-transparent md:p-0">
        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? "Submitting…" : "Submit report"}
        </Button>
      </div>
    </form>
  );
}
