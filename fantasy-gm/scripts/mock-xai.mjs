/**
 * Stands in for api.x.ai so the UI can be demoed or debugged without a key.
 * Serves the Responses API's SSE shape, word by word, and varies the answer
 * based on whether the request asked for search tools.
 *
 *   pnpm mock:xai      # terminal 1
 *   pnpm dev:mock      # terminal 2
 */
import { createServer } from "node:http";

const ANSWER_WITH_SEARCH = [
  "**Start Jahmyr Gibbs.** He is the higher-floor and higher-ceiling play this week.\n\n",
  "- **Usage is trending his way.** Gibbs took 64% of the running back snaps last week and ",
  "led the backfield in red-zone carries 4 to 1. That split has held for three straight games.\n",
  "- **Matchup.** Detroit draws a defense allowing 4.9 yards per carry and the second-most ",
  "receiving yards to backs, which matters because Gibbs runs a route on 41% of his snaps.\n",
  "- **Game script.** Detroit is favored by 6.5, so the trailing team throws and Gibbs is the ",
  "one who catches passes in this backfield.\n\n",
  "The one thing that would change my mind: if Friday's practice report drops him to limited ",
  "with the shoulder. Watch that, then lock him in.",
];

const CITATIONS = [
  { url: "https://www.detroitlions.com/news/injury-report-week", title: "Official injury report" },
  { url: "https://x.com/beatreporter/status/1234567890", title: "Beat reporter on snap share" },
  { url: "https://www.pro-football-reference.com/teams/det/", title: "Team usage splits" },
];

const ANSWER_NO_SEARCH = [
  "**Start Jahmyr Gibbs** in a flex spot. Without live news to check, I am going on role: ",
  "he is the pass-catching back in a high-scoring offense, and receiving work is the most ",
  "stable source of PPR points week to week.\n\n",
  "Flip on Live Search if you want me to check this week's practice report before you set it.",
];

function sse(payload) {
  return `event: ${payload.type}\ndata: ${JSON.stringify(payload)}\n\n`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

createServer(async (req, res) => {
  if (!req.url?.endsWith("/responses") || req.method !== "POST") {
    res.writeHead(404).end();
    return;
  }

  const raw = await new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
  });
  const request = JSON.parse(raw);
  const liveSearch = Array.isArray(request.tools) && request.tools.length > 0;
  console.log(
    `[mock-xai] model=${request.model} liveSearch=${liveSearch} tools=${JSON.stringify(request.tools ?? [])}`,
  );

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  let sequence = 0;
  const send = (payload) => res.write(sse({ ...payload, sequence_number: sequence++ }));

  send({ type: "response.created" });

  if (liveSearch) {
    send({ type: "response.output_item.added", item: { type: "x_search_call" } });
    await sleep(900);
    send({ type: "response.output_item.added", item: { type: "web_search_call" } });
    await sleep(1200);
  }

  const chunks = liveSearch ? ANSWER_WITH_SEARCH : ANSWER_NO_SEARCH;
  for (const chunk of chunks) {
    for (const word of chunk.match(/\S+\s*/g) ?? []) {
      send({ type: "response.output_text.delta", delta: word });
      await sleep(28);
    }
  }

  if (liveSearch) {
    for (const citation of CITATIONS) {
      send({
        type: "response.output_text.annotation.added",
        annotation: { type: "url_citation", ...citation },
      });
    }
  }

  send({ type: "response.completed", response: { output: [] } });
  res.write("data: [DONE]\n\n");
  res.end();
}).listen(8787, "127.0.0.1", () => console.log("[mock-xai] listening on 8787"));
