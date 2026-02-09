"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Upload listing photos to Supabase Storage and create listing_media rows.
 */
export async function uploadListingPhotos(
  listingId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const files = formData.getAll("photos") as File[];
  if (!files.length) return { error: "No photos provided." };

  const results: { path: string; order: number }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split(".").pop() || "jpg";
    const storagePath = `${listingId}/${Date.now()}_${i}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("listings")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error(`Upload error for photo ${i}:`, uploadError);
      continue;
    }

    results.push({ path: storagePath, order: i });
  }

  // Insert listing_media rows for successful uploads
  if (results.length > 0) {
    const { error: insertError } = await supabase
      .from("listing_media")
      .insert(
        results.map((r) => ({
          listing_id: listingId,
          type: "photo" as const,
          storage_path: r.path,
          order_index: r.order,
          uploaded_by_user_id: user.id,
        }))
      );

    if (insertError) {
      console.error("listing_media insert error:", insertError);
      return { error: insertError.message };
    }
  }

  return { success: true, count: results.length };
}

/**
 * Upload a verification document (EWA bill, deed, authorization letter)
 */
export async function uploadVerificationDoc(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const file = formData.get("document") as File;
  if (!file) return { error: "No document provided." };

  const ext = file.name.split(".").pop() || "pdf";
  const storagePath = `verification/${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Verification doc upload error:", uploadError);
    return { error: uploadError.message };
  }

  return { success: true, path: storagePath };
}

/**
 * Upload RERA certificate for agent verification
 */
export async function uploadReraCert(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const file = formData.get("rera_cert") as File;
  if (!file) return { error: "No certificate provided." };

  const ext = file.name.split(".").pop() || "pdf";
  const storagePath = `rera/${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("RERA cert upload error:", uploadError);
    return { error: uploadError.message };
  }

  // Update manager profile with RERA cert path
  await supabase
    .from("rental_manager_profiles")
    .update({ rera_cert_path: storagePath })
    .eq("user_id", user.id);

  return { success: true, path: storagePath };
}
