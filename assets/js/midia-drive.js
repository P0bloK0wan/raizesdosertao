/* =========================================================
   Busca as fotos de uma pasta pública do Google Drive, direto no
   navegador do visitante, usando a Drive API v3.

   Exige uma chave de API (RS_GOOGLE_DRIVE_API_KEY em data.js) e
   que a pasta esteja compartilhada como "Qualquer pessoa com o
   link" — veja o README. Sem a chave configurada, ou se a busca
   falhar por qualquer motivo, devolve null (quem chamar mostra um
   link "Abrir no Drive" no lugar das fotos).
   ========================================================= */

import { RS_GOOGLE_DRIVE_API_KEY } from "./data.js";

/* O Drive devolve o thumbnail bem pequeno (~220px) por padrão;
   trocamos o tamanho pedido na própria URL do thumbnail. */
function ampliarMiniatura(thumbnailLink, tamanho = 800) {
  if (!thumbnailLink) return thumbnailLink;
  return thumbnailLink.replace(/=s\d+$/, `=s${tamanho}`);
}

export async function buscarFotosDaPasta(folderId) {
  if (!RS_GOOGLE_DRIVE_API_KEY || !folderId) return null;

  const params = new URLSearchParams({
    q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
    fields: "files(id,name,thumbnailLink)",
    pageSize: "50",
    key: RS_GOOGLE_DRIVE_API_KEY,
  });

  try {
    const resp = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`);
    if (!resp.ok) return null;
    const json = await resp.json();
    if (!Array.isArray(json.files)) return null;

    return json.files.map((f) => ({
      id: f.id,
      nome: f.name,
      miniatura: ampliarMiniatura(f.thumbnailLink, 800),
      visualizar: `https://drive.google.com/uc?export=view&id=${f.id}`,
      baixar: `https://drive.google.com/uc?export=download&id=${f.id}`,
    }));
  } catch {
    return null;
  }
}
