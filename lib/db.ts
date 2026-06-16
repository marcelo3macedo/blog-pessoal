import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "blog.db");

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT 'indigo'
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      published_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      seo_title TEXT,
      seo_description TEXT,
      seo_keywords TEXT
    );

    CREATE TABLE IF NOT EXISTS post_tags (
      post_id INTEGER NOT NULL REFERENCES posts(id),
      tag_id  INTEGER NOT NULL REFERENCES tags(id),
      PRIMARY KEY (post_id, tag_id)
    );
  `);

  migrateSeoColumns(db);

  const count = (db.prepare("SELECT COUNT(*) as n FROM categories").get() as { n: number }).n;
  if (count === 0) seed(db);
}

// Adds SEO columns to databases created before they existed.
function migrateSeoColumns(db: Database.Database) {
  const columns = (db.prepare("PRAGMA table_info(posts)").all() as { name: string }[]).map(
    (c) => c.name
  );
  if (!columns.includes("seo_title")) db.exec("ALTER TABLE posts ADD COLUMN seo_title TEXT");
  if (!columns.includes("seo_description"))
    db.exec("ALTER TABLE posts ADD COLUMN seo_description TEXT");
  if (!columns.includes("seo_keywords"))
    db.exec("ALTER TABLE posts ADD COLUMN seo_keywords TEXT");
}

/* ── seed ──────────────────────────────────────────────────────────── */

const POST_SQLITE = `\
O SQLite tem uma reputação injusta de ser "apenas para desenvolvimento local". Em 2025, isso está muito longe da realidade.

![Diagrama de arquitetura SQLite](sqlite-architecture.png)

## O que mudou

Com o modo WAL (Write-Ahead Logging) e suporte a concorrência melhorado, o SQLite agora consegue lidar com centenas de leituras simultâneas sem engasgar. Projetos como **Litestream** permitem replicação contínua para S3, eliminando o argumento de "não tem backup".

## Exemplo com better-sqlite3

\`\`\`typescript
import Database from 'better-sqlite3'

const db = new Database('blog.db')
db.pragma('journal_mode = WAL')

const posts = db
  .prepare('SELECT * FROM posts ORDER BY published_at DESC LIMIT ?')
  .all(10)

console.log(posts)
\`\`\`

## Comparativo com outros bancos

| Banco      | Setup  | Concorrência | Tamanho    | Ideal para            |
|------------|--------|--------------|------------|-----------------------|
| SQLite     | Zero   | Leitura alta | < 1 TB     | Apps menores          |
| PostgreSQL | Alto   | Alta         | Ilimitado  | Produção em geral     |
| MySQL      | Médio  | Alta         | Ilimitado  | Apps web tradicionais |
| DynamoDB   | Zero   | Ilimitada    | Ilimitado  | Escala massiva        |

## Checklist antes de ir para produção

- [x] Modo WAL ativado (\`PRAGMA journal_mode = WAL\`)
- [x] Backup automatizado com Litestream
- [x] Monitoramento do tamanho do arquivo do banco
- [ ] Plano de migração para PostgreSQL se necessário

## Quando usar

- APIs com predominância de leitura
- Aplicações de uso pessoal ou de equipe pequena
- Prototipagem rápida que pode evoluir para produção

> O segredo é parar de tratar banco de dados como algo que precisa necessariamente ser um servidor separado. Para a maioria dos casos de uso, o SQLite é mais do que suficiente.
`;

