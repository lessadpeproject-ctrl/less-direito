import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { admin, cors, json } from "./_shared.ts";

// Gerador universal: transforma o pedido do usuário em um prompt completo usando o Gemini.
const LIMITE_COMPLETO = 40, LIMITE_PRO = 100;

const SISTEMA = `Você é um engenheiro de prompts especializado em trabalho jurídico no Brasil.
Sua tarefa é ESCREVER UM PROMPT (não executar a tarefa) que o usuário vai colar no Claude.
O prompt deve ser completo, em português do Brasil, e seguir esta estrutura, com títulos em caixa alta:
PAPEL (quem o Claude deve ser), CONTEXTO (situação, público, dados disponíveis com [COLCHETES] para o usuário preencher),
TAREFA (o que entregar), ETAPAS (passos numerados; quando a tarefa for complexa, peça primeiro um diagnóstico com perguntas e só depois a entrega),
FORMATO DA SAÍDA (estrutura, tamanho, tom), REGRAS.
Nas REGRAS inclua sempre, quando o tema for jurídico: não citar jurisprudência de memória (usar [PESQUISAR: termos]);
marcar CONFERIR em artigos de lei; usar marcadores no lugar de nomes e dados pessoais; nunca prometer resultado.
Responda SOMENTE com o prompt final, sem comentários antes ou depois, sem markdown de bloco de código.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ erro: "método não permitido" }, 405);

  const sb = admin();
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: u } = await sb.auth.getUser(jwt);
  const user = u?.user;
  if (!user?.email) return json({ erro: "Faça login novamente." }, 401);

  const { data: c } = await sb.from("compradores").select("status, plano").eq("email", user.email.toLowerCase()).maybeSingle();
  if (!c || c.status !== "ativo") return json({ erro: "Seu acesso não está ativo." }, 403);
  const LIMITE_DIA = c.plano === "pro" ? LIMITE_PRO : LIMITE_COMPLETO;

  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await sb.from("uso_gerador").select("id", { count: "exact", head: true })
    .eq("user_id", user.id).gte("criado_em", desde);
  if ((count ?? 0) >= LIMITE_DIA) return json({ erro: `Limite de ${LIMITE_DIA} prompts por dia atingido. Volte amanhã.`, codigo: "limite" }, 429);

  // Várias chaves: GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3... Se uma estourar o limite, usa a próxima.
  const chaves = ["", "_2", "_3", "_4", "_5"].map((s) => Deno.env.get("GEMINI_API_KEY" + s)).filter((k): k is string => !!k);
  if (!chaves.length) return json({ erro: "Gerador com IA ainda não configurado.", codigo: "sem_chave" }, 503);

  let e: Record<string, unknown> = {};
  try { e = await req.json(); } catch { return json({ erro: "Dados inválidos." }, 400); }
  const objetivo = String(e.objetivo ?? "").slice(0, 3000);
  if (objetivo.trim().length < 10) return json({ erro: "Descreva com mais detalhes o que você quer." }, 400);

  const pedido = `O QUE O USUÁRIO QUER: ${objetivo}
ÁREA: ${e.area || "não informada"}
PARA QUEM É O RESULTADO: ${e.publico || "não informado"}
FORMATO DESEJADO: ${e.formato || "o mais adequado"}
TOM: ${e.tom || "profissional"}
NÍVEL DE DETALHE: ${e.nivel || "completo"}
DETALHES EXTRAS: ${String(e.detalhes ?? "").slice(0, 2000) || "nenhum"}`;

  // Modelos em ordem de preferência (rápido primeiro). Se um estiver sobrecarregado, tenta o próximo.
  const preferido = Deno.env.get("GEMINI_MODEL");
  const modelos = [...new Set([...(preferido ? [preferido] : []), "gemini-2.5-flash", "gemini-flash-lite-latest", "gemini-flash-latest"])];
  const corpoPara = (modelo: string) => JSON.stringify({
    systemInstruction: { parts: [{ text: SISTEMA }] },
    contents: [{ role: "user", parts: [{ text: pedido }] }],
    generationConfig: {
      temperature: 0.6, maxOutputTokens: 4096,
      // sem "raciocínio" longo no 2.5: a resposta sai em segundos
      ...(modelo.startsWith("gemini-2.5") ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
    },
  });
  // deno-lint-ignore no-explicit-any
  let dados: any = {};
  let ok = false, status = 0;
  tentativas:
  for (const modelo of modelos) {
    for (const chave of chaves) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": chave },
        body: corpoPara(modelo),
      });
      status = r.status;
      dados = await r.json().catch(() => ({}));
      if (r.ok) { ok = true; break tentativas; }
      const chaveRuim = r.status === 400 && /api key/i.test(String(dados?.error?.message ?? ""));
      // cota estourada ou chave inválida/bloqueada: tenta a próxima chave
      if (chaveRuim || r.status === 429 || r.status === 401 || r.status === 403) continue;
      // modelo sobrecarregado, indisponível ou com configuração recusada: pula para o próximo modelo
      continue tentativas;
    }
  }
  if (!ok) {
    if (status === 429) return json({ erro: "O limite de uso da IA foi atingido agora. Tente de novo em alguns minutos.", codigo: "cota" }, 503);
    if (status === 503 || status === 500) return json({ erro: "A IA está com muita procura neste momento. Tente de novo em instantes.", codigo: "ocupado" }, 503);
    return json({ erro: "O Gemini recusou o pedido: " + (dados?.error?.message ?? status), codigo: "gemini" }, 502);
  }

  const texto = (dados?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("").trim();
  if (!texto) return json({ erro: "O Gemini não devolveu texto. Tente reformular o pedido.", codigo: "vazio" }, 502);

  await sb.from("uso_gerador").insert({ user_id: user.id });
  return json({ prompt: texto, restantes: LIMITE_DIA - (count ?? 0) - 1 });
});
