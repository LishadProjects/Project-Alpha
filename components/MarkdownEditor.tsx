import React, { useState, useRef, useMemo } from 'react';
import { 
    BoldIcon, ItalicIcon, StrikethroughIcon, 
    LinkIcon, HeadingIcon, QuoteIcon, 
    ListIcon, ListOrderedIcon, CheckSquareIcon,
    EyeIcon, CodeIcon, CheckIcon, ClipboardCheckIcon
} from './icons';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

const ToolbarButton: React.FC<{ onClick: () => void; title: string; children: React.ReactNode }> = ({ onClick, title, children }) => (
    <button type="button" onClick={onClick} className="p-1.5 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600" title={title}>
        {children}
    </button>
);

const MarkdownPreview: React.FC<{ markdown: string, onToggleCheckbox: (lineIndex: number) => void }> = ({ markdown, onToggleCheckbox }) => {
    
    const CodeBlock = ({ lang, code }: { lang: string, code: string }) => {
        const [copied, setCopied] = useState(false);
        const handleCopy = () => {
            navigator.clipboard.writeText(code).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        };

        return (
            <div className="bg-gray-200 dark:bg-gray-900 rounded-lg my-4 overflow-hidden relative group">
                <div className="flex justify-between items-center px-4 py-1.5 bg-gray-300/50 dark:bg-gray-700/50 text-xs border-b border-gray-300 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400 font-sans font-semibold">{lang || 'code'}</span>
                    <button 
                        onClick={handleCopy} 
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-sans font-medium flex items-center gap-1.5"
                    >
                        {copied ? (
                            <>
                                <CheckIcon className="w-4 h-4 text-green-500" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <ClipboardCheckIcon className="w-4 h-4" />
                                Copy
                            </>
                        )}
                    </button>
                </div>
                <pre className="p-4 overflow-x-auto text-sm">
                    <code className={`language-${lang}`}>{code}</code>
                </pre>
            </div>
        );
    };

    const parseInline = (text: string) => {
        let processedText = text;

        const escapeAttr = (s: string) => s.replace(/"/g, '&quot;');

        // Images: ![alt](src)
        processedText = processedText.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
            const sanitizedSrc = String(src).trim();
            if (/^javascript:/i.test(sanitizedSrc) || !/^(https?:\/\/|\/|data:image)/i.test(sanitizedSrc)) {
                return `<span>(Image source blocked)</span>`;
            }
            return `<img src="${escapeAttr(sanitizedSrc)}" alt="${escapeAttr(alt)}" class="max-w-full my-2 rounded-md shadow-md border border-gray-200 dark:border-gray-700" />`;
        });
        
        // Links: [text](url)
        processedText = processedText.replace(/\[(.*?)\]\((.*?)\)/g, (match, linkText, url) => {
            const sanitizedUrl = String(url).trim();
            if (/^javascript:/i.test(sanitizedUrl) || !/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(sanitizedUrl)) {
                return linkText; // Return just the text if URL is unsafe
            }
            return `<a href="${escapeAttr(sanitizedUrl)}" target="_blank" rel="noopener noreferrer" class="text-primary-500 hover:underline">${linkText}</a>`;
        });

        // Bold: **text** or __text__
        processedText = processedText.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');
        // Italic: *text* or _text_
        processedText = processedText.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');
        // Strikethrough: ~~text~~
        processedText = processedText.replace(/~~(.*?)~~/g, '<del>$1</del>');
        // Inline code: `code`
        processedText = processedText.replace(/`(.*?)`/g, '<code class="bg-gray-200 dark:bg-gray-700 rounded px-1.5 py-0.5 text-sm font-mono text-red-500 dark:text-red-400">$1</code>');
        return <span dangerouslySetInnerHTML={{ __html: processedText }} />;
    };

    const renderableBlocks = useMemo(() => {
        const blocks: React.ReactNode[] = [];
        if (!markdown) return blocks;

        const lines = markdown.split('\n');
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];

            // Headings
            const headingMatch = line.match(/^(#+) (.*)/);
            if (headingMatch) {
                const level = headingMatch[1].length;
                const content = parseInline(headingMatch[2]);
                if (level === 1) blocks.push(<h1 key={i} className="text-3xl font-bold mt-6 mb-3 pb-2 border-b border-gray-300 dark:border-gray-600">{content}</h1>);
                else if (level === 2) blocks.push(<h2 key={i} className="text-2xl font-bold mt-5 mb-2 pb-1 border-b border-gray-300 dark:border-gray-600">{content}</h2>);
                else if (level === 3) blocks.push(<h3 key={i} className="text-xl font-bold mt-4 mb-2">{content}</h3>);
                else blocks.push(<h4 key={i} className="text-lg font-bold mt-3 mb-1">{content}</h4>);
                i++;
                continue;
            }

            // Horizontal Rule
            if (line.match(/^(\*\*\*|---|___)$/)) {
                blocks.push(<hr key={i} className="my-6 border-gray-300 dark:border-gray-600" />);
                i++;
                continue;
            }
            
            // Tables
            const isTableLine = (l: string) => l.trim().startsWith('|') && l.trim().endsWith('|');
            const isSeparatorLine = (l: string) => /^\s*\|? *[:-]+ *\|?/.test(l);
            if (i + 1 < lines.length && isTableLine(lines[i]) && isSeparatorLine(lines[i + 1])) {
                const headerCells = lines[i].split('|').slice(1, -1).map(h => h.trim());
                const bodyRows = [];
                let tableIndex = i;
                i += 2; // Move past header and separator
                
                while(i < lines.length && isTableLine(lines[i])) {
                    const rowCells = lines[i].split('|').slice(1, -1).map(c => c.trim());
                    bodyRows.push(rowCells);
                    i++;
                }

                blocks.push(
                    <div key={tableIndex} className="my-4 overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-700/50">
                                    {headerCells.map((header, index) => (
                                        <th key={index} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold">{parseInline(header)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {bodyRows.map((row, rowIndex) => (
                                    <tr key={rowIndex} className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                        {row.map((cell, cellIndex) => (
                                            <td key={cellIndex} className="border border-gray-300 dark:border-gray-600 px-4 py-2">{parseInline(cell)}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
                continue;
            }


            // Code Blocks
            const codeBlockMatch = line.match(/^```(.*)/);
            if (codeBlockMatch) {
                const lang = codeBlockMatch[1];
                const codeLines = [];
                i++;
                while (i < lines.length && !lines[i].startsWith('```')) {
                    codeLines.push(lines[i]);
                    i++;
                }
                blocks.push(<CodeBlock key={i} lang={lang} code={codeLines.join('\n')} />);
                i++; // skip the closing ```
                continue;
            }

            // Blockquotes
            if (line.startsWith('>')) {
                const quoteLines = [];
                while (i < lines.length && lines[i].startsWith('>')) {
                    quoteLines.push(lines[i].substring(1).trim());
                    i++;
                }
                blocks.push(
                    <blockquote key={i} className="border-l-4 border-primary-500/50 bg-gray-100 dark:bg-gray-800/50 pl-4 my-4 italic text-gray-600 dark:text-gray-400 p-4 rounded-r-md">
                        {quoteLines.map((qline, qindex) => <p key={qindex} className="my-0">{parseInline(qline)}</p>)}
                    </blockquote>
                );
                continue;
            }

            // Lists (combining all list types)
            if (line.match(/^(\s*)(\*|-|\d+\.) /) || line.match(/^(\s*)- \[( |x|X)]/)) {
                const listBlock: { line: string, index: number }[] = [];
                while (i < lines.length && (lines[i].match(/^(\s*)(\*|-|\d+\.) /) || lines[i].match(/^(\s*)- \[( |x|X)]/) || lines[i].trim() === '')) {
                     if (lines[i].trim() === '' && (i+1 < lines.length) && !(lines[i+1].match(/^(\s*)(\*|-|\d+\.) /) || lines[i+1].match(/^(\s*)- \[( |x|X)]/))) {
                        // it's a blank line that separates from non-list content. break the list.
                        break;
                    }
                    listBlock.push({ line: lines[i], index: i });
                    i++;
                }

                const firstLine = listBlock.find(l => l.line.trim() !== '')?.line || '';
                const isOrdered = /^\s*\d+\./.test(firstLine);
                const ListTag = isOrdered ? 'ol' : 'ul';
                const listClass = isOrdered ? 'list-decimal list-inside' : 'ul-disc list-inside';

                blocks.push(
                    <ListTag key={i} className={`${listClass} my-2 pl-4 space-y-1`}>
                        {listBlock.map((item) => {
                            if (item.line.trim() === '') return null; // Ignore blank lines within list

                            const clMatch = item.line.match(/^(\s*)- \[([xX ])] (.*)/);
                            if (clMatch) {
                                const isChecked = clMatch[2].toLowerCase() === 'x';
                                const text = clMatch[3];
                                return (
                                    <li key={item.index} className="flex items-center gap-2 my-1 list-none -ml-4">
                                        <input type="checkbox" checked={isChecked} onChange={() => onToggleCheckbox(item.index)} className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500 cursor-pointer" />
                                        <span className={`flex-1 ${isChecked ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>{parseInline(text)}</span>
                                    </li>
                                );
                            }
                            
                            const content = item.line.replace(/^(\s*)(\*|-|\d+\.) /, '');
                            return <li key={item.index} className="pl-2">{parseInline(content)}</li>
                        })}
                    </ListTag>
                );
                continue;
            }

            // Paragraph
            if (line.trim() !== '') {
                 const paraLines = [line];
                 i++;
                 while(i < lines.length && lines[i].trim() !== '' && !/^(#|`{3}|>|---|\* | - |\d+\.|\s*\|.*\|)/.test(lines[i])) {
                     paraLines.push(lines[i]);
                     i++;
                 }
                blocks.push(<p key={i-1}>{parseInline(paraLines.join(' '))}</p>); // Join lines into a single paragraph
                continue;
            }

            i++; // Move past blank lines
        }

        return blocks;
    }, [markdown, onToggleCheckbox]);

    return (
        <div className="prose prose-sm dark:prose-invert max-w-none p-3 h-full overflow-y-auto">
            {renderableBlocks}
        </div>
    );
};


export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange, placeholder, rows = 5 }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPreview, setIsPreview] = useState(false);

  const applyInlineFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = `${value.substring(0, start)}${prefix}${selectedText}${suffix}${value.substring(end)}`;
    
    onChange(newText);
    
    setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = start + prefix.length;
        textarea.selectionEnd = end + prefix.length;
    }, 0);
  };
  
  const applyBlockFormatting = (prefixFn: (index: number) => string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const firstLineStart = value.lastIndexOf('\n', start - 1) + 1;
    let lastLineEnd = value.indexOf('\n', end);
    if (lastLineEnd === -1) lastLineEnd = value.length;
    
    const textToModify = value.substring(firstLineStart, lastLineEnd);
    const lines = textToModify.split('\n');

    const newLines = lines.map((line, index) => {
        if (line.trim() === '' && lines.length > 1) return line;
        return `${prefixFn(index)} ${line}`;
    });

    const newText = `${value.substring(0, firstLineStart)}${newLines.join('\n')}${value.substring(lastLineEnd)}`;
    onChange(newText);
    
    setTimeout(() => { textarea.focus(); }, 0);
  };
  
  const insertLink = () => {
    const url = prompt("Enter the URL:");
    if (!url || !url.trim()) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || "link text";
    const newText = `${value.substring(0, start)}[${selectedText}](${url})${value.substring(end)}`;

    onChange(newText);
  };
  
  const handleToggleCheckbox = (lineIndex: number) => {
      const lines = value.split('\n');
      const line = lines[lineIndex];
      // This regex will find a task list item, checked or unchecked, and capture its parts.
      // It allows for various amounts of whitespace and list markers (*, -, +).
      const match = line.match(/^(\s*(?:-|\+|\*)\s*\[)([^\]]*)(\].*)$/);

      if (match) {
          const prefix = match[1]; // e.g., "  - ["
          const content = match[2]; // " " or "x" or "X"
          const suffix = match[3]; // e.g., "] My task"

          const isChecked = content.trim().toLowerCase() === 'x';
          
          const newContent = isChecked ? ' ' : 'x';
          
          lines[lineIndex] = `${prefix}${newContent}${suffix}`;
          onChange(lines.join('\n'));
      }
  };


  return (
    <div className="rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-primary-500 transition-all h-full flex flex-col">
      <div className="p-1 border-b border-gray-200 dark:border-gray-600 flex items-center flex-wrap gap-x-1">
        <ToolbarButton onClick={() => setIsPreview(p => !p)} title={isPreview ? 'Edit' : 'Preview'}>
            {isPreview ? <CodeIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
        </ToolbarButton>
        <div className="h-5 w-px bg-gray-200 dark:bg-gray-600 mx-1"></div>
        <ToolbarButton onClick={() => applyBlockFormatting(() => '##')} title="Heading"><HeadingIcon className="w-4 h-4" /></ToolbarButton>
        <div className="h-5 w-px bg-gray-200 dark:bg-gray-600 mx-1"></div>
        <ToolbarButton onClick={() => applyInlineFormatting('**')} title="Bold"><BoldIcon className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => applyInlineFormatting('*')} title="Italic"><ItalicIcon className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => applyInlineFormatting('~~')} title="Strikethrough"><StrikethroughIcon className="w-4 h-4" /></ToolbarButton>
        <div className="h-5 w-px bg-gray-200 dark:bg-gray-600 mx-1"></div>
        <ToolbarButton onClick={() => applyBlockFormatting(() => '>')} title="Blockquote"><QuoteIcon className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={insertLink} title="Link"><LinkIcon className="w-4 h-4" /></ToolbarButton>
        <div className="h-5 w-px bg-gray-200 dark:bg-gray-600 mx-1"></div>
        <ToolbarButton onClick={() => applyBlockFormatting(() => '-')} title="Bulleted List"><ListIcon className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => applyBlockFormatting((i) => `${i + 1}.`)} title="Numbered List"><ListOrderedIcon className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => applyBlockFormatting(() => '- [ ]')} title="Checklist"><CheckSquareIcon className="w-4 h-4" /></ToolbarButton>
      </div>
      {isPreview ? (
        <div className="flex-1 overflow-y-auto">
            <MarkdownPreview markdown={value} onToggleCheckbox={handleToggleCheckbox} />
        </div>
      ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-3 bg-transparent focus:outline-none resize-y flex-1"
            rows={rows}
          />
      )}
    </div>
  );
};