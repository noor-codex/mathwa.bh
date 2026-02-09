"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createListing, publishListing } from "@/lib/actions/manager";
import { uploadListingPhotos, uploadVerificationDoc } from "@/lib/actions/upload";
import { cn } from "@/lib/utils";

// ---- Constants ----

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
  { value: "other", label: "Other" },
];

const FURNISHED_OPTIONS = [
  { value: "furnished", label: "Fully Furnished" },
  { value: "semi_furnished", label: "Semi Furnished" },
  { value: "not_furnished", label: "Unfurnished" },
];

const AC_OPTIONS = [
  { value: "central_ac", label: "Central A/C" },
  { value: "mounted_ac", label: "Mounted A/C" },
  { value: "no_ac", label: "No A/C" },
];

const PETS_OPTIONS = [
  { value: "dogs_allowed", label: "Dogs Allowed" },
  { value: "cats_allowed", label: "Cats Allowed" },
  { value: "dogs_and_cats", label: "Dogs & Cats Allowed" },
  { value: "no_pets", label: "No Pets Allowed" },
];

const AMENITIES = [
  "maids_room", "balcony", "shared_pool", "private_pool", "shared_gym",
  "private_gym", "shared_spa", "concierge_service", "covered_parking",
  "outdoor_parking", "dedicated_parking", "view_of_landmark", "sea_view",
  "study", "jacuzzi", "built_in_wardrobe", "walk_in_closet", "built_in_washer",
  "built_in_dryer", "gated_compound", "roof_access", "bbq_grill", "maids_service",
];

const AMENITY_LABELS: Record<string, string> = {
  maids_room: "Maid's Room", balcony: "Balcony", shared_pool: "Shared Pool",
  private_pool: "Private Pool", shared_gym: "Shared Gym", private_gym: "Private Gym",
  shared_spa: "Shared Spa", concierge_service: "Concierge Service",
  covered_parking: "Covered Parking", outdoor_parking: "Outdoor Parking",
  dedicated_parking: "Dedicated Parking", view_of_landmark: "View of Landmark",
  sea_view: "Sea View", study: "Study", jacuzzi: "Jacuzzi",
  built_in_wardrobe: "Built-in Wardrobe", walk_in_closet: "Walk-in Closet",
  built_in_washer: "Built-in Washer", built_in_dryer: "Built-in Dryer",
  gated_compound: "Gated Compound", roof_access: "Roof Access",
  bbq_grill: "BBQ Grill", maids_service: "Maid's Service",
};

const BED_OPTIONS = [0, 1, 1.5, 2, 2.5, 3, 3.5, 4];
const BATH_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4];

const LISTING_FOR_OPTIONS = [
  { value: "own_property", label: "My property", desc: "I own this property" },
  { value: "on_behalf", label: "On behalf of an owner", desc: "I'm managing this for someone" },
  { value: "company", label: "Company property", desc: "Listed under my company" },
];

const STEPS = ["Property Details", "Who are you listing for?", "Verification", "Review"];

// ---- Component ----

