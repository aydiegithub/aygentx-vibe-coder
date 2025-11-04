import { ProjectForm } from "@/modules/home/ui/components/project-form";
import { ProjectsList } from "@/modules/home/ui/components/projects-list";
import Image from "next/image";

export const metadata = {
  title: "AygentX Vibe Coder | Build with AI",
  description:
    "Experience the future of coding — build full-stack apps, websites, and AI projects instantly by chatting with AygentX Vibe Coder. No setup. No limits. Just pure creation.",
  openGraph: {
    title: "AygentX Vibe Coder | Build with AI",
    description:
      "Experience the future of coding — build full-stack apps, websites, and AI projects instantly by chatting with AygentX Vibe Coder. No setup. No limits. Just pure creation.",
    url: "https://aydie.in/aygentx/og-image.png",
    siteName: "AygentX Vibe Coder",
    images: [
      {
        url: "https://aydie.in/aygentx/og-image.png",
        width: 1200,
        height: 630,
        alt: "AygentX Vibe Coder",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AygentX Vibe Coder | Build with AI",
    description:
      "Experience the future of coding — build full-stack apps, websites, and AI projects instantly by chatting with AygentX Vibe Coder. No setup. No limits. Just pure creation.",
    images: ["https://aydie.in/aygentx/og-image.png"],
  },
};


const Page = () => {
  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full">
      <section className="space-y-6 py-[16vh] 2xl:py-48">
        <div className="flex flex-col items-center">
          <Image
            src="/vibecoder-icon-1.svg"
            alt="VibeCoder"
            width={50}
            height={50}
            className="hidden md:block"
          />
        </div>
        <h1 className="text-2xl md:text-5xl font-bold text-center">
          Build something with AygentX - Vibe Coder
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground text-center">
          Create apps and website by chatting with AI
        </p>
        <div className="max-w-3xl mx-auto w-full">
          <ProjectForm />
        </div>
      </section>
      <ProjectsList />
    </div>
  );
};

export default Page;