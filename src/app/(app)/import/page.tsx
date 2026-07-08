import { redirect } from "next/navigation";
import { OcrImport } from "@/components/import/ocr-import";
import { getRole } from "@/lib/supabase/server";
import { canEditSongs } from "@/lib/roles";

export default async function ImportPage() {
  // Import creates songs in the shared pool — admins only.
  if (!canEditSongs(await getRole())) redirect("/songs");

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Import from image</h1>
      <OcrImport />
    </div>
  );
}
