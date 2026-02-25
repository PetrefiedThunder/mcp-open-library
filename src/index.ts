#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = "https://openlibrary.org";
const RATE_LIMIT_MS = 200;
let last = 0;

async function olFetch(url: string): Promise<any> {
  const now = Date.now(); if (now - last < RATE_LIMIT_MS) await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - (now - last)));
  last = Date.now();
  const res = await fetch(url, { headers: { "User-Agent": "mcp-open-library/1.0.0" } });
  if (!res.ok) throw new Error(`Open Library ${res.status}`);
  return res.json();
}

const server = new McpServer({ name: "mcp-open-library", version: "1.0.0" });

server.tool("search_books", "Search for books.", {
  query: z.string(), limit: z.number().min(1).max(100).default(10),
  sort: z.enum(["relevance", "new", "old", "rating", "editions"]).optional(),
}, async ({ query, limit, sort }) => {
  const p = new URLSearchParams({ q: query, limit: String(limit) });
  if (sort) p.set("sort", sort);
  const d = await olFetch(`${BASE}/search.json?${p}`);
  const books = d.docs?.map((b: any) => ({
    title: b.title, author: b.author_name?.join(", "), firstPublished: b.first_publish_year,
    isbn: b.isbn?.[0], subjects: b.subject?.slice(0, 5), editionCount: b.edition_count,
    key: b.key, coverUrl: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : null,
  }));
  return { content: [{ type: "text" as const, text: JSON.stringify({ total: d.numFound, books }, null, 2) }] };
});

server.tool("get_book", "Get book details by Open Library key or ISBN.", {
  key: z.string().describe("OL key (e.g. '/works/OL45883W') or ISBN"),
}, async ({ key }) => {
  const path = key.startsWith("/") ? key : `/isbn/${key}`;
  const d = await olFetch(`${BASE}${path}.json`);
  return { content: [{ type: "text" as const, text: JSON.stringify(d, null, 2) }] };
});

server.tool("search_authors", "Search for authors.", {
  query: z.string(), limit: z.number().min(1).max(100).default(10),
}, async ({ query, limit }) => {
  const d = await olFetch(`${BASE}/search/authors.json?q=${encodeURIComponent(query)}&limit=${limit}`);
  const authors = d.docs?.map((a: any) => ({
    name: a.name, key: a.key, workCount: a.work_count, topWork: a.top_work,
    birthDate: a.birth_date,
  }));
  return { content: [{ type: "text" as const, text: JSON.stringify({ total: d.numFound, authors }, null, 2) }] };
});

server.tool("get_author_works", "Get works by an author.", {
  authorKey: z.string().describe("Author key (e.g. 'OL23919A')"),
  limit: z.number().min(1).max(100).default(20),
}, async ({ authorKey, limit }) => {
  const d = await olFetch(`${BASE}/authors/${authorKey}/works.json?limit=${limit}`);
  const works = d.entries?.map((w: any) => ({
    title: w.title, key: w.key, firstPublished: w.first_publish_date,
  }));
  return { content: [{ type: "text" as const, text: JSON.stringify({ total: d.size, works }, null, 2) }] };
});

server.tool("get_trending", "Get trending/popular books.", {
  type: z.enum(["daily", "weekly", "monthly", "yearly"]).default("daily"),
  limit: z.number().min(1).max(50).default(10),
}, async ({ type, limit }) => {
  const d = await olFetch(`${BASE}/trending/${type}.json?limit=${limit}`);
  const books = d.works?.map((b: any) => ({
    title: b.title, author: b.author_name?.join(", "), key: b.key,
    coverUrl: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : null,
  }));
  return { content: [{ type: "text" as const, text: JSON.stringify(books, null, 2) }] };
});

async function main() { const t = new StdioServerTransport(); await server.connect(t); }
main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