const POST_NEXTJS = `\
Migrei meu blog pessoal para o App Router do Next.js há 6 meses e tenho opiniões formadas.

## O que é genuinamente melhor

**Server Components por padrão** é a mudança mais impactante. Buscar dados diretamente no componente, sem \`useEffect\`, sem estado de loading manual — é libertador.

\`\`\`tsx
// Pages Router (antes)
export async function getStaticProps() {
  const posts = await fetchPosts()
  return { props: { posts } }
}

// App Router (depois) — busca direto no componente
export default async function Page() {
  const posts = await fetchPosts()
  return <PostList posts={posts} />
}
\`\`\`

## O sistema de cache

O cache é poderoso mas confuso. Leva tempo para internalizar os modos.

| Estratégia             | Quando usar              | Gotcha principal              |
|------------------------|--------------------------|-------------------------------|
| \`cache: 'force-cache'\` | Dados estáticos          | Precisa revalidar manualmente |
| \`cache: 'no-store'\`    | Dados sempre frescos     | Sem cache, maior latência     |
| \`revalidate: 60\`       | Dados com TTL em segundos| Pode servir dado velho        |
| tags de cache          | Revalidação sob demanda  | Mais complexo de implementar  |

## Roteiro de migração

- [x] Criar diretório \`app/\` paralelo ao \`pages/\`
- [x] Migrar layouts compartilhados primeiro
- [x] Migrar páginas puramente estáticas
- [ ] Migrar páginas com busca de dados para Server Components
- [ ] Remover \`pages/\` quando tudo estiver migrado

## Conclusão

Vale a pena migrar se você está começando um projeto novo. Para projetos existentes, faça gradualmente — os dois roteadores coexistem sem problema.
`;

const POST_POMODORO = `\
Quando descobri o Método Pomodoro achei que tinha encontrado a fórmula mágica da produtividade. 25 minutos de foco, 5 de pausa, repetir.

## A fase de entusiasmo

Nos primeiros meses, fiz tudo certo. Timer físico na mesa, notificações bloqueadas, sessões anotadas num caderno. Minha produção aumentou visivelmente. Mas...

## O que começou a travar

Trabalho com código. Algumas tarefas entram em *flow* e interromper aos 25 minutos é doloroso — você perde o contexto, perde o raciocínio em andamento. O timer começou a parecer o inimigo, não o aliado.

Também percebi que 25 minutos é arbitrário. Para leitura profunda preciso de blocos maiores. Para e-mails, menores.

## O que uso hoje

Blocos de foco **variáveis**: entre 45 minutos e 90 minutos dependendo da tarefa. Pausa proporcional de 10-15 minutos. Registro simples no papel.

O princípio central sobreviveu: **intenção antes do bloco** e **pausa real** (longe da tela).

## Conclusão

O Pomodoro é uma ótima porta de entrada para trabalho focado. Mas adapte. O objetivo é foco, não obedecer um timer.
`;

const POST_CARREIRA = `\
Durante boa parte da minha carreira operei no modo "sim para tudo". Reunião? Tô dentro. Novo projeto paralelo? Claro. Revisar esse PR urgente? Sem problema.

## A ilusão do ocupado

Ocupado parece produtivo. Agenda cheia, Slack com badge vermelho, sempre respondendo alguém — dá uma sensação de importância e utilidade. O problema é que no final do dia você olha para o que avançou no que realmente importa e a resposta é: quase nada.

## O turning point

Num período particularmente caótico, listei tudo que estava fazendo. Eram 12 projetos "em andamento". Nenhum estava realmente andando. Tudo no limbo, tudo pela metade.

Decidi: **três projetos ativos por vez, máximo**. Qualquer coisa nova entra na lista de espera.

## Como dizer não sem parecer difícil

> "Adoraria ajudar, mas agora estou comprometido com X e Y. Posso entrar em [data futura], isso funciona para você?"

Na maioria das vezes funciona. E quando não funciona, você aprende rápido quem respeita seu tempo.

---

## O resultado

- Projetos terminados
- Qualidade de entrega maior
- Menos estresse
- Mais respeito — pessoas valorizam quem tem clareza sobre suas prioridades

Dizer não é uma habilidade. E como toda habilidade, fica mais fácil com prática.
`;

