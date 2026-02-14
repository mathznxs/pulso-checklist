import { getSetores } from "@/lib/actions/admin"
import { OnboardingForm } from "@/components/pulso/onboarding-form"

export default async function OnboardingPage() {
  const setores = await getSetores()

  return <OnboardingForm setores={setores} />
}
