import { getUserOnboardingStatus } from "@/actions/user"
import { industries } from "@/data/industries"
import OnboardingForm from "./_components/onboarding-form";
import { redirect } from "next/navigation";

const onboardingpage = async () => {
  //check if the user is already onboarded
  const { isOnboarded } = await getUserOnboardingStatus();

  if ( isOnboarded ) {
    redirect("/dashboard");
  }

  return (
    <main>
      <OnboardingForm industries={industries} />
    </main>
  );
};

export default onboardingpage;
