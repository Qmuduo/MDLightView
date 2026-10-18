import MarkdownIt from 'markdown-it';
import { palettes } from '../../theme/colors';

export type Heading = { id: string; level: number; title: string };

export function renderMarkdown(source: string): { html: string; headings: Heading[] } {
  const md = new MarkdownIt({ html: false, linkify: false, typographer: false });
  md.renderer.rules.image = (tokens, index) => `<span class="image-placeholder">[图片：${md.utils.escapeHtml(tokens[index].content || '无说明')}]</span>`;
  md.renderer.rules.table_open = () => '<div class="table-scroll"><table>\n';
  md.renderer.rules.table_close = () => '</table></div>\n';
  const tokens = md.parse(source.replace(/^\uFEFF/, ''), {});
  const headings: Heading[] = [];
  tokens.forEach((token, index) => {
    if (token.type !== 'heading_open') return;
    const inline = tokens[index + 1];
    const title = inline.children?.filter(child => ['text', 'code_inline', 'image', 'softbreak'].includes(child.type))
      .map(child => child.type === 'softbreak' ? ' ' : child.content).join('') || inline.content;
    const id = `heading-${headings.length}`;
    token.attrSet('id', id);
    headings.push({ id, level: Number(token.tag.slice(1)), title });
  });
  return { html: md.renderer.render(tokens, md.options, {}), headings };
}

export function buildReaderPage(source: string, theme: 'light' | 'dark', progress: number): string {
  const { html } = renderMarkdown(source);
  const colors = palettes[theme];
  const initial = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-mdlightview'; style-src 'unsafe-inline'; img-src 'none'; connect-src 'none'; base-uri 'none'; form-action 'none'">
<style>
:root{color-scheme:${theme}}*{box-sizing:border-box}html{background:${colors.paper};color:${colors.text};overflow-wrap:anywhere;scroll-padding-top:20px;-webkit-text-size-adjust:100%}
body{max-width:780px;min-height:100vh;margin:0 auto;padding:21px 22px 58px;font:16px/1.88 -apple-system,BlinkMacSystemFont,"Noto Sans",sans-serif}
h1,h2,h3,h4,h5,h6{line-height:1.5;scroll-margin-top:20px;font-weight:650}h1{font-size:30px;letter-spacing:-.45px;margin:8px 0 18px}h2{font-size:21px;margin:31px 0 14px}h3{font-size:18px;margin:25px 0 12px}h4,h5,h6{font-size:16px;margin:22px 0 10px}p{margin:0 0 19px}
a{color:${colors.accent};text-underline-offset:4px}blockquote{margin:22px 0;padding:7px 16px;border-left:3px solid ${colors.water};color:${colors.muted};font-size:.94em;line-height:1.9}blockquote p:last-child{margin-bottom:0}
pre{padding:16px;overflow:auto;white-space:pre;background:${colors.background};border:1px solid ${colors.border};border-radius:10px;font-size:13px;line-height:1.75}code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.88em;background:${colors.soft};padding:2px 5px;border-radius:4px}pre code{background:none;padding:0;font-size:inherit}
ul,ol{padding-left:25px}li{margin:6px 0}.table-scroll{overflow-x:auto;margin:22px 0;border-radius:9px}table{border-collapse:collapse;min-width:100%;font-size:14px}th,td{border:1px solid ${colors.border};padding:9px 12px;text-align:left;white-space:nowrap}th{background:${colors.soft};font-weight:600}hr{border:0;border-top:1px solid ${colors.border};margin:31px 0}.image-placeholder{display:block;color:${colors.muted};font-size:13px;padding:12px;background:${colors.soft};border-radius:8px}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
</style></head><body><main>${html}</main>
<script nonce="mdlightview">
(function(){
  var restored=false,timer;
  function send(message){if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(message));}
  function range(){return Math.max(0,document.documentElement.scrollHeight-window.innerHeight);}
  function restore(){window.scrollTo(0,range()*${initial});setTimeout(function(){restored=true;},80);}
  requestAnimationFrame(function(){requestAnimationFrame(restore);});
  window.addEventListener('scroll',function(){if(!restored)return;clearTimeout(timer);timer=setTimeout(function(){var height=range();send({type:'progress',value:height?window.scrollY/height:0});},200);},{passive:true});
  document.addEventListener('click',function(event){
    var link=event.target.closest('a');if(!link)return;event.preventDefault();var url=link.getAttribute('href')||'';
    if(url.charAt(0)==='#'){
      var hash;try{hash=decodeURIComponent(url.slice(1));}catch(e){return;}
      var target=document.getElementById(hash);
      if(!target)target=Array.from(document.querySelectorAll('[id^="heading-"]')).find(function(h){return h.textContent.toLowerCase().replace(/\\s+/g,'-')===hash.toLowerCase();});
      if(target)target.scrollIntoView();
    }else if(/^(https?:\\/\\/|mailto:)/i.test(url))send({type:'link',url:url});
  });
})();
</script></body></html>`;
}
