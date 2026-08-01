import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Copy, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EXAMPLE_BACKUP_JSON } from "@/lib/backup-example";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/import-guide")({
  component: ImportGuidePage,
  head: () => ({
    meta: [{ title: "Import file format | Habits" }, { name: "robots", content: "noindex" }],
  }),
});

type FieldDef = {
  name: string;
  type: string;
  required: boolean;
  desc: string;
};

const TOP_LEVEL: FieldDef[] = [
  { name: "version", type: "1", required: true, desc: "Format version. Must be exactly the number 1." },
  { name: "exportedAt", type: "string", required: false, desc: "ISO 8601 timestamp. Informational only." },
  { name: "categories", type: "array", required: false, desc: "Your habit categories. Defaults to []." },
  { name: "habits", type: "array", required: false, desc: "Your habits. Defaults to []." },
  { name: "completions", type: "array", required: false, desc: "Which habit was done on which day. Defaults to []." },
  { name: "todos", type: "array", required: false, desc: "Your one-off tasks. Defaults to []." },
];

const CATEGORY_FIELDS: FieldDef[] = [
  { name: "id", type: "uuid", required: true, desc: "Unique identifier." },
  { name: "name", type: "string", required: true, desc: "Category name. Habits reference categories by this name." },
  { name: "colorHex", type: "string | null", required: false, desc: "Hex color like #22c55e." },
  { name: "sortOrder", type: "number", required: false, desc: "Display order. Defaults to 0." },
  { name: "isDefault", type: "boolean", required: false, desc: "Whether it's a built-in category. Defaults to false." },
];

const HABIT_FIELDS: FieldDef[] = [
  { name: "id", type: "uuid", required: true, desc: "Unique identifier. Completions link to this." },
  { name: "name", type: "string", required: true, desc: "Habit name." },
  { name: "description", type: "string | null", required: false, desc: "Optional notes." },
  { name: "category", type: "string", required: false, desc: "Matches a category name. Defaults to empty." },
  { name: "colorHex", type: "string | null", required: false, desc: "Hex color." },
  { name: "icon", type: "string | null", required: false, desc: "Emoji or short icon string." },
  { name: "frequency", type: '"daily" | "custom"', required: false, desc: 'How often. Defaults to "daily".' },
  {
    name: "frequencyConfig",
    type: "object | null",
    required: false,
    desc: 'Required when custom. Either { "type": "weekly_count", "count": 1-7 } or { "type": "specific_days", "days": [0-6] } (0 = Sunday).',
  },
  { name: "sortOrder", type: "number", required: false, desc: "Display order. Defaults to 0." },
  { name: "isArchived", type: "boolean", required: false, desc: "Archived habits are hidden. Defaults to false." },
];

const COMPLETION_FIELDS: FieldDef[] = [
  { name: "habitId", type: "uuid", required: true, desc: "The id of a habit in this same file." },
  { name: "completedDate", type: "string", required: true, desc: "Date only, YYYY-MM-DD (no time)." },
];

const TODO_FIELDS: FieldDef[] = [
  { name: "id", type: "uuid", required: true, desc: "Unique identifier." },
  { name: "title", type: "string", required: true, desc: "Task text." },
  { name: "completed", type: "boolean", required: false, desc: "Defaults to false." },
  { name: "sortOrder", type: "number", required: false, desc: "Display order. Defaults to 0." },
];