function seed(db: Database.Database) {
  const insertCategory = db.prepare(
    "INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)"
  );
  const insertTag = db.prepare(
    "INSERT INTO tags (name, slug, color) VALUES (?, ?, ?)"
  );
  const insertPost = db.prepare(
    "INSERT INTO posts (title, slug, excerpt, content, category_id, published_at) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const insertPostTag = db.prepare(
    "INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)"
  );

  db.transaction(() => {
    const techId = insertCategory.run("Tecnologia",         "tecnologia",         "Artigos sobre tecnologia e inovação").lastInsertRowid;
    const webId  = insertCategory.run("Desenvolvimento Web","desenvolvimento-web", "Dicas e tutoriais de dev web").lastInsertRowid;
    const vidaId = insertCategory.run("Vida Pessoal",       "vida-pessoal",        "Reflexões e experiências pessoais").lastInsertRowid;
    const prodId = insertCategory.run("Produtividade",      "produtividade",       "Como fazer mais com menos esforço").lastInsertRowid;

    const tSqlite = insertTag.run("SQLite",           "sqlite",            "amber").lastInsertRowid;
    const tDb     = insertTag.run("Banco de Dados",   "banco-de-dados",    "teal").lastInsertRowid;
    const tBack   = insertTag.run("Backend",          "backend",           "indigo").lastInsertRowid;
    const tNext   = insertTag.run("Next.js",          "nextjs",            "fuchsia").lastInsertRowid;
    const tReact  = insertTag.run("React",            "react",             "cyan").lastInsertRowid;
    const tSC     = insertTag.run("Server Components","server-components", "pink").lastInsertRowid;
    const tFoco   = insertTag.run("Foco",             "foco",              "lime").lastInsertRowid;
    const tTec    = insertTag.run("Técnicas",         "tecnicas",          "orange").lastInsertRowid;
    const tCar    = insertTag.run("Carreira",         "carreira",          "orange").lastInsertRowid;
    const tSoft   = insertTag.run("Soft Skills",      "soft-skills",       "teal").lastInsertRowid;
    const tMind   = insertTag.run("Mindset",          "mindset",           "fuchsia").lastInsertRowid;

    const p1 = insertPost.run(
      "Por que o SQLite é subestimado em 2025",
      "sqlite-subestimado-2025",
      "O SQLite tem evoluído silenciosamente e hoje suporta casos de uso que antes eram impensáveis para um banco embarcado.",
      POST_SQLITE, techId, "2025-03-10"
    ).lastInsertRowid;
    insertPostTag.run(p1, tSqlite);
    insertPostTag.run(p1, tDb);
    insertPostTag.run(p1, tBack);

    const p2 = insertPost.run(
      "Next.js App Router: o que aprendi depois de 6 meses",
      "nextjs-app-router-6-meses",
      "O App Router mudou a forma como penso em componentes React. Aqui estão os pontos que mais me surpreenderam.",
      POST_NEXTJS, webId, "2025-04-22"
    ).lastInsertRowid;
    insertPostTag.run(p2, tNext);
    insertPostTag.run(p2, tReact);
    insertPostTag.run(p2, tSC);

    const p3 = insertPost.run(
      "Método Pomodoro depois de 2 anos: o que ficou e o que abandonei",
      "pomodoro-2-anos",
      "Usei o Pomodoro rigidamente por um tempo, depois larguei tudo. Hoje tenho uma versão própria que realmente funciona para mim.",
      POST_POMODORO, prodId, "2025-05-15"
    ).lastInsertRowid;
    insertPostTag.run(p3, tFoco);
    insertPostTag.run(p3, tTec);

    const p4 = insertPost.run(
      "Aprender a dizer não foi a melhor coisa que fiz pela minha carreira",
      "aprender-dizer-nao-carreira",
      "Por anos aceitei tudo que chegava. Um dia percebi que estava ocupado mas não avançando. Mudar isso foi difícil e valeu muito.",
      POST_CARREIRA, vidaId, "2025-06-01"
    ).lastInsertRowid;
    insertPostTag.run(p4, tCar);
    insertPostTag.run(p4, tSoft);
    insertPostTag.run(p4, tMind);
  })();
}

/* ── types ──────────────────────────────────────────────────────────── */

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  published_at: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  tags: Tag[];
}

/* ── helpers ────────────────────────────────────────────────────────── */

function getTagsForPost(postId: number): Tag[] {
  return getDb()
    .prepare(
      `SELECT t.* FROM tags t
       JOIN post_tags pt ON t.id = pt.tag_id
       WHERE pt.post_id = ? ORDER BY t.name`
    )
    .all(postId) as Tag[];
}

