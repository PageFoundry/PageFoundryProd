import fs from "fs";
import path from "path";

/** Eingebettetes Logo für E-Mail (CID = pf_logo) */
export function logoAttachment() {
  const p = path.join(process.cwd(), "public/email/logo.png");
  const buf = fs.readFileSync(p);
  return {
    filename: "logo.png",
    content: buf,
    contentType: "image/png",
    cid: "pf_logo",
  } as const;
}
