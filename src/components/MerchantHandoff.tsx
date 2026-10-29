import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { APP_NAME } from "@/lib/app-config";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { merchantWebsite } from "@/lib/rewards";

export function MerchantHandoff({ merchant, onClose }: { merchant: string; onClose: () => void }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 2000); return () => clearTimeout(t); }, []);
  return (
    <div role="dialog" aria-modal="true" aria-label={`Opening ${merchant}`} className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-6">
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-soft">
        <div className="flex justify-center"><BrandLogo name={merchant} className="h-16 w-16" /></div>
        {!ready ? <>
          <p className="mt-4 font-bold">Opening {merchant} app…</p>
          <LoaderCircle className="mx-auto mt-4 h-7 w-7 animate-spin text-muted-foreground" aria-hidden />
        </> : <>
          <p className="mt-4 text-sm">In the full version, this opens the {merchant} app so you can order and earn points there.</p>
          <div className="mt-5 flex flex-col gap-2">
            <Button onClick={onClose}>Back to {APP_NAME}</Button>
            <Button asChild variant="outline"><a href={merchantWebsite[merchant] ?? "#"} target="_blank" rel="noopener noreferrer">Visit {merchant} website</a></Button>
          </div>
        </>}
      </div>
    </div>
  );
}
