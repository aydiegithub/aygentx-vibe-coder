"use client"

import Image from "next/image";
import { PricingTable } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { usrCurrentTheme } from "@/hooks/use-current-theme";


const Page = () => {
    const currentTheme = usrCurrentTheme();

    return (
        <div className="flex flex-col max-w-3xl mx-auto w-full">
            <section className="space-y-6 pt-[16vh] 2xl:pt-48">
                <div className="flex flex-col items-center">
                    <Image
                        src="/vibecoder-icon-1.svg"
                        alt="Vibe Coder"
                        width={50}
                        height={50}
                        className="hidden md:block"
                    />
                </div>
                <h1 className="text-xl md:text-3xl font-bold text-center">Pricing</h1>
                <p className="text-muted-foreground text-center text-sm md:text-base">
                    Choose the plan that fits your needs.
                </p>
                <p className="text-muted-foreground text-center text-sm md:text-base">
                    *This is a porfolio project, this is still functional but please do not make payments.
                </p>
                <PricingTable
                    appearance={{
                        baseTheme: currentTheme === "dark" ? dark : undefined,
                        elements: {
                            pricingTableCard: "border! shadow-none! rounded-lg"
                        }
                    }}
                />
            </section>
        </div>
    );
}


export default Page;