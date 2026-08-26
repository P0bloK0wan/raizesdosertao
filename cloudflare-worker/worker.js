/* =========================================================
   Servidor mínimo (Cloudflare Worker) só pra guardar a chave
   secreta do Mercado Pago (Access Token) e chamar a API de
   Preferências em nome do site.

   Por quê isso precisa existir: o Access Token do Mercado Pago
   nunca pode aparecer no código do navegador — qualquer pessoa
   que abrisse o site conseguiria roubar e usar essa chave. Por
   isso essa chamada acontece aqui, num servidor separado, que só
   recebe "quanto a pessoa quer doar" e devolve o link de
   pagamento pronto — o Access Token em si nunca sai daqui.

   Deploy: veja o passo a passo no README.md do site (seção
   "Configurar a API de pagamento do Mercado Pago").
   ========================================================= */

const HEADERS_JSON = { "Content-Type": "application/json; charset=utf-8" };

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.SITE_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ erro: "Método não permitido." }), {
        status: 405,
        headers: { ...cors, ...HEADERS_JSON },
      });
    }

    if (!env.MP_ACCESS_TOKEN || !env.SITE_URL_CAMPORI) {
      return new Response(
        JSON.stringify({ erro: "O Worker ainda não foi configurado (faltam MP_ACCESS_TOKEN e/ou SITE_URL_CAMPORI)." }),
        { status: 500, headers: { ...cors, ...HEADERS_JSON } }
      );
    }

    let corpo;
    try {
      corpo = await request.json();
    } catch {
      return new Response(JSON.stringify({ erro: "Corpo da requisição inválido." }), {
        status: 400,
        headers: { ...cors, ...HEADERS_JSON },
      });
    }

    const valor = Number(corpo.valor);
    if (!Number.isFinite(valor) || valor < 1 || valor > 50000) {
      return new Response(JSON.stringify({ erro: "Informe um valor de doação válido (entre R$1 e R$50.000)." }), {
        status: 400,
        headers: { ...cors, ...HEADERS_JSON },
      });
    }

    const baseUrl = env.SITE_URL_CAMPORI;
    const preferencia = {
      items: [
        {
          title: "Doação — Campori DSA 2027 (Clube Raízes do Sertão)",
          quantity: 1,
          unit_price: Math.round(valor * 100) / 100,
          currency_id: "BRL",
        },
      ],
      back_urls: {
        success: `${baseUrl}?doacao=obrigado`,
        pending: `${baseUrl}?doacao=pendente`,
        failure: `${baseUrl}?doacao=falhou`,
      },
      auto_return: "approved",
      statement_descriptor: "RAIZES DO SERTAO",
    };

    let respostaMp;
    try {
      respostaMp = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferencia),
      });
    } catch {
      return new Response(JSON.stringify({ erro: "Não foi possível falar com o Mercado Pago agora. Tente de novo em instantes." }), {
        status: 502,
        headers: { ...cors, ...HEADERS_JSON },
      });
    }

    const dados = await respostaMp.json();

    if (!respostaMp.ok || !dados.init_point) {
      return new Response(JSON.stringify({ erro: dados.message || "Não foi possível gerar o pagamento." }), {
        status: 502,
        headers: { ...cors, ...HEADERS_JSON },
      });
    }

    return new Response(JSON.stringify({ url: dados.init_point }), {
      status: 200,
      headers: { ...cors, ...HEADERS_JSON },
    });
  },
};
