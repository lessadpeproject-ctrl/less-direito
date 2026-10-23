import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { admin, cors, hmacSha1, json, sha256, soDigitos } from "./_shared.ts";

// Recebe as notificações da Kiwify e libera ou bloqueia o acesso do comprador.
// URL configurada na Kiwify: .../functions/v1/kiwify-webhook?k=<webhook_key da tabela config>
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ erro: "método não permitido" }, 405);

  const sb = admin();
  const url = new URL(req.url);
  const raw = await req.text();
  let body: Record<string, any> = {};
  try { body = JSON.parse(raw); } catch { return json({ erro: "json inválido" }, 400); }

  const { data: cfg } = await sb.from("config").select("valor").eq("chave", "webhook_key").single();
  let valido = !!cfg && url.searchParams.get("k") === cfg.valor;

  // Camada extra opcional: assinatura da Kiwify (defina o secret KIWIFY_TOKEN com o token do webhook)
  const token = Deno.env.get("KIWIFY_TOKEN");
  const assinatura = url.searchParams.get("signature");
  if (valido && token) {
    const a = await hmacSha1(token, raw);
    const b = await hmacSha1(token, JSON.stringify(body));
    valido = !!assinatura && (assinatura === a || assinatura === b);
  }

  const cliente = body.Customer ?? body.customer ?? {};
  const email = String(cliente.email ?? "").trim().toLowerCase();
  const status = String(body.order_status ?? "").toLowerCase();
  const evento = String(body.webhook_event_type ?? status);

  await sb.from("webhook_log").insert({ evento, email, valido, payload: body });
  if (!valido) return json({ erro: "não autorizado" }, 401);
  if (!email) return json({ ok: true, ignorado: "sem e-mail" });

  if (["paid", "approved", "order_approved"].includes(status) || evento === "order_approved") {
    const cpf = soDigitos(cliente.CPF ?? cliente.cpf);
    const registro = {
      email,
      nome: cliente.full_name ?? cliente.name ?? null,
      cpf_hash: cpf ? await sha256(cpf) : null,
      pedido: String(body.order_ref ?? body.order_id ?? "") || null,
      produto: body.Product?.product_name ?? null,
      status: "ativo",
      atualizado_em: new Date().toISOString(),
    };
    const { error } = await sb.from("compradores").upsert(registro, { onConflict: "email" });
    if (error) return json({ erro: error.message }, 500);
    return json({ ok: true, acesso: "liberado" });
  }

  if (["refunded", "chargedback", "chargeback"].includes(status) || ["order_refunded", "chargeback"].includes(evento)) {
    await sb.from("compradores").update({ status: "reembolsado", atualizado_em: new Date().toISOString() }).eq("email", email);
    return json({ ok: true, acesso: "bloqueado" });
  }

  return json({ ok: true, ignorado: status || evento });
});
