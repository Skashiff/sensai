"use server"

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateAIInsights } from "./dashboard";

// this function is for the updating the user in DB...
export async function updateUser(data) {
  
  //authorization or authentaction...
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
  });

  if (!user) throw new Error ("User not found");

  try {

    const result = await db.$transaction( 
        async(tx)=>{
            
            // find if the industry exists...
            let industryInsight = await tx.industryInsight.findUnique({
                where: {
                  industry: data.industry,
                },
            });

            // find industry does't exist, create it with default values - will replace it with ai later...
            if (!industryInsight) {
                const insights = await generateAIInsights(data.industry);

                industryInsight = await db.industryInsight.create({
                  data:{
                      industry: data.industry,
                      ...insights,
                      nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                  },
                });
              }

            // update the user...
            const updatedUser = await tx.user.update({
                where: {
                  id: user.id,
                },
                data: {
                  industry: data.industry,
                  experience: data.experience,
                  bio: data.bio,
                  skills: data.skills,
                },
            });

            return { updatedUser, industryInsight };
        },
        {
            timeout: 10000, //this is the transation time-out...
        }
    );

    return { success: true, ...result };
  } catch (error) {
    console.error("Error updating user and industry:", error.message);
    throw new Error ("Failed to update profile" + error.message);
  }
};


// this function is for getting user's onboarding status...
export async function getUserOnboardingStatus() {

  //authorization or authentaction...
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { 
      clerkUserId: userId 
    },
  });

  if (!user) throw new Error("User not found");

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
      select: {
        industry: true,
      },
    });

    return {
      isOnboarded: !!user?.industry,
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    throw new Error("Failed to check onboarding status");
  }
};
