import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export async function checkUser() {
  const user = await currentUser();
  if (!user) return null;
  const existing = await db.user.findUnique({ where: { clerkUserId: user.id } });
  if (existing) return existing;
  const email = user.emailAddresses.find((address) => address.id === user.primaryEmailAddressId)?.emailAddress;
  if (!email) throw new Error("A primary email address is required to create your profile");
  return db.user.upsert({
    where: { clerkUserId: user.id },
    update: {},
    create: {
      clerkUserId: user.id, email,
      name: [user.firstName, user.lastName].filter(Boolean).join(" "),
      imageUrl: user.imageUrl, skills: [],
    },
  });
}
