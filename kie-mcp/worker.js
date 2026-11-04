// Kie.ai Veo 3.1 — Claude için MCP sunucusu (Cloudflare Worker)
//
// Bu dosyanın tamamını Cloudflare Worker editörüne yapıştırın.
// Gerekli gizli değişkenler (Worker → Settings → Variables and Secrets):
//   KIE_API_KEY   : kie.ai API anahtarınız
//   ERISIM_KODU   : kendi uydurduğunuz uzun, rastgele bir kod (URL'de şifre gibi kullanılır)
//
// Claude'a eklenecek adres:  https://<worker-adınız>.<hesabınız>.workers.dev/mcp/<ERISIM_KODU>

const KIE_BASE = "https://api.kie.ai";
const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];

const TOOLS = [
  {
    name: "veo_video_uret",
    description:
      "Kie.ai üzerinden Google Veo 3.1 ile video üretimini başlatır. Hemen bir taskId döner; video birkaç dakika içinde hazır olur. " +
      "Sonucu almak için veo_durum_sorgula aracını taskId ile çağırın. Her çağrı kie.ai kredisi harcar.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Videoda ne olacağını anlatan metin (İngilizce genelde daha iyi sonuç verir)." },
        model: {
          type: "string",
          description: "Model: 'veo3_fast' (hızlı, ucuz, varsayılan) veya 'veo3' (kalite, pahalı).",
          default: "veo3_fast",
        },
        aspect_ratio: { type: "string", description: "En-boy oranı: '16:9', '9:16' veya 'Auto'.", default: "16:9" },
        image_urls: {
          type: "array",
          items: { type: "string" },
          description: "İsteğe bağlı: görüntüden videoya için herkese açık görsel URL'leri.",
        },
        generation_type: {
          type: "string",
          description:
            "İsteğe bağlı: 'TEXT_2_VIDEO', 'FIRST_AND_LAST_FRAMES_2_VIDEO' veya 'REFERENCE_2_VIDEO'. Boş bırakılırsa kie.ai otomatik seçer.",
        },
        seeds: { type: "integer", description: "İsteğe bağlı: tekrarlanabilir sonuç için tohum değeri." },
        watermark: { type: "string", description: "İsteğe bağlı: videoya eklenecek filigran metni." },
      },
      required: ["prompt"],
    },
  },
  {
    name: "veo_durum_sorgula",
    description:
      "Bir Veo görevinin durumunu sorgular. Hazırsa video bağlantılarını döner. Hâlâ üretiliyorsa 20-30 saniye sonra tekrar sorgulayın.",
    inputSchema: {
      type: "object",
      properties: { task_id: { type: "string", description: "veo_video_uret'in döndürdüğü taskId." } },
      required: ["task_id"],
    },
  },
  {
    name: "veo_1080p_al",
    description:
      "Tamamlanmış bir 16:9 videonun 1080p sürümünü ister. Video tamamlandıktan birkaç dakika sonra çağırın; hazır değilse sonra tekrar deneyin.",
    inputSchema: {
      type: "object",
      properties: { task_id: { type: "string", description: "Tamamlanmış görevin taskId'si." } },
      required: ["task_id"],
    },
  },
  {
    name: "kie_kredi_sorgula",
    description: "Kie.ai hesabındaki kalan kredi miktarını gösterir.",
    inputSchema: { type: "object", properties: {} },
  },
];

