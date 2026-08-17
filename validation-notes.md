# Validação visual e funcional

- A página pública abriu em `http://localhost:3002/` com título e conteúdo completos.
- O catálogo mockado carregou com categorias Tradicional, Especial e Bebidas e 14 produtos.
- Em viewport desktop observado, o layout expandiu para cinco colunas, com hero largo, busca e categorias alinhadas ao container.
- O botão rápido de adicionar Muçarela atualizou o contador do carrinho para 1 e exibiu o carrinho flutuante com subtotal de R$ 40,00.
- O hero rotacionou slides normalmente durante a verificação.
- Os sheets foram atualizados para centralizar e ampliar em telas a partir de `md`, preservando o bottom sheet no mobile.
- Próximo passo: executar build/testes e revisar o diff antes do commit.

A abertura do carrinho funcionou após o clique no CTA flutuante. Em viewport ampla, o diálogo ficou centralizado, com largura maior e conteúdo de item, observações, subtotal e botão Continuar visíveis; o fundo permaneceu bloqueado conforme esperado.

## Ajustes finos

No preview Nitro de produção, a rota pública respondeu HTTP 200 e renderizou o catálogo. O banner exibiu imagem de fundo mockada sem a sombra externa anterior; pesquisa e categorias permanecem visíveis no topo da área de conteúdo. O modal de produto foi aberto no viewport mobile e o botão de fechar apareceu sobre a imagem, no canto superior direito, com área de toque ampliada.

O CTA flutuante continuou funcionando após a adição rápida de uma pizza. O carrinho abriu em diálogo centralizado com subtotal de R$ 40,00 e botão Continuar disponível, sem alteração da função específica do carrinho que foi deixada para depois.

No checkout, os modos Entrega e No local usam o mesmo espaço vertical do modal, com rolagem interna para informações adicionais. O campo Número aparece como entrada textual com teclado numérico e sanitização somente de dígitos. Ao selecionar Dinheiro, o campo Troco para quanto? apareceu e recebeu foco automaticamente; o preenchimento de 50 foi mantido.

## PWA

O preview Nitro respondeu HTTP 200 para a rota raiz, entregou o `manifest.json` com ícones 192/512 e entregou `sw.js` com content-type JavaScript. No navegador, o manifest foi encontrado em `/manifest.json`, o contexto seguro estava ativo, o service worker `http://localhost:3011/sw.js` estava controlando a página e a altura da viewport visual foi detectada para sincronização com o teclado.

A página exibiu o prompt de instalação do cardápio no preview. Ao abrir o modal de produto, o foco inicial foi direcionado ao botão `Fechar`, o diálogo foi identificado com `role=dialog` e o controle está dentro do modal, sem deixar o foco atrás da camada.

## Checkout em três etapas

O checkout foi validado no preview mobile com o fluxo `Dados → Revisão → Pagamento`. A primeira etapa exibiu entrega/local e dados de contato/endereço; a segunda apresentou endereço, cliente, itens e total com opção Editar; a terceira exibiu Pix, Dinheiro e Cartão na entrega. Ao informar R$ 50,00 para um total de R$ 45,00, a interface calculou e exibiu `Seu troco será R$ 5,00`.

A finalização foi executada no preview com pagamento em dinheiro de R$ 50,00 para total de R$ 45,00. O pedido foi aceito sem o erro de validação do cardápio e abriu o WhatsApp com o código `LBP-483259`, endereço, itens, total e informação de troco.

## Mensagem WhatsApp

A mensagem de pedido foi reorganizada para usar formatação nativa do WhatsApp: seções em MAIÚSCULAS, negrito com `*`, itálico com `_`, separadores curtos e quebras controladas. Cada adicional aparece em sua própria linha abaixo de `_ADICIONAIS:_`, e o resumo inclui subtotal, entrega, pagamento, troco e total. O número informado `998340085` é normalizado para `5588998340085`, correspondente a 55 + DDD 88 + telefone.

## Correção da validação do pedido

O erro `Não foi possível validar o cardápio. Tente novamente.` ocorria porque a presença das variáveis Supabase ativava automaticamente a consulta externa, mesmo com o catálogo público ainda mockado. O serviço agora usa o catálogo mockado por padrão e só ativa Supabase quando `MOCK_DATA_MODE=false` estiver configurado explicitamente. O cenário com variáveis Supabase presentes e sem `MOCK_DATA_MODE` foi coberto por teste de regressão; o pedido foi confirmado e o link do WhatsApp foi gerado normalmente.

## Central de pedidos `/pedidos`

A nova rota respondeu HTTP 200 no preview Nitro/Vercel e renderizou o estado protegido de acesso quando não havia sessão autenticada. A tela informa que a central é exclusiva da equipe e direciona para o login administrativo, sem expor dados mockados publicamente. O dashboard e os controles mockados ficam disponíveis após a autenticação autorizada.

## Acesso administrativo mockado

No preview de produção, a tela `/admin` exibiu as credenciais de demonstração. O login com `admin@labellapizza.local` e `LaBella@2026` autorizou o painel sem consultar o Supabase, manteve a sessão no navegador e permitiu abrir `/pedidos`. A central exibiu 6 pedidos mockados, métricas, fluxo operacional, filtros e ações de status.