function withTags(rows: Omit<Post, "tags">[]): Post[] {
  return rows.map((p) => ({ ...p, tags: getTagsForPost(p.id) }));
}

/* ── queries ────────────────────────────────────────────────────────── */

export function getAllCategories(): Category[] {
  return getDb().prepare("SELECT * FROM categories ORDER BY name").all() as Category[];
}

export function getCategoryBySlug(slug: string): Category | null {
  return (getDb().prepare("SELECT * FROM categories WHERE slug = ?").get(slug) as Category) ?? null;
}

export function getRecentPosts(limit = 10): Post[] {
  const rows = getDb()
    .prepare(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM posts p JOIN categories c ON p.category_id = c.id
       ORDER BY p.published_at DESC LIMIT ?`
    )
    .all(limit) as Omit<Post, "tags">[];
  return withTags(rows);
}

export function getPostsByCategory(categorySlug: string): Post[] {
  const rows = getDb()
    .prepare(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM posts p JOIN categories c ON p.category_id = c.id
       WHERE c.slug = ? ORDER BY p.published_at DESC`
    )
    .all(categorySlug) as Omit<Post, "tags">[];
  return withTags(rows);
}

export function getPostBySlug(slug: string): Post | null {
  const row = getDb()
    .prepare(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM posts p JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ?`
    )
    .get(slug) as Omit<Post, "tags"> | undefined;
  if (!row) return null;
  return { ...row, tags: getTagsForPost(row.id) };
}

export function getPostCountByCategory(): Record<string, number> {
  const rows = getDb()
    .prepare(
      `SELECT c.slug, COUNT(p.id) as count
       FROM categories c LEFT JOIN posts p ON p.category_id = c.id
       GROUP BY c.id`
    )
    .all() as { slug: string; count: number }[];
  return Object.fromEntries(rows.map((r) => [r.slug, r.count]));
}

/* ── write operations (used by upload API) ──────────────────────────── */

const TAG_COLORS = ["amber", "teal", "orange", "cyan", "lime", "pink", "fuchsia", "indigo"];

function colorFromSlug(slug: string): string {
  const hash = slug.split("").reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 0);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export function getOrCreateTag(name: string, slug: string): Tag {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM tags WHERE slug = ?").get(slug) as Tag | undefined;
  if (existing) return existing;
  db.prepare("INSERT INTO tags (name, slug, color) VALUES (?, ?, ?)").run(
    name,
    slug,
    colorFromSlug(slug)
  );
  return db.prepare("SELECT * FROM tags WHERE slug = ?").get(slug) as Tag;
}

export function setPostTags(postId: number, tagIds: number[]): void {
  const db = getDb();
  db.prepare("DELETE FROM post_tags WHERE post_id = ?").run(postId);
  const insert = db.prepare("INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)");
  for (const tagId of tagIds) insert.run(postId, tagId);
}

export function upsertPost(data: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category_id: number;
  published_at: string;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
}): { id: number; created: boolean } {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM posts WHERE slug = ?")
    .get(data.slug) as { id: number } | undefined;

  const seoTitle = data.seo_title ?? null;
  const seoDescription = data.seo_description ?? null;
  const seoKeywords = data.seo_keywords ?? null;

  if (existing) {
    db.prepare(
      `UPDATE posts SET title=?, excerpt=?, content=?, category_id=?, published_at=?,
       seo_title=?, seo_description=?, seo_keywords=?
       WHERE slug=?`
    ).run(
      data.title,
      data.excerpt,
      data.content,
      data.category_id,
      data.published_at,
      seoTitle,
      seoDescription,
      seoKeywords,
      data.slug
    );
    return { id: existing.id, created: false };
  }

  const result = db
    .prepare(
      `INSERT INTO posts (title, slug, excerpt, content, category_id, published_at, seo_title, seo_description, seo_keywords)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.title,
      data.slug,
      data.excerpt,
      data.content,
      data.category_id,
      data.published_at,
      seoTitle,
      seoDescription,
      seoKeywords
    );
  return { id: Number(result.lastInsertRowid), created: true };
}
