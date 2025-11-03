// Need to include "https://unpkg.com/showdown@2.1.0/dist/showdown.min.js" in the HTML file.

function MarkdownToHTMLString (markdown) {
    try {
        const converter = new showdown.Converter({ strikethrough: true });
        return converter.makeHtml(markdown);
    }
    catch (err) {
        return markdown;
    }
}

export default MarkdownToHTMLString;
export { MarkdownToHTMLString };