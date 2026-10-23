import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { admin, cors, json, sha256, soDigitos } from "./_shared.ts";

// Cria o login do comprador (ou redefine a senha) conferindo e-mail + CPF da compra.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ erro: "método não permitido" }, 405);

  let entrada: Record<string, unknown> = {};
  try { entrada = await req.json(); } catch { return json({ erro: "Dados inválidos." }, 400); }

  const email = String(entrada.email ?? "").trim().toLowerCase();
  const codigo = String(entrada.cpf ?? "").trim();
  const senha = String(entrada.senha ?? "");
  if (!email || !codigo) return json({ erro: "Informe o e-mail da compra e o CPF (ou o código do pedido)." }, 400);
  if (senha.length < 8) return json({ erro: "A senha precisa ter pelo menos 8 caracteres." }, 400);

  const sb = admin();
  const umaHora = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await sb.from("tentativas_acesso").select("id", { count: "exact", head: true })
    .eq("email", email).eq("sucesso", false).gte("criado_em", umaHora);
  if ((count ?? 0) >= 8) return json({ erro: "Muitas tentativas. Aguarde uma hora e tente de novo." }, 429);

  const { data: c } = await sb.from("compradores").select("*").eq("email", email).maybeSingle();
  const cpfOk = !!c?.cpf_hash && c.cpf_hash === await sha256(soDigitos(codigo));
  const pedidoOk = !!c?.pedido && c.pedido.toLowerCase() === codigo.toLowerCase();

  if (!c || c.status !== "ativo" || !(cpfOk || pedidoOk)) {
    await sb.from("tentativas_acesso").insert({ email, sucesso: false });
    const msg = c && c.status !== "ativo"
      ? "Esta compra foi reembolsada ou cancelada."
      : "Não encontramos uma compra com esse e-mail e CPF. Use o mesmo e-mail e CPF informados na compra.";
    return json({ erro: msg }, 403);
  }

  let userId: string | null = c.user_id;
  if (!userId) {
    const { data, error } = await sb.auth.admin.createUser({ email, password: senha, email_confirm: true, user_metadata: { nome: c.nome } });
    if (data?.user) userId = data.user.id;
    else if (error) {
      // Usuário já existia no Auth: localizar e atualizar
      for (let page = 1; page <= 20 && !userId; page++) {
        const { data: lista } = await sb.auth.admin.listUsers({ page, perPage: 200 });
        const u = lista?.users.find((x) => x.email?.toLowerCase() === email);
        if (u) userId = u.id;
        if (!lista || lista.users.length < 200) break;
      }
      if (!userId) return json({ erro: "Não foi possível criar o acesso agora. Tente de novo em instantes." }, 500);
    }
  }
  const { error: upErr } = await sb.auth.admin.updateUserById(userId!, { password: senha, email_confirm: true });
  if (upErr) return json({ erro: "Não foi possível definir a senha: " + upErr.message }, 500);

  await sb.from("compradores").update({ user_id: userId, atualizado_em: new Date().toISOString() }).eq("email", email);
  await sb.from("tentativas_acesso").insert({ email, sucesso: true });
  return json({ ok: true });
});