export function CreateListingForm({
  managerType,
  agencyId,
  isVerified,
}: {
  managerType: string;
  agencyId: string | null;
  isVerified: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Step 1: Property details
  const [propertyType, setPropertyType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [beds, setBeds] = useState<number | null>(null);
  const [baths, setBaths] = useState<number | null>(null);
  const [utilitiesIncluded, setUtilitiesIncluded] = useState<boolean | null>(null);
  const [furnishedType, setFurnishedType] = useState("");
  const [acType, setAcType] = useState("");
  const [petsPolicy, setPetsPolicy] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [priceMonthly, setPriceMonthly] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [moveInSpecial, setMoveInSpecial] = useState(false);
  const [moveInSpecialDesc, setMoveInSpecialDesc] = useState("");

  // Step 2: Listing for
  const [listingFor, setListingFor] = useState("own_property");

  // Step 3: Verification
  const [verificationFile, setVerificationFile] = useState<File | null>(null);

  function toggleAmenity(a: string) {
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }

  function validateStep1() {
    if (!propertyType) return "Property type is required.";
    if (!title.trim()) return "Title is required.";
    if (beds === null) return "Number of beds is required.";
    if (baths === null) return "Number of baths is required.";
    if (utilitiesIncluded === null) return "EWA (inclusive/exclusive) is required.";
    if (!furnishedType) return "Furnishing type is required.";
    if (!acType) return "A/C type is required.";
    if (!petsPolicy) return "Pets policy is required.";
    if (!priceMonthly) return "Monthly price is required.";
    return null;
  }

  function handleStep1Next() {
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep(1);
  }

  function handleStep2Next() {
    if (listingFor === "company" && !agencyId) {
      setError("You are not linked to a company. Choose a different option or link your account first.");
      return;
    }
    setError(null);
    setStep(2);
  }

  function handleStep3Next() {
    setError(null);
    setStep(3);
  }

  function handleBack() {
    setError(null);
    setStep(Math.max(0, step - 1));
  }

  function handleSubmit() {
    startTransition(async () => {
      setError(null);

      // Upload verification doc if provided
      let verificationDocPath: string | null = null;
      if (verificationFile) {
        const docFormData = new FormData();
        docFormData.set("document", verificationFile);
        const docResult = await uploadVerificationDoc(docFormData);
        if (docResult.error) {
          setError(docResult.error);
          return;
        }
        verificationDocPath = docResult.path ?? null;
      }

      // Create listing
      const formData = new FormData();
      formData.set("property_type", propertyType);
      formData.set("title", title);
      if (description) formData.set("description", description);
      if (address) formData.set("address", address);
      if (city) formData.set("city", city);
      if (area) formData.set("area", area);
      if (beds !== null) formData.set("beds", String(beds));
      if (baths !== null) formData.set("baths", String(baths));
      formData.set("utilities_included", String(utilitiesIncluded));
      formData.set("furnished_type", furnishedType);
      formData.set("ac_type", acType);
      formData.set("pets_policy", petsPolicy);
      formData.set("amenities", selectedAmenities.join(","));
      formData.set("price_monthly", priceMonthly);
      if (securityDeposit) formData.set("security_deposit", securityDeposit);
      formData.set("move_in_special", String(moveInSpecial));
      if (moveInSpecialDesc) formData.set("move_in_special_desc", moveInSpecialDesc);
      formData.set("listing_for", listingFor);
      if (verificationDocPath) formData.set("verification_doc_path", verificationDocPath);

      const result = await createListing(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      const listingId = result.listingId;

      // Upload photos if any
      if (photos && photos.length > 0 && listingId) {
        const photoFormData = new FormData();
        for (let i = 0; i < photos.length; i++) {
          photoFormData.append("photos", photos[i]);
        }
        await uploadListingPhotos(listingId, photoFormData);
      }

      // Publish the listing
      if (listingId) {
        const publishResult = await publishListing(listingId);
        if (publishResult.error) {
          setError(publishResult.error);
          return;
        }
      }

      router.push("/manager/listings");
    });
  }

  return (
    <div className="px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Create Listing</h1>
        <span className="text-sm text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </span>
      </div>

      {/* Progress */}
      <div className="flex gap-1 mb-6">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-muted")}
          />
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Step 0: Property Details */}
      {step === 0 && (
        <div className="space-y-5">
          {/* Property Type */}
          <div>
            <Label>Property Type *</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PROPERTY_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setPropertyType(t.value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition",
                    propertyType === t.value ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Listing Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sea View Apartment, Juffair" />
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Manama" />
            </div>
            <div>
              <Label htmlFor="area">Area</Label>
              <Input id="area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Juffair" />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" />
          </div>

          {/* Beds & Baths */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Beds *</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {BED_OPTIONS.map((b) => (
                  <button key={b} onClick={() => setBeds(b)} className={cn("rounded-full border px-3 py-1.5 text-sm transition", beds === b ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted")}>
                    {b === 0 ? "Studio" : b}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Baths *</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {BATH_OPTIONS.map((b) => (
                  <button key={b} onClick={() => setBaths(b)} className={cn("rounded-full border px-3 py-1.5 text-sm transition", baths === b ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted")}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* EWA */}
          <div>
            <Label>EWA (Utilities) *</Label>
            <div className="mt-2 flex gap-2">
              <button onClick={() => setUtilitiesIncluded(true)} className={cn("flex-1 rounded-lg border px-4 py-2.5 text-sm transition", utilitiesIncluded === true ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted")}>
                Inclusive
              </button>
              <button onClick={() => setUtilitiesIncluded(false)} className={cn("flex-1 rounded-lg border px-4 py-2.5 text-sm transition", utilitiesIncluded === false ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted")}>
                Exclusive
              </button>
            </div>
          </div>

          {/* Furnished */}
          <div>
            <Label>Furnishing *</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {FURNISHED_OPTIONS.map((o) => (
                <button key={o.value} onClick={() => setFurnishedType(o.value)} className={cn("rounded-full border px-4 py-2 text-sm transition", furnishedType === o.value ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted")}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* A/C */}
          <div>
            <Label>A/C Type *</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {AC_OPTIONS.map((o) => (
                <button key={o.value} onClick={() => setAcType(o.value)} className={cn("rounded-full border px-4 py-2 text-sm transition", acType === o.value ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted")}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pets */}
          <div>
            <Label>Pets Policy *</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PETS_OPTIONS.map((o) => (
                <button key={o.value} onClick={() => setPetsPolicy(o.value)} className={cn("rounded-full border px-4 py-2 text-sm transition", petsPolicy === o.value ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted")}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <Label>Features & Amenities</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {AMENITIES.map((a) => (
                <button key={a} onClick={() => toggleAmenity(a)} className={cn("rounded-full border px-3 py-1.5 text-xs transition", selectedAmenities.includes(a) ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted")}>
                  {AMENITY_LABELS[a] ?? a}
                </button>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div>
            <Label htmlFor="photos">Photos *</Label>
            <Input id="photos" type="file" accept="image/*" multiple onChange={(e) => setPhotos(e.target.files)} />
            {photos && photos.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">{photos.length} photo(s) selected</p>
            )}
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price">Monthly Rent (BD) *</Label>
              <Input id="price" type="number" value={priceMonthly} onChange={(e) => setPriceMonthly(e.target.value)} placeholder="e.g. 650" />
            </div>
            <div>
              <Label htmlFor="deposit">Security Deposit (BD)</Label>
              <Input id="deposit" type="number" value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)} placeholder="e.g. 650" />
            </div>
          </div>

          {/* Move-in special */}
          <div>
            <Label>Move-in Special</Label>
            <div className="mt-2 flex gap-2">
              <button onClick={() => setMoveInSpecial(true)} className={cn("flex-1 rounded-lg border px-4 py-2.5 text-sm transition", moveInSpecial === true ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted")}>Yes</button>
              <button onClick={() => { setMoveInSpecial(false); setMoveInSpecialDesc(""); }} className={cn("flex-1 rounded-lg border px-4 py-2.5 text-sm transition", moveInSpecial === false ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted")}>No</button>
            </div>
            {moveInSpecial && (
              <div className="mt-2">
                <Input value={moveInSpecialDesc} onChange={(e) => setMoveInSpecialDesc(e.target.value)} placeholder="Describe your move-in special" />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your property..." rows={4} />
          </div>

          <Button onClick={handleStep1Next} className="w-full">
            Continue
          </Button>
        </div>
      )}

      {/* Step 1: Who are you listing for? */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-muted-foreground">Who are you listing this property for?</p>
          <div className="space-y-3">
            {LISTING_FOR_OPTIONS.map((o) => {
              if (o.value === "company" && !agencyId) return null;
              return (
                <button key={o.value} onClick={() => setListingFor(o.value)} className={cn("w-full rounded-xl border p-4 text-left transition", listingFor === o.value ? "border-primary bg-primary/5" : "hover:bg-muted/50")}>
                  <div className="font-medium">{o.label}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{o.desc}</div>
                </button>
              );
            })}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
            <Button onClick={handleStep2Next} className="flex-1">Continue</Button>
          </div>
        </div>
      )}

      {/* Step 2: Verification / Trust checks */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            {listingFor === "own_property"
              ? "Upload proof of ownership (EWA bill, title deed, or authorization letter)."
              : listingFor === "on_behalf"
                ? "Upload the owner's authorization letter and your RERA verification."
                : "Company-verified listings can publish faster."}
          </p>

          {listingFor !== "company" && (
            <div>
              <Label htmlFor="verification_doc">
                {listingFor === "own_property" ? "Ownership Proof" : "Authorization Document"}
              </Label>
              <Input
                id="verification_doc"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setVerificationFile(e.target.files?.[0] ?? null)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                You can skip this, but your listing will stay in &quot;Pending
                Review&quot; until verified.
              </p>
            </div>
          )}

          {listingFor === "company" && (
            <div className="rounded-xl border p-4 bg-muted/30">
              <p className="text-sm">
                Your company is already verified. This listing will be reviewed
                and published under your company&apos;s brand.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
            <Button onClick={handleStep3Next} className="flex-1">
              {verificationFile || listingFor === "company" ? "Continue" : "Skip for now"}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-muted-foreground">Review your listing details before submitting.</p>

          <div className="rounded-xl border p-4 space-y-3">
            <Row label="Property Type" value={PROPERTY_TYPES.find((t) => t.value === propertyType)?.label ?? propertyType} />
            <Row label="Title" value={title} />
            <Row label="Location" value={[area, city].filter(Boolean).join(", ") || "Not set"} />
            <Row label="Beds" value={beds === 0 ? "Studio" : String(beds ?? "-")} />
            <Row label="Baths" value={String(baths ?? "-")} />
            <Row label="EWA" value={utilitiesIncluded ? "Inclusive" : "Exclusive"} />
            <Row label="Furnishing" value={FURNISHED_OPTIONS.find((o) => o.value === furnishedType)?.label ?? "-"} />
            <Row label="A/C" value={AC_OPTIONS.find((o) => o.value === acType)?.label ?? "-"} />
            <Row label="Pets" value={PETS_OPTIONS.find((o) => o.value === petsPolicy)?.label ?? "-"} />
            <Row label="Price" value={priceMonthly ? `BD ${priceMonthly}/month` : "-"} />
            {securityDeposit && <Row label="Deposit" value={`BD ${securityDeposit}`} />}
            <Row label="Listing For" value={LISTING_FOR_OPTIONS.find((o) => o.value === listingFor)?.label ?? listingFor} />
            {selectedAmenities.length > 0 && (
              <Row label="Amenities" value={selectedAmenities.map((a) => AMENITY_LABELS[a] ?? a).join(", ")} />
            )}
            {photos && <Row label="Photos" value={`${photos.length} photo(s)`} />}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
            <Button onClick={handleSubmit} disabled={isPending} className="flex-1">
              {isPending ? "Publishing..." : "Publish Listing"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}
