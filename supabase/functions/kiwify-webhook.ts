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

  // Que produto é? "PRO" ou "Upgrade" liberam o plano PRO; "Pack" é complemento (order bump);
  // o restante é o plano Completo.
  const nomeProduto = String(body.Product?.product_name ?? body.product_name ?? "");
  const n = nomeProduto.toLowerCase();
  const tipo = /upgrade/.test(n) ? "upgrade" : /\bpro\b/.test(n) ? "pro" : /\bpack\b/.test(n) ? "pack" : "completo";

  const { data: atual } = await sb.from("compradores").select("plano, status, produto").eq("email", email).maybeSingle();

  if (["paid", "approved", "order_approved"].includes(status) || evento === "order_approved") {
    const cpf = soDigitos(cliente.CPF ?? cliente.cpf);
    // upgrade só vale para quem já tem uma compra registrada
    const virouPro = tipo === "pro" || (tipo === "upgrade" && !!atual) || atual?.plano === "pro";
    const registro: Record<string, unknown> = {
      email,
      nome: cliente.full_name ?? cliente.name ?? null,
      status: "ativo",
      plano: virouPro ? "pro" : "completo",
      atualizado_em: new Date().toISOString(),
    };
    if (cpf) registro.cpf_hash = await sha256(cpf);
    // o pedido e o produto guardados são os da compra principal (não do pack nem do upgrade)
    if (!atual || tipo === "completo" || tipo === "pro") {
      registro.pedido = String(body.order_ref ?? body.order_id ?? "") || null;
      registro.produto = nomeProduto || null;
    }
    const { error } = await sb.from("compradores").upsert(registro, { onConflict: "email" });
    if (error) return json({ erro: error.message }, 500);
    return json({ ok: true, acesso: "liberado", plano: registro.plano, tipo });
  }

  if (["refunded", "chargedback", "chargeback"].includes(status) || ["order_refunded", "chargeback"].includes(evento)) {
    const agora = new Date().toISOString();
    if (tipo === "pack") return json({ ok: true, ignorado: "reembolso de pack" });
    if (tipo === "upgrade") {
      await sb.from("compradores").update({ plano: "completo", atualizado_em: agora }).eq("email", email);
      return json({ ok: true, plano: "completo" });
    }
    await sb.from("compradores").update({ status: "reembolsado", atualizado_em: agora }).eq("email", email);
    return json({ ok: true, acesso: "bloqueado" });
  }

  return json({ ok: true, ignorado: status || evento });
});
