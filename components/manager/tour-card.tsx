"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateTourRequest } from "@/lib/actions/manager";

type TourRequest = {
  id: string;
  listing_id: string;
  requested_slot: string;
  status: string;
  rescheduled_slot: string | null;
  reschedule_reason: string | null;
  listing: {
    title: string;
    city: string | null;
    area: string | null;
  };
  tenant: {
    display_name: string | null;
    email: string | null;
  };
};

export function TourCard({ tour }: { tour: TourRequest }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(tour.status);

  const slotDate = new Date(tour.requested_slot);
  const formattedDate = slotDate.toLocaleDateString("en-BH", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = slotDate.toLocaleTimeString("en-BH", {
    hour: "numeric",
    minute: "2-digit",
  });

  const location = [tour.listing.area, tour.listing.city]
    .filter(Boolean)
    .join(", ");

  function handleAction(action: "accepted" | "denied") {
    startTransition(async () => {
      const result = await updateTourRequest(tour.id, action);
      if (!result.error) {
        setStatus(action);
      }
    });
  }

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div>
        <h3 className="font-medium text-sm">{tour.listing.title}</h3>
        {location && (
          <p className="text-xs text-muted-foreground">{location}</p>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-muted-foreground">Tenant: </span>
          <span className="font-medium">
            {tour.tenant.display_name ?? tour.tenant.email ?? "Unknown"}
          </span>
        </div>
        <div className="text-right">
          <div className="font-medium">{formattedDate}</div>
          <div className="text-xs text-muted-foreground">{formattedTime}</div>
        </div>
      </div>

      {status === "pending" && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => handleAction("accepted")}
            disabled={isPending}
            className="flex-1"
          >
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction("denied")}
            disabled={isPending}
            className="flex-1"
          >
            Deny
          </Button>
        </div>
      )}

      {status !== "pending" && (
        <div className="text-xs font-medium capitalize text-muted-foreground">
          {status}
        </div>
      )}
    </div>
  );
}
