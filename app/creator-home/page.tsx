import WorkspaceLayout from "@/components/layout/workspace-layout";

export default function CreatorHomePage() {
  return (
    <WorkspaceLayout activeItem="creator-home">
      <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold capitalize">Creator Home</h1>
          <p className="mt-2 text-zinc-500">This feature is currently under construction.</p>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
