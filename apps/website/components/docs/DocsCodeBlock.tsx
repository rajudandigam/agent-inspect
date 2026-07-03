import { CodeBlock } from "@/components/shared/CodeBlock";

type DocsCodeBlockProps = {
  code: string;
  language?: string;
  filename?: string;
};

export function DocsCodeBlock({
  code,
  language = "bash",
  filename,
}: DocsCodeBlockProps) {
  return (
    <div className="my-6">
      <CodeBlock code={code} language={language} filename={filename} />
    </div>
  );
}
