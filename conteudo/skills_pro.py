# Kit Escritório Digital (PRO): 12 skills extras no mesmo formato do editor da plataforma.
# formato: chave -> dict(titulo, md, files={}, extra=[])

REGRAS_BASE = """## Regras gerais
- Use marcadores ([CLIENTE], [PROCESSO], [CPF]) no lugar de dados pessoais.
- Não cite jurisprudência de memória: escreva [PESQUISAR: termos].
- Marque CONFERIR em todo artigo de lei, prazo e valor.
- Nunca prometa resultado ao cliente.
"""

def sk(nome, desc, titulo, corpo, files=None):
    assert len(desc) <= 200, (nome, len(desc))
    md = f"---\nname: {nome}\ndescription: {desc}\n---\n\n# {titulo}\n\n{corpo.strip()}\n\n{REGRAS_BASE}"
    return dict(titulo=titulo, md=md, files=files or {}, extra=[], pro=True)

SKILLS_PRO = {}
def add(nome, desc, titulo, corpo, files=None):
    SKILLS_PRO[nome] = sk(nome, desc, titulo, corpo, files)

add("calculo-de-prazos-recursais",
    "Use quando o usuário pedir o prazo de recurso, contestação ou manifestação a partir de uma intimação, decisão ou data de publicação.",
    "Cálculo de prazos processuais",
    """
## Passos
1. Identifique o ato, o rito (CPC, CLT, Juizados, CPP) e a data da intimação ou publicação.
2. Consulte `prazos.md` e diga qual regra se aplica: dias úteis (CPC, art. 219) ou corridos (CPP; Juizados criminais).
3. Aplique o início da contagem: exclui o dia do começo e inclui o do vencimento (CPC, art. 224).
4. Considere prazo em dobro quando houver litisconsortes com advogados diferentes em autos físicos, Fazenda Pública, Defensoria ou MP (CONFERIR).
5. Liste feriados e suspensões que o usuário deve conferir no calendário do tribunal (recesso de 20/12 a 20/01 no CPC, art. 220).

## Entrega
Tabela: ato | regra | início | vencimento estimado | o que conferir. Termine com: "Confira no calendário oficial do tribunal antes de protocolar."
""",
    {"prazos.md": """# Prazos de referência (CONFERIR sempre)
| Ato | Prazo | Base |
|---|---|---|
| Contestação (CPC) | 15 dias úteis | CPC, art. 335 |
| Réplica | 15 dias úteis | CPC, arts. 350 e 351 |
| Apelação, agravo de instrumento, agravo interno, REsp, RE | 15 dias úteis | CPC, art. 1.003, §5º |
| Embargos de declaração (CPC) | 5 dias úteis | CPC, art. 1.023 |
| Recurso inominado | 10 dias | Lei 9.099/1995, art. 42 |
| Recurso ordinário trabalhista | 8 dias | CLT, art. 895 |
| Embargos de declaração (CLT) | 5 dias | CLT, art. 897-A |
| Resposta à acusação | 10 dias | CPP, art. 396 |
| Apelação criminal | 5 dias (razões em 8) | CPP, arts. 593 e 600 |
| Recurso em sentido estrito | 5 dias (razões em 2) | CPP, arts. 586 e 588 |
| Embargos de declaração (CPP) | 2 dias | CPP, arts. 382 e 619 |
"""})

add("contrato-de-honorarios",
    "Use quando o usuário pedir contrato de honorários advocatícios, proposta de honorários ou revisão de cláusulas de remuneração do advogado.",
    "Contrato de honorários advocatícios",
    """
## Passos
1. Pergunte: área, objeto (ação ou consultoria), fase, valor fixo, êxito (percentual), forma de pagamento e despesas.
2. Monte o contrato com: partes (marcadores), objeto delimitado, honorários contratuais, honorários de sucumbência (a quem pertencem, Lei 8.906/1994, art. 23), despesas, rescisão, revogação do mandato, foro.
3. Inclua cláusula sobre honorários em caso de acordo e de desistência.
4. Lembre os limites éticos: tabela da OAB da seccional como referência mínima e vedação de cláusulas abusivas (Código de Ética, arts. 48 a 54, CONFERIR).

## Entrega
Contrato em cláusulas numeradas + resumo de 5 linhas para o cliente entender o que está assinando.
""")

