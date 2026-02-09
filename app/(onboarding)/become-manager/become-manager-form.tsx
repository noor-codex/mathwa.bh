"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOnboarding } from "@/lib/actions/manager";
import { uploadReraCert, uploadVerificationDoc } from "@/lib/actions/upload";

type ManagerType = "private_owner" | "independent_agent" | "company_agent";

type Prefill = {
  fullName: string;
  email: string;
  phone: string;
};

const STEPS = ["Intent", "Identity", "Company", "Confirm"];

export function BecomeManagerForm({ prefill }: { prefill: Prefill }) {
  const [step, setStep] = useState(0);
  const [managerType, setManagerType] = useState<ManagerType | null>(null);
  const [fullName, setFullName] = useState(prefill.fullName);
  const [cprOrPassport, setCprOrPassport] = useState("");
  const [phone, setPhone] = useState(prefill.phone);
  const [reraFile, setReraFile] = useState<File | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const needsRera =
    managerType === "independent_agent" || managerType === "company_agent";
  const needsCompanyStep = managerType === "company_agent";

  function handleIntentSelect(type: ManagerType) {
    setManagerType(type);
    setStep(1);
  }

  function handleIdentityNext() {
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    setError(null);
    // Skip company step if not company agent
    if (needsCompanyStep) {
      setStep(2);
    } else {
      setStep(3);
    }
  }

  function handleCompanyNext() {
    setError(null);
    setStep(3);
  }

  function handleBack() {
    setError(null);
    if (step === 3 && !needsCompanyStep) {
      setStep(1);
    } else {
      setStep(step - 1);
    }
  }

  function handleSubmit() {
    startTransition(async () => {
      setError(null);

      // Upload RERA cert if provided
      let reraCertPath: string | null = null;
      if (reraFile) {
        const reraFormData = new FormData();
        reraFormData.set("rera_cert", reraFile);
        const reraResult = await uploadReraCert(reraFormData);
        if (reraResult.error) {
          setError(reraResult.error);
          return;
        }
        reraCertPath = reraResult.path ?? null;
      }

      const formData = new FormData();
      formData.set("manager_type", managerType!);
      formData.set("full_name", fullName);
      if (cprOrPassport) formData.set("cpr_or_passport", cprOrPassport);
      if (phone) formData.set("phone", phone);
      if (inviteCode) formData.set("invite_code", inviteCode);
      // reraCertPath is already uploaded and stored on the profile by uploadReraCert

      const result = await completeOnboarding(formData);
      if (result?.error) {
        setError(result.error);
      }
      // On success, completeOnboarding redirects to /manager/listings
    });
  }

  const managerLabel =
    managerType === "private_owner"
      ? "Private Owner"
      : managerType === "independent_agent"
        ? "Independent Agent"
        : managerType === "company_agent"
          ? "Company Agent"
          : "";

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Become a Rental Manager</h1>
        <span className="text-sm text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </span>
      </div>

      <div className="flex gap-1">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Step 0: Intent */}
      {step === 0 && (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            What brings you to Mathwa as a Rental Manager?
          </p>
          <div className="space-y-3">
            <button
              onClick={() => handleIntentSelect("private_owner")}
              className="w-full rounded-xl border p-4 text-left transition hover:border-primary hover:bg-muted/50"
            >
              <div className="font-medium">List my own property</div>
              <div className="mt-1 text-sm text-muted-foreground">
                I own property and want to find tenants
              </div>
            </button>
            <button
              onClick={() => handleIntentSelect("independent_agent")}
              className="w-full rounded-xl border p-4 text-left transition hover:border-primary hover:bg-muted/50"
            >
              <div className="font-medium">Manage listings for owners</div>
              <div className="mt-1 text-sm text-muted-foreground">
                I&apos;m an agent or manager helping owners rent out properties
              </div>
            </button>
            <button
              onClick={() => handleIntentSelect("company_agent")}
              className="w-full rounded-xl border p-4 text-left transition hover:border-primary hover:bg-muted/50"
            >
              <div className="font-medium">I&apos;m part of a company</div>
              <div className="mt-1 text-sm text-muted-foreground">
                I work for a real estate agency or property management company
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Identity */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Tell us about yourself so we can verify your identity.
          </p>

          <div className="space-y-3">
            <div>
              <Label htmlFor="full_name">Full name *</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full legal name"
              />
            </div>

            <div>
              <Label htmlFor="cpr_or_passport">CPR or Passport number</Label>
              <Input
                id="cpr_or_passport"
                value={cprOrPassport}
                onChange={(e) => setCprOrPassport(e.target.value)}
                placeholder="e.g. 001234567"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+973 XXXX XXXX"
              />
            </div>

            {needsRera && (
              <div>
                <Label htmlFor="rera_cert">
                  RERA Certificate{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="rera_cert"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setReraFile(e.target.files?.[0] ?? null)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  You can skip this for now, but you won&apos;t be able to
                  publish listings until verified.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Back
            </Button>
            <Button onClick={handleIdentityNext} className="flex-1">
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Company Link */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Enter your company&apos;s invite code to link your account.
          </p>

          <div>
            <Label htmlFor="invite_code">Invite Code</Label>
            <Input
              id="invite_code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="e.g. COMPANY-ABC-123"
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Don&apos;t have a code? You can skip this step and join a company
            later from your profile settings.
          </p>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Back
            </Button>
            <Button onClick={handleCompanyNext} className="flex-1">
              {inviteCode ? "Continue" : "Skip for now"}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Review your details and confirm.
          </p>

          <div className="rounded-xl border p-4 space-y-3">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Profile Type
              </div>
              <div className="font-medium">{managerLabel}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Name
              </div>
              <div className="font-medium">{fullName}</div>
            </div>
            {cprOrPassport && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  CPR / Passport
                </div>
                <div className="font-medium">{cprOrPassport}</div>
              </div>
            )}
            {phone && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Phone
                </div>
                <div className="font-medium">{phone}</div>
              </div>
            )}
            {needsRera && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  RERA Certificate
                </div>
                <div className="font-medium">
                  {reraFile ? reraFile.name : "Not uploaded (can add later)"}
                </div>
              </div>
            )}
            {inviteCode && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Company Code
                </div>
                <div className="font-medium">{inviteCode}</div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? "Setting up..." : "Complete Setup"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
