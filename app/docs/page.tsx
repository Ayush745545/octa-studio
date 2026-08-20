import type { Metadata } from "next";
import DocsView from "@/components/docs-view";

export const metadata: Metadata = {
  title: "Docs — octa-studio",
  description: "Documentation for the octa-studio creative workspace.",
};

export default function DocsPage() {
  return <DocsView />;
}
