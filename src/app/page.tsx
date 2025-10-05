import { prisma } from "@/lib/db";
import { use } from "react";

const Page = async () => {
  const user = await prisma.user.findMany();
  const posts = await prisma.post.findMany();
  return (
    <div className="font-bold">
      {JSON.stringify(user, null, 2)}
      {JSON.stringify(posts, null, 2)}
    </div>
  );
};
export default Page;