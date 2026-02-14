import NextAuth from "next-auth"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import { createServiceClient } from "@/lib/supabase/service"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      microsoftId: string
      profileId: string | null
      cargo: string | null
      lojaId: string | null
      onboardingCompleto: boolean
      ativo: boolean
    }
  }

  interface JWT {
    microsoftId?: string
    profileId?: string | null
    cargo?: string | null
    lojaId?: string | null
    onboardingCompleto?: boolean
    ativo?: boolean
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // On first sign-in, store the Microsoft OID
      if (account && profile) {
        token.microsoftId = (profile as { oid?: string }).oid ?? account.providerAccountId
        token.email = profile.email ?? token.email
        token.name = profile.name ?? token.name
      }

      // Refresh profile data from DB on every token refresh
      if (token.microsoftId) {
        const supabase = createServiceClient()
        const { data: dbProfile } = await supabase
          .from("profiles")
          .select("id, cargo, loja_id, onboarding_completo, ativo")
          .eq("microsoft_id", token.microsoftId as string)
          .single()

        if (dbProfile) {
          token.profileId = dbProfile.id
          token.cargo = dbProfile.cargo
          token.lojaId = dbProfile.loja_id
          token.onboardingCompleto = dbProfile.onboarding_completo
          token.ativo = dbProfile.ativo
        } else {
          token.profileId = null
          token.cargo = null
          token.lojaId = null
          token.onboardingCompleto = false
          token.ativo = true
        }
      }

      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: (token.profileId as string) ?? "",
        microsoftId: (token.microsoftId as string) ?? "",
        profileId: (token.profileId as string) ?? null,
        cargo: (token.cargo as string) ?? null,
        lojaId: (token.lojaId as string) ?? null,
        onboardingCompleto: (token.onboardingCompleto as boolean) ?? false,
        ativo: (token.ativo as boolean) ?? true,
      }
      return session
    },
    async signIn({ account, profile }) {
      if (account?.provider === "microsoft-entra-id") {
        const microsoftId = (profile as { oid?: string })?.oid ?? account.providerAccountId
        const supabase = createServiceClient()

        // Check if profile exists
        const { data: existing } = await supabase
          .from("profiles")
          .select("id, ativo")
          .eq("microsoft_id", microsoftId)
          .single()

        if (existing && !existing.ativo) {
          return "/auth/blocked"
        }

        // If no profile exists yet, sign-in still succeeds.
        // The middleware will redirect to /onboarding.
      }
      return true
    },
  },
  session: {
    strategy: "jwt",
  },
})
