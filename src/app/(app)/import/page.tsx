import { OcrImport } from "@/components/import/ocr-import";

export default function ImportPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Import from image</h1>
      <OcrImport />
    </div>
  );
}
