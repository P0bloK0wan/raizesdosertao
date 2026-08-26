/* =========================================================
   Upload de imagens pro Cloudinary (armazenamento gratuito de
   fotos, sem precisar de servidor próprio nem de plano pago).

   Usa um "upload preset" do tipo unsigned — configurado no painel
   do Cloudinary (Settings → Upload → Upload presets), restringindo
   lá o que pode ser enviado (tamanho máximo, tipo de arquivo,
   pasta). O Cloud name e o nome do preset não são segredo: um
   preset unsigned só permite enviar dentro do que foi configurado,
   nunca dá acesso de leitura/exclusão da conta (mesma lógica das
   chaves do Firebase, que também aparecem no código do site).
   ========================================================= */

import { RS_CLOUDINARY_CLOUD_NAME, RS_CLOUDINARY_UPLOAD_PRESET } from "./data.js";

export async function enviarImagemCloudinary(arquivo) {
  if (!RS_CLOUDINARY_CLOUD_NAME || !RS_CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("O Cloudinary ainda não foi configurado (veja o README.md).");
  }
  const url = `https://api.cloudinary.com/v1_1/${RS_CLOUDINARY_CLOUD_NAME}/image/upload`;
  const form = new FormData();
  form.append("file", arquivo);
  form.append("upload_preset", RS_CLOUDINARY_UPLOAD_PRESET);

  const resp = await fetch(url, { method: "POST", body: form });
  if (!resp.ok) {
    const erro = await resp.json().catch(() => null);
    throw new Error((erro && erro.error && erro.error.message) || "Falha ao enviar a imagem.");
  }
  const dados = await resp.json();
  return { url: dados.secure_url, publicId: dados.public_id };
}

/* O atributo HTML "download" não funciona em links pra outro
   domínio (o navegador ignora e só abre a imagem) — o Cloudinary
   resolve isso com a flag "fl_attachment" na própria URL, que faz
   o servidor dele mandar o arquivo como download de verdade. */
export function urlComDownloadForcado(url) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", "/upload/fl_attachment/");
}