add("procuracao-e-substabelecimento",
    "Use quando o usuário pedir procuração ad judicia, procuração com poderes especiais, substabelecimento com ou sem reserva ou revogação.",
    "Procuração e substabelecimento",
    """
## Passos
1. Pergunte o tipo: ad judicia et extra, poderes especiais (CPC, art. 105: receber citação, confessar, transigir, desistir, renunciar, receber e dar quitação, firmar compromisso, declaração de hipossuficiência) ou substabelecimento.
2. Para substabelecimento, pergunte se é com ou sem reserva de poderes.
3. Use marcadores para outorgante, outorgado e OAB.
4. Indique se o caso exige firma reconhecida ou assinatura digital (CONFERIR com o cartório ou o órgão).

## Entrega
Documento pronto para assinatura + lista de poderes incluídos em linguagem simples.
""")

add("notificacao-extrajudicial",
    "Use quando o usuário pedir notificação extrajudicial, carta de cobrança, constituição em mora ou contranotificação.",
    "Notificação extrajudicial",
    """
## Passos
1. Pergunte: quem notifica, quem é notificado, o fato, o que se exige, o prazo para resposta e a consequência.
2. Redija com: identificação (marcadores), fatos objetivos, fundamento legal (CONFERIR), exigência clara, prazo certo, consequências e meio de resposta.
3. Sugira o meio de envio com prova de recebimento (cartório de títulos e documentos, AR, e-mail com confirmação).
4. Tom firme e sem ameaça: proibido mencionar medidas que não serão tomadas ou expor o devedor (CDC, art. 42, em relações de consumo).

## Entrega
Notificação de até 1 página + versão curta para WhatsApp, se o cliente quiser enviar antes.
""")

add("parecer-juridico",
    "Use quando o usuário pedir parecer, opinião legal, nota técnica ou análise de viabilidade de uma tese ou de um caso.",
    "Parecer jurídico",
    """
## Passos
1. Reúna: consulente (marcador), pergunta exata, fatos e documentos.
2. Estruture: Ementa, Relatório, Questões jurídicas, Fundamentação (lei, doutrina indicada para pesquisa, [PESQUISAR] para precedentes), Riscos, Conclusão com respostas numeradas às perguntas.
3. Classifique o risco de cada caminho: baixo, médio, alto, com o porquê.
4. Separe o que é fato confirmado do que é premissa assumida.

## Entrega
Parecer com títulos e conclusão objetiva no início ("resposta curta") e no fim (respostas numeradas).
""")

add("checklist-de-recurso",
    "Use quando o usuário for interpor ou analisar um recurso e precisar conferir cabimento, tempestividade, preparo e requisitos formais.",
    "Checklist de admissibilidade de recurso",
    """
## Passos
1. Identifique a decisão recorrida e o recurso cabível.
2. Confira: cabimento, legitimidade, interesse, tempestividade (use a skill de prazos se instalada), preparo e porte de remessa, regularidade formal, dialeticidade, prequestionamento (recursos aos tribunais superiores).
3. Liste os fundamentos da decisão e se cada um foi atacado.
4. Aponte riscos de não conhecimento e como evitá-los.

## Entrega
Checklist em tabela: requisito | situação (ok, atenção, falta) | o que fazer.
""")

add("preparacao-de-audiencia",
    "Use quando o usuário for a uma audiência de conciliação, instrução ou trabalhista e precisar de roteiro, perguntas e estratégia.",
    "Preparação de audiência",
    """
## Passos
1. Pergunte o tipo de audiência, o juízo, a posição do cliente e os pontos controvertidos.
2. Monte: objetivo da audiência, margem de acordo (se houver), perguntas para o depoimento pessoal da parte contrária, perguntas para cada testemunha (fato a provar ao lado), riscos e respostas para perguntas difíceis ao cliente.
3. Liste documentos e provas a levar e o que pedir em ata.
4. Prepare uma orientação simples para o cliente: como se comportar, o que não fazer, horário de chegada.

## Entrega
Roteiro em 1 página + orientação de 5 tópicos para enviar ao cliente.
""")

