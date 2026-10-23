# Less Direito · Claude no Direito

Site do produto "Claude no Direito" (guia + plataforma).

| Caminho | O que é |
| --- | --- |
| `/` (`index.html`) | Landing page de vendas |
| `/app/` (`app/index.html`) | Plataforma com login (Supabase) |
| `img/`, `js/` | Imagens e bibliotecas compartilhadas |

## Publicação
O Netlify publica automaticamente a cada push na branch `main` (pasta raiz, sem build).

## Configurar a venda
No fim de `index.html`, preencha `CHECKOUT_URL` (link do checkout da Kiwify) e `PRECO`.

## Backend
Supabase (projeto `less-direito`): tabelas de compradores, funções `kiwify-webhook`, `acesso` e `gerar-prompt`.
O código das funções fica em `supabase/functions/` apenas como referência; nenhuma chave secreta vai para este repositório.
