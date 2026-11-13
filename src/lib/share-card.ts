"use client";

/**
 * Gerador de Cartão Visual Partilhável (PNG 1080×1350 — formato ideal para WhatsApp Status e Instagram).
 * Usa Web Share API Level 2 (`navigator.share({ files })`) em telemóveis e descarregamento directo em PC.
 */

export interface ShareCardParams {
  studentName: string;
  langName: string;
  langFlag: string;
  badge: string; // ex.: "CERTIFICADO A1.1" ou "UNIDADE CONCLUÍDA"
  title: string; // ex.: "Etapa 1 · Sobrevivência" ou "No café"
  subtitle: string; // ex.: "9 unidades concluídas com competência real"
  xp: number;
  streak: number;
  code?: string;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function renderShareCardBlob(p: ShareCardParams): Promise<Blob | null> {
  if (typeof document === "undefined") return null;
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Fundo gradiente editorial (Coral -> Pêssego -> Azul gelo)
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0F2038");
  bg.addColorStop(0.52, "#193358");
  bg.addColorStop(1, "#264773");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Círculos decorativos luminosos
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#E8735A";
  ctx.beginPath();
  ctx.arc(W - 120, 160, 320, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#86C5BD";
  ctx.beginPath();
  ctx.arc(130, H - 140, 290, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Cartão central claro
  const cx = 76;
  const cy = 110;
  const cw = W - cx * 2;
  const ch = H - cy * 2;
  roundRect(ctx, cx, cy, cw, ch, 56);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();

  // Faixa superior Coral dentro do cartão
  ctx.save();
  roundRect(ctx, cx, cy, cw, 290, 56);
  ctx.clip();
  const topGrad = ctx.createLinearGradient(cx, cy, cx + cw, cy + 290);
  topGrad.addColorStop(0, "#E8735A");
  topGrad.addColorStop(1, "#F08C73");
  ctx.fillStyle = topGrad;
  ctx.fillRect(cx, cy, cw, 290);
  ctx.restore();

  // Marca FiguraLinguística no topo
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "800 32px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("FiguraLinguística", cx + 64, cy + 82);

  // Selo do idioma à direita
  ctx.textAlign = "right";
  ctx.font = "700 32px system-ui, -apple-system, sans-serif";
  ctx.fillText(`${p.langFlag} ${p.langName}`, cx + cw - 64, cy + 82);

  // Badge de Conquista
  ctx.textAlign = "left";
  roundRect(ctx, cx + 64, cy + 125, Math.min(cw - 128, ctx.measureText(p.badge).width + 86), 58, 29);
  ctx.fillStyle = "rgba(255,255,255,0.24)";
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 26px system-ui, -apple-system, sans-serif";
  ctx.fillText(`🎓 ${p.badge.toUpperCase()}`, cx + 92, cy + 163);

  // Medalha central flutuante
  ctx.save();
  ctx.beginPath();
  ctx.arc(W / 2, cy + 290, 74, 0, Math.PI * 2);
  ctx.fillStyle = "#FCF3D6";
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#FFFFFF";
  ctx.stroke();
  ctx.restore();
  ctx.textAlign = "center";
  ctx.font = "76px system-ui, -apple-system, sans-serif";
  ctx.fillText("🏅", W / 2, cy + 316);

  // Nome do aluno
  ctx.fillStyle = "#7D8BA1";
  ctx.font = "700 28px system-ui, -apple-system, sans-serif";
  ctx.fillText("CONQUISTA DE", W / 2, cy + 430);

  ctx.fillStyle = "#0F2038";
  ctx.font = "900 58px system-ui, -apple-system, sans-serif";
  const safeName = p.studentName.length > 24 ? `${p.studentName.slice(0, 23)}…` : p.studentName;
  ctx.fillText(safeName, W / 2, cy + 502);

  // Título da Etapa / Unidade
  ctx.fillStyle = "#E8735A";
  ctx.font = "800 44px system-ui, -apple-system, sans-serif";
  const titleLines = wrapText(ctx, p.title, cw - 140).slice(0, 2);
  let yCursor = cy + 585;
  for (const line of titleLines) {
    ctx.fillText(line, W / 2, yCursor);
    yCursor += 54;
  }

  // Subtítulo
  ctx.fillStyle = "#5B6B82";
  ctx.font = "600 30px system-ui, -apple-system, sans-serif";
  const subLines = wrapText(ctx, p.subtitle, cw - 150).slice(0, 3);
  yCursor += 14;
  for (const line of subLines) {
    ctx.fillText(line, W / 2, yCursor);
    yCursor += 42;
  }

  // Estatísticas (XP + Sequência)
  const statY = cy + ch - 275;
  const boxW = (cw - 160) / 2;

  roundRect(ctx, cx + 64, statY, boxW, 130, 30);
  ctx.fillStyle = "#F2F6FA";
  ctx.fill();
  ctx.fillStyle = "#0F2038";
  ctx.font = "900 42px system-ui, -apple-system, sans-serif";
  ctx.fillText(`✨ ${p.xp} XP`, cx + 64 + boxW / 2, statY + 64);
  ctx.fillStyle = "#7D8BA1";
  ctx.font = "700 24px system-ui, -apple-system, sans-serif";
  ctx.fillText(`em ${p.langName}`, cx + 64 + boxW / 2, statY + 102);

  roundRect(ctx, cx + 96 + boxW, statY, boxW, 130, 30);
  ctx.fillStyle = "#FBE3DC";
  ctx.fill();
  ctx.fillStyle = "#E8735A";
  ctx.font = "900 42px system-ui, -apple-system, sans-serif";
  ctx.fillText(`🔥 ${p.streak} ${p.streak === 1 ? "dia" : "dias"}`, cx + 96 + boxW + boxW / 2, statY + 64);
  ctx.fillStyle = "#A34835";
  ctx.font = "700 24px system-ui, -apple-system, sans-serif";
  ctx.fillText("sequência activa", cx + 96 + boxW + boxW / 2, statY + 102);

  // Rodapé com código e link
  const dateStr = new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
  ctx.fillStyle = "#7D8BA1";
  ctx.font = "700 24px ui-monospace, monospace";
  ctx.fillText(
    p.code ? `${p.code} · ${dateStr}` : `Emitido em ${dateStr}`,
    W / 2,
    cy + ch - 84,
  );
  ctx.fillStyle = "#0F2038";
  ctx.font = "800 25px system-ui, -apple-system, sans-serif";
  ctx.fillText("figura-linguistica.vercel.app · Inglês · Francês · Japonês", W / 2, cy + ch - 42);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.95);
  });
}

export async function shareAchievementCard(p: ShareCardParams): Promise<"shared" | "downloaded" | "copied"> {
  const shareText = `🎓 ${p.studentName} conquistou «${p.title}» em ${p.langFlag} ${p.langName} na FiguraLinguística! (${p.xp} XP)\nExperimenta em: https://figura-linguistica.vercel.app`;
  const blob = await renderShareCardBlob(p);

  if (blob && typeof File !== "undefined") {
    const safeSlug = (p.code || p.title).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const file = new File([blob], `figuralinguistica-${safeSlug}.png`, { type: "image/png" });
    if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: "Conquista FiguraLinguística",
          text: shareText,
          files: [file],
        });
        return "shared";
      } catch (e) {
        if ((e as DOMException)?.name === "AbortError") return "shared";
      }
    }

    // Em PC ou navegador sem partilha de ficheiros: descarrega o PNG + copia legenda
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareText).catch(() => undefined);
    }
    return "downloaded";
  }

  if (typeof navigator !== "undefined" && navigator.share) {
    await navigator.share({ title: "Conquista FiguraLinguística", text: shareText }).catch(() => undefined);
    return "shared";
  }
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(shareText).catch(() => undefined);
  }
  return "copied";
}
