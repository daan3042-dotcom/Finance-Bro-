// Verwijdert het inlogaccount van de aanroeper zelf.
//
// `auth: "user"` laat alleen aanvragen door met een geldig, actief
// login-token — een niet-ingelogde aanvraag wordt al vóór onze code
// geweigerd. Het te verwijderen account komt bewust nooit uit de
// aanvraag zelf (dat zou iemand in staat stellen een ander account op
// te geven); we gebruiken altijd het account dat bij het geverifieerde
// token hoort.
import "@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "@supabase/server"

export default {
  fetch: withSupabase({ auth: "user" }, async (_req, ctx) => {
    const {
      data: { user },
      error: userError,
    } = await ctx.supabase.auth.getUser()

    if (userError || !user) {
      return Response.json({ error: "Niet ingelogd." }, { status: 401 })
    }

    // auth.admin.deleteUser vereist service-role-rechten (supabaseAdmin)
    // en verwijdert het inlogaccount. De ON DELETE CASCADE-koppelingen op
    // user_profiles, lesson_progress, concept_progress en
    // question_responses ruimen de rest van de gebruikersdata op in
    // dezelfde databasetransactie — er bestaat geen tussentoestand waarin
    // het account nog bestaat maar de data al weg is, of andersom.
    const { error: deleteError } = await ctx.supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      return Response.json({ error: deleteError.message }, { status: 500 })
    }

    return Response.json({ success: true })
  }),
}