async function kie(env, method, path, body) {
  const res = await fetch(KIE_BASE + path, {
    method,
    headers: {
      Authorization: "Bearer " + env.KIE_API_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

const DURUMLAR = { 0: "Üretiliyor", 1: "Tamamlandı", 2: "Başarısız (oluşturma)", 3: "Başarısız (üretim)" };

async function callTool(name, args, env) {
  args = args || {};
  if (name === "veo_video_uret") {
    if (!args.prompt) throw new Error("prompt zorunlu.");
    const body = {
      prompt: args.prompt,
      model: args.model || "veo3_fast",
      aspect_ratio: args.aspect_ratio || "16:9",
      // Eski dokümanlarda alan adı camelCase geçiyor; ikisini birden gönderiyoruz.
      aspectRatio: args.aspect_ratio || "16:9",
      enableTranslation: true,
    };
    if (args.image_urls && args.image_urls.length) body.imageUrls = args.image_urls;
    if (args.generation_type) body.generationType = args.generation_type;
    if (args.seeds !== undefined) body.seeds = args.seeds;
    if (args.watermark) body.watermark = args.watermark;
    const r = await kie(env, "POST", "/api/v1/veo/generate", body);
    const taskId = r.data && r.data.data && r.data.data.taskId;
    if (taskId) {
      return `Video üretimi başladı.\ntaskId: ${taskId}\nBirkaç dakika sonra veo_durum_sorgula ile sonucu alın.`;
    }
    return `Kie.ai beklenmeyen yanıt verdi (HTTP ${r.status}):\n${JSON.stringify(r.data, null, 2)}`;
  }

  if (name === "veo_durum_sorgula") {
    if (!args.task_id) throw new Error("task_id zorunlu.");
    const r = await kie(env, "GET", "/api/v1/veo/record-info?taskId=" + encodeURIComponent(args.task_id));
    const d = r.data && r.data.data;
    if (d && d.successFlag !== undefined) {
      const urls = (d.response && (d.response.resultUrls || d.response.originUrls)) || [];
      let out = `Durum: ${DURUMLAR[d.successFlag] || d.successFlag}`;
      if (urls.length) out += `\nVideo bağlantıları:\n${urls.join("\n")}`;
      if (d.errorMessage) out += `\nHata: ${d.errorMessage}`;
      return out + `\n\nHam yanıt:\n${JSON.stringify(r.data, null, 2)}`;
    }
    return `Kie.ai yanıtı (HTTP ${r.status}):\n${JSON.stringify(r.data, null, 2)}`;
  }

  if (name === "veo_1080p_al") {
    if (!args.task_id) throw new Error("task_id zorunlu.");
    const r = await kie(env, "GET", "/api/v1/veo/get-1080p-video?taskId=" + encodeURIComponent(args.task_id));
    return `Kie.ai yanıtı (HTTP ${r.status}):\n${JSON.stringify(r.data, null, 2)}`;
  }

  if (name === "kie_kredi_sorgula") {
    const r = await kie(env, "GET", "/api/v1/chat/credit");
    return `Kie.ai yanıtı (HTTP ${r.status}):\n${JSON.stringify(r.data, null, 2)}`;
  }

  throw new Error("Bilinmeyen araç: " + name);
}

async function handleRpc(msg, env) {
  const { id, method, params } = msg;
  const ok = (result) => ({ jsonrpc: "2.0", id, result });
  const fail = (code, message) => ({ jsonrpc: "2.0", id, error: { code, message } });

  if (id === undefined || id === null) return null; // bildirim: yanıt yok

  switch (method) {
    case "initialize": {
      const asked = params && params.protocolVersion;
      return ok({
        protocolVersion: PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0],
        capabilities: { tools: {} },
        serverInfo: { name: "kie-veo", version: "1.0.0" },
        instructions:
          "Kie.ai Veo 3.1 video üretimi. Önce veo_video_uret ile görevi başlat, sonra veo_durum_sorgula ile sonucu al.",
      });
    }
    case "ping":
      return ok({});
    case "tools/list":
      return ok({ tools: TOOLS });
    case "tools/call":
      try {
        const text = await callTool(params && params.name, params && params.arguments, env);
        return ok({ content: [{ type: "text", text }] });
      } catch (e) {
        return ok({ content: [{ type: "text", text: "Hata: " + e.message }], isError: true });
      }
    default:
      return fail(-32601, "Desteklenmeyen metod: " + method);
  }
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...CORS } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

    if (!env.ERISIM_KODU || !env.KIE_API_KEY) {
      return new Response("Sunucu ayarlanmamış: KIE_API_KEY ve ERISIM_KODU gizli değişkenlerini ekleyin.", { status: 500 });
    }
    if (url.pathname !== "/mcp/" + env.ERISIM_KODU) {
      return new Response("Bulunamadı", { status: 404 });
    }
    if (request.method === "GET") {
      return new Response("Kie Veo MCP sunucusu çalışıyor.", { status: 405, headers: { Allow: "POST", ...CORS } });
    }
    if (request.method !== "POST") return new Response(null, { status: 405, headers: CORS });

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Geçersiz JSON" } }, 400);
    }

    if (Array.isArray(payload)) {
      const results = (await Promise.all(payload.map((m) => handleRpc(m, env)))).filter(Boolean);
      return results.length ? json(results) : new Response(null, { status: 202, headers: CORS });
    }
    const result = await handleRpc(payload, env);
    return result ? json(result) : new Response(null, { status: 202, headers: CORS });
  },
};