add("relatorio-mensal-cliente",
    "Use quando o usuário pedir relatório periódico de processos para um cliente, prestação de contas ou status da carteira.",
    "Relatório mensal ao cliente",
    """
## Passos
1. Receba a lista de processos e andamentos do período (anonimizados).
2. Para cada processo: fase atual, o que aconteceu no mês, próximo passo, prazo ou audiência, providência do cliente.
3. Destaque no topo: urgências, valores recebidos ou a receber, documentos pendentes.
4. Linguagem simples, sem termos técnicos sem explicação.

## Entrega
Relatório com resumo executivo (até 5 linhas) + tabela por processo + lista de pendências do cliente.
""")

add("triagem-de-intimacoes",
    "Use quando o usuário colar intimações, publicações do DJEN ou e-mails do tribunal e quiser triagem por urgência e providência.",
    "Triagem de intimações e publicações",
    """
## Passos
1. Leia cada intimação e identifique: processo, órgão, ato (despacho, decisão, sentença, audiência), teor resumido.
2. Classifique a providência: manifestar, recorrer, cumprir, ciência apenas, comparecer.
3. Estime o prazo com a regra do rito e marque CONFERIR.
4. Ordene por vencimento e urgência.

## Entrega
Tabela: processo | ato | providência | prazo estimado | prioridade (alta, média, baixa) | responsável [MARCADOR].
""")

add("minuta-de-acordo",
    "Use quando o usuário pedir minuta de acordo judicial ou extrajudicial, termo de transação, proposta de acordo ou contraproposta.",
    "Minuta de acordo",
    """
## Passos
1. Pergunte: partes (marcadores), objeto, valor, parcelas, vencimentos, multa por atraso, quitação, honorários e custas.
2. Redija cláusulas: objeto, valor e forma de pagamento, mora e multa (CONFERIR limites legais), quitação (ampla ou restrita ao objeto), honorários, custas, homologação judicial quando houver processo.
3. Em acordo trabalhista, discrimine verbas e natureza para fins de contribuições (CONFERIR).
4. Aponte riscos de cláusulas ambíguas.

## Entrega
Minuta pronta + quadro-resumo de valores e datas para o cliente aprovar.
""")

add("linha-do-tempo-do-caso",
    "Use quando o usuário enviar documentos, conversas ou relato de um caso e precisar de linha do tempo dos fatos com provas.",
    "Linha do tempo do caso",
    """
## Passos
1. Extraia todos os eventos com data (ou período aproximado) dos documentos e do relato.
2. Para cada evento: data, fato, documento que prova, observação (contradição, lacuna, prazo).
3. Destaque datas que contam prazos: prescrição, decadência, requerimento administrativo, ciência do dano.
4. Liste lacunas: o que falta provar e qual documento pedir ao cliente.

## Entrega
Tabela cronológica + lista de lacunas + datas críticas em destaque.
""")

add("revisao-de-peca",
    "Use quando o usuário pedir revisão de uma petição, recurso ou parecer antes de protocolar ou enviar.",
    "Revisão de peça antes do protocolo",
    """
## Passos
1. Leia a peça inteira antes de comentar.
2. Revise em 4 camadas: (a) técnica: pedidos coerentes com a causa de pedir, requisitos legais, valor da causa; (b) provas: cada alegação tem documento?; (c) forma: endereçamento, qualificação, assinatura, anexos citados; (d) escrita: clareza, repetição, erros de português.
3. Aponte citações de lei e julgados que precisam ser conferidas.
4. Não reescreva a peça inteira sem pedido: sugira as alterações.

## Entrega
Lista de correções por prioridade (crítica, importante, estilo), com trecho original e sugestão.
""")

if __name__ == "__main__":
    import json
    print(len(SKILLS_PRO), [len(v["md"]) for v in SKILLS_PRO.values()])