function FieldTable({ fields }: { fields: FieldDef[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-gray-400">
            <th className="px-3 py-2 font-medium">Field</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Required</th>
            <th className="px-3 py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f.name} className="border-b border-zinc-900 last:border-0 align-top">
              <td className="px-3 py-2 font-mono text-blue-400 whitespace-nowrap">{f.name}</td>
              <td className="px-3 py-2 font-mono text-gray-300 whitespace-nowrap">{f.type}</td>
              <td className="px-3 py-2">
                {f.required ? <span className="text-amber-400">yes</span> : <span className="text-gray-500">no</span>}
              </td>
              <td className="px-3 py-2 text-gray-300">{f.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 id={id} className="text-lg sm:text-xl font-semibold text-white scroll-mt-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ImportGuidePage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(EXAMPLE_BACKUP_JSON);
      setCopied(true);
      toast.success("Example copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([EXAMPLE_BACKUP_JSON], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "habits-backup-example.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-black text-white">
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 min-h-0">
        <div className="shrink-0 px-3 sm:px-6 pt-4 sm:pt-8 pb-4">
          <Link
            to="/dashboard"
            search={{ week: undefined }}
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="mt-3 text-2xl sm:text-4xl font-bold">Import file format</h1>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-6 pb-8 space-y-8">
          <Section id="overview" title="What is a backup file?">
            <div className="space-y-3 text-gray-300 text-sm sm:text-base leading-relaxed">
              <p>
                A backup is a single <span className="font-mono text-blue-400">.json</span> file holding your
                categories, habits, completion history, and tasks. The easiest way to get a valid one is to open the
                profile menu and choose <span className="font-medium text-white">Export data</span> — importing that
                file back is always safe.
              </p>
              <p>
                Import is <span className="font-medium text-white">additive and non-destructive</span>. Nothing you
                already have is deleted or overwritten. Anything already present is skipped, so importing the same file
                twice does not create duplicates. Categories are matched by their{" "}
                <span className="font-mono">name</span>, while habits, completions, and tasks are matched by their
                identifiers.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download example file
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-gray-200 hover:bg-zinc-700 transition-colors"
              >
                <Copy className="w-4 h-4" />
                {copied ? "Copied" : "Copy example"}
              </button>
            </div>
          </Section>

          <Section id="structure" title="Top-level structure">
            <p className="text-gray-300 text-sm sm:text-base">
              The file is a JSON object. Only <span className="font-mono text-blue-400">version</span> is required —
              every array is optional and defaults to empty, so you can import just habits, just tasks, and so on.
            </p>
            <FieldTable fields={TOP_LEVEL} />
          </Section>

          <Section id="categories" title="categories[]">
            <FieldTable fields={CATEGORY_FIELDS} />
          </Section>

          <Section id="habits" title="habits[]">
            <FieldTable fields={HABIT_FIELDS} />
          </Section>

          <Section id="completions" title="completions[]">
            <p className="text-gray-300 text-sm sm:text-base">
              Each entry marks one habit as done on one day. A completion whose{" "}
              <span className="font-mono text-blue-400">habitId</span> doesn't match any habit in the file is ignored.
            </p>
            <FieldTable fields={COMPLETION_FIELDS} />
          </Section>

          <Section id="todos" title="todos[]">
            <FieldTable fields={TODO_FIELDS} />
          </Section>

          <Section id="example" title="Complete example">
            <p className="text-gray-300 text-sm sm:text-base">
              A minimal but valid file with one category, two habits (one daily, one 3×/week), a few completions, and a
              task:
            </p>
            <pre
              className={cn(
                "overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4",
                "text-xs sm:text-sm font-mono text-gray-200 leading-relaxed",
              )}
            >
              <code>{EXAMPLE_BACKUP_JSON}</code>
            </pre>
          </Section>

          <Section id="rules" title="Validation rules">
            <ul className="list-disc space-y-2 pl-5 text-gray-300 text-sm sm:text-base">
              <li>
                The file must be valid JSON with <span className="font-mono text-blue-400">version</span> set to the
                number <span className="font-mono">1</span>. Any other value is rejected.
              </li>
              <li>
                All <span className="font-mono">id</span> and <span className="font-mono">habitId</span> values must be
                UUIDs.
              </li>
              <li>
                <span className="font-mono text-blue-400">completedDate</span> must be a date only, formatted{" "}
                <span className="font-mono">YYYY-MM-DD</span> — no time component.
              </li>
              <li>
                When a habit's <span className="font-mono">frequency</span> is{" "}
                <span className="font-mono">"custom"</span>, its <span className="font-mono">frequencyConfig</span> must
                be one of the two shapes shown above.
              </li>
              <li>If any entry fails validation, the whole import is rejected and nothing is changed.</li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
