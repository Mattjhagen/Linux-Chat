import { marked } from 'marked';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Configure marked
marked.setOptions({
  gfm: true,
  breaks: true,
  sanitize: false, // We use DOMPurify for sanitization
  headerIds: false,
  mangle: false
});

const renderMarkdown = (content) => {
  if (!content) return '';
  const rawHtml = marked.parse(content);
  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel']
  });
};

export { renderMarkdown };
