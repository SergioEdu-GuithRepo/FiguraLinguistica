/** Verifica que todas as vozes do catálogo existem no serviço de voz neural. Uso: npm run tts:voices */
import { MsEdgeTTS } from "msedge-tts";
import { NEURAL_VOICES } from "@/lib/voices";

(async () => {
  const list = await new MsEdgeTTS().getVoices();
  const names = new Set(list.map((v) => v.ShortName));
  let missing = 0;
  for (const [lang, voices] of Object.entries(NEURAL_VOICES)) {
    for (const v of voices) {
      const ok = names.has(v.id);
      if (!ok) missing++;
      console.log(`${ok ? "✓" : "✗"} ${lang} ${v.id}`);
    }
  }
  console.log(missing ? `\n${missing} voz(es) em falta` : "\nTodas as vozes disponíveis.");
  process.exit(missing ? 1 : 0);
})();
