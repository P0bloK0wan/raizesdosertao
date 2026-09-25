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

// O preset unsigned precisa permitir vídeos na conta Cloudinary.
export async function enviarVideoCloudinary(arquivo){
  if(!RS_CLOUDINARY_CLOUD_NAME || !RS_CLOUDINARY_UPLOAD_PRESET)throw new Error("Configure o Cloudinary antes de enviar vídeos.");
  if(!["video/mp4","video/webm","video/quicktime"].includes(arquivo.type))throw new Error("Use vídeos MP4, WebM ou MOV.");
  if(arquivo.size>50*1024*1024)throw new Error("O vídeo deve ter até 50 MB.");
  const form=new FormData();form.append("file",arquivo);form.append("upload_preset",RS_CLOUDINARY_UPLOAD_PRESET);
  const resp=await fetch("https://api.cloudinary.com/v1_1/"+encodeURIComponent(RS_CLOUDINARY_CLOUD_NAME)+"/video/upload",{method:"POST",body:form});
  if(!resp.ok){const err=await resp.json().catch(()=>null);throw new Error(err?.error?.message||"Falha ao enviar vídeo. Confira se o preset Cloudinary aceita vídeos.");}
  const data=await resp.json();return {url:data.secure_url,publicId:data.public_id};
}
